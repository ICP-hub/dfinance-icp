import React, { useState, useEffect, useRef } from "react";
import Button from "../../Common/Button";
import { Info } from "lucide-react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
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
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,liquidationThreshold, assetSupply, assetBorrow, }) => {

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

  useEffect(() => {
    const fetchConversionRate = async () => {
      try {
        let coinId;

        // Map asset to CoinGecko coin IDs
        if (asset === "ckBTC") {
          coinId = "bitcoin";
        } else if (asset === "ckETH") {
          coinId = "ethereum";
        } else {
          console.error("Unsupported asset:", asset);
          return;
        }

        // Fetch conversion rate from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("CoinGecko data", data);

        // Extract the conversion rate (price in USD)
        const rate = data[coinId]?.usd;
        if (rate) {
          setConversionRate(rate);
          console.log("Conversion rate:", rate);
        } else {
          console.error("Conversion rate not found for asset:", asset);
        }
      } catch (error) {
        console.error("Error fetching conversion rate", error);
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
        setUsdValue(0);
      }
    } else if (inputAmount === "") {
      // Allow empty input and reset error
      setAmount("");
      setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
      setUsdValue(0);
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
    } else {
      console.error("Unknown asset:", asset);
      return;
    }

    try {


      const amountInUnits = BigInt(amount);
      // Call the withdraw function on the selected ledger actor
      const withdrawResult = await backendActor.withdraw(asset, amountInUnits, [], true);
      console.log("Withdraw result", withdrawResult);
      toast.success("Supply successful!");
      window.location.reload()

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

  return (
    <>
      <h1 className="font-semibold text-xl">Withdraw {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>

          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
            <div className="w-5/12 md:w-4/12">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="text-md focus:outline-none bg-gray-100 rounded-md py-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                placeholder="Enter Amount"
              />
             <p className="text-xs text-gray-500 ">
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
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
            <div className="w-8/12">
              <p className="text-sm">Remaining supply</p>
            </div>
            <div className="w-4/12 flex flex-col items-end">
              <p className="text-xs mt-2">{assetSupply-amount} Max</p>
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
        <Button title="Withdraw" onClickHandler={handleWithdraw} />
      </div>
    </>
  );
};

export default WithdrawPopup;
