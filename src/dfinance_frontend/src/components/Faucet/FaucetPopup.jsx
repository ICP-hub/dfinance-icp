import React, { useState, useRef, useEffect } from "react";
import { X, TriangleAlert } from "lucide-react";
import FaucetPayment from "./FaucetPayment";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import { toast } from "react-toastify";
import useUserData from "../customHooks/useUserData";
import { toggleRefresh } from "../../redux/reducers/faucetUpdateReducer";

const FaucetPopup = ({ isOpen, onClose, asset, assetImage }) => {
  const dispatch = useDispatch();
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
  const { userData } = useUserData();
  const initialLimits = {
    ckBTC: 50000000000,
    ckETH: 50000000000,
    ckUSDC: 50000000000,
    ICP: 50000000000,
    ckUSDT: 50000000000,
  };

  const initialUsages = {
    ckBTC: 0,
    ckETH: 0,
    ckUSDC: 0,
    ICP: 0,
    ckUSDT: 0,
  };

  const [FaucetUsage, setFaucetUsage] = useState(initialUsages);
  const [FaucetLimit, setFaucetLimit] = useState(initialLimits);
  const [remainingFaucet, setRemainingFaucet] = useState(0);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  useEffect(() => {
    if (userData?.Ok?.reserves && userData.Ok.reserves[0]?.length > 0) {
      const updatedLimits = { ...initialLimits };
      const updatedUsages = { ...initialUsages };

      userData.Ok.reserves[0].forEach((reserveGroup) => {
        const asset = reserveGroup[0];
        if (!asset) return;

        const faucetLimit = reserveGroup[1]?.faucet_limit
          ? Number(reserveGroup[1].faucet_limit)
          : initialLimits[asset];

        const faucetUsage = reserveGroup[1]?.faucet_usage
          ? Number(reserveGroup[1].faucet_usage)
          : initialUsages[asset];

        updatedLimits[asset] = faucetLimit;
        updatedUsages[asset] = faucetUsage;
      });

      setFaucetLimit(updatedLimits);
      setFaucetUsage(updatedUsages);
    } else {
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
      } catch (error) {}
    };
    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  useEffect(() => {
    if (ckBTCUsdRate && ckBTCUsdRate > 0) {
      const btcAmount =
        (FaucetLimit[asset] - FaucetUsage[asset]) / ckBTCUsdRate;
      const truncatedBtcAmount = Math.trunc(btcAmount * 1e8) / 1e8;
      setFaucetBTC(truncatedBtcAmount);
    }

    if (ckETHUsdRate && ckETHUsdRate > 0) {
      const ethAmount =
        (FaucetLimit[asset] - FaucetUsage[asset]) / ckETHUsdRate;
      const truncatedBtcAmount = Math.trunc(ethAmount * 1e8) / 1e8;
      setFaucetETH(truncatedBtcAmount);
    }

    if (ckUSDCUsdRate && ckUSDCUsdRate > 0) {
      const usdcAmount =
        (FaucetLimit[asset] - FaucetUsage[asset]) / ckUSDCUsdRate;
      const truncatedBtcAmount = Math.trunc(usdcAmount * 1e8) / 1e8;
      setFaucetUSDC(truncatedBtcAmount);
    }

    if (ckICPUsdRate && ckICPUsdRate > 0) {
      const icpAmount =
        (FaucetLimit[asset] - FaucetUsage[asset]) / ckICPUsdRate;
      const truncatedBtcAmount = Math.trunc(icpAmount * 1e8) / 1e8;
      setFaucetICP(truncatedBtcAmount);
    }

    if (ckUSDTUsdRate && ckUSDTUsdRate > 0) {
      const usdTAmount =
        (FaucetLimit[asset] - FaucetUsage[asset]) / ckUSDTUsdRate;
      const truncatedBtcAmount = Math.trunc(usdTAmount * 1e8) / 1e8;

      setFaucetUSDT(truncatedBtcAmount);
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
      setAmount("");
      return;
    }

    if (!/^\d*\.?\d*$/.test(inputAmount)) {
      return;
    }

    const numericAmount = parseFloat(inputAmount);
    const availableAmount = (FaucetLimit[asset] - FaucetUsage[asset]) / 1e8;

    if (numericAmount > availableAmount) {
      return;
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

  const errorMessages = {
    EmptyAsset: "Asset cannot be empty. Please select a valid asset.",
    InvalidAssetLength:
      "Asset name is too long. It must be 7 characters or less.",
    InvalidAmount:
      "The amount entered is invalid. Please enter a positive value.",
    InvalidPrincipal:
      "Anonymous users are not allowed. Please log in to continue.",
    NoCanisterIdFound:
      "The asset is not supported. Please select a valid asset.",
    LowWalletBalance: "Insufficient wallet balance. Please try again later.",
    AmountTooMuch: "The requested amount exceeds the faucet limit.",
    ErrorFaucetTokens:
      "An error occurred while transferring tokens. Please try again.",
    Default:
      "An unexpected error occurred during the faucet process. Please try again later.",
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
        const availableAmount = FaucetLimit[asset] - FaucetUsage[asset];
        if (numericAmount > availableAmount) {
          toast.error(`Faucet limit exceeded! `, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setLoading(false);
          return;
        }
        const result = await backendActor.faucet(asset, natAmount);
        dispatch(toggleRefresh());
        if (result.Err) {
          const errorKey = result.Err;
          console.log(errorKey);
          const userFriendlyMessage =
            errorMessages[errorKey] || "An unexpected error occurred, please try again later.";
          toast.error(userFriendlyMessage, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setLoading(false);
          return;
        }

        setShowFaucetPayment(true);
        toast.success(`Successfully claimed ${amount} ${asset}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error(error.message);
      toast.error(`Error: ${error.message}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
    setLoading(true);

    try {
      const result = await backendActor.reset_faucet_usage();

      if (result.Ok === null || result.Ok === undefined) {
        const updatedLimits = { ...FaucetLimit };
        updatedLimits[asset] = 50000000000;
        setFaucetLimit(updatedLimits);
        toast.success(`Reset faucet succesfull for ${asset}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error(`Unexpected response from backend: ${result.Ok}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      toast.success("Failed to reset faucet usage", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const resetFaucetLimitsAtMidnight = () => {
      const now = new Date();
      const midnightUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      const timeUntilMidnight = midnightUTC.getTime() - now.getTime();

      setTimeout(() => {
        handleResetFaucetUsage();

        setInterval(() => {
          handleResetFaucetUsage();
        }, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    };

    resetFaucetLimitsAtMidnight();

    return () => {};
  }, []);

  return (
    <>
      {!showFaucetPayment && (
        <div className="modal" ref={modalRef}>
          <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl rounded-[1rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-7 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-semibold text-xl">Faucet {asset}</h1>
              <button
                onClick={onClose}
                className="text-gray-400 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-5 text-sm">
              <div className="w-full">
                <div className="w-full flex justify-between my-2">
                  <h1>Transaction overview</h1>
                </div>
                <div className="w-full flex items-center justify-between bg-gray-100 p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
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
                    <div
                      className="cursor-pointer bg-blue-100 dark:bg-gray-700/45 text-xs mt-4 p-3 py-2 rounded-md"
                      onClick={handleMaxAmountClick}
                    >
                      $
                      {(
                        (FaucetLimit[asset] - FaucetUsage[asset]) /
                        1e8
                      ).toLocaleString()}{" "}
                      Max
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {(() => {
                const remainingAmount =
                  FaucetLimit[asset] / 1e8 - Number(FaucetUsage[asset]) / 1e8;
                const formattedAmount = remainingAmount.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                );

                return parseFloat(formattedAmount) <= 0;
              })() && (
                <div className="w-full flex flex-col my-3 space-y-2">
                  <div className="w-full flex bg-[#BA5858] p-3 rounded-lg text-white">
                    <div className="w-1/12 flex items-center justify-center">
                      <div className="warning-icon-container">
                        <TriangleAlert />
                      </div>
                    </div>
                    <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                      Faucet limit has been exceeded. It will reset at midnight.
                    </div>
                  </div>
                </div>
              )}

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
