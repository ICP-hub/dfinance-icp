import React, { useState, useEffect, useRef } from "react";
import Button from "../../Common/Button";
import { Info } from "lucide-react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { Check, Wallet, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import { Principal } from "@dfinity/principal";
import { trackEvent } from "../../../utils/googleAnalytics";
import { useMemo } from "react";

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
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [collateral, setCollateral] = useState(currentCollateralStatus);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset);
  console.log("Fees:", fees);
  console.log("assetSupply:", assetSupply);

  console.log("Current Collateral Status", collateral);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";
  const [amount, setAmount] = useState("");
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const isCollateral = true;

  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);

  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const modalRef = useRef(null);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAmountChange = (e) => {
    let inputAmount = e.target.value.replace(/,/g, ""); // Remove commas for processing

    // Limit decimal places to 8 digits
    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");
      if (decimalPart.length > 8) {
        inputAmount = `${integerPart}.${decimalPart.slice(0, 8)}`; // Limit decimal places to 8
      }
    }

    // Convert input amount to number for comparison
    const numericAmount = parseFloat(inputAmount);

    // Check if the amount exceeds assetSupply
    if (numericAmount > assetSupply) {
      inputAmount = assetSupply.toString(); // Limit input amount to assetSupply
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
    updateAmountAndUsdValue(inputAmount);
  };

  const updateAmountAndUsdValue = (inputAmount) => {
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= assetSupply) {
        const convertedValue = numericAmount * conversionRate;

        // Format the integer part with commas

        setUsdValue(parseFloat(convertedValue.toFixed(2))); // Round USD to 2 decimal places
        setAmount(formattedAmount); // Update the amount with commas
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else if (inputAmount === "") {
      setAmount(""); // Clear the amount in state
      setError("");
    } else {
      setError("Amount must be a positive number");
    }
  };

  // Utility function to format the amount with commas

  useEffect(() => {
    if (amount && conversionRate) {
      const convertedValue =
        parseFloat(amount.replace(/,/g, "")) * conversionRate;
      setUsdValue(convertedValue);
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);
  useEffect(() => {
    if (assetSupply && conversionRate) {
      const convertedMaxValue = parseFloat(assetSupply) * conversionRate;
      setMaxUsdValue(convertedMaxValue);
    } else {
      setMaxUsdValue(0);
    }
  }, [amount, conversionRate]);

  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

  const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
  console.log("Amount as nat64:", amountAsNat64);

  const scaledAmount = amountAsNat64; // Use scaled amount for further calculations

  const handleWithdraw = async () => {
    console.log("Withdraw function called for", asset, amount);
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
      // Added condition for ckUSDT
      ledgerActor = ledgerActors.ckUSDT;
    }

    try {
      const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
      let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
      console.log("Amount as nat64:", amountAsNat64);
      const scaledAmount = amountAsNat64;

      console.log(
        " current colletral status while withdraw ",
        currentCollateralStatus
      );
      // Use scaled amount for further calculations
      const withdrawResult = await backendActor.withdraw(
        asset,
        scaledAmount,
        [],
        currentCollateralStatus
      );
      console.log("Withdraw result", withdrawResult);

      if ("Ok" in withdrawResult) {
        trackEvent(
          "Withdraw," +
            asset +
            "," +
            scaledAmount / 100000000 +
            "," +
            currentCollateralStatus +
            "," +
            principalObj.toString(),
          "Assets",
          "Withdraw," +
            asset +
            "," +
            scaledAmount / 100000000 +
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
        const errorMsg = withdrawResult.Err;
        toast.error(`Withdraw failed: ${errorMsg}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        console.error("Withdraw error:", errorMsg);
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error(`Error: ${error.message || "Withdraw action failed!"}`);
    } finally {
      setIsLoading(false); // Stop loading once the function is done
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

  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold
    );
    console.log("Health Factor:", healthFactor);

    const amountTaken = collateral ? usdValue || 0 : 0;
    const amountAdded = 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) - parseFloat(amountTaken);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountAdded);

    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);
    console.log("LTV:", ltv);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    if (ltv * 100 >= liquidationThreshold && currentCollateralStatus) {
      // Dismiss any existing toasts before showing a new one
      toast.dismiss(); // This will remove all active toasts
      toast.info("LTV Exceeded!"); // Show the new toast
    }

    if (
      (healthFactor <= 1 || ltv * 100 >= liquidationThreshold) &&
      currentCollateralStatus
    ) {
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
  ]);

  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold
  ) => {
    const amountTaken = collateral ? usdValue || 0 : 0;
    const amountAdded = 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) - parseFloat(amountTaken);
    const totalDeptValue = parseFloat(totalDebt) + parseFloat(amountAdded);

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
    return totalDeptValue / totalCollateralValue;
  };

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  const handleMaxClick = () => {
    let asset_supply = assetSupply
      ? assetSupply >= 1e-8 && assetSupply < 1e-7
        ? Number(assetSupply).toFixed(8)
        : assetSupply >= 1e-7 && assetSupply < 1e-6
        ? Number(assetSupply).toFixed(7)
        : assetSupply
      : "0";
    const maxAmount = asset_supply.toString();
    setAmount(maxAmount.toString());
    updateAmountAndUsdValue(maxAmount);
  };

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
              <div className="w-full flex items-center justify-between bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
                <div className="w-[50%]">
                  <input
                    type="text" // Use text input to allow formatting
                    value={amount}
                    onChange={handleAmountChange}
                    // disabled={supplyBalance === 0}
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
                    ${maxUsdValue.toLocaleString(4)}
                    Max {/* Adjust maximumFractionDigits as needed */}
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
                    {(assetSupply - amount.replace(/,/g, "")).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
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
                  className={`font-semibold ${
                    currentCollateralStatus ? "text-green-500" : "text-red-500"
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
                  <p className="text-gray-500">liquidation at &lt;1</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex  mt-3">
            <div className="flex items-center">
              <Fuel className="w-4 h-4 mr-1" />
              <h1 className="text-lg font-semibold mr-1">{transferfee}</h1>
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
          </div>
          <div>
            <Button
              onClickHandler={
                isLoading || amount <= 0 || isButtonDisabled
                  ? null
                  : handleWithdraw
              }
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center ${
                isLoading || amount <= 0 || isButtonDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              title="Withdraw"
            />
          </div>
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
              className="text-gray-400 hover:text-gray-600 focus:outline-none self-end"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <center>
              <p className="mt-2">
                Your Supply was{" "}
                <strong>
                  {assetSupply} {asset}{" "}
                </strong>{" "}
                and you have withdrawn{" "}
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
    </>
  );
};

export default WithdrawPopup;
