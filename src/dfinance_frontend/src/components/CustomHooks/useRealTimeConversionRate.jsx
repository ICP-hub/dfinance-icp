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
  const { backendActor, verifyCertificate } = useAuth();

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        if (!backendActor) {
          throw new Error("Backend actor is not available");
        }

        const result = await backendActor.get_cached_exchange_rate_certified(
          asset
        );

        if (result && result[1]) {
          const isVerified = await verifyCertificate(result[1]);
          if (!isVerified) {
            throw new Error("Certificate verification failed");
          }
        }

        if (result?.Ok[0] !== undefined) {
          setConversionRate(result.Ok[0]);
        } else {
          setError("Invalid response from backend actor");
        }
      } catch (error) {
        setError(error.message || "An error occurred");
        console.error("Error fetching conversion rate:", error.message);
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset, backendActor, dashboardRefreshTrigger]);

  return { conversionRate, error };
};

export default useRealTimeConversionRate;
