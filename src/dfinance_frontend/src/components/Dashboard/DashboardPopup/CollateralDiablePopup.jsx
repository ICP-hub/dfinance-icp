import React, { useState, useRef } from "react";
import { Info, Check, Wallet, X, TriangleAlert } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { Fuel } from "lucide-react";
import { useSelector,useDispatch } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";


const ColateralPopup = ({
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
  currentCollateralStatus  ,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  console.log("props in ColateralPopup", asset,
    image,
    supplyRateAPR,
    balance,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    totalCollateral,
    totalDebt,
    currentCollateralStatus ,
    isModalOpen,
    handleModalOpen,
    setIsModalOpen,
    onLoadingChange)
  const { createLedgerActor, backendActor, principal } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [isCollateral, setIsCollateral] = useState(currentCollateralStatus);

  const transactionFee = 0.01;
  const dispatch=useDispatch()
  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  
  const value = currentHealthFactor;

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

  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

  async function toggleCollateral(asset, assetSupply) {
    try {
      // Scale factor for two decimal places (adjust if needed)
      const scaleFactor = 100; 
  
      // Determine the values based on the isCollateral condition
      const addedAmount = currentCollateralStatus  ? BigInt(0) : BigInt(Math.round(assetSupply * 100000000)); // Pass assetSupply as added amount if toggled is false
      const amount =currentCollateralStatus ? BigInt(Math.round(assetSupply * 100000000)) : BigInt(0); // Pass assetSupply if toggled is true, otherwise 0
  
      // Call the backend function `toggle_collateral` with the asset, amount, and addedAmount
      await backendActor.toggle_collateral(
        asset,
        Number(amount) / scaleFactor, // Convert back to a decimal for the backend if necessary
        addedAmount
      );
      setIsCollateral(!currentCollateralStatus);
      console.log("Collateral toggled successfully", isCollateral);
    } catch (error) {
      console.error("Error toggling collateral:", error);
      throw error; // Re-throw the error to handle it in the caller
    }
  }
  
  

  const handleToggleCollateral = async () => {
    setIsLoading(true); // Start loading
    try {
      // Call the function
      await toggleCollateral(asset, assetSupply);

      // If no error, display success message
      toast.success("Collateral updated successfully!");
      
      setIsPaymentDone(true);
      setIsVisible(false);
    } catch (error) {
      // Display an error message if something goes wrong
      console.error("Error toggling collateral");
      toast.error("Error updating collateral.");
    } finally {
      setIsLoading(false); // Stop loading
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

console.log("toggle status ",currentCollateralStatus )
  useEffect(() => {
    const adjustedCollateral = currentCollateralStatus 
    ? totalCollateral - assetSupply // Subtract when collateral is active (disabling)
    : totalCollateral + assetSupply; // Add when collateral is inactive (enabling)

    const healthFactor = calculateHealthFactor(
      adjustedCollateral, // Use adjusted collateral
      totalDebt,
      liquidationThreshold
    );
    console.log("Health Factor:", healthFactor);

    const ltv = calculateLTV(adjustedCollateral, totalDebt); // Adjust LTV as well
    console.log("LTV:", ltv);

    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );
    if (healthFactor <= 1) {
      setIsButtonDisabled(true);
      toast.info(" Health Factor Less than 1 ");
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
    const amountTaken = 0;
    const amountAdded = usdValue || 0;

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
  return (
    <>
      {isVisible && (
        <div className="supply-popup" ref={modalRef}>
          <h1 className="font-normal text-xl">Review tx {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
          {currentCollateralStatus  ? (
              <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
                <p className="text-yellow-700 dark:text-yellow-500">
                  Disabling {asset} as collateral affects your borrowing power and
                  Health Factor.
                </p>
              </div>
            ) : (
              <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
                <p className="text-yellow-700 dark:text-yellow-500">
                Enabling {asset} as collateral increases your borrowing power and Health Factor. However, it can get liquidated if your health factor drops below 1.
                </p>
              </div>
            )}

            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 cursor-pointer p-3  rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex justify-between items-center my-3">
                  <p>Supply Balance</p>
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{assetSupply}</span>
                    <span className="text-lg">{asset}</span>
                  </div>
                </div>

                <div className="w-full flex flex-col my-2">
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
          </div>
          {value <= 1 ? (
            <div className="w-full flex flex-col my-3 space-y-2">
              <div className="w-full flex bg-[#BA5858] p-3 rounded-lg">
                <div className="w-1/12 flex items-center justify-center">
                  <div className="warning-icon-container">
                    <TriangleAlert />
                  </div>
                </div>
                <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                  Switching collateral may trigger a liquidation call and
                  increase the risk of liquidation.
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={handleToggleCollateral}
            className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center ${
              isButtonDisabled || isLoading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={isButtonDisabled || isLoading} // Disable the button during loading
          >
           {currentCollateralStatus 
              ? `Disable ${asset} as collateral`
              : `Enable ${asset} as collateral`}
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
  Your {asset} is {currentCollateralStatus  ? " not used" : "used"} as collateral
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

export default ColateralPopup;
