import { useState, useEffect, useCallback, useRef } from "react";
import useFetchBalance from "./useFetchBalance";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";

/**
 * Global cache for exchange rates to persist between hook instances and component remounts
 * Shared across all instances of the hook
 */
const GLOBAL_RATES_CACHE = {
  data: {
    ckBTC: { value: null, lastUpdated: null },
    ckETH: { value: null, lastUpdated: null },
    ckUSDC: { value: null, lastUpdated: null },
    ICP: { value: null, lastUpdated: null },
    ckUSDT: { value: null, lastUpdated: null },
  },
  pendingRequests: {}
};

// Cache timeout (5 minutes by default)
const DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000;
const ASSETS = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

/**
 * Custom hook to fetch and update conversion rates for various ckAssets in USD.
 * Uses global caching and intelligent polling to minimize backend calls.
 *
 * @param {number} refreshInterval - The interval (in milliseconds) at which to refresh rates.
 * @param {number} cacheTimeout - The timeout (in milliseconds) for cached values.
 * @returns {Object} - Contains conversion rates, balance states, error states, and fetch functions.
 */
const useFetchConversionRate = (
  refreshInterval = 60000,
  cacheTimeout = DEFAULT_CACHE_TIMEOUT
) => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const ledgerActors = useSelector((state) => state.ledger);
  const { principal, backendActor, verifyCertificate } = useAuth();
  const {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchBalance(ledgerActors, principal);

  // Use the global cache but create local state to trigger re-renders
  const [rates, setRates] = useState(GLOBAL_RATES_CACHE.data);
  const [errors, setErrors] = useState({
    ckBTC: null,
    ckETH: null,
    ckUSDC: null,
    ICP: null,
    ckUSDT: null,
    global: null
  });
  const [loading, setLoading] = useState({
    ckBTC: false,
    ckETH: false,
    ckUSDC: false,
    ICP: false,
    ckUSDT: false,
    any: false
  });
  
  // References
  const isMountedRef = useRef(true);
  const lastRefreshRef = useRef(0);
  const activeInstanceId = useRef(`instance-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const requestCount = useRef(0);
  const intervalIdRef = useRef(null);
  const retryCounters = useRef({
    ckBTC: 0,
    ckETH: 0,
    ckUSDC: 0,
    ICP: 0,
    ckUSDT: 0
  });
  const assetsInProgress = useRef(new Set());

  // Debug logging function that doesn't pollute console in production
  const debugLog = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${activeInstanceId.current}] ${message}`, data || '');
    }
  }, []);

  /**
   * Update both local state and global cache
   */
  const updateRateCache = useCallback((asset, value) => {
    const now = Date.now();
    
    GLOBAL_RATES_CACHE.data = {
      ...GLOBAL_RATES_CACHE.data,
      [asset]: { value, lastUpdated: now }
    };
    
    if (isMountedRef.current) {
      setRates(prevRates => ({
        ...prevRates,
        [asset]: { value, lastUpdated: now }
      }));
      
      // Clear any error for this asset
      setErrors(prevErrors => ({
        ...prevErrors,
        [asset]: null
      }));
      
      // Reset retry counter for successful fetch
      retryCounters.current[asset] = 0;
    }
    
    debugLog(`Updated rate for ${asset}:`, value);
  }, [debugLog]);

  /**
   * Set loading state for a specific asset
   */
  const setAssetLoading = useCallback((asset, isLoading) => {
    if (isMountedRef.current) {
      setLoading(prev => {
        const newLoadingState = {
          ...prev,
          [asset]: isLoading
        };
        
        // Update the "any" flag based on whether any asset is loading
        const anyLoading = Object.keys(newLoadingState)
          .filter(key => key !== 'any')
          .some(key => newLoadingState[key]);
        
        return {
          ...newLoadingState,
          any: anyLoading
        };
      });
    }
  }, []);

  /**
   * Set error state for a specific asset
   */
  const setAssetError = useCallback((asset, error) => {
    if (isMountedRef.current) {
      setErrors(prev => ({
        ...prev,
        [asset]: error
      }));
    }
  }, []);

  /**
   * Retry mechanism for failed fetches
   */
  const scheduleRetry = useCallback((asset, error) => {
    const currentRetries = retryCounters.current[asset];
    
    if (currentRetries < MAX_RETRIES) {
      retryCounters.current[asset]++;
      debugLog(`Scheduling retry ${retryCounters.current[asset]}/${MAX_RETRIES} for ${asset} in ${RETRY_DELAY}ms`);
      
      setTimeout(() => {
        if (isMountedRef.current && !assetsInProgress.current.has(asset)) {
          debugLog(`Executing retry for ${asset}`);
          fetchSingleRate(asset, true).catch(e => 
            debugLog(`Retry failed for ${asset}:`, e.message)
          );
        }
      }, RETRY_DELAY);
    } else {
      debugLog(`All retries exhausted for ${asset}`, error);
      setAssetError(asset, error || 'Failed to fetch after multiple attempts');
    }
  }, [debugLog]);

  /**
   * Fetch a single asset's rate only if needed
   */
  const fetchSingleRate = useCallback(
    async (asset, isRetry = false) => {
      // Skip if already in progress to prevent duplicate requests
      if (assetsInProgress.current.has(asset)) {
        debugLog(`Skipping ${asset} - request already in progress`);
        return null;
      }

      const cachedRate = GLOBAL_RATES_CACHE.data[asset];
      const now = Date.now();
      
      // Use cache unless this is a retry or cache is expired
      if (
        !isRetry &&
        cachedRate?.lastUpdated &&
        now - cachedRate.lastUpdated < cacheTimeout &&
        cachedRate.value !== null
      ) {
        debugLog(`Using cached value for ${asset}`, cachedRate.value);
        return cachedRate.value;
      }

      if (!backendActor) {
        const error = 'No backend actor available';
        debugLog(error);
        setAssetError(asset, error);
        return null;
      }

      // Mark this asset as in progress
      assetsInProgress.current.add(asset);
      setAssetLoading(asset, true);
      requestCount.current++;
      
      debugLog(`Fetching rate for ${asset} (Request #${requestCount.current})${isRetry ? ' (retry)' : ''}`);

      try {
        const result = await backendActor.get_cached_exchange_rate_certified(asset);
        console.log(`${asset} conversion rate:`, result);
        
        if (result && result[1]) {
          const verified = await verifyCertificate(result[1]);
          if (!verified) {
            throw new Error(`Certificate verification failed for ${asset}`);
          }
        }

        if (result?.Ok?.[0] !== undefined) {
          const rateValue = result.Ok[0].toString();
          updateRateCache(asset, rateValue);
          return rateValue;
        } else {
          throw new Error(`Invalid or empty response for ${asset}`);
        }
      } catch (error) {
        debugLog(`Error fetching rate for ${asset}:`, error.message);
        
        // Schedule retry if needed
        scheduleRetry(asset, error.message);
        return null;
      } finally {
        // Cleanup
        assetsInProgress.current.delete(asset);
        setAssetLoading(asset, false);
      }
    },
    [backendActor, verifyCertificate, cacheTimeout, updateRateCache, setAssetLoading, setAssetError, scheduleRetry, debugLog]
  );

  /**
   * Fetch all conversion rates, but only those that need updating
   */
  const fetchConversionRate = useCallback(
    async (forceRefresh = false) => {
      // Prevent rapid sequential calls
      const now = Date.now();
      if (!forceRefresh && now - lastRefreshRef.current < 1000) {
        debugLog('Skipping fetch - too soon since last refresh');
        return;
      }

      lastRefreshRef.current = now;
      if (loading.any) {
        debugLog('Skipping batch fetch - assets already loading');
        return;
      }

      setErrors(prev => ({ ...prev, global: null }));
      debugLog('Starting conversion rate fetch', forceRefresh ? '(forced)' : '');

      try {
        const assetsToFetch = forceRefresh
          ? ASSETS
          : ASSETS.filter((asset) => {
              const cachedRate = GLOBAL_RATES_CACHE.data[asset];
              const needsUpdate = 
                !cachedRate?.lastUpdated || 
                cachedRate.value === null ||
                (now - cachedRate.lastUpdated >= cacheTimeout);
              return needsUpdate;
            });

        debugLog('Assets that need updating:', assetsToFetch);

        if (assetsToFetch.length > 0) {
          // Process assets in parallel for better performance
          const promises = assetsToFetch.map(asset => fetchSingleRate(asset));
          await Promise.all(promises);
        } else {
          debugLog('No assets need updating');
        }
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch conversion rates";
        debugLog('Error in fetchConversionRate:', errorMsg);
        setErrors(prev => ({ ...prev, global: errorMsg }));
      }
    },
    [fetchSingleRate, loading, cacheTimeout, debugLog]
  );

  /**
   * Force refresh a specific asset
   */
  const refreshAsset = useCallback((asset) => {
    if (!ASSETS.includes(asset)) {
      debugLog(`Invalid asset: ${asset}`);
      return Promise.reject(new Error(`Invalid asset: ${asset}`));
    }
    
    debugLog(`Force refreshing ${asset}`);
    return fetchSingleRate(asset, true);
  }, [fetchSingleRate, debugLog]);

  // Initial fetch on mount or dashboard trigger change
  useEffect(() => {
    debugLog('Dashboard trigger changed or initial mount - fetching rates');
    fetchConversionRate(true).catch(e => 
      debugLog('Error during initial fetch:', e.message)
    );
    
    return () => {
      debugLog('Component unmounting');
    };
  }, [dashboardRefreshTrigger, fetchConversionRate, debugLog]);

  // Set up refresh interval
  useEffect(() => {
    debugLog('Setting up refresh interval:', refreshInterval);
    
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    
    if (refreshInterval > 0) {
      intervalIdRef.current = setInterval(() => {
        if (isMountedRef.current) {
          debugLog('Interval triggered - checking for updates');
          fetchConversionRate().catch(e => 
            debugLog('Error during interval fetch:', e.message)
          );
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalIdRef.current) {
        debugLog('Clearing refresh interval');
        clearInterval(intervalIdRef.current);
      }
    };
  }, [fetchConversionRate, refreshInterval, debugLog]);

  // Fetch balances
  useEffect(() => {
    const fetchAllBalances = async () => {
      debugLog('Fetching all balances');
      try {
        // Fetch balances in parallel for better performance
        await Promise.all(ASSETS.map(asset => fetchBalance(asset)));
      } catch (e) {
        debugLog('Error fetching balances:', e.message);
        setErrors(prev => ({ ...prev, global: `Balance fetch error: ${e.message}` }));
      }
    };

    fetchAllBalances();
  }, [fetchBalance, dashboardRefreshTrigger, debugLog]);

  // When component unmounts
  useEffect(() => {
    return () => {
      debugLog('Component unmounted');
      isMountedRef.current = false;
    };
  }, [debugLog]);

  return {
    // Rate values
    ckBTCUsdRate: rates.ckBTC.value,
    ckETHUsdRate: rates.ckETH.value,
    ckUSDCUsdRate: rates.ckUSDC.value,
    ckICPUsdRate: rates.ICP.value,
    ckUSDTUsdRate: rates.ckUSDT.value,

    // Loading states
    isLoading: loading.any,
    loadingStates: loading,
    
    // Error states
    error: errors.global,
    errors,

    // Balances
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,

    // Action functions
    fetchConversionRate,
    fetchBalance,
    refreshAsset,

    // Metadata
    lastUpdated: {
      ckBTC: rates.ckBTC.lastUpdated,
      ckETH: rates.ckETH.lastUpdated,
      ckUSDC: rates.ckUSDC.lastUpdated,
      ICP: rates.ICP.lastUpdated,
      ckUSDT: rates.ckUSDT.lastUpdated,
    },
    
    // Debug info
    _debugState: {
      instanceId: activeInstanceId.current,
      requestCount: requestCount.current,
      pendingRequests: Array.from(assetsInProgress.current),
      retryCounters: {...retryCounters.current}
    }
  };
};

export default useFetchConversionRate;