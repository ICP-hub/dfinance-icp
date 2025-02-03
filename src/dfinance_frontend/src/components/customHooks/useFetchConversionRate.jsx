import { useState, useEffect, useCallback, useRef } from "react";
import useFetchBalance from "./useFetchBalance";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";

const useFetchConversionRate = (pollInterval = 2000) => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const ledgerActors = useSelector((state) => state.ledger);
  const { principal, backendActor } = useAuth();
  const {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchBalance(ledgerActors, principal);
  const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
  const [ckETHUsdRate, setCkETHUsdRate] = useState(null);
  const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);
  const [ckUSDTUsdRate, setCkUSDTUsdRate] = useState(null);
  const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
  const [error, setError] = useState(null);
  const intervalIdRef = useRef(null);

  const fetchConversionRate = useCallback(async () => {
    try {
      if (!backendActor) {
        setError("Backend actor is not available.");
        return;
      }
      const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
      let fetchedRates = 0;
      const rates = await Promise.all(
        assets.map(async (asset) => {
          try {
            const result = await backendActor.get_cached_exchange_rate(asset);

            if (result.Ok && result.Ok.cache && result.Ok.cache.length > 0) {
              const priceRecord = result.Ok.cache[0];
              const price = priceRecord[1]?.price;

              if (price) {
                fetchedRates++;
                return { asset, rate: price.toString() };
              } else {
                throw new Error(`No price found for ${asset}`);
              }
            } else {
              throw new Error(`Invalid response structure for ${asset}`);
            }
          } catch (error) {
            return { asset, rate: null };
          }
        })
      );

      rates.forEach(({ asset, rate }) => {
        if (rate !== null) {
          switch (asset) {
            case "ckBTC":
              setCkBTCUsdRate(rate);
              break;
            case "ckETH":
              setCkETHUsdRate(rate);
              break;
            case "ckUSDC":
              setCkUSDCUsdRate(rate);
              break;
            case "ICP":
              setCkICPUsdRate(rate);
              break;
            case "ckUSDT":
              setCkUSDTUsdRate(rate);
              break;
            default:
              break;
          }
        }
      });

      if (fetchedRates === assets.length) {
        console.log("All conversion rates fetched. Stopping polling.");
        clearInterval(intervalIdRef.current);
      }
    } catch (error) {
      setError(error.message);
    }
  }, [
    backendActor,
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    dashboardRefreshTrigger,
  ]);

  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      fetchConversionRate();
    }, pollInterval);

    return () => clearInterval(intervalIdRef.current);
  }, [fetchConversionRate, pollInterval, dashboardRefreshTrigger]);

  useEffect(() => {
    fetchBalance("ckBTC");
    fetchBalance("ckETH");
    fetchBalance("ckUSDC");
    fetchBalance("ICP");
    fetchBalance("ckUSDT");
  }, [fetchBalance, dashboardRefreshTrigger]);

  return {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    error,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  };
};

export default useFetchConversionRate;
