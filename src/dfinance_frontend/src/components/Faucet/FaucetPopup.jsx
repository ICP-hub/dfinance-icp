import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import FaucetPayment from "./FaucetPayment";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import { toast } from "react-toastify"; // Import toastify
import useUserData from "../customHooks/useUserData";
const FaucetPopup = ({ isOpen, onClose, asset, assetImage }) => {
  const { backendActor } = useAuth();
  const modalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [faucetBTC, setFaucetBTC] = useState(0);
  const [faucetETH, setFaucetETH] = useState(0);
  const [faucetUSDC, setFaucetUSDC] = useState(0);
  const [faucetICP, setFaucetICP] = useState(0);
  const [faucetUSDT, setFaucetUSDT] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [amount, setAmount] = useState("");
  const { userData, healthFactorBackend, refetchUserData } = useUserData();
  const initialLimits = {
    ckBTC: 500,
    ckETH: 500,
    ckUSDC: 500,
    ICP: 500,
    ckUSDT: 500,
  };

  const initialUsages = {
    ckBTC: 0,
    ckETH: 0,
    ckUSDC: 0,
    ICP: 0,
    ckUSDT: 0,
  };

  const [FaucetUsage, setFaucetUsage] = useState(initialUsages); // To track faucet usage
  const [FaucetLimit, setFaucetLimit] = useState(initialLimits); // Max faucet limit (USD value)
  const [remainingFaucet, setRemainingFaucet] = useState(0);
  useEffect(() => {
    if (userData?.Ok?.reserves && userData.Ok.reserves[0]?.length > 0) {
      const updatedLimits = { ...initialLimits };
      const updatedUsages = { ...initialUsages };

      userData.Ok.reserves[0].forEach((reserveGroup) => {
        const asset = reserveGroup[0];
        if (!asset) return; // Skip invalid assets

        const faucetLimit = reserveGroup[1]?.faucet_limit
          ? Number(reserveGroup[1].faucet_limit) / 100000000
          : initialLimits[asset];

        const faucetUsage = reserveGroup[1]?.faucet_usage
          ? Number(reserveGroup[1].faucet_usage) / 100000000
          : initialUsages[asset];

        updatedLimits[asset] = faucetLimit;
        updatedUsages[asset] = faucetUsage;
      });

      setFaucetLimit(updatedLimits);
      setFaucetUsage(updatedUsages);
    } else {
      console.log(
        "Reserves data is missing or undefined. Using initial defaults."
      );
    }
  }, [userData]);

  const [showFaucetPayment, setShowFaucetPayment] = useState(false);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    fetchBalance,
  } = useFetchConversionRate();

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
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  useEffect(() => {
    if (ckBTCUsdRate && ckBTCUsdRate > 0) {
      const btcAmount = (
        (FaucetLimit[asset] - FaucetUsage[asset]) /
        (ckBTCUsdRate / 1e8)
      ).toFixed(8);
      setFaucetBTC(btcAmount);
    }

    if (ckETHUsdRate && ckETHUsdRate > 0) {
      const ethAmount = (
        (FaucetLimit[asset] - FaucetUsage[asset]) /
        (ckETHUsdRate / 1e8)
      ).toFixed(8);
      setFaucetETH(ethAmount);
    }

    if (ckUSDCUsdRate && ckUSDCUsdRate > 0) {
      const usdcAmount = (
        (FaucetLimit[asset] - FaucetUsage[asset]) /
        (ckUSDCUsdRate / 1e8)
      ).toFixed(8);
      setFaucetUSDC(usdcAmount);
    }

    if (ckICPUsdRate && ckICPUsdRate > 0) {
      const icpAmount = (
        (FaucetLimit[asset] - FaucetUsage[asset]) /
        (ckICPUsdRate / 1e8)
      ).toFixed(8);
      setFaucetICP(icpAmount);
    }

    if (ckUSDTUsdRate && ckUSDTUsdRate > 0) {
      const usdTAmount = (
        (FaucetLimit[asset] - FaucetUsage[asset]) /
        (ckUSDTUsdRate / 1e8)
      ).toFixed(8);
      setFaucetUSDT(usdTAmount);
    }
  }, [ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate]);

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
      case "ckUSDT":
        return faucetUSDT;
      default:
        return null;
    }
  };

  useEffect(() => {
    const faucetAmount = getFaucetAmount();
    setExchangeRate(faucetAmount);
  }, [asset, faucetBTC, faucetETH, faucetUSDC, faucetICP, faucetUSDT]);

  const handleAmountChange = (e) => {
    let inputAmount = e.target.value.replace(/,/g, "");

    if (inputAmount === "") {
      setAmount(""); // Clear the amount if input is empty
      return;
    }

    if (!/^\d*\.?\d*$/.test(inputAmount)) {
      return; // If invalid input, do nothing
    }

    const numericAmount = parseFloat(inputAmount);

    // Prevent the user from typing an amount greater than the exchangeRate
    if (exchangeRate && numericAmount > exchangeRate) {
      return; // Do not update if amount exceeds exchangeRate
    }

    let formattedAmount;
    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");
      formattedAmount = `${parseInt(integerPart).toLocaleString(
        "en-US"
      )}.${decimalPart.slice(0, 8)}`;
    } else {
      formattedAmount = parseInt(inputAmount).toLocaleString("en-US");
    }

    setAmount(formattedAmount);
  };

  const handleMaxAmountClick = () => {
    if (exchangeRate) {
      const formattedAmount = parseFloat(exchangeRate).toFixed(8);
      const displayAmount = formatWithCommas(formattedAmount);
      setAmount(displayAmount);
    }
  };

  const formatWithCommas = (value) => {
    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = parseInt(integerPart).toLocaleString("en-US");
    return decimalPart
      ? `${formattedInteger}.${decimalPart.slice(0, 8)}`
      : formattedInteger;
  };

  const handleFaucet = async (asset) => {
    setLoading(true);
    try {
      if (backendActor) {
        const numericAmount = parseFloat(amount.replace(/,/g, ""));

        if (isNaN(numericAmount)) {
          toast.error("Invalid amount entered.");
          setLoading(false);
          return;
        }

        const natAmount = Math.round(numericAmount * Math.pow(10, 8));

        let usdAmount = 0;
        switch (asset) {
          case "ckBTC":
            usdAmount = parseFloat(numericAmount) * (ckBTCUsdRate / 1e8);
            break;
          case "ckETH":
            usdAmount = parseFloat(numericAmount) * (ckETHUsdRate / 1e8);
            break;
          case "ckUSDC":
            usdAmount = parseFloat(numericAmount) * (ckUSDCUsdRate / 1e8);
            break;
          case "ICP":
            usdAmount = parseFloat(numericAmount) * (ckICPUsdRate / 1e8);
            break;
          case "ckUSDT":
            usdAmount = parseFloat(numericAmount) * (ckUSDTUsdRate / 1e8);
            break;
          default:
            throw new Error("Unknown asset type.");
        }
        console.log("usdAmount", usdAmount);

        if (usdAmount > FaucetLimit[asset]) {
          toast.error("Faucet limit exceeded!");
          setLoading(false);
          return;
        }

        const result = await backendActor.faucet(asset, natAmount);

        if (result.Err) {
          toast.error(`Error from backend: ${result.Err}`);
          setLoading(false);
          return;
        }

        setShowFaucetPayment(true);

        console.log("Faucet result:", result);
        toast.success(`Successfully claimed ${amount} ${asset}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setShowFaucetPayment(false);
    onClose();
  };

  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";
  const transferFee = fees[normalizedAsset] || fees.default;

  const handleResetFaucetUsage = async () => {
    setLoading(true); // Start loading when the function is called

    try {
      // Call the backend actor to reset faucet usage
      const result = await backendActor.reset_faucet_usage(asset);
console.log("result",result)
      if (result.Ok) {
        toast.success(`Successfully reset faucet usage for ${asset}`);
      } else {
        toast.error(`Error resetting faucet usage: ${result.Err}`);
      }
    } catch (error) {
      console.error("Error resetting faucet usage:", error);
      toast.error("Failed to reset faucet usage");
    } finally {
      setLoading(false); // Stop loading when done
    }
  };

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
                      className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
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

                    <p
                      className="button1 cursor-pointer bg-blue-100 dark:bg-gray-700/45 text-xs mt-4 p-2 py-1 rounded-md button1"
                      onClick={handleMaxAmountClick}
                    >
                      <span className="text-gray-500 text-[10px] dark:text-gray-400">
                        Approx.
                      </span>
                      {"   "} $
                      {(
                        FaucetLimit[asset] - FaucetUsage[asset]
                      ).toLocaleString()}{" "}
                      Max
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {console.log("faucet usuage", FaucetUsage)}
              <button
                onClick={() => handleFaucet(asset)}
                disabled={
                  amount.replace(/,/g, "") <= 0 ||
                  FaucetUsage[asset] >= FaucetLimit ||
                  loading
                }
                className={`w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] ${
                  amount.replace(/,/g, "") > 0 &&
                  FaucetUsage[asset] < FaucetLimit[asset]
                    ? "opacity-100 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {loading ? "Processing..." : `Faucet ${asset}`}
              </button>
              {/* <button
        onClick={handleResetFaucetUsage}
        disabled={loading}
        className={`w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] ${loading ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
      >
        {loading ? 'Resetting...' : `Reset Faucet Usage for ${asset}`}
      </button> */}
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
