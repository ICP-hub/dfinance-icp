import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import { Principal } from "@dfinity/principal";
import { trackEvent } from "../../../utils/googleAnalytics";
import { useMemo } from "react";
import { toggleDashboardRefresh } from "../../../redux/reducers/dashboardDataUpdateReducer";
import useFunctionBlockStatus from "../../customHooks/useFunctionBlockStatus";
import useTransferFee from "../../customHooks/useTransferFee";
import { SCALING_FACTOR } from '../../../utils/constants';
import { PERCENTAGE_FACTOR } from '../../../utils/constants';
import { Info } from "lucide-react";

/**
 * WithdrawPopup Component
 *
 * This component is a popup modal that allows users to withdraw an asset from a platform. It handles the input for withdrawal amount,
 * validates the input, calculates the USD equivalent of the withdrawal, and executes the transaction.
 *
 * @returns {JSX.Element} - Returns the WithdrawPopup component.
 */
const WithdrawPopup = ({
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
  const { isBlocked } = useFunctionBlockStatus();
  const transferFeRetrive = useTransferFee(asset);
  const withdrawButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { backendActor, principal } = useAuth();
  const { conversionRate } = useRealTimeConversionRate(asset);
  const modalRef = useRef(null);
  const { healthFactorBackend } = useUserData();
  const ledgerActors = useSelector((state) => state.ledger);

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [amount, setAmount] = useState("");
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [liq_thresh, setTempLiq] = useState(liquidationThreshold);
  const [showPanicPopup, setShowPanicPopup] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [ledgerFee, setLedgerFee] = useState(null);
  const transferFee =
    (Number(transferFeRetrive?.transferFee) || 0) + (Number(ledgerFee) || 0);

  /* ===================================================================================
   *                                  REDUX-SELECTER & MEMOIZATION
   * =================================================================================== */
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const dispatch = useDispatch();

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                                  HELPERS
   * =================================================================================== */

  // This function truncates a number to seven decimal places and returns it as a string.
  const truncateToSevenDecimals = (value) => {
    const multiplier = Math.pow(10, 7);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(7);
  };

  const truncateToeightDeimals = (value) => {
    const multiplier = Math.pow(10, 8);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(8);
  };

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const paymentModalRef = useRef(null);

  //   This function handles the change in the withdrawal amount input field. It validates the input, formats it, and updates the state.
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

    const parts = inputAmount.split(".");
    if (parts[0].length > 8) {
      parts[0] = parts[0].slice(0, 8);
    }
    if (parts[1] && parts.join("").length > 9) {
      parts[1] = parts[1].slice(0, 9 - parts[0].length);
    }
    inputAmount = parts.join(".");

    const numericAmount = parseFloat(inputAmount);
    if (!isNaN(numericAmount) && numericAmount > assetSupply) {
      inputAmount = truncateToeightDeimals(assetSupply - transferFee).toString();
    }

    setAmount(inputAmount);
    updateAmountAndUsdValue(inputAmount);
  };

  /**
   * This function updates the USD equivalent of the withdrawal amount based on the conversion rate. It also checks if the
   * amount is valid and less than or equal to the asset supply, providing error messages when necessary.
   *
   * @param {string} inputAmount - The amount entered by the user.
   * @returns {void}
   */
  const updateAmountAndUsdValue = (inputAmount) => {
    const Amount = parseFloat(inputAmount.toString().replace(/,/g, ""));
    const truncateTo8Decimals = (num) => {
      return Math.trunc(num * SCALING_FACTOR) / SCALING_FACTOR;
    };
    const numericAmount = truncateTo8Decimals(Amount);
    const truncatedAssetSupply = truncateTo8Decimals(assetSupply);
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= truncatedAssetSupply) {
        const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
        const convertedValue = numericAmount * adjustedConversionRate;
        setUsdValue(parseFloat(convertedValue));
      } else {
        console.error("Amount exceeds the supply balance");
      }
    } else if (inputAmount === "") {
      setAmount("");
      setUsdValue(0);
    } else {
      console.error("Amount must be a positive number");
    }
  };

  const safeAmount = Number((amount.toString() || "").replace(/,/g, "")) || 0;
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
  const scaledAmount = amountAsNat64;

  const ERROR_MESSAGES = {
    InvalidPrincipal:
      "Your account is not authorized for this action. Please log in with a valid account.",
    NoCanisterIdFound:
      "The asset is not available for withdrawal. Please check the selected asset.",
    NoReserveDataFound:
      "We couldn't retrieve the reserve data for the asset. Please try again later.",
    ErrorBurnTokens:
      "There was an issue processing your transaction. The tokens could not be burned.",
    WithdrawMoreThanSupply:
      "You are trying to withdraw more than the available supply. Please check the amount and try again.",
    Default:
      "An unexpected error occurred during the withdraw process. Please try again later.",
  };

  /**
   * Handles the execution of the withdrawal transaction. It interacts with the backend actor to process the withdrawal,
   * tracks the event using Google Analytics, and shows success or error messages based on the result. It also ensures that the
   * withdrawal amount is within the allowed limit and updates the UI accordingly.
   *
   * @returns {void}
   */
  const handleWithdraw = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    setIsLoading(true);
    let ledgerActor;
    if (asset === "ckBTC") ledgerActor = ledgerActors.ckBTC;
    else if (asset === "ckETH") ledgerActor = ledgerActors.ckETH;
    else if (asset === "ckUSDC") ledgerActor = ledgerActors.ckUSDC;
    else if (asset === "ICP") ledgerActor = ledgerActors.ICP;
    else if (asset === "ckUSDT") ledgerActor = ledgerActors.ckUSDT;

    const fee = await ledgerActor.icrc1_fee();
    const feeAsNumber = typeof fee === "bigint" ? Number(fee) : fee;
    const feeBigInt = BigInt(Math.round(feeAsNumber * 1e8));
    setLedgerFee(feeBigInt);

    try {
      const safeAmount =
        Number((amount.toString() || "").replace(/,/g, "")) || 0;
      let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
      const scaledAmount = amountAsNat64;
      const transferFeeBigInt = Math.round(transferFee * Math.pow(10, 8));

      const totalAmount = transferFeeBigInt
        ? scaledAmount + transferFeeBigInt
        : scaledAmount;

      const withdrawParams = {
        asset: asset,
        amount: totalAmount,
        is_collateral: currentCollateralStatus,
      };

      const withdrawResult = await backendActor.execute_withdraw(
        withdrawParams
      );
      dispatch(toggleDashboardRefresh());

      if ("Ok" in withdrawResult) {
        trackEvent(
          "Withdraw," +
          asset +
          "," +
          scaledAmount / SCALING_FACTOR +
          "," +
          currentCollateralStatus +
          "," +
          principalObj.toString(),
          "Assets",
          "Withdraw," +
          asset +
          "," +
          scaledAmount / SCALING_FACTOR +
          "," +
          currentCollateralStatus +
          ", " +
          principalObj.toString()
        );
        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }
        toast.success("Withdraw successful!", {
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
      } else if ("Err" in withdrawResult) {
        const errorObject = withdrawResult.Err;
        const errorKey = Object.keys(errorObject)[0];
        const errorMessage =
          errorKey?.toString() || "An unexpected error occurred";
        const isPanicError = errorMessage.toLowerCase().includes("panic");
        if (errorObject && "BLOCKEDFORONEHOUR" in errorObject) {
          console.error("You are temporarily blocked from using this function");

          toast.error("You are temporarily blocked from using this function", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
          setIsModalOpen(false);
          setIsLoading(false);
        }
        if (isPanicError) {
          setShowPanicPopup(true);
          setIsVisible(false);
        } else {
          let userFriendlyMessage;

          switch (errorKey) {
            case "WithdrawMoreThanSupply":
              userFriendlyMessage =
                "You cannot withdraw more than your supplied amount.";
              break;
            case "AmountSubtractionError":
              userFriendlyMessage = "You cannot withdraw more than you owe.";
              break;
            case "LTVGreaterThanThreshold":
              userFriendlyMessage =
                "Collateral update failed: LTV exceeds the allowable threshold.";
              break;
            default:
              userFriendlyMessage =
                ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.Default;
          }

          toast.error(`Withdraw failed: ${userFriendlyMessage}`, {
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
    } catch (error) {
      console.error(`Error: ${error.message || "Withdraw action failed!"}`);
      const message = error.message || "Withdraw action failed!";
      const isPanicError = message.toLowerCase().includes("panic");
      const isOutOfCyclesError =
        message.toLowerCase().includes("out of cycles") ||
        message.includes("Reject text: Canister");

      if (isPanicError) {
        setShowPanicPopup(true);
        setIsVisible(false);
      } else if (isOutOfCyclesError) {
        toast.error("Canister is out of cycles. Admin has been notified.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
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
    } finally {
      setIsLoading(false);
    }
  };

  // This function handles the closing of the payment popup. It resets the payment state and closes the modal.
  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
  };

  /**
   * Calculates key borrowing metrics:
   * 
   * amountTaken:
   *   - Value of asset used as collateral (if enabled).
   *   - amountTaken = currentCollateralStatus ? usdValue : 0
   * 
   * totalCollateralValue:
   *   - Remaining collateral = totalCollateral - amountTaken
   * 
   * tempLiq (effective liquidation threshold):
   *   - avliq = liquidationThreshold × totalCollateral
   *   - truncatedVal = amountTaken × reserveliquidationThreshold
   *   - tempLiq = (avliq - truncatedVal) / totalCollateralValue
   * 
   * healthFactor:
   *   - Risk buffer = (totalCollateralValue × (tempLiq / 100)) / totalDebt
   * 
   * ltv (Loan to Value):
   *   - ltv = (totalDebt / totalCollateralValue) × 100
   */
  const calculatedValues = ({
    totalCollateral,
    totalDebt,
    liquidationThreshold,
    reserveliquidationThreshold,
    currentCollateralStatus,
    usdValue,
  }) => {
    const amountTaken = currentCollateralStatus
      ? (usdValue || 0).toFixed(8)
      : "0.00000000";
    const truncateTo8Decimals = (num) => Math.trunc(num * SCALING_FACTOR) / SCALING_FACTOR;

    let totalCollateralValue = 0;
    if (
      amountTaken > totalCollateral &&
      parseFloat(amountTaken) - parseFloat(totalCollateral) === 0.0000001
    ) {
      totalCollateralValue = 0;
    } else {
      totalCollateralValue = truncateTo8Decimals(
        parseFloat(totalCollateral) - parseFloat(amountTaken)
      );
    }

    let avliq = liquidationThreshold * totalCollateral;
    let truncatedVal =
      Math.trunc(amountTaken * reserveliquidationThreshold * SCALING_FACTOR) / SCALING_FACTOR;
    let tempLiq = 0;
    if (
      amountTaken > totalCollateral &&
      parseFloat(amountTaken) - parseFloat(totalCollateral) === 0.0000001
    ) {
      tempLiq = 0;
    } else {
      tempLiq = avliq - truncatedVal;
    }
    if (totalCollateralValue > 0) {
      tempLiq = Math.floor((tempLiq / totalCollateralValue) * SCALING_FACTOR) / SCALING_FACTOR;
    }

    let totalDebtValue = parseFloat(totalDebt);
    if (totalDebtValue < 0) totalDebtValue = 0;

    const healthFactor =
      totalDebtValue === 0
        ? Infinity
        : Math.round(
          ((totalCollateralValue * (tempLiq / PERCENTAGE_FACTOR)) / totalDebtValue) * SCALING_FACTOR
        ) / SCALING_FACTOR;

    let ltv =
      totalCollateralValue === 0
        ? 0
        : parseFloat(totalDebtValue) / totalCollateralValue;
    ltv = Math.trunc(ltv * (SCALING_FACTOR * PERCENTAGE_FACTOR)) / SCALING_FACTOR; //in percent


    return {
      amountTaken,
      totalCollateralValue,
      totalDebtValue,
      tempLiq,
      healthFactor,
      ltv,
    };
  };

  // This function handles the click event for the "Max" button. It sets the maximum amount to withdraw based on the asset supply and updates the USD value accordingly.
  const handleMaxClick = () => {
    const truncateToSevenDecimals = (value) => {
      const multiplier = Math.pow(10, 8);
      const truncated = Math.floor(value * multiplier) / multiplier;
      return truncated;
    };
    const fee = transferFee ? Number(transferFee) : 0;
    let asset_supply = assetSupply
      ? assetSupply >= 1e-8 && assetSupply < 1e-7
        ? parseFloat(Number(assetSupply).toFixed(8))
        : assetSupply >= 1e-7 && assetSupply < 1e-6
          ? parseFloat(Number(assetSupply).toFixed(7))
          : truncateToSevenDecimals(assetSupply)
      : 0;
    const maxAmount = asset_supply - fee;
    const formattedAmount =
      maxAmount.toString().split(".")[0] +
      "." +
      (maxAmount.toString().split(".")[1] || "").padEnd(8, "0").substring(0, 8);
    setAmount(formattedAmount);
    updateAmountAndUsdValue(assetSupply);
  };

  // This function handles the click event for the close button. It resets the payment state and closes the modal.
  const truncateToDecimals = (num, decimals) => {
    const factor = Math.pow(10, decimals);
    return (Math.floor(num * factor) / factor).toFixed(decimals);
  };

  const truncatedValue = truncateToDecimals(Number(healthFactorBackend), 2);

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        paymentModalRef.current &&
        !paymentModalRef.current.contains(event.target)
      ) {
        setIsPaymentDone(false);
        setIsVisible(false);
        setIsModalOpen(false);
      }
    };

    if (isPaymentDone) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isPaymentDone]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          withdrawButtonRef.current &&
          !withdrawButtonRef.current.disabled
        ) {
          withdrawButtonRef.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const { tempLiq, healthFactor, ltv } = calculatedValues({
      totalCollateral,
      totalDebt,
      liquidationThreshold,
      reserveliquidationThreshold,
      currentCollateralStatus,
      usdValue,
    });

    const truncateToDecimals = (num, decimals) => {
      const factor = Math.pow(10, decimals);
      return (Math.floor(num * factor) / factor).toFixed(decimals);
    };

    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : truncateToDecimals(healthFactor, 2)
    );

    setTempLiq(tempLiq);

    let showToastMessage = "";

    const isLtvExceeded =
      assetBorrow > 0 && ltv > tempLiq && currentCollateralStatus;
    const isHealthFactorLow = healthFactor <= 1 && currentCollateralStatus;

    if (isLtvExceeded && isHealthFactorLow) {
      showToastMessage = "LTV Exceeded & Health Factor is Less than 1";
    } else if (isLtvExceeded) {
      showToastMessage = "LTV Exceeded!";
    } else if (isHealthFactorLow) {
      showToastMessage = "Health Factor Less than 1";
    }

    if (showToastMessage) {
      toast.dismiss();
      toast.info(showToastMessage, {
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

    if (isLtvExceeded || isHealthFactorLow) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [
    asset,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
    liq_thresh,
  ]);

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
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(amount.toString().replace(/,/g, "")) * adjustedConversionRate;
      setUsdValue(convertedValue);
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  /* ===================================================================================
   *                                  RENDER COMPONENTS
   * =================================================================================== */
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
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-2 rounded-md">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="lg:text-lg   mb-2 placeholder:text-xs lg:placeholder:text-sm focus:outline-none bg-gray-100 rounded-md p-1 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter Amount ${asset}`}
                  />
                  <p className="text-xs text-gray-500 px-2  mt-2 mb-1">
                    {usdValue
                      ? `$${usdValue.toLocaleString()} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2  mt-1">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className="text-xs mt-4 cursor-pointer bg-blue-100 dark:bg-gray-700/45 p-2 py-1 rounded-md button1"
                    onClick={() => {
                      if (assetSupply > 0) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {truncateToeightDeimals(
                      Math.max(0, assetSupply - transferFee)
                    )}{" "}
                    Max
                  </p>
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
                  <p className="text-xs mt-2">
                    {Math.max(
                      0,
                      assetSupply -
                      transferFee -
                      Number(amount.toString().replace(/,/g, ""))
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8,
                    })}{" "}
                    Max
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="w-full flex justify-between my-2"></div>
            <div className="w-full bg-gray-100 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
              <div className="w-full flex justify-between items-center my-1">
                <p>Supply APY</p>
                <p>
                  {supplyRateAPR < 0.1
                    ? "<0.01%"
                    : `${supplyRateAPR.toFixed(2)}%`}
                </p>
              </div>
              <div className="w-full flex justify-between items-center my-1">
                <p>Collateralization</p>
                <p
                  className={`font-semibold ${currentCollateralStatus ? "text-green-500" : "text-red-500"
                    }`}
                >
                  {currentCollateralStatus ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div className="w-full flex flex-col my-1">
                <div className="w-full flex justify-between items-center">
                  <p>Health Factor</p>
                  <p>
                    <span
                      className={`${truncatedValue > 3
                        ? "text-green-500"
                        : truncatedValue <= 1
                          ? "text-red-500"
                          : truncatedValue <= 1.5
                            ? "text-orange-600"
                            : truncatedValue <= 2
                              ? "text-orange-400"
                              : "text-orange-300"
                        }`}
                    >
                      {truncatedValue > 100 ? "Infinity" : truncatedValue}
                    </span>
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
                <div className="w-full flex justify-between items-center my-1">
                  <div className="flex items-center gap-1 relative">
                    <div className="flex items-center">
                      <p>Transaction Fee</p>
                      <Info
                        size={14}
                        className="text-blue-800 dark:text-white ml-1 cursor-help"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      />
                      {showTooltip && (
                        <div className="absolute bottom-full left-[-4px] mb-2 px-4 py-3 dark:bg-[#252347] bg-white border border-gray-300 dark:border-gray-700  dark:text-white text-[12px] rounded-xl shadow-lg w-64 z-10">
                          Platform fee + Ledger Transfer fee
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p>{transferFee}</p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full flex justify-between items-center">
                  <p>Final amount</p>
                  <div className="flex items-center gap-2">
                    <p>
                      {(amount
                        ? (+amount || 0) + (+transferFee || 0)
                        : 0
                      ).toFixed(8)}{" "}
                    </p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full flex justify-end items-center mt-1">
                  <p className="text-gray-500">liquidation at &lt;1</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex  mt-3">
            {parseFloat(
              assetSupply - amount.toString().replace(/,/g, "")
            ).toFixed(7) === "0.0000000" && (
                <div className="bg-yellow-200 p-3 rounded-lg border border-yellow-400">
                  <p className="text-yellow-800 text-[13px] font-medium">
                    <span className="font-semibold">Warning: </span>
                    Due to interest rates, a small amount might still remain even
                    after the maximum withdraw.
                  </p>
                </div>
              )}
          </div>
          <div>
            <button
              ref={withdrawButtonRef}
              onClick={
                isLoading || amount <= 0 || isButtonDisabled
                  ? null
                  : handleWithdraw
              }
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center ${isLoading || amount <= 0 || isButtonDisabled
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
            >
              Withdraw
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
      )}
      {isPaymentDone && (
        <div
          ref={paymentModalRef}
          className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-5 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50"
        >
          <div className="w-full flex flex-col items-center">
            <button
              ref={closeButtonRef}
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
              <p className="mt-2 text-center">
                Your Supply was{" "}
                <strong>
                  {truncateToSevenDecimals(assetSupply)} {asset}{" "}
                </strong>{" "}
                and you have withdrawn{" "}
                <strong>
                  {scaledAmount / SCALING_FACTOR
                    ? scaledAmount / SCALING_FACTOR >= 1e-8 &&
                      scaledAmount / SCALING_FACTOR < 1e-7
                      ? Number(scaledAmount / SCALING_FACTOR).toFixed(8)
                      : scaledAmount / SCALING_FACTOR >= 1e-7 &&
                        scaledAmount / SCALING_FACTOR < 1e-6
                        ? Number(scaledAmount / SCALING_FACTOR).toFixed(7)
                        : scaledAmount / SCALING_FACTOR
                    : "0"}
                </strong>{" "}
                <strong>{asset}</strong> after{" "}
                {supplyRateAPR < 0.1
                  ? "<0.01%"
                  : `${supplyRateAPR.toFixed(2)}%`}{" "}
                apy
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
          <div className="w-full flex flex-col items-center ">
            <div className="w-full flex items-center justify-between  ">
              <h1 className="font-semibold text-lg text-orange-400 text-center flex-grow mt-3">
                Important Message
              </h1>
              ref={closeButtonRef}
              <button
                onClick={handleClosePaymentPopup}
                className="text-gray-400 focus:outline-none mt-3 mr-4"
              >
                <X size={22} />
              </button>
            </div>

            <div
              className="dark:bg-gradient 
                      dark:from-darkGradientStart 
                      dark:to-darkGradientEnd 
                      dark:text-darkText p-2 "
            >
              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Thanks for helping us improve DFinance! <br></br> You’ve
                uncovered a bug, and our dev team is on it.
              </p>

              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Your account is temporarily locked while we investigate and fix
                the issue. <br />
              </p>
              <p className="text-gray-700 mb-2 text-[14px] dark:text-darkText mt-2 leading-relaxed">
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

export default WithdrawPopup;