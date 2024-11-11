import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient"; // Assuming you have this hook for the backend actor

const useRealTimeConversionRate = (asset) => {
  const [conversionRate, setConversionRate] = useState(0);
  const [error, setError] = useState(null);
  const { backendActor } = useAuth();  // Assuming backendActor is available through useAuth

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        if (!backendActor) {
          throw new Error("Backend actor is not available");
        }

        // Fetch the exchange rate from the backend actor using get_cached_exchange_rate
        const result = await backendActor.get_cached_exchange_rate(asset);

        if (result.Ok && result.Ok.cache && result.Ok.cache.length > 0) {
          // Extract the rate from the result based on the asset
          const rate = result.Ok.cache[0]?.[1]?.price;

          if (rate) {
            setConversionRate(rate);
            console.log(`Rate for ${asset}:`, rate);
          } else {
            console.error(`No price found for ${asset}`);
            setError("No price found for asset");
          }
        } else {
          console.error("Invalid response from backend actor");
          setError("Invalid response from backend actor");
        }
      } catch (error) {
        console.error("Error fetching conversion rate from backend:", error.message);
        setError(error);
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset, backendActor]);

  return { conversionRate, error };
};

export default useRealTimeConversionRate;
