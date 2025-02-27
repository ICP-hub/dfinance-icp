import { Info, Check, X } from "lucide-react";
import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import { trackEvent } from "../../../utils/googleAnalytics";
import { toggleDashboardRefresh } from "../../../redux/reducers/dashboardDataUpdateReducer";

/**
 * Repay Component
 *
 * This component allows users to repay borrowed amounts in various assets. It handles user input for repayment amounts,
 * updates the USD equivalent of the repayment, and manages the approval process before executing the repayment transaction.
 *
 * @param {Object} props - Component props containing asset details, modal state, user data, and other necessary data for repayment.
 * @returns {JSX.Element} - Returns the Repay component, allowing users to input and execute repayment transactions.
 */

const Repay = ({
  asset,
  image,
  supplyRateAPR,
  balance,
  liquidationThreshold,
  reserveliquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  currentCollateralStatus,
  Ltv,
  borrowableValue,
  borrowableAssetValue,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const { userData, healthFactorBackend, refetchUserData } = useUserData();
  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);
  const { backendActor, principal } = useAuth();

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [amount, setAmount] = useState(null);
  const modalRef = useRef(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [usdValue, setUsdValue] = useState(0);
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const ledgerActors = useSelector((state) => state.ledger);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const [showPanicPopup, setShowPanicPopup] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [maxAmount, setMaxAmount] = useState("0");
  const [maxClicked, setMaxClicked] = useState(false);

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const fees = useSelector((state) => state.fees.fees);
  const dispatch = useDispatch();

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  const truncateToSevenDecimals = (value) => {
    const multiplier = Math.pow(10, 8);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(8);
  };

  /**
   * Handles the change in the input field for the repayment amount. It ensures that only valid numeric input
   * is accepted and updates the state accordingly. It also updates the USD equivalent of the entered amount.
   *
   * @param {object} e - The event triggered by user input in the amount field.
   * @returns {void}
   */
  const handleAmountChange = (e) => {
    let inputAmount = e.target.value;
    if (inputAmount === "") {
      setAmount("");
      updateAmountAndUsdValue("");
      return;
    }
    inputAmount = inputAmount.replace(/[^0-9.]/g, "");
    if (inputAmount.indexOf(".") !== inputAmount.lastIndexOf(".")) {
      inputAmount = inputAmount.slice(0, inputAmount.lastIndexOf("."));
    }
    let numericAmount = parseFloat(inputAmount);
    if (isNaN(numericAmount)) numericAmount = 0;
    if (numericAmount > assetBorrow) {
      numericAmount = assetBorrow;
      inputAmount = truncateToSevenDecimals(assetBorrow).toString();
    }
    setAmount(inputAmount);
    setMaxClicked(inputAmount === assetBorrow.toString());
    updateAmountAndUsdValue(inputAmount);
  };

  /**
   * This function updates the USD equivalent of the repayment amount based on the entered amount and conversion rate.
   * It also validates the input to ensure it is a positive number and does not exceed the available borrow balance.
   *
   * @param {string} inputAmount - The repayment amount entered by the user.
   * @returns {void}
   */
  const updateAmountAndUsdValue = (inputAmount) => {
    let numericAmount = parseFloat(inputAmount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setAmount("");
      setUsdValue("0.00"); // ✅ Always show 2 decimal places
      setError("Amount must be a positive number");
      return;
    }
    if (numericAmount > assetBorrow) {
      setError("Amount exceeds the supply balance");
      return;
    }
    const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
    const convertedValue = numericAmount * adjustedConversionRate;
    setUsdValue(convertedValue.toFixed(7));
    setAmount(inputAmount);
    setError("");
  };

  const formatAmountWithCommas = (amount) => {
    if (!amount) return "0";
    const parts = amount.toString().split(".");
    parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");
    return parts.length > 1 ? parts.join(".") : parts[0];
  };

  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const numericBalance = balance;
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const amountAsNat64 = Number(amount);
  const scaledAmount = amountAsNat64 * Number(10 ** 8);

  /**
   * This function handles the approval process before executing a repayment. It checks the asset type and uses the appropriate
   * ledger actor to approve the repayment amount for the selected asset.
   *
   */
  const handleApprove = async () => {
    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    } else if (asset === "ckUSDT") {
      ledgerActor = ledgerActors.ckUSDT;
    }
    const safeAmount = Number(amount.replace(/,/g, "")) || 0;
    let amountAsNat64 = Math.round(amount.replace(/,/g, "") * Math.pow(10, 8));
    const scaledAmount = amountAsNat64;
    const totalAmount = scaledAmount + transferfee;
    try {
      const approval = await ledgerActor.icrc2_approve({
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: totalAmount,
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
          subaccount: [],
        },
      });

      if (approval?.Ok) {
        setIsApproved(true);
        toast.success(`Approval successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if (approval?.Err) {
        toast.error(`Error: ${approval.Err || "Approval failed!"}`, {
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
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
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
  };

  const errorMessages = {
    NoCanisterIdFound:
      "The requested asset is unavailable. Please try again later.",
    NoReserveDataFound:
      "Unable to find reserve data. Ensure the asset is valid.",
    ErrorMintDebtTokens:
      "Failed to process the transaction. Please contact support.",

    default: "An unexpected error occurred. Please try again later.",
  };

  /**
   * This function executes the repayment transaction. It calls the backend to perform the repayment for the specified asset.
   */
  const handleRepayETH = async () => {
    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    } else if (asset === "ckUSDT") {
      ledgerActor = ledgerActors.ckUSDT;
    }

    try {
      let amountAsNat64 = Math.round(
        amount.replace(/,/g, "") * Math.pow(10, 8)
      );
      const scaledAmount = amountAsNat64;
      const safeAmount = Number(amount.replace(/,/g, "")) || 0;
      const repayParams = {
        asset: asset,
        amount: scaledAmount,
        on_behalf_of: [],
      };

      const repayResult = await backendActor.execute_repay(repayParams);
      dispatch(toggleDashboardRefresh());
      if ("Ok" in repayResult) {
        trackEvent(
          "Repay," +
            asset +
            "," +
            scaledAmount / 100000000 +
            "," +
            principalObj.toString(),
          "Assets",
          "Repay," +
            asset +
            "," +
            scaledAmount / 100000000 +
            ", " +
            principalObj.toString()
        );
        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }
        toast.success("Repay successful!", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setIsPaymentDone(true);
        setIsVisible(false);
      } else if ("Err" in repayResult) {
        const errorMsg = repayResult.Err;
        if (errorMsg?.AmountSubtractionError === null) {
          toast.error("Repay failed: You cannot repay more than you owe.", {
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
          const isPanicError = JSON.stringify(errorMsg)
            .toLowerCase()
            .includes("panic");

          if (isPanicError) {
            setShowPanicPopup(true);
          } else {
            const userFriendlyMessage =
              errorMessages[errorMsg] ||
              errorMessages.default ||
              "Repay action failed!";
            toast.error(`Repay failed: ${userFriendlyMessage}`, {
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
        }
      }
    } catch (error) {
      console.error("Caught error:", error.message);
      let message = error.message || "Repay action failed!";

      if (message.toLowerCase().includes("panic")) {
        setShowPanicPopup(true);
      } else if (
        message.includes(
          "Panicked at 'Cannot subtract b from a because b is larger than a."
        )
      ) {
        message = "You cannot repay more than you owe.";
      } else if (
        message.toLowerCase().includes("out of cycles") ||
        message.includes("Reject text: Canister")
      ) {
        message = "Canister is out of cycles. Admin has been notified.";
      }

      toast.error(`Error: ${message}`, {
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
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
  };

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleRepayETH();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
    const amountTaken = 0;
    const amountAdded = usdValue || 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountTaken);
    let totalDeptValue = parseFloat(totalDebt) - parseFloat(amountAdded);
    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (
      (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue
    );
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return totalDeptValue / totalCollateralValue;
  };

  const handleMaxClick = () => {
    const truncateToSevenDecimals = (value) => {
      const multiplier = Math.pow(10, 8);
      const truncated = Math.floor(value * multiplier) / multiplier;
      return truncated.toFixed(8);
    };

    let selectedBalance =
      supplyBalance > assetBorrow ? assetBorrow : supplyBalance;
    let displayBalance = selectedBalance
      ? selectedBalance >= 1e-8 && selectedBalance < 1e-7
        ? Number(selectedBalance).toFixed(8)
        : selectedBalance >= 1e-7 && selectedBalance < 1e-6
        ? Number(selectedBalance).toFixed(7)
        : truncateToSevenDecimals(selectedBalance)
      : "0";
    const maxAmount = displayBalance.toString();
    setMaxAmount(maxAmount);
    setMaxClicked(true);
    updateAmountAndUsdValue(maxAmount);
  };

  const formatValue = (value) => {
    if (!value) return "0";
    return Number(value)
      .toFixed(8)
      .replace(/\.?0+$/, "");
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);

      const numericAmount = Number(amount.replace(/,/g, ""));

      let convertedValue = numericAmount * adjustedConversionRate;

      const truncatedValue = (
        Math.floor(convertedValue * Math.pow(10, 8)) / Math.pow(10, 8)
      ).toFixed(7);

      setUsdValue(truncatedValue);
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);

  useEffect(() => {
    if (assetBorrow && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedMaxValue = Number(assetBorrow) * adjustedConversionRate;
      setMaxUsdValue(convertedMaxValue);
    } else {
      setMaxUsdValue(0);
    }
  }, [amount, conversionRate]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !isLoading
      ) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);

  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold
    );
    const amountAdded = usdValue || 0;
    let totalCollateralValue = parseFloat(totalCollateral);

    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    let totalDeptValue = parseFloat(totalDebt) - parseFloat(amountAdded);

    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);

    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );
  }, [
    asset,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
  ]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      {isVisible && (
        <div className="repay-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Repay {asset} </h1>

          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0 || isApproved}
                    className="lg:text-lg   mb-2 placeholder:text-xs lg:placeholder:text-sm focus:outline-none bg-gray-100 rounded-md p-1 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter Amount ${asset}`}
                  />
                  <p className="text-xs text-gray-500 px-2  mt-4 mb-1">
                    {usdValue
                      ? `$${usdValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2  mt-1">
                    <img
                      src={image}
                      alt="Item Image"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 text-right w-full mt-1">
                    Wallet Balance:
                  </p>
                  <p
                    className={`text-xs mt-1 p-2 py-1 rounded-md button1 ${
                      assetBorrow === 0 || isApproved
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                    }`}
                    onClick={() => {
                      if (assetBorrow > 0 && !isApproved) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {truncateToSevenDecimals(supplyBalance)} Max
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full ">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center ">
                    <p className="text-nowrap">Remaining debt</p>
                    <div className="w-4/12 flex flex-col items-end text-nowrap">
                      <p className="text-[14px] mt-1">
                        {(
                          assetBorrow - (amount?.replace(/,/g, "") || "")
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 7,
                          maximumFractionDigits: 7,
                        })}{" "}
                        Max
                      </p>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center mt-1">
                    <p>Health Factor</p>
                    <p>
                      <span
                        className={`${
                          healthFactorBackend > 3
                            ? "text-green-500"
                            : healthFactorBackend <= 1
                            ? "text-red-500"
                            : healthFactorBackend <= 1.5
                            ? "text-orange-600"
                            : healthFactorBackend <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                        }`}
                      >
                        {parseFloat(
                          healthFactorBackend > 100
                            ? "Infinity"
                            : parseFloat(healthFactorBackend).toFixed(2)
                        )}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span
                        className={`${
                          currentHealthFactor > 3
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
                    <p className="text-[#909094]">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-3">
              {amount > 0 && amount > supplyBalance ? (
                <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                  <div className="text-white text-[12px]">
                    Amount exceeds your wallet balance.
                  </div>
                </div>
              ) : supplyBalance <= 0 ? (
                <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                  <div className="text-white text-[12px]">
                    You do not have enough {asset} in your account to pay for
                    transaction fees. Please deposit {asset} from another
                    account.
                  </div>
                </div>
              ) : maxClicked && supplyBalance < assetBorrow ? (
                <div className="bg-yellow-200 p-3 rounded-lg border border-yellow-400">
                  <p className="text-yellow-800 text-[13px]">
                    <span className="font-semibold">Warning: </span> Due to an
                    insufficient wallet balance, some amount will still remain.
                  </p>
                </div>
              ) : supplyBalance >= parseFloat(maxAmount) &&
                parseFloat(
                  assetBorrow - (amount?.replace(/,/g, "") || "")
                ).toFixed(7) === "0.0000000" ? (
                <div className="bg-yellow-200 p-3 rounded-lg border border-yellow-400">
                  <p className="text-yellow-800 text-[13px]">
                    <span className="font-semibold">Warning: </span> Due to
                    interest rates, a small amount might still remain after the
                    maximum repayment.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-4 mt-4">
                {/* Approve Button */}
                <button
                  onClick={() => !isApproved && handleClick()}
                  className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                    isApproved ||
                    isLoading ||
                    isButtonDisabled ||
                    amount <= 0 ||
                    supplyBalance <= 0 ||
                    amount > supplyBalance
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    isApproved ||
                    isLoading ||
                    amount <= 0 ||
                    supplyBalance <= 0 ||
                    amount > supplyBalance
                  }
                >
                  Approve {asset} to continue
                </button>

                {/* Repay Button */}
                <button
                  onClick={() => isApproved && handleClick()}
                  className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                    !isApproved ||
                    isButtonDisabled ||
                    isLoading ||
                    amount <= 0 ||
                    supplyBalance <= 0 ||
                    amount > supplyBalance
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={
                    !isApproved ||
                    isLoading ||
                    amount <= 0 ||
                    supplyBalance <= 0 ||
                    amount > supplyBalance
                  }
                >
                  Repay {asset}
                </button>
              </div>

              {isLoading && (
                <div
                  className="fixed inset-0 flex items-center justify-center z-50"
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(1px)",
                  }}
                >
                  <div className="loader"></div>
                </div>
              )}
            </div>
          </div>
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
            <center>
              <p className="mt-2 ">
                Your Debt was{" "}
                <strong>
                  {" "}
                  {assetBorrow
                    ? assetBorrow >= 1e-8 && assetBorrow < 1e-7
                      ? Number(assetBorrow).toFixed(8)
                      : assetBorrow >= 1e-7 && assetBorrow < 1e-6
                      ? Number(assetBorrow).toFixed(7)
                      : truncateToSevenDecimals(assetBorrow)
                    : "0"}
                </strong>{" "}
                <strong>{asset}</strong> and you have repayed{" "}
                <strong>
                  {scaledAmount / 100000000
                    ? scaledAmount / 100000000 >= 1e-8 &&
                      scaledAmount / 100000000 < 1e-7
                      ? Number(scaledAmount / 100000000).toFixed(8)
                      : scaledAmount / 100000000 >= 1e-7 &&
                        scaledAmount / 100000000 < 1e-6
                      ? Number(scaledAmount / 100000000).toFixed(7)
                      : scaledAmount / 100000000
                    : "0"}
                </strong>{" "}
                <strong>{asset}</strong> after{" "}
                {supplyRateAPR < 0.1
                  ? "<0.01%"
                  : `${supplyRateAPR.toFixed(2)}%`}{" "}
                borrow rate
              </p>
            </center>
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
      {showPanicPopup && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2  text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center p-2 ">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 focus:outline-none self-end button1"
            >
              <X size={24} />
            </button>

            <div
              className="dark:bg-gradient 
                dark:from-darkGradientStart 
                dark:to-darkGradientEnd 
                dark:text-darkText  "
            >
              <h1 className="font-semibold text-xl mb-4 text-orange-600 ">
                Important Message
              </h1>
              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Thanks for helping us improve DFinance! <br></br> You’ve
                uncovered a bug, and our dev team is on it.
              </p>

              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Your account is temporarily locked while we investigate and fix
                the issue. <br />
              </p>
              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                We appreciate your contribution and have logged your ID—testers
                like you are key to making DFinance better! <br />
                If you have any questions, feel free to reach out.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Repay;
