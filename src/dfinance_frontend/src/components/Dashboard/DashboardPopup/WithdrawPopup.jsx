import React, { useState, useEffect, useRef } from "react";
import Button from "../../Common/Button";
import { Info } from "lucide-react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { Check, Wallet, X } from "lucide-react";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { idlFactory as ledgerIdlFactory } from "../../../../../declarations/token_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";

const WithdrawPopup = ({ asset,
  image,
  supplyRateAPR,
  balance,
  liquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange, }) => {

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);

  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset);
  console.log("Fees:", fees);
  console.log("assetSupply:", assetSupply);
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';
  const [amount, setAmount] = useState("");
  const [conversionRate, setConversionRate] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const isCollateral = true;

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        let coinId;

        // Map asset to coin IDs for each API
        switch (asset) {
          case "ckBTC":
            coinId = {
              coingecko: "bitcoin",
              coincap: "bitcoin",
              coinapi: "BTC",
              cryptocompare: "BTC",
              nomics: "BTC"
            };
            break;
          case "ckETH":
            coinId = {
              coingecko: "ethereum",
              coincap: "ethereum",
              coinapi: "ETH",
              cryptocompare: "ETH",
              nomics: "ETH"
            };
            break;
          case "ckUSDC":
            coinId = {
              coingecko: "usd-coin",
              coincap: "usd-coin",
              coinapi: "USDC",
              cryptocompare: "USDC",
              nomics: "USDC"
            };
            break;
          case "ckICP":
            coinId = {
              coingecko: "internet-computer",
              coincap: "internet-computer",
              coinapi: "ICP",
              cryptocompare: "ICP",
              nomics: "ICP"
            };
            break;
          default:
            console.error(`Unsupported asset: ${asset}`);
            return;
        }

        // API Endpoints and Fetch Functions
        const apiEndpoints = [
          // CoinGecko
          {
            name: 'CoinGecko',
            url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId.coingecko}&vs_currencies=usd`,
            extractRate: (data) => data[coinId.coingecko]?.usd,
          },
          // CoinCap
          {
            name: 'CoinCap',
            url: `https://api.coincap.io/v2/assets/${coinId.coincap}`,
            extractRate: (data) => data.data?.priceUsd,
          },
          // CoinAPI
          {
            name: 'CoinAPI',
            url: `https://rest.coinapi.io/v1/exchangerate/${coinId.coinapi}/USD`,
            headers: { 'X-CoinAPI-Key': 'YOUR_COINAPI_KEY' }, // Use your CoinAPI key here
            extractRate: (data) => data?.rate,
          },
          // CryptoCompare
          {
            name: 'CryptoCompare',
            url: `https://min-api.cryptocompare.com/data/price?fsym=${coinId.cryptocompare}&tsyms=USD`,
            extractRate: (data) => data?.USD,
          },
          // Nomics
          {
            name: 'Nomics',
            url: `https://api.nomics.com/v1/currencies/ticker?key=YOUR_NOMICS_KEY&ids=${coinId.nomics}&convert=USD`,
            extractRate: (data) => data[0]?.price,
          }
        ];

        // Function to attempt fetching from multiple APIs
        const tryMultipleApis = async (apiList) => {
          for (const api of apiList) {
            try {
              const response = await fetch(api.url, {
                headers: api.headers || {},
              });

              if (response.ok) {
                const data = await response.json();
                const rate = api.extractRate(data);

                if (rate) {
                  console.log(`${api.name} rate for ${asset}:`, rate);
                  return rate;
                }
              } else {
                console.error(`${api.name} failed:`, response.statusText);
              }
            } catch (error) {
              console.error(`${api.name} error:`, error.message);
            }
          }
          throw new Error("All API requests failed.");
        };

        // Fetch the rate from any available API
        const rate = await tryMultipleApis(apiEndpoints);

        if (rate) {
          setConversionRate(rate);
        } else {
          console.error("Conversion rate not found for asset:", asset);
        }

      } catch (error) {
        console.error("Error fetching conversion rate:", error.message);
      }
    };

    if (asset) {
      fetchConversionRate();
    }
  }, [asset]);

  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const modalRef = useRef(null); // Reference to the modal container
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;

    // Convert input to a number
    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= assetSupply) {
        // Calculate and format the USD value
        const convertedValue = numericAmount * conversionRate;
        setUsdValue(parseFloat(convertedValue.toFixed(2))); // Ensure proper formatting
        setAmount(inputAmount);
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
        // setUsdValue(0);
      }
    } else if (inputAmount === "") {
      // Allow empty input and reset error
      setAmount("");
      // setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
      // setUsdValue(0);
    }
  };

  const { createLedgerActor, backendActor } = useAuth();

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            console.log(`get_asset_principle (${asset}):`, result);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {
          console.error("Error fetching asset principal:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };

    fetchAssetPrinciple();
  }, [backendActor]);

  console.log("fecthAssteprincCKUSDC", assetPrincipal.ckUSDC)
  console.log("fecthAssteprincCKBTC", assetPrincipal.ckBTC)
  console.log("fecthAssteprincCKETH", assetPrincipal.ckETH)

  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      let result;
      switch (asset) {
        case "ckBTC":
          result = await backendActor.get_asset_principal("ckBTC");
          break;
        case "ckETH":
          result = await backendActor.get_asset_principal("ckETH");
          break;
        case "ckUSDC":
          result = await backendActor.get_asset_principal("ckUSDC");
          break;
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      console.log(`get_asset_principle in mysupply (${asset}):`, result);
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };



  const ledgerActorckBTC = useMemo(
    () =>
      assetPrincipal.ckBTC
        ? createLedgerActor(
          assetPrincipal.ckBTC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckBTC] // Re-run when principal changes
  );

  // Memoized actor for ckETH using dynamic principal
  const ledgerActorckETH = useMemo(
    () =>
      assetPrincipal.ckETH
        ? createLedgerActor(
          assetPrincipal.ckETH, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckETH] // Re-run when principal changes
  );

  const ledgerActorckUSDC = useMemo(
    () =>
      assetPrincipal.ckUSDC
        ? createLedgerActor(
          assetPrincipal.ckUSDC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckUSDC] // Re-run when principal changes
  );

  const handleWithdraw = async () => {
    console.log("Withdraw function called for", asset, amount);
    setIsLoading(true);
    let ledgerActor;

    // Example logic to select the correct backend actor based on the asset
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActorckUSDC; // Add ckUSDC ledger actor
    }

    try {


      const amountInUnits = BigInt(amount);
      // Call the withdraw function on the selected ledger actor
      const withdrawResult = await backendActor.withdraw(asset, amountInUnits, [], true);
      console.log("Withdraw result", withdrawResult);
      toast.success("Withdraw successful!");
      setIsPaymentDone(true);
      setIsVisible(false);



      // Handle success, e.g., show success message, update UI, etc.
    } catch (error) {
      console.error("Error withdrawing:", error);
      // Handle error state, e.g., show error message
      toast.error(`Error: ${error.message || "Withdraw action failed!"}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isLoading) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);
  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    const healthFactor = calculateHealthFactor(totalCollateral, totalDebt, liquidationThreshold);
    console.log('Health Factor:', healthFactor);
    const ltv = calculateLTV(assetSupply, assetBorrow);
    console.log('LTV:', ltv);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(healthFactor.toFixed(2));

    if (healthFactor < 1) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }

  }, [asset, liquidationThreshold, assetSupply, assetBorrow, amount, usdValue]);


  const calculateHealthFactor = (totalCollateral, totalDebt, liquidationThreshold,) => {
    const amountTaken = parseFloat(usdValue) || 0; // Ensure usdValue is treated as a number
    const amountAdded = 0// No amount added for now, but keeping it in case of future use

    // Ensure totalCollateral and totalDebt are numbers to prevent string concatenation
    const totalCollateralValue = parseFloat(totalCollateral) - amountTaken;
    const totalDeptValue = parseFloat(totalDebt) + amountAdded;
    console.log("totalCollateralValue", totalCollateralValue)
    console.log("totalDeptValue", totalDeptValue)
    console.log("amountAdded", amountAdded)
    console.log("liquidationThreshold", liquidationThreshold)
    console.log("totalDebt", totalDebt)
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue;
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return totalDeptValue / totalCollateralValue;
  };



  return (
    <>
      {isVisible && (
        <div className="withdraw-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Withdraw {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>

              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
                <div className="w-5/12 md:w-4/12">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0}
                    className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                  />
                  <p className="text-xs text-gray-500 px-2">
                    {usdValue ? `$${usdValue.toFixed(2)} USD` : "$0 USD"}
                  </p>
                </div>
                <div className="w-7/12 md:w-8/12 flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p className="text-xs mt-4">{assetSupply.toFixed(2)} Max</p>
                </div>
              </div>
            </div>
            <div className="w-full ">
              <div className="w-full flex justify-between my-2 dark:text-darkText">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-8/12">
                  <p className="text-sm">Remaining supply</p>
                </div>
                <div className="w-4/12 flex flex-col items-end">
                  <p className="text-xs mt-2">{assetSupply - amount} Max</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="w-full flex justify-between my-2">

            </div>
            <div className="w-full bg-gray-100 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
              <div className="w-full flex justify-between items-center my-1">
                <p>Supply APY</p>
                <p>{supplyRateAPR}%</p>
              </div>
              <div className="w-full flex justify-between items-center my-1">
                <p>Collateralization</p>
                <p
                  className={`font-semibold ${isCollateral ? "text-green-500" : "text-red-500"
                    }`}
                >
                  {isCollateral ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div className="w-full flex flex-col my-1">
                <div className="w-full flex justify-between items-center">
                  <p>Health Factor</p>
                  <p>
                    <span lassName={`${prevHealthFactor > 3
                      ? "text-green-500"
                      : prevHealthFactor <= 1
                        ? "text-red-500"
                        : prevHealthFactor <= 1.5
                          ? "text-orange-600"
                          : prevHealthFactor <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                      }`}>{prevHealthFactor}</span>
                    <span className="text-gray-500 mx-1">→</span>
                    <span
                      className={`${currentHealthFactor > 3
                        ? "text-green-500"
                        : currentHealthFactor <= 1
                          ? "text-red-500"
                          : currentHealthFactor <= 1.5
                            ? "text-orange-600"
                            : currentHealthFactor <= 2
                              ? "text-orange-400"
                              : "text-orange-300"
                        }`}
                    >
                      {currentHealthFactor}
                    </span>
                  </p>
                </div>
                <div className="w-full flex justify-end items-center mt-1">
                  <p className="text-gray-500">liquidation at &lt;1</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex  mt-3">
            <div className="flex items-center">
              <Fuel className="w-4 h-4 mr-1" />
              <h1 className="text-lg font-semibold mr-1">{transferfee}</h1>
              <img
                src={image}
                alt="asset icon"
                className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
              />
              <div className="relative group">
                <Info size={16} className="ml-2 cursor-pointer" />

                {/* Tooltip */}
                <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                  Fees deducted on every transaction
                </div>
              </div>
            </div>

          </div>
          <div>
            <Button
              onClickHandler={isLoading || amount <= 0 || isButtonDisabled ? null : handleWithdraw}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center ${isLoading || amount <= 0 || isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              title="Withdraw"
            />

          </div>
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-50"
              style={{
                background: "rgba(0, 0, 0, 0.4)", // Dim background
                backdropFilter: "blur(1px)", // Blur effect
              }}
            >
              <div className="loader"></div>
            </div>
          )}
        </div>
      )}
      {isPaymentDone && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 hover:text-gray-600 focus:outline-none self-end"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <p className="mt-2">
              You have withdrawn {amount} d{asset}
            </p>

            {/* <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-3 items-center dark:bg-[#1D1B40] dark:text-darkText">
              <div className="flex items-center gap-3 mt-3 text-nowrap text-[11px] lg1:text-[13px]">
                <span>Add dToken to wallet to track your balance.</span>
              </div>
              <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2 mb-2">
                <Wallet />
                Add to wallet
              </button>
            </div> */}
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawPopup;
