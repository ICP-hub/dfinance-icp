import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../utils/useAuthClient";

const ReserveDataContext = createContext();

export const ReserveDataProvider = ({ children }) => {
  const [reserveDataCache, setReserveDataCache] = useState({});
  const [lastFetchTimes, setLastFetchTimes] = useState({});
  const CACHE_TTL = 5 * 60 * 1000;

  const { backendActor } = useAuth();

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
        console.log(`Fetching reserve data for ${asset} from backend`);
        const reserveData = await backendActor.get_reserve_data(asset);

        setReserveDataCache((prev) => ({
          ...prev,
          [asset]: reserveData,
        }));

        setLastFetchTimes((prev) => ({
          ...prev,
          [asset]: now,
        }));

        return reserveData;
      } catch (error) {
        console.error(`Error fetching reserve data for ${asset}:`, error);
        throw error;
      }
    },
    [backendActor, reserveDataCache, lastFetchTimes]
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
            const data = await backendActor.get_reserve_data(asset);
            return { asset, data };
          } catch (error) {
            console.error(`Error in batch fetch for ${asset}:`, error);
            return { asset, data: null };
          }
        });

        const fetchedData = await Promise.all(fetchPromises);

        const newCacheData = { ...reserveDataCache };
        const newFetchTimes = { ...lastFetchTimes };

        fetchedData.forEach(({ asset, data }) => {
          if (data) {
            results[asset] = data;
            newCacheData[asset] = data;
            newFetchTimes[asset] = now;
          }
        });

        setReserveDataCache(newCacheData);
        setLastFetchTimes(newFetchTimes);
      }

      return results;
    },
    [backendActor, reserveDataCache, lastFetchTimes]
  );

  const invalidateCache = useCallback(
    (assets = null) => {
      if (assets === null) {
        setReserveDataCache({});
        setLastFetchTimes({});
      } else if (Array.isArray(assets)) {
        const newCache = { ...reserveDataCache };
        const newTimes = { ...lastFetchTimes };

        assets.forEach((asset) => {
          delete newCache[asset];
          delete newTimes[asset];
        });

        setReserveDataCache(newCache);
        setLastFetchTimes(newTimes);
      }
    },
    [reserveDataCache, lastFetchTimes]
  );

  const value = useMemo(
    () => ({
      fetchReserveData,
      batchFetchReserveData,
      invalidateCache,
      reserveDataCache,
    }),
    [fetchReserveData, batchFetchReserveData, invalidateCache, reserveDataCache]
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
