import { Check, X, TriangleAlert } from "lucide-react";
import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import { trackEvent } from "../../../utils/googleAnalytics";
import { Principal } from "@dfinity/principal";

const Borrow = ({ asset, image, supplyRateAPR, balance, liquidationThreshold, reserveliquidationThreshold, assetSupply, assetBorrow, totalCollateral, totalDebt, currentCollateralStatus, Ltv, borrowableValue, borrowableAssetValue, isModalOpen, handleModalOpen, setIsModalOpen, onLoadingChange }) => {
 
  const { backendActor, principal } = useAuth();
  const principalObj = useMemo(() => Principal.fromText(principal),[principal]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [amount, setAmount] = useState(null);

  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isAcknowledgmentRequired, setIsAcknowledgmentRequired] = useState(false);

  const [error, setError] = useState("");
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);

  const { conversionRate, error: conversionError } =useRealTimeConversionRate(asset);

  const ledgerActors = useSelector((state) => state.ledger);
  useEffect(() => {
if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAcknowledgeChange = (e) => {
    setIsAcknowledged(e.target.checked);
  };
  const value = currentHealthFactor;
  const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
  const scaledAmount = amountAsNat64;

  const borrowErrorMessages = {
    NoReserveDataFound: "The reserve data for the selected asset could not be found. Please check the asset or try again later.",
    NoCanisterIdFound: "The canister ID for the selected asset is missing. Please contact support.",
    ErrorMintDebtTokens: "Borrow failed due to a debt token error. Your account state has been rolled back. Try again later.",
    Default: "An unexpected error occurred during the borrow process. Please try again later.",
  };

  const handleBorrowETH = async () => {
    setIsLoading(true);
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
    const borrowParams = {
      asset: asset,
      amount: scaledAmount,
    };
    try {
      const borrowResult = await backendActor.execute_borrow(borrowParams);
      

      if ("Ok" in borrowResult) {
        trackEvent(
          "Borrow," +
            asset +
            "," +
            scaledAmount / 100000000 +
            ", " +
            principalObj.toString(),
          "Assets",
          "Borrow," +
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
        toast.success(`Borrow successful!`, {
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
      } else if ("Err" in borrowResult) {
        const errorKey = borrowResult.Err;
        const userFriendlyMessage = borrowErrorMessages[errorKey] || borrowErrorMessages.Default;
        console.log("error",errorKey);
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
        setIsPaymentDone(false);
        setIsVisible(true);
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Borrow action failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setIsPaymentDone(false);
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  
  const numericBalance = parseFloat(balance);
 
  const supplyBalance = numericBalance;

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
    const amountTaken = usdValue || 0;
    const amountAdded = 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    const nextTotalDebt = parseFloat(amountTaken) + parseFloat(totalDebt);

    const ltv = calculateLTV(nextTotalDebt, totalCollateralValue);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    if (value < 2 && value > 1) {
      setIsAcknowledgmentRequired(true);
    } else {
      setIsAcknowledgmentRequired(false);
      setIsAcknowledged(false);
    }
    if (ltv * 100 >= liquidationThreshold) {
      toast.dismiss();
      toast.info("LTV Exceeded!");
    }
    if (
      healthFactor <= 1 ||
      ltv * 100 >= liquidationThreshold ||
      (isAcknowledgmentRequired && !isAcknowledged)
    ) {
      setIsButtonDisabled(true);
    } else {
      setIsButtonDisabled(false);
    }
  }, [
    asset, reserveliquidationThreshold, liquidationThreshold, assetSupply,assetBorrow,amount,usdValue,isAcknowledged,value,isAcknowledgmentRequired,setIsAcknowledged,
  ]);

 
  
  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
     const amountTaken = usdValue || 0;
    let totalCollateralValue =
      parseFloat(totalCollateral);
      if (totalCollateralValue < 0) {
        totalCollateralValue = 0;  
      }
      let totalDeptValue = parseFloat(totalDebt) + parseFloat(amountTaken);  
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

 
  const calculateLTV = (nextTotalDebt, totalCollateral) => {
    if (totalCollateral === 0) {
      return 0;
    }
    return nextTotalDebt / totalCollateral;
  };

  const { healthFactorBackend } = useUserData();

  console.log("healthfactor backend",healthFactorBackend)

  const handleAmountChange = (e) => {
    let inputAmount = e.target.value;
  
    inputAmount = inputAmount.replace(/[^0-9.]/g, "");
  
    if (inputAmount.indexOf('.') !== inputAmount.lastIndexOf('.')) {
      inputAmount = inputAmount.slice(0, inputAmount.lastIndexOf('.'));
    }
  
    if (inputAmount === "") {
      setAmount(""); 
      updateAmountAndUsdValue(""); 
      return; 
    }
  
    const numericAmount = parseFloat(inputAmount);
  
    if (numericAmount > parseFloat(borrowableAssetValue)) {
      return; 
    }
  
    let formattedAmount;
    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");
      formattedAmount = `${parseInt(integerPart).toLocaleString("en-US")}.${decimalPart.slice(0, 8)}`;
    } else {
      formattedAmount = parseInt(inputAmount).toLocaleString("en-US"); 
    }
  
    setAmount(formattedAmount);
    updateAmountAndUsdValue(inputAmount); 
  };

  const updateAmountAndUsdValue = (inputAmount) => {
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));

    if (inputAmount === "") {
      setAmount("");
      setUsdValue(0);
      return;
    }

    if (numericAmount <= supplyBalance) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue = numericAmount * adjustedConversionRate;
      setUsdValue(convertedValue.toFixed(2));
      setError("");
    } else {
      setError("Amount must be a positive number");
      setUsdValue(0);
    }
  };

  useEffect(() => {
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(amount.replace(/,/g, "")) * adjustedConversionRate;
      setUsdValue(convertedValue);
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);

  const handleMaxClick = () => {
    const maxAmount = parseFloat(borrowableValue).toFixed(8);
    const [integerPart, decimalPart] = maxAmount.split(".");

    const formattedAmount = `${parseInt(integerPart).toLocaleString(
      "en-US"
    )}.${decimalPart}`;

    setAmount(formattedAmount);
    updateAmountAndUsdValue(maxAmount);
  };
  const formatValue = (value) => {
    if (!value) return '0';
    return Number(value).toFixed(8).replace(/\.?0+$/, ''); // Ensure 8 decimals and remove trailing zeroes
  };
  return (
    <>
      {isVisible && (
        <div className="borrow-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Borrow {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="lg:text-lg  placeholder:text-xs focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter Amount ${asset}`}
                  />
                  <p className="text-xs text-gray-500 px-2">
                    {usdValue
                      ? `$${usdValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="Item Image"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${
                      parseFloat(borrowableValue) === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                    }`}
                    onClick={() => {
                      if (parseFloat(borrowableValue) > 0) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {formatValue(borrowableValue)}{" "}
                    Max
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full ">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100  cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center my-1 mb-2">
                    <p>APY, borrow rate</p>
                    <p>
                      {supplyRateAPR < 0.1
                        ? "<0.01%"
                        : `${supplyRateAPR.toFixed(2)}%`}
                    </p>
                  </div>

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

                  <div className="w-full flex justify-end items-center mt-1 ">
                    <p className="text-gray-500">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-3">
              <div className="w-full">
                <div>
                  {value < 2 && value > 1 && (
                    <div>
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          id="acknowledgeRisk"
                          className="mr-2"
                          onChange={handleAcknowledgeChange}
                        />
                        <label
                          htmlFor="acknowledgeRisk"
                          className="text-sm text-gray-700 dark:text-white"
                        >
                          I acknowledge the risk involved
                        </label>
                      </div>

                      <div className="w-full flex flex-col my-3 space-y-2">
                        <div className="w-full flex bg-[#BA5858] p-3 rounded-lg text-white">
                          <div className="w-1/12 flex items-center justify-center">
                            <div className="warning-icon-container">
                              <TriangleAlert />
                            </div>
                          </div>
                          <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                            Borrowing this amount will reduce your health factor
                            and increase risk of liquidation
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {value <= 1 && (
                    <div>
                      <div className="w-full flex flex-col my-3 space-y-2">
                        <div className="w-full flex bg-[#BA5858] p-3 rounded-lg text-white">
                          <div className="w-1/12 flex items-center justify-center">
                            <div className="warning-icon-container">
                              <TriangleAlert />
                            </div>
                          </div>
                          <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                            You can't borrow as your health factor is below 1,
                            which risks liquidation.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleBorrowETH}
                className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 ${
                  isLoading || amount <= 0 || isButtonDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading || amount <= 0 || null || isButtonDisabled}
              >
                Borrow {asset}
              </button>
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
            <p>
              You have borrowed{" "}
              {scaledAmount / 100000000
                ? scaledAmount / 100000000 >= 1e-8 &&
                  scaledAmount / 100000000 < 1e-7
                  ? Number(scaledAmount / 100000000).toFixed(8)
                  : scaledAmount / 100000000 >= 1e-7 &&
                    scaledAmount / 100000000 < 1e-6
                  ? Number(scaledAmount / 100000000).toFixed(7)
                  : scaledAmount / 100000000
                : "0"}{" "}
              <strong>{asset}</strong>
            </p>
            <p className="md:text-sm text-nowrap">
              You have received{" "}
              {scaledAmount / 100000000
                ? scaledAmount / 100000000 >= 1e-8 &&
                  scaledAmount / 100000000 < 1e-7
                  ? Number(scaledAmount / 100000000).toFixed(8)
                  : scaledAmount / 100000000 >= 1e-7 &&
                    scaledAmount / 100000000 < 1e-6
                  ? Number(scaledAmount / 100000000).toFixed(7)
                  : scaledAmount / 100000000
                : "0"}{" "}
              <strong>debt{asset}</strong>
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
    </>
  );
};

export default Borrow;
