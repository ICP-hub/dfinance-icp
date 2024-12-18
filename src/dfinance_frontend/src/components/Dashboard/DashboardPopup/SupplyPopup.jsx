import React, { useState, useRef } from "react";
import { Info, Check, Wallet, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";

const SupplyPopup = ({
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
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange
}) => {
  console.log("currentColletralStatus", currentCollateralStatus)
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [collateral, setCollateral] = useState(currentCollateralStatus);

  const transactionFee = 0.01;
  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const hasEnoughBalance = balance >= transactionFee;
  const value = currentHealthFactor;
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [amount, setAmount] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAmountChange = (e) => {
    // Get the input value and remove commas for processing
    let inputAmount = e.target.value.replace(/,/g, '');

    // Allow only numbers and decimals
    if (!/^\d*\.?\d*$/.test(inputAmount)) {
      return; // If invalid input, do nothing
    }

    // Convert inputAmount to a number for comparison with supplyBalance
    const numericAmount = parseFloat(inputAmount);

    // Prevent the user from typing an amount greater than the supplyBalance
    if (numericAmount > supplyBalance) {
      // Do not update the input field or the state if the value exceeds supplyBalance
      setError(`Amount cannot exceed your available supply balance of ${supplyBalance.toLocaleString('en-US')}`);
      return;
    } else {
      setError(''); // Clear any previous error
    }

    // Split the integer and decimal parts, if applicable
    let formattedAmount;
    if (inputAmount.includes('.')) {
      const [integerPart, decimalPart] = inputAmount.split('.');

      // Format the integer part with commas and limit decimal places to 8 digits
      formattedAmount = `${parseInt(integerPart).toLocaleString('en-US')}.${decimalPart.slice(0, 8)}`;
    } else {
      // If no decimal, format the integer part with commas
      formattedAmount = parseInt(inputAmount).toLocaleString('en-US');
    }

    // Update the input field value with the formatted number (with commas)
    setAmount(formattedAmount); // Set the formatted amount in the state

    // Pass the numeric value (without commas) for internal calculations
    updateAmountAndUsdValue(inputAmount); // Pass raw numeric value for calculations
  };

  const updateAmountAndUsdValue = (inputAmount) => {
    // Ensure that the numeric value is used for calculations (no commas)
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ''));

    // Handle the case when the input is cleared (empty value)
    if (inputAmount === "") {
      setAmount(''); // Clear the amount in state
      setUsdValue(0); // Reset USD value
      return;
    }

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= supplyBalance) {
        const convertedValue = numericAmount * conversionRate;
        setUsdValue(parseFloat(convertedValue.toFixed(2)));
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else {
      setError("Amount must be a positive number");
    }
  };


  useEffect(() => {
    if (amount && conversionRate) {
      const convertedValue = parseFloat(amount.replace(/,/g, '')) * conversionRate;
      setUsdValue(convertedValue);
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);
  useEffect(() => {
    if (balance && conversionRate) {
      console.log("balance in supplypopup",balance, conversionRate);
      const convertedMaxValue = parseFloat(balance) * conversionRate;
      console.log("converted in supplypopup",convertedMaxValue);
      setMaxUsdValue(convertedMaxValue);
    } else {
      setMaxUsdValue(0);
    }
  }, [amount, conversionRate]);
  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

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
    } else if (asset === "ckUSDT") { // Added condition for ckUSDT
      ledgerActor = ledgerActors.ckUSDT;
    }
    const safeAmount = Number(amount.replace(/,/g, '')) || 0;
    let amountAsNat64 = Math.round(amount.replace(/,/g, '') * Math.pow(10, 8));
    console.log("Amount as nat64:", amountAsNat64);
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
      console.log("Approve", approval);
      setIsApproved(true);
      console.log("isApproved state after approval:", isApproved);
      toast.success(`Approval successful!`, {
        className: 'custom-toast',
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
        className: 'custom-toast',
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
  const safeAmount = Number((amount || '').replace(/,/g, '')) || 0; // Ensure amount is not null
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8)); // Multiply by 10^8 for scaling

  console.log("Amount as nat64:", amountAsNat64);

  const scaledAmount = amountAsNat64; // Use scaled amount for further calculations



  const handleSupplyETH = async () => {
    try {
      console.log("Supply function called for", asset, amount);

      let ledgerActor;
      if (asset === "ckBTC") {
        ledgerActor = ledgerActors.ckBTC;
      } else if (asset === "ckETH") {
        ledgerActor = ledgerActors.ckETH;
      } else if (asset === "ckUSDC") {
        ledgerActor = ledgerActors.ckUSDC;
      } else if (asset === "ICP") {
        ledgerActor = ledgerActors.ICP;
      } else if (asset === "ckUSDT") { // Added condition for ckUSDT
        ledgerActor = ledgerActors.ckUSDT;
      }
      console.log("amountAsNat64", amountAsNat64);
      console.log("scaledAmount", scaledAmount);
      console.log("Backend actor", backendActor);
      console.log(" current colletral status while supply ", currentCollateralStatus)
      const sup = await backendActor.supply(asset, scaledAmount, currentCollateralStatus);
      console.log("Supply", sup);

      setIsPaymentDone(true);
      setIsVisible(false);

      const sound = new Audio(coinSound);
      sound.play();
      toast.success(`Supply successful!`, {
        className: 'custom-toast',
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error("Supply failed:", error);

      toast.error(`Error: ${error.message || "Supply action failed!"}`, {
        className: 'custom-toast',
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

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
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

  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold
    );
    console.log("Health Factor:", healthFactor);

    const amountTaken = 0;
    const amountAdded = collateral ? (usdValue || 0) : 0;

    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountTaken);

    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);
    console.log("LTV:", ltv);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );
    //|| liquidationThreshold>ltv
  }, [
    asset,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
  ]);

  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
    const amountTaken = 0;
    const amountAdded = collateral ? (usdValue || 0) : 0;

    console.log(
      "amount added",
      amountAdded,
      "totalCollateral",
      totalCollateral,
      "totalDebt",
      totalDebt,
      "liquidationThreshold",
      liquidationThreshold
    );

    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountTaken);
    console.log("totalCollateralValue", totalCollateralValue);
    console.log("totalDeptValue", totalDeptValue);
    console.log("amountAdded", amountAdded);
    console.log("liquidationThreshold", liquidationThreshold);
    console.log("totalDebt", totalDebt);
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
    return (totalDeptValue / totalCollateralValue) * 100;
  };

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  const handleMaxClick = () => {
    const maxAmount = supplyBalance.toFixed(8);
    const [integerPart, decimalPart] = maxAmount.split('.');
    const formattedAmount = `${parseInt(integerPart).toLocaleString('en-US')}.${decimalPart}`;
    setAmount(formattedAmount);
    updateAmountAndUsdValue(maxAmount);
  };



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
              <div className="w-full flex items-center justify-between bg-gray-100 cursor-pointer p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text" // Use text input to allow formatting
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0}
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
                      alt="connect_wallet_icon"
                      className="object-cover w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${supplyBalance === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                      }`}
                    onClick={() => {
                      if (supplyBalance > 0) {
                        handleMaxClick();
                      }
                    }}
                  >
                    ${maxUsdValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Max
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
                      ? "<0.1%"
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
                        className={`${healthFactorBackend > 3
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
                        className={`${value > 3
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
              <Fuel className="w-4 h-4 mr-1" />
              <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
              <img
                src={image}
                alt="asset icon"
                className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
              />
              <div className="relative group">
                <Info size={16} className="ml-2 cursor-pointer" />

                {/* Tooltip */}
                <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                  Fees deducted on every transaction
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <p
                className={`text-xs whitespace-nowrap ${isApproved ? "text-green-500" : "text-red-500"
                  }`}
              >
                {isApproved
                  ? "Approved with signed message"
                  : "Approve with signed message"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center ${isLoading || !hasEnoughBalance || amount <= 0 || isButtonDisabled
              ? "opacity-50 cursor-not-allowed"
              : ""
              }`}
            disabled={isLoading || amount <= 0 || null}
          >
            {isApproved ? `Supply ${asset}` : `Approve ${asset} to continue`}
          </button>

          {/* Fullscreen Loading Overlay with Dim Background */}
          {isLoading && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{
                background: "rgba(0, 0, 0, 0.4)", // Dim background
                backdropFilter: "blur(1px)", // Blur effect
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
            <p>
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
                  : "0"} {asset}
              </strong>
            </p>
            <p>
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
                  : "0"} d{asset}
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
    </>
  );
};

export default SupplyPopup;
