import { useState, useEffect, useCallback, useRef } from "react";
import useFetchBalance from "./useFetchBalance";
import { useSelector } from "react-redux";
import { useAuths } from "../../utils/useAuthClient";

/**
 * Custom hook to fetch and update conversion rates for various ckAssets in USD.
 * Polls the backend at a specified interval to get exchange rates and updates state accordingly.
 *
 * @param {number} pollInterval - The interval (in milliseconds) at which to poll for exchange rates.
 * @returns {Object} - Contains conversion rates, balance states, error states, and fetch functions.
 */
const useFetchConversionRate = (pollInterval = 2000) => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const ledgerActors = useSelector((state) => state.ledger);
  const { principal, backendActor } = useAuths();
  
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

  /**
   * Fetches conversion rates for multiple assets from the backend canister.
   * Updates state with the latest prices and stops polling if all rates are retrieved.
   */
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
        clearInterval(intervalIdRef.current);
      }
    } catch (error) {
      setError(error.message);
      console.error(error.message);
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
