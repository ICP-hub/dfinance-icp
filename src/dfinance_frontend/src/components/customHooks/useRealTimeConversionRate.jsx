import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient"; 

const useRealTimeConversionRate = (asset) => {
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
  }, [asset, backendActor]);

  return { conversionRate, error };
};

export default useRealTimeConversionRate;