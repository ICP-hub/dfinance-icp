import { useState, useEffect } from "react";

const useRealTimeConversionRate = (asset) => {
    const [conversionRate, setConversionRate] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConversionRate = async () => {
            try {
                const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");

                if (!response.ok) {
                    throw new Error("Failed to fetch conversion rates from server");
                }

                const data = await response.json();

                let rate;
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
                    default:
                        console.error(`Unsupported asset: ${asset}`);
                        return;
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
            }
        };

        if (asset) {
            fetchConversionRate();
        }
    }, [asset]);

    return { conversionRate, error };
};

export default useRealTimeConversionRate;
