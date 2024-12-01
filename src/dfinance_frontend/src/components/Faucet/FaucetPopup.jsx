import React, { useState, useRef, useEffect } from "react";
import { X, TriangleAlert } from "lucide-react";
import FaucetPayment from "./FaucetPayment";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import { toast } from "react-toastify"; 
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
  const { userData} = useUserData();
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
      } catch (error) {
        
      }
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

    
    if (exchangeRate && numericAmount > exchangeRate) {
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
          toast.error(`Faucet limit exceeded! You can claim only up to $${availableAmount.toLocaleString()}`, {
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

        if (result.Err) {
          toast.error(`Error from backend: ${result.Err}`, {
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
      const timeUntilMidnight = midnightUTC.getTime() - now.getTime(); // Time remaining until midnight
  
      console.log(`Reset will occur in: ${timeUntilMidnight / 1000} seconds`);
  
      // Schedule the reset once at midnight
      setTimeout(() => {
        handleResetFaucetUsage(); // Reset faucet usage at midnight
  
        // After midnight reset, schedule it to run again every 24 hours
        setInterval(() => {
          handleResetFaucetUsage(); // Reset every 24 hours
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilMidnight); // Only runs once at midnight
    };
  
    resetFaucetLimitsAtMidnight(); // Initialize the midnight reset logic
  
    return () => {
      // Cleanup logic if needed, e.g. clearing intervals, though this should only run once per day
      console.log("Cleaning up reset timer.");
    };
  }, []); // Run only once on mount
  

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
                 $
                      {(
                        FaucetLimit[asset] / 1e8 -
                        FaucetUsage[asset] / 1e8
                      ).toLocaleString()}{" "}
                      Max
                    </p>
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
