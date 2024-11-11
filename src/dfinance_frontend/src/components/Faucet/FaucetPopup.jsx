import React, { useState ,useRef } from "react";
import { X } from "lucide-react";
import FaucetPayment from "./FaucetPayment";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import { useEffect } from "react";

const FaucetPopup = ({ isOpen, onClose, asset, assetImage }) => {
  const { backendActor } = useAuth();
  const modalRef = useRef(null);
  const [faucetBTC, setFaucetBTC] = useState(0);
  const [faucetETH, setFaucetETH] = useState(0);
  const [faucetUSDC, setFaucetUSDC] = useState(0);
  const [faucetICP, setFaucetICP] = useState(0);
  const [faucetUSDT, setFaucetUSDT] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(null);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();
  console.log('ckBTCUsdRate:', ckBTCUsdRate);  // Should not be null or 0
console.log('ckETHUsdRate:', ckETHUsdRate);
console.log('ckUSDCUsdRate:', ckUSDCUsdRate);
console.log('ckICPUsdRate:', ckICPUsdRate);
console.log('ckUSDTUsdRate:', ckUSDTUsdRate);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchBalance("ckUSDT"),
          fetchConversionRate(),
        ]);
      } catch (error) {
        setError(error);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  useEffect(() => {
    // Ensure rates are valid before calculation
    if (ckBTCUsdRate && ckBTCUsdRate > 0) {
      const btcAmount = ((10000 / (ckBTCUsdRate / 1e8))).toFixed(8);  // Divide by 10^8 first
      setFaucetBTC(btcAmount);
    } else {
      console.error('Invalid ckBTCUsdRate:', ckBTCUsdRate);
    }

    if (ckETHUsdRate && ckETHUsdRate > 0) {
      const ethAmount = ((10000 / (ckETHUsdRate / 1e8))).toFixed(8);  // Same here for ETH
      setFaucetETH(ethAmount);
    } else {
      console.error('Invalid ckETHUsdRate:', ckETHUsdRate);
    }

    if (ckUSDCUsdRate && ckUSDCUsdRate > 0) {
      const usdcAmount = ((10000 / (ckUSDCUsdRate / 1e8))).toFixed(8);  // Same for USDC
      setFaucetUSDC(usdcAmount);
    } else {
      console.error('Invalid ckUSDCUsdRate:', ckUSDCUsdRate);
    }

    if (ckICPUsdRate && ckICPUsdRate > 0) {
      const icpAmount = ((10000 / (ckICPUsdRate / 1e8))).toFixed(8);  // Same for ICP
      setFaucetICP(icpAmount);
    } else {
      console.error('Invalid ckICPUsdRate:', ckICPUsdRate);
    }

    if (ckUSDTUsdRate && ckUSDTUsdRate > 0) {
      const usdTAmount = ((10000 / (ckUSDTUsdRate / 1e8))).toFixed(8);  // Same for USDT
      setFaucetUSDT(usdTAmount);
    } else {
      console.error('Invalid ckUSDTUsdRate:', ckUSDTUsdRate);
    }
}, [
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
]);


  

  const getFaucetAmount = () => {
    switch (asset) {
      case "ckBTC":
        return faucetBTC;
      case "ckETH":
        return faucetETH;
      case "ckUSDC":
        return faucetUSDC;
      case "ICP":
        return faucetICP;
      case "ckUSDT": // Added case for ckUSDT
        return faucetUSDT;
      default:
        return null; // Return null if the asset is not recognized
    }
  };
  

  useEffect(() => {
    const faucetAmount = getFaucetAmount();
    setExchangeRate(faucetAmount);
  }, [asset, faucetBTC, faucetETH, faucetUSDC, faucetICP ,faucetUSDT]);
  console.log("faucetasset",faucetBTC, faucetETH, faucetUSDC, faucetICP ,faucetUSDT)
  const [amount, setAmount] = useState("");
  const [showFaucetPayment, setShowFaucetPayment] = useState(false);

  const handleAmountChange = (e) => {
    // Get the input value and remove commas for processing
    let inputAmount = e.target.value.replace(/,/g, "");
    
    if (inputAmount === "") {
      setAmount(""); // Clear the amount if input is empty
      return;
    }
    // Allow only numbers and decimals
    if (!/^\d*\.?\d*$/.test(inputAmount)) {
      return; // If invalid input, do nothing
    }

    // Convert inputAmount to a number for comparison with exchangeRate
    const numericAmount = parseFloat(inputAmount);

    // Prevent the user from typing an amount greater than the exchangeRate
    if (exchangeRate && numericAmount > exchangeRate) {
      return; // Do not update if amount exceeds exchangeRate
    }

    // Split the integer and decimal parts, if applicable
    let formattedAmount;
    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");

      // Format the integer part with commas and limit decimal places to 8 digits
      formattedAmount = `${parseInt(integerPart).toLocaleString(
        "en-US"
      )}.${decimalPart.slice(0, 8)}`;
    } else {
      // If no decimal, format the integer part with commas
      formattedAmount = parseInt(inputAmount).toLocaleString("en-US");
    }

    // Set the formatted amount in the state
    setAmount(formattedAmount);
  };

  const handleMaxAmountClick = () => {
    if (exchangeRate) {
      console.log("exchangeRate",exchangeRate)
      // Convert exchangeRate to a number, format it to 8 decimal places, and ensure it's a valid number
      const formattedAmount = parseFloat(exchangeRate).toFixed(8);
      // Format it for display
      const displayAmount = formatWithCommas(formattedAmount);
      setAmount(displayAmount);
    }
  };

  const formatWithCommas = (value) => {
    // Ensure the value is a number before formatting
    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = parseInt(integerPart).toLocaleString("en-US");
    return decimalPart
      ? `${formattedInteger}.${decimalPart.slice(0, 8)}`
      : formattedInteger;
  };

  const handleFaucetETH = async (asset) => {
    console.log("Faucet", asset, "ETH:", amount);
    setShowFaucetPayment(true);

    try {
      if (backendActor) {
        // Remove commas and convert to a float, then scale to nat
        const numericAmount = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(numericAmount)) {
          throw new Error("Invalid amount entered.");
        }

        const natAmount = Math.round(numericAmount * Math.pow(10, 8)); // Scale to nat (if needed)
        console.log("Scaled amount", natAmount);

        // Await the result if faucet is asynchronous
        const result = await backendActor.faucet(asset, natAmount);
        console.log("Faucet result.", result);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    // Add event listener for clicks
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleClose = () => {
    setShowFaucetPayment(false);
    onClose();
  };

  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const maxAmount = 10000;

  return (
    <>
    
      {!showFaucetPayment && (
         <div className="modal" ref={modalRef}>
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl rounded-[1rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-7 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-semibold text-xl">Faucet {asset}</h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[60%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2  w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                    min="0"
                  />
                </div>
                <div className="w-9/12 flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={assetImage}
                      alt="connect_wallet_icon"
                      className="object-cover w-8 h-8 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  {maxAmount && (
                    <p
                      className="button1 cursor-pointer bg-blue-100 dark:bg-gray-700/45 text-xs mt-4 p-2 py-1 rounded-md button1"
                      onClick={handleMaxAmountClick}
                    >
                      <span className="text-gray-500 text-[10px] dark:text-gray-400">
                        Approx.
                      </span>
                      {"   "} ${maxAmount.toLocaleString()} Max
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => handleFaucetETH(asset)}
              disabled={amount.replace(/,/g, "") <= 0}
              className={`w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] ${
                amount.replace(/,/g, "") > 0
                  ? "opacity-100 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              Faucet {asset}
            </button>
          </div>
        </div>
        </div>
      )}
      {showFaucetPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50" />
          <FaucetPayment asset={asset} amount={amount} onClose={handleClose} />
        </div>
      )}
    </>
  );
};

export default FaucetPopup;
