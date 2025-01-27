import React, { useState, useRef } from "react";
import { Info, Check, Wallet, X, TriangleAlert } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import { toggleDashboardRefresh } from "../../../redux/reducers/dashboardDataUpdateReducer";
import { useDispatch } from "react-redux";

const ColateralPopup = ({asset, image, supplyRateAPR, balance, liquidationThreshold, reserveliquidationThreshold, assetSupply, assetBorrow, totalCollateral, totalDebt, currentCollateralStatus, Ltv, borrowableValue, borrowableAssetValue, isModalOpen, handleModalOpen, setIsModalOpen, onLoadingChange 
}) => {
  const dispatch = useDispatch();
  const { backendActor } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [isCollateral, setIsCollateral] = useState(currentCollateralStatus);
  const value = currentHealthFactor;
  const [usdValue, setUsdValue] = useState(0);
  const [amount, setAmount] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, SetError] = useState(null);
  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  async function toggleCollateral(asset, assetSupply) {
    try {
      const addedAmount = currentCollateralStatus
        ? BigInt(0)
        : BigInt(Math.round(assetSupply * 100000000));
      const amount = currentCollateralStatus
        ? BigInt(Math.round(assetSupply * 100000000))
        : BigInt(0);
  
      const response = await backendActor.toggle_collateral(asset, Number(amount), addedAmount);
  
      // Check if the response contains an error
      if (response?.Err) {
        const errorMsg = response.Err;
  
        if (errorMsg?.ExchangeRateError === null) {
          toast.error("Price fetch failed", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
  
          // Optionally, set additional error state for UI
          SetError("Price fetch failed: Your assets are safe, try again after some time.");
          throw new Error("ExchangeRateError: Price fetch failed.");
        }
        if (errorMsg?.LTVGreaterThanThreshold === null) {
          const errorText = "Collateral update failed: LTV exceeds the allowable threshold.";
          toast.error(errorText, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
  
          // Optionally set additional UI state for the error
         
          throw new Error("LTVGreaterThanThreshold: " + errorText);
        }
        // Handle other errors if needed
        throw new Error(JSON.stringify(errorMsg));
      }
  
      // Update collateral status on success
      setIsCollateral(currentCollateralStatus);
    } catch (error) {
      console.error("Error in toggleCollateral:", error);
      throw error; // Re-throw the error for the calling function to handle
    }
  }
  
  
  useEffect(() => {
  if (assetSupply && conversionRate) {
    const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
    const convertedValue = parseFloat(assetSupply) * adjustedConversionRate;

    // Truncate to 8 decimal places without rounding
    const truncatedValue = Math.trunc(convertedValue * 1e8) / 1e8;

    setUsdValue(truncatedValue);
  } else {
    setUsdValue(0);
  }
}, [amount, conversionRate]);


  const handleToggleCollateral = async () => {
    setIsLoading(true);
    try {
      // Call toggleCollateral with the required parameters
      await toggleCollateral(asset, assetSupply);
         dispatch(toggleDashboardRefresh());
      toast.success("Collateral updated successfully!");
      setIsPaymentDone(true);
      setIsVisible(false);
    } catch (error) {
      
      console.error("Error updating collateral:", error);
      const errorMessage = error?.message || "An unexpected error occurred.";
     // toast.error(`Error updating collateral: ${errorMessage}`);
    } finally {
      setIsLoading(false); // Reset loading state
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
  };
  useEffect(() => {
    const Collateral = currentCollateralStatus
  ? Math.max(totalCollateral - usdValue, 0)
  : Math.max(totalCollateral + usdValue, 0);
    const adjustedCollateral = Math.trunc(Collateral * 1e8) / 1e8;
    const totalCollateralValue = parseFloat(adjustedCollateral);
    const totalDeptValue = parseFloat(totalDebt);
    let result;
    if (totalDeptValue === 0) {
      result = Infinity;
    } else
    {let avliq=(liquidationThreshold*totalCollateral);
    console.log("avliq", avliq);
    let tempLiq = currentCollateralStatus
    ? (avliq-(usdValue * reserveliquidationThreshold))
    : (avliq+(usdValue * reserveliquidationThreshold))
    
     if (totalCollateralValue > 0) {tempLiq=tempLiq/totalCollateralValue;}
    console.log("tempLiq", tempLiq);
    result = (totalCollateralValue * (tempLiq / 100)) / totalDeptValue;
    result = Math.round(result * 1e8) / 1e8; 
    console.log("result", result);}
  console.log("result", result);

    const healthFactor= result;
    console.log("adjustedCollateral",adjustedCollateral,totalCollateral,usdValue)
    

    const ltv = calculateLTV(adjustedCollateral, totalDebt);

    setPrevHealthFactor(currentHealthFactor);

    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );

    setIsButtonDisabled(healthFactor <= 1);

    if (healthFactor <= 1) {
      toast.dismiss();
      toast.info("Health Factor Less than 1", {
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
  }, [
    asset,liquidationThreshold,reserveliquidationThreshold,assetSupply,assetBorrow,amount,usdValue,currentCollateralStatus,totalCollateral,totalDebt,
  ]);

  

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return (totalDeptValue / totalCollateralValue) * 100;
  };

  const { healthFactorBackend } = useUserData();
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
  const formatValue = (value) => {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      return "0";
    }

    if (numericValue === 0) {
      return "0";
    } else if (numericValue >= 1) {
      return numericValue.toFixed(2);
    } else {
      return numericValue.toFixed(7);
    }
  };
  return (
    <>
      {isVisible && (
        <div className="supply-popup" ref={modalRef}>
          <h1 className="font-normal text-xl">Review {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            {currentCollateralStatus ? (
              <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
                <p className="text-yellow-700 dark:text-yellow-500">
                  Disabling {asset} as collateral affects your borrowing power
                  and Health Factor.
                </p>
              </div>
            ) : (
              <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
                <p className="text-yellow-700 dark:text-yellow-500">
                  Enabling {asset} as collateral increases your borrowing power
                  and Health Factor. However, it can get liquidated if your
                  health factor drops below 1.
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
                    <span className="text-lg">{formatValue(assetSupply)}</span>
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

          {}
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
            disabled={isButtonDisabled || isLoading}
          >
            {currentCollateralStatus
              ? `Disable ${asset} as collateral`
              : `Enable ${asset} as collateral`}
          </button>

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
            <p>
              Your {asset} is {currentCollateralStatus ? " not used" : "used"}{" "}
              as collateral
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
