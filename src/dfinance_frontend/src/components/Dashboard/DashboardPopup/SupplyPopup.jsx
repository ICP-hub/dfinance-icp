import React, { useState, useRef } from "react";
import { Info, Check, Wallet, X } from "lucide-react";
import { useAuths } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { Fuel } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import { trackEvent } from "../../../utils/googleAnalytics";
import { useMemo } from "react";
import { toggleDashboardRefresh } from "../../../redux/reducers/dashboardDataUpdateReducer";

/**
 * SupplyPopup Component
 *
 * This component is a popup modal that allows users to supply an asset to a platform, taking into account factors like collateral,
 * debt, liquidation thresholds, and the user's current health factor.
 * It calculates the USD equivalent of the supplied amount, manages user input for supply amounts, and handles approval
 * and supply transactions.
 *
 * @returns {JSX.Element} - Returns the SupplyPopup component.
 */

const SupplyPopup = ({ asset, image, supplyRateAPR, balance, liquidationThreshold, reserveliquidationThreshold, assetSupply, assetBorrow, totalCollateral, totalDebt, currentCollateralStatus, Ltv, borrowableValue, borrowableAssetValue, isModalOpen, handleModalOpen, setIsModalOpen, onLoadingChange,}) => {
  
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const { healthFactorBackend } = useUserData();
  const { backendActor, principal } = useAuths();
  const { conversionRate, error: conversionError } =useRealTimeConversionRate(asset);

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [collateral, setCollateral] = useState(currentCollateralStatus);
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [amount, setAmount] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPanicPopup, setShowPanicPopup] = useState(false);

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const fees = useSelector((state) => state.fees.fees);
  const dispatch = useDispatch();
  const ledgerActors = useSelector((state) => state.ledger);

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                                  HELPERS
   * =================================================================================== */

  const transactionFee = 0;
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  const errorMessages = {
    NoReserveDataFound:
      "The reserve data for the selected asset could not be found. Please check the asset or try again later.",
    FailedToUpdatePrice:
      "Failed to update the reserve prices. Please try again later.",
    ValidationError:
      "The supply validation failed. Ensure your inputs are correct.",
    InterestRateUpdateFailed:
      "Unable to update interest rates. Please retry the operation.",
    ErrorMintTokens:
      "Minting of tokens failed. Your account state has been rolled back. Try again later.",
    Default: "An unexpected error occurred. Please try again later.",
  };

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const hasEnoughBalance = balance >= transactionFee;
  const value = currentHealthFactor;

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  // Handles user input for supply amount
  const handleAmountChange = (e) => {
    let inputAmount = e.target.value;
    inputAmount = inputAmount.replace(/[^0-9.]/g, "");
    if (inputAmount.indexOf(".") !== inputAmount.lastIndexOf(".")) {
      inputAmount = inputAmount.slice(0, inputAmount.lastIndexOf("."));
    }
    if (inputAmount === "") {
      setAmount("");
      updateAmountAndUsdValue("");
      return;
    }
    const numericAmount = parseFloat(inputAmount);
    if (numericAmount > supplyBalance) {
      setError(
        `Amount cannot exceed your available supply balance of ${supplyBalance.toLocaleString(
          "en-US"
        )}`
      );
      return;
    } else {
      setError("");
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
    updateAmountAndUsdValue(inputAmount);
  };

  // Updates the USD equivalent of the supply amount
  const updateAmountAndUsdValue = (inputAmount) => {
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));
    if (inputAmount === "") {
      setAmount("");
      setUsdValue(0);
      return;
    }
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= supplyBalance) {
        const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
        const convertedValue = numericAmount * adjustedConversionRate;
        setUsdValue(convertedValue.toFixed(8));
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else {
      setError("Amount must be a positive number");
    }
  };

  // Approves the supply transaction
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
    } catch (error) {
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

  const isCollateral = true;
  const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
  const scaledAmount = amountAsNat64;

  // Executes the supply transaction
  const handleSupplyETH = async () => {
    try {
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

      const supplyParams = {
        asset: asset,
        is_collateral: currentCollateralStatus,
        amount: scaledAmount,
      };

      const response = await backendActor.execute_supply(supplyParams);
      dispatch(toggleDashboardRefresh());

      if ("Ok" in response) {
        trackEvent(
          `Supply,${asset},${
            scaledAmount / 100000000
          },${currentCollateralStatus},${principalObj.toString()}`,
          "Assets",
          `Supply,${asset},${
            scaledAmount / 100000000
          },${currentCollateralStatus},${principalObj.toString()}`,
          "Assets"
        );
        setIsPaymentDone(true);
        setIsVisible(false);

        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }

        toast.success(`Supply successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if ("Err" in response) {
        const errorKey = response.Err;
        const errorMsg = errorKey?.toString() || "An unexpected error occurred";

        if (errorMsg.toLowerCase().includes("panic")) {
          setShowPanicPopup(true);
          setIsVisible(false);
        } else {
          const userFriendlyMessage =
            errorMessages[errorKey] || errorMessages.Default;
          console.error("Error:", errorMsg);

          toast.error(`Supply failed: ${userFriendlyMessage}`, {
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
      console.error(`Error: ${error.message || "Supply action failed!"}`);

      if (error.message && error.message.toLowerCase().includes("panic")) {
        setShowPanicPopup(true);
        setIsVisible(false);
      } else {
        toast.error(`Error: ${error.message || "Supply action failed!"}`, {
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
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
  };

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleSupplyETH();
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
    liquidationThreshold,
    reserveliquidationThreshold
  ) => {
    const amountAdded = collateral ? usdValue || 0 : 0;
    let totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    let totalDeptValue = parseFloat(totalDebt);
    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    if (totalDeptValue === 0) {
      return Infinity;
    }
    let avliq = liquidationThreshold * totalCollateral;
    let tempLiq =
      (avliq + amountAdded * reserveliquidationThreshold) /
      totalCollateralValue;
    let result = (totalCollateralValue * (tempLiq / 100)) / totalDeptValue;
    result = Math.round(result * 1e8) / 1e8;
    return result;
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return (totalDeptValue / totalCollateralValue) * 100;
  };

  const handleMaxClick = () => {
    const maxAmount = supplyBalance.toFixed(8);
    const [integerPart, decimalPart] = maxAmount.split(".");
    const formattedAmount = `${parseInt(integerPart).toLocaleString(
      "en-US"
    )}.${decimalPart}`;
    setAmount(formattedAmount);
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
      liquidationThreshold,
      reserveliquidationThreshold
    );

    const amountAdded = collateral ? usdValue || 0 : 0;
    let totalCollateralValue =parseFloat(totalCollateral) + parseFloat(amountAdded);
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    let totalDeptValue = parseFloat(totalDebt);
    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }

    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor( healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2));
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
   *                                 EFFECT
   * =================================================================================== */
  useEffect(() => {
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(amount.replace(/,/g, "")) * adjustedConversionRate;
      setUsdValue(convertedValue.toFixed(8));
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);

  useEffect(() => {
    if (balance && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedMaxValue = balance * adjustedConversionRate;

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

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      {isVisible && (
        <div className="supply-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Supply {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2 dark:text-darkText">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0 || isApproved}
                    className="lg:text-lg   mb-2 placeholder:text-xs lg:placeholder:text-sm focus:outline-none bg-gray-100 rounded-md p-1 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter ${asset} Amount`}
                  />

                  <p className="text-xs text-gray-500 px-2 mt-2 mb-1">
                    {usdValue
                      ? `$${usdValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2 mt-1">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${
                      supplyBalance === 0 || isApproved
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                    }`}
                    onClick={() => {
                      if (supplyBalance > 0 && !isApproved) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {formatValue(balance)} Max
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
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
                    className={`font-semibold ${
                      currentCollateralStatus
                        ? "text-green-500"
                        : "text-red-500"
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
                        {healthFactorBackend > 100
                          ? "Infinity"
                          : parseFloat(healthFactorBackend).toFixed(2)}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span
                        className={`${
                          value > 3
                            ? "text-green-500"
                            : value <= 1
                            ? "text-red-500"
                            : value <= 1.5
                            ? "text-orange-600"
                            : value <= 2
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
          </div>

          {!hasEnoughBalance && (
            <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
              <p className="text-yellow-700 dark:text-yellow-500">
                You do not have enough {asset} in your account to pay for
                transaction fees on the Ethereum Sepolia network. Please deposit{" "}
                {asset} from another account.
              </p>
            </div>
          )}

          <div className="w-full flex justify-between items-center mt-3">
            <div className="flex items-center justify-start">
              {}
              <div className="relative group">
                {}

                {}
                {}
              </div>
            </div>

            <div className="flex items-center">
              <p
                className={`text-xs whitespace-nowrap ${
                  isApproved ? "text-green-500" : "text-red-500"
                }`}
              >
                {isApproved
                  ? "Approved with signed message"
                  : "Approve with signed message"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {/* Approve Button */}
            <button
              onClick={() => !isApproved && handleClick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                isApproved ||
                isLoading ||
                !hasEnoughBalance ||
                amount <= 0 ||
                isButtonDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                isApproved || isLoading || amount <= 0 || !hasEnoughBalance
              }
            >
              Approve {asset} to continue
            </button>

            {/* Supply Button */}
            <button
              onClick={() => isApproved && handleClick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                !isApproved ||
                isLoading ||
                amount <= 0 ||
                !hasEnoughBalance ||
                isButtonDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                !isApproved || isLoading || amount <= 0 || !hasEnoughBalance
              }
            >
              Supply {asset}
            </button>
          </div>

          {}
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
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 focus:outline-none self-end button1"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <p className=" text-sm  lgx:text-lg whitespace-nowrap">
              You have supplied{" "}
              <strong>
                {scaledAmount / 100000000
                  ? scaledAmount / 100000000 >= 1e-8 &&
                    scaledAmount / 100000000 < 1e-7
                    ? Number(scaledAmount / 100000000).toFixed(8)
                    : scaledAmount / 100000000 >= 1e-7 &&
                      scaledAmount / 100000000 < 1e-6
                    ? Number(scaledAmount / 100000000).toFixed(7)
                    : scaledAmount / 100000000
                  : "0"}{" "}
                {asset}
              </strong>
            </p>
            <p className="text-sm  lgx:text-lg whitespace-nowrap">
              You have received{" "}
              <strong>
                {scaledAmount / 100000000
                  ? scaledAmount / 100000000 >= 1e-8 &&
                    scaledAmount / 100000000 < 1e-7
                    ? Number(scaledAmount / 100000000).toFixed(8)
                    : scaledAmount / 100000000 >= 1e-7 &&
                      scaledAmount / 100000000 < 1e-6
                    ? Number(scaledAmount / 100000000).toFixed(7)
                    : scaledAmount / 100000000
                  : "0"}{" "}
                d{asset}
              </strong>
            </p>

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
              <h1 className="font-semibold text-xl mb-4 ">Important Message</h1>
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

export default SupplyPopup;