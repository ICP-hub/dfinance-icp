import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect
} from "react";
import { useAuths } from "../utils/useAuthClient";
import { useSelector } from "react-redux";

const ReserveDataContext = createContext();

export const ReserveDataProvider = ({ children }) => {
  const [reserveDataCache, setReserveDataCache] = useState({});
  const [lastFetchTimes, setLastFetchTimes] = useState({});
  const [certificateStatus, setCertificateStatus] = useState({});
  const CACHE_TTL = 5 * 60 * 1000;
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );

  const { backendActor, verifyCertificate } = useAuths();

  useEffect(() => {
    invalidateCache();
  }, [dashboardRefreshTrigger]);

  const fetchReserveData = useCallback(
    async (asset) => {
      const now = Date.now();
      const lastFetchTime = lastFetchTimes[asset] || 0;

      if (reserveDataCache[asset] && now - lastFetchTime < CACHE_TTL) {
        return reserveDataCache[asset];
      }

      if (!backendActor) {
        throw new Error("Backend actor not initialized");
      }

      try {
        const reserveDataResponse = await backendActor.get_reserve_data_certified(asset);
        let reserveData;
        let verified = false;
        
        if ("Ok" in reserveDataResponse) {
          const [data, certificate] = reserveDataResponse.Ok;
          verified = await verifyCertificate(certificate);
          
          if (!verified) {
            console.error(`Certificate verification failed for ${asset}`);
          }
          
          reserveData = reserveDataResponse;
        } else if ("Err" in reserveDataResponse) {
          throw new Error(`Backend returned error: ${reserveDataResponse.Err}`);
        } else {
          console.warn(`Falling back to non-certified data for ${asset}`);
          reserveData = await backendActor.get_reserve_data(asset);
        }

        setReserveDataCache((prev) => ({
          ...prev,
          [asset]: reserveData,
        }));

        setLastFetchTimes((prev) => ({
          ...prev,
          [asset]: now,
        }));
        
        setCertificateStatus((prev) => ({
          ...prev,
          [asset]: verified,
        }));

        return reserveData;
      } catch (error) {
        console.error(`Error fetching reserve data for ${asset}:`, error);
        throw error;
      }
    },
    [backendActor, reserveDataCache, lastFetchTimes, verifyCertificate]
  );

  const batchFetchReserveData = useCallback(
    async (assetList) => {
      if (!assetList || assetList.length === 0) return {};

      const results = {};
      const assetsToFetch = [];
      const now = Date.now();

      for (const asset of assetList) {
        const lastFetchTime = lastFetchTimes[asset] || 0;
        if (reserveDataCache[asset] && now - lastFetchTime < CACHE_TTL) {
          results[asset] = reserveDataCache[asset];
        } else {
          assetsToFetch.push(asset);
        }
      }

      if (assetsToFetch.length > 0) {
        const fetchPromises = assetsToFetch.map(async (asset) => {
          try {
            const reserveDataResponse = await backendActor.get_reserve_data_certified(asset);
            let data;
            let verified = false;
            
            if ("Ok" in reserveDataResponse) {
              const [reserveData, certificate] = reserveDataResponse.Ok;
              verified = await verifyCertificate(certificate);
              
              if (!verified) {
                console.error(`Certificate verification failed for ${asset}`);
              } 
              
              data = reserveDataResponse;
            } else if ("Err" in reserveDataResponse) {
              console.error(`Backend returned error for ${asset}: ${reserveDataResponse.Err}`);
              data = null;
            } else {
              console.warn(`Falling back to non-certified data for ${asset}`);
              data = await backendActor.get_reserve_data(asset);
            }
            
            return { asset, data, verified };
          } catch (error) {
            console.error(`Error in batch fetch for ${asset}:`, error);
            return { asset, data: null, verified: false };
          }
        });

        const fetchedData = await Promise.all(fetchPromises);

        const newCacheData = { ...reserveDataCache };
        const newFetchTimes = { ...lastFetchTimes };
        const newCertStatus = { ...certificateStatus };

        fetchedData.forEach(({ asset, data, verified }) => {
          if (data) {
            results[asset] = data;
            newCacheData[asset] = data;
            newFetchTimes[asset] = now;
            newCertStatus[asset] = verified;
          }
        });

        setReserveDataCache(newCacheData);
        setLastFetchTimes(newFetchTimes);
        setCertificateStatus(newCertStatus);
      }

      return results;
    },
    [backendActor, reserveDataCache, lastFetchTimes, verifyCertificate]
  );

  const invalidateCache = useCallback(
    (assets = null) => {
      if (assets === null) {
        setReserveDataCache({});
        setLastFetchTimes({});
        setCertificateStatus({});
      } else if (Array.isArray(assets)) {
        const newCache = { ...reserveDataCache };
        const newTimes = { ...lastFetchTimes };
        const newCertStatus = { ...certificateStatus };

        assets.forEach((asset) => {
          delete newCache[asset];
          delete newTimes[asset];
          delete newCertStatus[asset];
        });

        setReserveDataCache(newCache);
        setLastFetchTimes(newTimes);
        setCertificateStatus(newCertStatus);
      }
    },
    [reserveDataCache, lastFetchTimes, certificateStatus]
  );

  const refreshDashboard = useCallback(() => {
    invalidateCache();
  }, [invalidateCache]);

  const value = useMemo(
    () => ({
      fetchReserveData,
      batchFetchReserveData,
      invalidateCache,
      refreshDashboard, 
      reserveDataCache,
      certificateStatus,
    }),
    [
      fetchReserveData,
      batchFetchReserveData,
      invalidateCache,
      refreshDashboard,
      reserveDataCache,
      certificateStatus,
    ]
  );

  return (
    <ReserveDataContext.Provider value={value}>
      {children}
    </ReserveDataContext.Provider>
  );
};

export const useReserveData = () => {
  const context = useContext(ReserveDataContext);
  if (!context) {
    throw new Error("useReserveData must be used within a ReserveDataProvider");
  }
  return context;
};