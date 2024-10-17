import React, { useState, useRef } from "react";
import { Info, Check, Wallet, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/message_chronicles.mp3"
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
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
 console.log("props", asset,
  image,
  supplyRateAPR,
  balance,
  liquidationThreshold,
  reserveliquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,)
 
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);

  const convertToUSD = (asset, value, prices) => {
    switch (asset) {
      case "ckbtc":
        return value * prices.ckbtc;
      case "cketh":
        return value * prices.cketh;
      case "ckusdc":
        return value * prices.ckusdc;
      case "icp":
        return value * prices.icp;
      default:
        return value;
    }
  };

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
 
  const [usdValue, setUsdValue] = useState(0);
  const [amount, setAmount] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { conversionRate, error: conversionError } = useRealTimeConversionRate(asset)

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;

    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0 && supplyBalance >= 0) {
      if (numericAmount <= supplyBalance) {
        const convertedValue = numericAmount * conversionRate;
        setUsdValue(parseFloat(convertedValue.toFixed(2))); // Ensure proper formatting
        setAmount(inputAmount);
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
        // setUsdValue(0);
      }
    } else if (inputAmount === "") {
      setAmount("");
      // setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
      // setUsdValue(0);
    }
  };

  useEffect(() => {
    if (amount && conversionRate) {
      const convertedValue = parseFloat(amount) * conversionRate;
      setUsdValue(convertedValue); // Update USD value
    } else {
      setUsdValue(0); // Reset USD value if conditions are not met
    }
  }, [amount, conversionRate]);

  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

  const handleApprove = async () => {
    let ledgerActor;

    // Access ledger actor based on asset
    if (asset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    }

    const amountAsNat64 = Number(amount);
    const scaledAmount = amountAsNat64 * Number(10 ** 8); // Adjusting for scaling factor
    const totalAmount = scaledAmount + transferfee; // Add transfer fee

    try {
      // Call the approval function
      const approval = await ledgerActor.icrc2_approve({
        fee: [], // Adjust fee if needed
        memo: [], // Optional memo field
        from_subaccount: [],
        created_at_time: [],
        amount: totalAmount, // Set the amount to be approved
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND), // Set spender principal ID
          subaccount: [],
        },
      });

      console.log("Approve", approval);
      setIsApproved(true); // Update the approval state
      console.log("isApproved state after approval:", isApproved);

      // Show success notification
      toast.success("Approval successful!");
    } catch (error) {
      // Handle error during approval
      console.error("Approval failed:", error);

      // Show error notification
      toast.error(`Error: ${error.message || "Approval failed!"}`);
    }
  };


  const isCollateral = true;
  const amountAsNat64 = Number(amount);
  const scaledAmount = amountAsNat64 * Number(10 ** 8);
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
      }


      console.log("amountAsNat64", amountAsNat64)
      console.log("scaledAmount", scaledAmount)
      console.log("Backend actor", backendActor);

      // Calling the backend actor for supply
      const sup = await backendActor.supply(asset, scaledAmount, true);
      console.log("Supply", sup);

      // Set state on success
      setIsPaymentDone(true);
      setIsVisible(false);

      // Show success notification
      const sound = new Audio(coinSound);
    sound.play();
      toast.success("Supply successful!");
    } catch (error) {
      // Log the error for debugging
      console.error("Supply failed:", error);

      // Show error notification using Toastify
      toast.error(`Error: ${error.message || "Supply action failed!"}`);
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
    const ltv = calculateLTV(assetSupply, assetBorrow);
    console.log("LTV:", ltv);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );
    //|| liquidationThreshold>ltv

    if (ltv * 100 >= liquidationThreshold) {
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
    const amountTaken = 0; // Ensure usdValue is treated as a number
    const amountAdded = usdValue || 0; // No amount added for now, but keeping it in case of future use

    // Ensure totalCollateral and totalDebt are numbers to prevent string concatenation
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
    return totalDeptValue / totalCollateralValue;
  };

  const { userData, healthFactorBackend, refetchUserData } = useUserData();
console.log("HealthFactorBackend",healthFactorBackend)
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
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0}
                    className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2  w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 px-2">
                    {usdValue ? `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : "$0.00 USD"}
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
                  <p className="text-xs mt-4">
                    {supplyBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Max
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
                    {supplyRateAPR * 100 < 0.1
                      ? "<0.1%"
                      : `${(supplyRateAPR * 100).toFixed(2)}%`}
                  </p>
                </div>
                <div className="w-full flex justify-between items-center my-1">
                  <p>Collateralization</p>
                  <p
                    className={`font-semibold ${isCollateral ? "text-green-500" : "text-red-500"
                      }`}
                  >
                    {isCollateral ? "Enabled" : "Disabled"}
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
              <p className="text-yellow-700">
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
            disabled={isLoading || amount <= 0 || null || isButtonDisabled}
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
              You have supplied <strong>{scaledAmount / 100000000} {asset}</strong>
            </p>
            <p>You have received <strong>{scaledAmount / 100000000} d{asset}</strong></p>
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
