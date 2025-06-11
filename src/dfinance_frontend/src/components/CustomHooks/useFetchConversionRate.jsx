import { useState, useEffect, useCallback, useRef } from "react";
import useFetchBalance from "./useFetchBalance";
import { useSelector } from "react-redux";
import { useAuths } from "../../utils/useAuthClient";

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
  pendingRequests: {},
};

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
  const { principal, backendActor, verifyCertificate } = useAuths();
  const {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchBalance(ledgerActors, principal);

  const [rates, setRates] = useState(GLOBAL_RATES_CACHE.data);
  const [errors, setErrors] = useState({
    ckBTC: null,
    ckETH: null,
    ckUSDC: null,
    ICP: null,
    ckUSDT: null,
    global: null,
  });
  const [loading, setLoading] = useState({
    ckBTC: false,
    ckETH: false,
    ckUSDC: false,
    ICP: false,
    ckUSDT: false,
    any: false,
  });

  const isMountedRef = useRef(true);
  const lastRefreshRef = useRef(0);
  const requestCount = useRef(0);
  const intervalIdRef = useRef(null);
  const retryCounters = useRef({
    ckBTC: 0,
    ckETH: 0,
    ckUSDC: 0,
    ICP: 0,
    ckUSDT: 0,
  });
  const assetsInProgress = useRef(new Set());

  /**
   * Update both local state and global cache
   */
  const updateRateCache = useCallback((asset, value) => {
    const now = Date.now();

    GLOBAL_RATES_CACHE.data = {
      ...GLOBAL_RATES_CACHE.data,
      [asset]: { value, lastUpdated: now },
    };

    if (isMountedRef.current) {
      setRates((prevRates) => ({
        ...prevRates,
        [asset]: { value, lastUpdated: now },
      }));

      setErrors((prevErrors) => ({
        ...prevErrors,
        [asset]: null,
      }));

      retryCounters.current[asset] = 0;
    }
  }, []);

  /**
   * Set loading state for a specific asset
   */
  const setAssetLoading = useCallback((asset, isLoading) => {
    if (isMountedRef.current) {
      setLoading((prev) => {
        const newLoadingState = {
          ...prev,
          [asset]: isLoading,
        };

        const anyLoading = Object.keys(newLoadingState)
          .filter((key) => key !== "any")
          .some((key) => newLoadingState[key]);

        return {
          ...newLoadingState,
          any: anyLoading,
        };
      });
    }
  }, []);

  /**
   * Set error state for a specific asset
   */
  const setAssetError = useCallback((asset, error) => {
    if (isMountedRef.current) {
      setErrors((prev) => ({
        ...prev,
        [asset]: error,
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

      setTimeout(() => {
        if (isMountedRef.current && !assetsInProgress.current.has(asset)) {
          fetchSingleRate(asset, true).catch(() => { });
        }
      }, RETRY_DELAY);
    } else {
      setAssetError(asset, error || "Failed to fetch after multiple attempts");
    }
  }, []);

  /**
   * Fetch a single asset's rate only if needed
   */
  const fetchSingleRate = useCallback(
    async (asset, isRetry = false) => {
      if (assetsInProgress.current.has(asset)) {
        return null;
      }

      const cachedRate = GLOBAL_RATES_CACHE.data[asset];
      const now = Date.now();

      if (
        !isRetry &&
        cachedRate?.lastUpdated &&
        now - cachedRate.lastUpdated < cacheTimeout &&
        cachedRate.value !== null
      ) {
        return cachedRate.value;
      }

      if (!backendActor) {
        const error = "No backend actor available";
        setAssetError(asset, error);
        return null;
      }

      assetsInProgress.current.add(asset);
      setAssetLoading(asset, true);
      requestCount.current++;

      try {
        const result = await backendActor.get_cached_exchange_rate_certified(
          asset
        );

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
        scheduleRetry(asset, error.message);
        return null;
      } finally {
        assetsInProgress.current.delete(asset);
        setAssetLoading(asset, false);
      }
    },
    [
      backendActor,
      verifyCertificate,
      cacheTimeout,
      updateRateCache,
      setAssetLoading,
      setAssetError,
      scheduleRetry,
    ]
  );

  /**
   * Fetch all conversion rates, but only those that need updating
   */
  const fetchConversionRate = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      if (!forceRefresh && now - lastRefreshRef.current < 1000) {
        return;
      }

      lastRefreshRef.current = now;
      if (loading.any) {
        return;
      }

      setErrors((prev) => ({ ...prev, global: null }));

      try {
        const assetsToFetch = forceRefresh
          ? ASSETS
          : ASSETS.filter((asset) => {
            const cachedRate = GLOBAL_RATES_CACHE.data[asset];
            const needsUpdate =
              !cachedRate?.lastUpdated ||
              cachedRate.value === null ||
              now - cachedRate.lastUpdated >= cacheTimeout;
            return needsUpdate;
          });

        if (assetsToFetch.length > 0) {
          const promises = assetsToFetch.map((asset) => fetchSingleRate(asset));
          await Promise.all(promises);
        }
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch conversion rates";
        setErrors((prev) => ({ ...prev, global: errorMsg }));
      }
    },
    [fetchSingleRate, loading, cacheTimeout]
  );

  /**
   * Force refresh a specific asset
   */
  const refreshAsset = useCallback(
    (asset) => {
      if (!ASSETS.includes(asset)) {
        return Promise.reject(new Error(`Invalid asset: ${asset}`));
      }

      return fetchSingleRate(asset, true);
    },
    [fetchSingleRate]
  );

  useEffect(() => {
    fetchConversionRate(true).catch(() => { });

    return () => { };
  }, [dashboardRefreshTrigger, fetchConversionRate]);

  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    if (refreshInterval > 0) {
      intervalIdRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchConversionRate().catch(() => { });
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [fetchConversionRate, refreshInterval]);

  useEffect(() => {
    const fetchAllBalances = async () => {
      try {
        await Promise.all(ASSETS.map((asset) => fetchBalance(asset)));
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          global: `Balance fetch error: ${e.message}`,
        }));
      }
    };

    fetchAllBalances();
  }, [fetchBalance, dashboardRefreshTrigger]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ckBTCUsdRate: rates.ckBTC.value,
    ckETHUsdRate: rates.ckETH.value,
    ckUSDCUsdRate: rates.ckUSDC.value,
    ckICPUsdRate: rates.ICP.value,
    ckUSDTUsdRate: rates.ckUSDT.value,

    isLoading: loading.any,
    loadingStates: loading,

    error: errors.global,
    errors,

    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,

    fetchConversionRate,
    fetchBalance,
    refreshAsset,

    lastUpdated: {
      ckBTC: rates.ckBTC.lastUpdated,
      ckETH: rates.ckETH.lastUpdated,
      ckUSDC: rates.ckUSDC.lastUpdated,
      ICP: rates.ICP.lastUpdated,
      ckUSDT: rates.ckUSDT.lastUpdated,
    },
  };
};

export default useFetchConversionRate;
