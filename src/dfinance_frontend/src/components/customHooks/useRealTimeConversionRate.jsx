import { useState, useEffect } from "react";

const useRealTimeConversionRate = (asset) => {
    const [conversionRate, setConversionRate] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConversionRate = async () => {
            try {
        //  const response = await fetch("http://localhost:5000/conversion-rates");
                const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");
                if (!response.ok) {
                    throw new Error("Failed to fetch conversion rates from server");
                }

                const data = await response.json();
                let rate;

                if (data.bitcoin && data.ethereum && data["usd-coin"] && data["internet-computer"]) {
                    // CoinGecko structure
                    switch (asset) {
                        case "ckBTC":
                            rate = data.bitcoin?.usd;
                            break;
                        case "ckETH":
                            rate = data.ethereum?.usd;
                            break;
                        case "ckUSDC":
                            rate = data["usd-coin"]?.usd;
                            break;
                        case "ICP":
                            rate = data["internet-computer"]?.usd;
                            break;
                        case "ckUSDT":
                            rate = data["tether"]?.usd;
                            break;
                        default:
                            console.error(`Unsupported asset: ${asset}`);
                            return;
                    }
                } else if (data.data) {
                    // CoinCap structure
                    const assets = data.data;
                    switch (asset) {
                        case "ckBTC":
                            rate = assets.find(asset => asset.id === 'bitcoin')?.priceUsd;
                            break;
                        case "ckETH":
                            rate = assets.find(asset => asset.id === 'ethereum')?.priceUsd;
                            break;
                        case "ckUSDC":
                            rate = assets.find(asset => asset.id === 'usd-coin')?.priceUsd;
                            break;
                        case "ICP":
                            rate = assets.find(asset => asset.id === 'internet-computer')?.priceUsd;
                            break;
                        case "ckUSDT":
                            rate = assets.find(asset => asset.id === 'tether')?.priceUsd;
                            break;
                            break;
                        default:
                            console.error(`Unsupported asset: ${asset}`);
                            return;
                    }
                } else if (data.RAW) {
                    // CryptoCompare structure
                    const rates = data.RAW;
                    switch (asset) {
                        case "ckBTC":
                            rate = rates.BTC.USD.PRICE;
                            break;
                        case "ckETH":
                            rate = rates.ETH.USD.PRICE;
                            break;
                        case "ckUSDC":
                            rate = rates.USDC.USD.PRICE;
                            break;
                        case "ICP":
                            rate = rates.ICP.USD.PRICE;
                            break;
                        case "ckUSDT":
                            rate = rates.USDT.USD.PRICE;
                            break;
                        default:
                            console.error(`Unsupported asset: ${asset}`);
                            return;
                    }
                } else {
                    console.error("Response does not contain expected data");
                }

                if (rate) {
                    console.log(`Rate for ${asset}:`, rate);
                    setConversionRate(rate);
                } else {
                    console.error("Conversion rate not found for asset:", asset);
                }
            } catch (error) {
                console.error(
                    "Error fetching conversion rate from server:",
                    error.message
                );
                setError(error);
            }
        };

        if (asset) {
            fetchConversionRate();
        }
    }, [asset]);

    return { conversionRate, error };
};

export default useRealTimeConversionRate;