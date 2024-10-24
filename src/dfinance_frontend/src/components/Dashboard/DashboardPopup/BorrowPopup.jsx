import { Info, Check, Wallet, X, TriangleAlert } from "lucide-react";
import React, { useState, useRef } from "react";
import Vector from "../../../../public/Helpers/Vector.png";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { idlFactory as ledgerIdlFactory } from "../../../../../declarations/token_ledger";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
const Borrow = ({
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
  Ltv,
  availableBorrow,
  borrowableAsset,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  console.log(
    "props in borrow ",
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
    Ltv,
    availableBorrow,
    borrowableAsset,
    isModalOpen,
    handleModalOpen,
    setIsModalOpen,
    onLoadingChange
  );
  console.log(
    " avaialbele borrow ,borowable asset",
    availableBorrow,
    borrowableAsset
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [amount, setAmount] = useState(null);

  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isAcknowledgmentRequired, setIsAcknowledgmentRequired] =
    useState(false);
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [error, setError] = useState("");
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);

  const [assetPrincipal, setAssetPrincipal] = useState({});

  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);

  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAcknowledgeChange = (e) => {
    setIsAcknowledged(e.target.checked);
  };
  const value = currentHealthFactor;
  const safeAmount = Number((amount || "").replace(/,/g, "")) || 0; // Ensure amount is not null
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8)); // Multiply by 10^8 for scaling

  console.log("Amount as nat64:", amountAsNat64);

  const scaledAmount = amountAsNat64; // Use scaled amount for further calculations
  console.log("Scaled Amount:", scaledAmount);

  const handleBorrowETH = async () => {
    console.log("Borrow function called for", asset, scaledAmount);
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
    }
    try {
      const borrowResult = await backendActor.borrow(asset, scaledAmount);
      console.log("Borrow result", borrowResult);
      setIsPaymentDone(true);
      setIsVisible(false);
      const sound = new Audio(coinSound);
      sound.play();
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
    } catch (error) {
      console.error("Error borrowing:", error);
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
      setIsLoading(false);
    }
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset);
  console.log("Fees:", fees);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const numericBalance = parseFloat(balance);
  const transferFee = Number(fees[normalizedAsset] || fees.default);
  const supplyBalance = numericBalance - transferFee;

  console.log("Supply Balance:", supplyBalance);
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
    const totalCollateralValue = parseFloat(totalCollateral) + parseFloat(amountAdded);
    const nextTotalDebt = parseFloat(amountTaken) + parseFloat(totalDebt);
  
    const ltv = calculateLTV(nextTotalDebt, totalCollateralValue);
    console.log("LTV:", ltv * 100);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    if (value < 2 && value > 1) {
      setIsAcknowledgmentRequired(true);
    } else {
      setIsAcknowledgmentRequired(false);
      setIsAcknowledged(false); // Reset the acknowledgment when it's not required
    }
    if (ltv * 100 >= liquidationThreshold) {
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
    // if (isAcknowledged) {
    //   setIsButtonDisabled(false);
    // }
  }, [
    asset,
    reserveliquidationThreshold,
    liquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
    isAcknowledged,
    value,
    isAcknowledgmentRequired,
    setIsAcknowledged,
  ]);

  const amountTaken = usdValue || 0;
  const amountAdded = 0;
  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountTaken);
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (
      (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue
    );
  };

  const totalDeptValueLTV = parseFloat(totalDebt) + parseFloat(amountTaken);

  const calculateLTV = (nextTotalDebt, totalCollateral) => {
    if (totalCollateral === 0) {
      return 0;
    }
    return nextTotalDebt / totalCollateral;
  };

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  const [availableBorrows, setAvailableBorrows] = useState(0);

  const handleAmountChange = (e) => {
    // Get the input value and remove commas for processing
    let inputAmount = e.target.value.replace(/,/g, "");

    // Allow only numbers and decimals
    if (!/^\d*\.?\d*$/.test(inputAmount)) {
      return; // If invalid input, do nothing
    }

    // Convert to number for comparison with borrowableAsset
    const numericAmount = parseFloat(inputAmount);

    // Limit input value to borrowableAsset
    if (numericAmount > parseFloat(borrowableAsset)) {
      return; // If input exceeds borrowableAsset, do nothing
    }

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

    // Update the input field value with the formatted number (with commas)
    setAmount(formattedAmount);

    // Pass the numeric value (without commas) for internal calculations
    updateAmountAndUsdValue(inputAmount); // Pass raw numeric value for calculations
  };

  const updateAmountAndUsdValue = (inputAmount) => {
    // Ensure that the numeric value is used for calculations (no commas)
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));

    // Handle the case when the input is cleared (empty value)
    if (inputAmount === "") {
      setAmount(""); // Clear the amount in state
      setUsdValue(0); // Reset USD value
      return;
    }

    // Update USD value only if the input is a valid positive number
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      const convertedValue = numericAmount * conversionRate;
      setUsdValue(parseFloat(convertedValue.toFixed(2))); // Round USD to 2 decimal places
      setError("");
    } else {
      setError("Amount must be a positive number");
      setUsdValue(0); // Reset USD value if invalid
    }
  };

  // Sync conversion when either amount or conversionRate changes
  useEffect(() => {
    if (amount && conversionRate) {
      const convertedValue =
        parseFloat(amount.replace(/,/g, "")) * conversionRate;
      setUsdValue(parseFloat(convertedValue.toFixed(2)));
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);
  console.log("borowableasset", borrowableAsset);
  // Handle max button click to set max amount
  // Function to handle max button click
  const handleMaxClick = () => {
    const maxAmount = borrowableAsset.toFixed(8); 
    const [integerPart, decimalPart] = maxAmount.split('.');
    const formattedAmount = `${parseInt(integerPart).toLocaleString('en-US')}.${decimalPart}`;
    setAmount(formattedAmount);
    updateAmountAndUsdValue(maxAmount); 
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
                    type="text" // Use text input to allow formatting
                    value={amount}
                    onChange={handleAmountChange}
                    className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
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
                      parseFloat(availableBorrow) === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                    }`}
                    onClick={() => {
                      if (parseFloat(availableBorrow) > 0) {
                        handleMaxClick();
                      }
                    }}
                  >
                    $
                    {parseFloat(availableBorrow)?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"}{" "}
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
                        ? "<0.1%"
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
                <div className="flex items-center">
                  <Fuel className="w-4 h-4 mr-1" />
                  <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
                  <img
                    src={image}
                    alt="asset icon"
                    className="object-cover w-5 h-5 rounded-full"
                  />
                  <div className="relative group">
                    <Info size={16} className="ml-2 cursor-pointer" />

                    {/* Tooltip */}
                    <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                      Fees deducted on every transaction
                    </div>
                  </div>
                </div>
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
              {asset}
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
