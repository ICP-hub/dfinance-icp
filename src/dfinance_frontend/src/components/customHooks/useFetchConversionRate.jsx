import { useState, useEffect, useCallback } from "react";
import useFetchBalance from "./useFetchBalance";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";

const useFetchConversionRate = (pollInterval = 2000) => {
    const ledgerActors = useSelector((state) => state.ledger);
    const {
        principal,
        backendActor,
      } = useAuth();
    const {
        ckBTCBalance,
        ckETHBalance,
        ckUSDCBalance,
        ckICPBalance,
        fetchBalance,
      } = useFetchBalance(ledgerActors, principal);

    const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
    const [ckETHUsdRate, setCkETHUsdRate] = useState(null);
    const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);
    const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
    const [error, setError] = useState(null);

    const fetchConversionRate = useCallback(async () => {
        try {
            const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const text = await response.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonError) {
                throw new Error("Response was not valid JSON");
            }

            setCkBTCUsdRate(data.bitcoin.usd);
            setCkETHUsdRate(data.ethereum.usd);
            setCkUSDCUsdRate(data["usd-coin"].usd);
            setCkICPUsdRate(data["internet-computer"].usd);
        } catch (error) {
            console.error("Error fetching conversion rates:", error);
            setError(error);
        }
}, [ckBTCBalance, ckETHBalance, ckUSDCBalance, ckICPBalance, pollInterval]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchConversionRate();
        }, pollInterval);
        return () => clearInterval(intervalId);
    }, [fetchConversionRate, pollInterval]);

    return {
        ckBTCUsdRate,
        ckETHUsdRate,
        ckUSDCUsdRate,
        ckICPUsdRate,
        error,
        fetchConversionRate,
        ckBTCBalance,
        ckETHBalance,
        ckUSDCBalance,
        ckICPBalance,
        fetchBalance
    };
};

export default useFetchConversionRate;
