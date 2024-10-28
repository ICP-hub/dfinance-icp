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
        ckUSDTBalance, 
        fetchBalance,
    } = useFetchBalance(ledgerActors, principal);

    const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
    const [ckETHUsdRate, setCkETHUsdRate] = useState(null);
    const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);
    const [ckUSDTUsdRate, setCkUSDTUsdRate] = useState(null);
    const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
    const [error, setError] = useState(null);

    const fetchConversionRate = useCallback(async () => {
        try {
             const response = await fetch("http://localhost:5000/conversion-rates");
           // const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");
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

            if (data.bitcoin && data.ethereum && data["usd-coin"] && data["internet-computer"]) {
                setCkBTCUsdRate(data.bitcoin.usd);
                setCkETHUsdRate(data.ethereum.usd);
                setCkUSDCUsdRate(data["usd-coin"].usd);
                setCkICPUsdRate(data["internet-computer"].usd);
                setCkUSDTUsdRate(data["tether"].usd);
                return;
            }

            if (data.data) {
                const assets = data.data;
                setCkBTCUsdRate(assets.find(asset => asset.id === 'bitcoin').priceUsd);
                setCkETHUsdRate(assets.find(asset => asset.id === 'ethereum').priceUsd);
                setCkUSDCUsdRate(assets.find(asset => asset.id === 'usd-coin').priceUsd);
                setCkICPUsdRate(assets.find(asset => asset.id === 'internet-computer').priceUsd);
                setCkUSDTUsdRate(assets.find(asset => asset.id === 'tether').priceUsd);
                return;
            }

            if (data.RAW) {
                const rates = data.RAW;
                setCkBTCUsdRate(rates.BTC.USD.PRICE);
                setCkETHUsdRate(rates.ETH.USD.PRICE);
                setCkUSDCUsdRate(rates.USDC.USD.PRICE);
                setCkICPUsdRate(rates.ICP.USD.PRICE);
                setCkUSDTUsdRate(rates.USDT.USD.PRICE);
                return;
            }
            
        } catch (error) {
            console.error("Error fetching conversion rates:", error);
            setError(error);
        }
    }, [ckBTCBalance, ckETHBalance, ckUSDCBalance,ckUSDTBalance, ckICPBalance, pollInterval]);

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
        ckUSDTUsdRate, 
        error,
        fetchConversionRate,
        ckBTCBalance,
        ckETHBalance,
        ckUSDCBalance,
        ckICPBalance,
        ckUSDTBalance,
        fetchBalance
    };
};

export default useFetchConversionRate;
