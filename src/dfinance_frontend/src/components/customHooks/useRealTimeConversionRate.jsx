import { useState, useEffect } from "react";
import { useAuths } from "../../utils/useAuthClient";
import { useSelector } from "react-redux";

/**
 * Custom hook to fetch and update the real-time conversion rate of a specified asset.
 * The hook listens for dashboard updates and fetches the latest exchange rate from the backend actor.
 *
 * @param {string} asset - The asset symbol (e.g., "ckBTC", "ckETH").
 * @returns {Object} - Contains the latest conversion rate and error state.
 */
const useRealTimeConversionRate = (asset) => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const [conversionRate, setConversionRate] = useState(0);
  const [error, setError] = useState(null);
  const { backendActor } = useAuths();

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        if (!backendActor) {
          throw new Error("Backend actor is not available");
        }
        const result = await backendActor.get_cached_exchange_rate(asset);
        if (result.Ok && result.Ok.cache && result.Ok.cache.length > 0) {
          const rate = result.Ok.cache[0]?.[1]?.price;

          if (rate) {
            setConversionRate(rate);
          } else {
            setError("No price found for asset");
          }
        } else {
          setError("Invalid response from backend actor");
        }
      } catch (error) {
        setError(error);
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset, backendActor, dashboardRefreshTrigger]);

  return { conversionRate, error };
};

export default useRealTimeConversionRate;
