import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";
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
  const { backendActor } = useAuth();

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        if (!backendActor) {
          throw new Error("Backend actor is not available");
        }
        const result = await backendActor.get_cached_exchange_rate(asset);
        console.log("result of exchange rate: ", result);
        
        if (result?.Ok !== undefined) {
          setConversionRate(result.Ok);
        } else {
          setError("Invalid response from backend actor");
        }
      } catch (error) {
        setError(error.message || "An error occurred");
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset, backendActor, dashboardRefreshTrigger]);

  return { conversionRate, error };
};

export default useRealTimeConversionRate;
