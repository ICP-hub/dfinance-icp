import React, { useState, useRef, useEffect } from "react";
import { X, TriangleAlert } from "lucide-react";
import FaucetPayment from "./FaucetPayment";
import { useDispatch } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import useFetchConversionRate from "../CustomHooks/useFetchConversionRate";
import { toast } from "react-toastify";
import { toggleRefresh } from "../../redux/reducers/faucetUpdateReducer";
import useFunctionBlockStatus from "../CustomHooks/useFunctionBlockStatus";
import { showCaptchaToUser } from "../Captcha/showCaptchaToUser";
import { InitialFuaceLimit, SCALING_FACTOR } from '../../utils/constants';

/**
 * FaucetPopup Component
 *
 * This component provides a popup interface to claim faucet tokens.
 *
 * @param {boolean} isOpen - Determines whether the popup is open or closed.
 * @param {function} onClose - Function to close the popup.
 * @param {string} asset - The selected asset for the faucet.
 * @param {string} assetImage - Image for the selected asset.
 * @returns {JSX.Element} - Returns the FaucetPopup component.
 */
const FaucetPopup = ({ isOpen, onClose, asset, assetImage }) => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { isBlocked } = useFunctionBlockStatus();
  const faucetButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { backendActor, user, verifyCertificate } = useAuth();
  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    fetchBalance,
  } = useFetchConversionRate();

  /* ===================================================================================
   *                                 STATE-MANAGEMENT
   * =================================================================================== */
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faucetBTC, setFaucetBTC] = useState(0);
  const [faucetETH, setFaucetETH] = useState(0);
  const [faucetUSDC, setFaucetUSDC] = useState(0);
  const [faucetICP, setFaucetICP] = useState(0);
  const [faucetUSDT, setFaucetUSDT] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [showFaucetPayment, setShowFaucetPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);

  const initialLimits = {
    ckBTC: InitialFuaceLimit,
    ckETH: InitialFuaceLimit,
    ckUSDC: InitialFuaceLimit,
    ICP: InitialFuaceLimit,
    ckUSDT: InitialFuaceLimit,
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

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const modalRef = useRef(null);
  const dispatch = useDispatch();

  /* ===================================================================================
   *                                 FUNCTION
   * =================================================================================== */

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
    if (numericAmount > exchangeRate) {
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
    AmountExceedsLimit: "Requested amount exceeds the total faucet limit.",
    ExceedsRemainingLimit:
      "Requested amount exceeds the remaining faucet limit.",
    ErrorFaucetTokens:
      "An error occurred while transferring tokens. Please try again.",
    Default:
      "An unexpected error occurred during the faucet process. Please try again later.",
  };

  /**
   * handleFaucet function
   *
   * This function handles the process of claiming faucet tokens for the selected asset.
   * It checks the input amount, ensures it's within the faucet limits, and then makes a request to the backend
   * to transfer the requested amount of tokens. It also displays appropriate success or error messages.
   *
   * @param {string} asset - The asset selected by the user to claim.
   */
  const handleFaucet = async (asset) => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      let captchaData = null;

      try {
        captchaData = await backendActor.create_captcha();
      } catch (error) {
        console.error("Error in create_captcha:", error);
        toast.error("Failed to create captcha. Please try again.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
        });
        setLoading(false);
        return;
      }

      if (captchaData?.Err) {
        console.error("Captcha error:", captchaData.Err);

        if ("CaptchaLimitReached" in captchaData.Err) {
          toast.error("Captcha limit reached. Please try again later.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
          });
        } else if ("CaptchaAlreadyExists" in captchaData.Err) {
          toast.error("Captcha already exists. Please wait a moment and try again.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
          });
        }

        setLoading(false);
        return;
      }

      setIsCaptchaOpen(true);
      let captchaVerified = false;

      while (!captchaVerified) {
        try {
          const { userInput, unmount } = await showCaptchaToUser(captchaData);

          const result = await backendActor.verify_captcha(userInput);

          if (result.Ok === null) {
            captchaVerified = true;
            unmount();
            setIsCaptchaOpen(false);

            toast.success("Captcha verified successfully!", {
              className: "custom-toast",
              position: "top-center",
              autoClose: 3000,
            });

            const numericAmount = parseFloat(amount.replace(/,/g, ""));
            if (isNaN(numericAmount)) {
              toast.error("Invalid amount entered.");
              setLoading(false);
              return;
            }

            const natAmount = Math.round(numericAmount * Math.pow(10, 8));
            const availableAmount = FaucetLimit[asset] - FaucetUsage[asset];

            if (numericAmount > availableAmount) {
              toast.error(`Faucet limit exceeded!`, {
                className: "custom-toast",
                position: "top-center",
                autoClose: 3000,
              });
              dispatch(toggleRefresh());
              setLoading(false);
              return;
            }

            try {
              const faucetResult = await backendActor.faucet(asset, natAmount);

              if (faucetResult.Err) {
                const errorKey = faucetResult.Err;
                toast.error(`Faucet error: ${Object.keys(errorKey)[0]}`, {
                  className: "custom-toast",
                  position: "top-center",
                  autoClose: 5000,
                });
                dispatch(toggleRefresh());
                setLoading(false);
                return;
              }

              toast.success(`Successfully claimed ${amount} ${asset}`, {
                className: "custom-toast",
                position: "top-center",
                autoClose: 3000,
              });

              setShowFaucetPayment(true);
              dispatch(toggleRefresh());
              setLoading(false);
            } catch (error) {
              console.error("Error during faucet transaction:", error);
              toast.error(`Transaction error: ${error.message}`, {
                className: "custom-toast",
                position: "top-center",
                autoClose: 5000,
              });
              setLoading(false);
            }
          } else {
            toast.error("Captcha verification failed. Try again.", {
              className: "custom-toast",
              position: "top-center",
              autoClose: 3000,
            });
            unmount();
            setIsCaptchaOpen(false);
            await new Promise((res) => setTimeout(res, 300));
            setIsCaptchaOpen(true);
          }
        } catch (error) {
          console.error("Error in captcha process:", error);
          toast.error("Something went wrong during captcha process.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
          });
          setIsCaptchaOpen(false);
          break;
        }
      }
    } catch (error) {
      console.error("Error in faucet process:", error.message);
      setIsCaptchaOpen(false);

      if (
        error.message.includes("out of cycles") ||
        error.message.includes("Reject text: Canister")
      ) {
        toast.error("Canister is out of cycles. Please wait, the admin has been notified.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error(`Error: ${error.message}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };



  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowFaucetPayment(false);
    onClose();
  };

  const getUserFaucetData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }

    setIsFaucetLoading(true);

    try {
      const result = await backendActor.get_user_faucet_data(user);

      if ("Ok" in result) {
        const verification = await verifyCertificate(result.Ok[1]);
        if (!verification) {
          console.error("Certificate verification failed");
          setError("Certificate verification failed");
          return;
        }

        const reserves = result.Ok[0].reserves;
        if (reserves && reserves[0]?.length > 0) {
          const updatedLimits = { ...initialLimits };
          const updatedUsages = { ...initialUsages };

          reserves[0].forEach((reserveGroup) => {
            const asset = reserveGroup[0];
            if (!asset) return;

            const faucetLimitRaw = reserveGroup[1]?.faucet_limit
              ? Number(reserveGroup[1].faucet_limit)
              : initialLimits[asset];
            const faucetUsageRaw = reserveGroup[1]?.faucet_usage
              ? Number(reserveGroup[1].faucet_usage)
              : initialUsages[asset];

            const faucetLimit = Math.trunc(faucetLimitRaw * SCALING_FACTOR) / SCALING_FACTOR;
            const faucetUsage = Math.trunc(faucetUsageRaw * SCALING_FACTOR) / SCALING_FACTOR;

            updatedLimits[asset] = faucetLimit;
            updatedUsages[asset] = faucetUsage;
          });

          setFaucetLimit(updatedLimits);
          setFaucetUsage(updatedUsages);
        } else {
          setFaucetLimit(initialLimits);
          setFaucetUsage(initialUsages);
        }
      }
    } catch (error) {
      setError(error.message);
      console.error(error.message);
      if (error.message.toLowerCase().includes("freeze canister")) {
        setIsFreezePopupVisible(true);
      }
    } finally {
      setIsFaucetLoading(false);
    }
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          faucetButtonRef.current &&
          !faucetButtonRef.current.disabled
        ) {
          faucetButtonRef.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
        console.error(error.message);
      }
    };
    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  useEffect(() => {
    if (!asset || FaucetLimit[asset] === undefined || FaucetUsage[asset] === undefined) return;

    const remaining = FaucetLimit[asset] - FaucetUsage[asset];

    if (ckBTCUsdRate && ckBTCUsdRate > 0) {
      const btcAmount = remaining / ckBTCUsdRate;
      setFaucetBTC(Math.trunc(btcAmount * SCALING_FACTOR) / SCALING_FACTOR);
    }

    if (ckETHUsdRate && ckETHUsdRate > 0) {
      const ethAmount = remaining / ckETHUsdRate;
      setFaucetETH(Math.trunc(ethAmount * SCALING_FACTOR) / SCALING_FACTOR);
    }

    if (ckUSDCUsdRate && ckUSDCUsdRate > 0) {
      const usdcAmount = remaining / ckUSDCUsdRate;
      setFaucetUSDC(Math.trunc(usdcAmount * SCALING_FACTOR) / SCALING_FACTOR);
    }

    if (ckICPUsdRate && ckICPUsdRate > 0) {
      const icpAmount = remaining / ckICPUsdRate;
      setFaucetICP(Math.trunc(icpAmount * SCALING_FACTOR) / SCALING_FACTOR);
    }

    if (ckUSDTUsdRate && ckUSDTUsdRate > 0) {
      const usdtAmount = remaining / ckUSDTUsdRate;
      setFaucetUSDT(Math.trunc(usdtAmount * SCALING_FACTOR) / SCALING_FACTOR);
    }
  }, [
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    FaucetUsage[asset],
    FaucetLimit[asset],
    asset
  ]);


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
    if (user) {
      getUserFaucetData(user);
    }
  }, [user]);

  useEffect(() => {
    const faucetAmount = getFaucetAmount();
    setExchangeRate(faucetAmount);
  }, [asset, faucetBTC, faucetETH, faucetUSDC, faucetICP, faucetUSDT]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (isCaptchaOpen) {
    return null;
  }

  /* ===================================================================================
   *                                  RENDER-COMPONENTS
   * =================================================================================== */

  return (
    <>
      {isOpen && !showFaucetPayment && (
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
                  <div className="w-[80%]">
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
                      className={`cursor-pointer bg-blue-100 dark:bg-gray-700/45 text-xs mt-4 p-3 py-2 rounded-md ${isFaucetLoading ||
                        Math.floor(
                          ((FaucetLimit[asset] - FaucetUsage[asset]) / SCALING_FACTOR) *
                          100
                        ) /
                        100 <=
                        0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                      onClick={
                        isFaucetLoading ||
                          Math.floor(
                            ((FaucetLimit[asset] - FaucetUsage[asset]) / SCALING_FACTOR) *
                            100
                          ) /
                          100 <=
                          0
                          ? undefined
                          : handleMaxAmountClick
                      }
                    >
                      {isFaucetLoading ? (
                        <div className="flex justify-center items-center space-x-2">
                          <div className="w-4 h-4 border-4 border-t-4 border-gray-200 border-solid rounded-full animate-spin border-t-blue-500"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <>
                          $
                          {(
                            (FaucetLimit[asset] - FaucetUsage[asset]) /
                            SCALING_FACTOR
                          ).toFixed(2)}{" "}
                          Max
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {(() => {
                const remainingAmount =
                  FaucetLimit[asset] / SCALING_FACTOR - Number(FaucetUsage[asset]) / SCALING_FACTOR;
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
                        Faucet limit has been exceeded. It will reset at 00:00
                        (UTC).
                      </div>
                    </div>
                  </div>
                )}

              <button
                ref={faucetButtonRef}
                onClick={() => handleFaucet(asset)}
                disabled={
                  amount.replace(/,/g, "") <= 0 ||
                  FaucetUsage[asset] >= FaucetLimit ||
                  loading
                }
                className={`w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] ${amount.replace(/,/g, "") > 0 &&
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
