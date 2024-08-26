import React, { useEffect, useRef, useState } from "react";
import { Info ,X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import cketh from "../../../public/assests-icon/cekTH.png";
import ckbtc from "../../../public/assests-icon/ckBTC.png";
import icp from "../../../public/assests-icon/icpdark.png";
import Button from "../Common/Button";
import Vector from "../../../public/Helpers/Vector.png"
const UserInformationPopup = ({ onClose }) => {
  const { principal } = useAuth();
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false); // State to manage content view
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false); // New state for Collateral Overlay
  const [selectedAsset, setSelectedAsset] = useState("cketh"); // Default selected asset
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null); // State to handle transaction result
  const [isSuccessful, setIsSuccessful] = useState(false); 
  const defaultAsset = "cketh"; 
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNextClick = () => {
    if (isDebtInfo) {
      setIsCollateralOverlay(true); // Show Collateral Overlay on next click in Debt Info
    } else {
      setIsDebtInfo(true); // Switch to Debt Information view
    }
  };
  
  const handleAssetSelection = (asset) => {
    setSelectedAsset(asset); // Set the selected asset (only one at a time)
  };

  const renderAssetDetails = (asset) => {
    switch (asset) {
      case "cketh":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckETH Price
              </p>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                0.0032560
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckETH Bonus%
              </p>
              <p className="text-xs font-medium">10%</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckETH Rewarded Amount
              </p>
              <p className="text-xs font-medium">0.0032560</p>
            </div>
          </div>
        );
      case "ckbtc":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckBTC Price
              </p>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                0.0010250
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckBTC Bonus%
              </p>
              <p className="text-xs font-medium">15%</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ckBTC Rewarded Amount
              </p>
              <p className="text-xs font-medium">0.0010250</p>
            </div>
          </div>
        );
      case "icp":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ICP Price
              </p>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                5.032560
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ICP Bonus%
              </p>
              <p className="text-xs font-medium">12%</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm mt-4">
              <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                ICP Rewarded Amount
              </p>
              <p className="text-xs font-medium">5.032560</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  const handleCallLiquidation = () => {
    setShowWarningPopup(true);
  };

  const handleCloseWarningPopup = () => {
    setShowWarningPopup(false);
  };

  const handleCheckboxClick = () => {
    // Simulate the transaction result
    const staticValue = true; // or false to simulate failure
    
    // Set the state to indicate whether the liquidation was successful or failed
    setIsSuccessful(staticValue);
    
    // Set transaction result and close the warning popup
    setTransactionResult(staticValue ? "success" : "failure");
    setShowWarningPopup(false);
  };
  const handleClosePopup = () => {
    setTransactionResult(null);
    onClose(); // Close the transaction result popup
  };
  
  const handleRetry = () => {
    setTransactionResult(null); // Reset the transaction result and show warning popup
    setShowWarningPopup(true);
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
       {transactionResult ? (
        // Transaction result popup
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md w-full max-w-md mx-auto text-center">
          <div className="flex flex-col items-center">
            {transactionResult === "success" ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-purple-500 mb-4"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <h2 className="text-2xl font-bold text-[#2A1F9D] mb-2">
                  Liquidation Successful
                </h2>
                <p className="text-gray-500 mb-4">Check Your wallet balance</p>
                <button
                  className="bg-gradient-to-r from-purple-500 to-orange-500 text-white py-2 px-4 rounded-md focus:outline-none"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-red-500 mb-4"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h2 className="text-2xl font-bold text-red-500 mb-2">
                  Liquidation Failed
                </h2>
                <p className="text-gray-500 mb-4">
                  We couldn’t process your request. Please try again.
                </p>
                <button
                  className="bg-gradient-to-r from-purple-500 to-orange-500 text-white py-2 px-4 rounded-md focus:outline-none"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      ) : showWarningPopup ? (
        // Render only the warning popup when `showWarningPopup` is true
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-[#2A1F9D] dark:text-indigo-300">
            Warning Pop Up
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-4">
            Are you sure you want to liquidate on behalf of "{principal}"? 
            <strong>1000 ICP</strong> will be deducted from your account 
            & <strong>100 ICP</strong> will be rewarded.
          </p>
          <div className="mt-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" onClick={handleCheckboxClick} />
              Yes, call Liquidation
            </label>
          </div>
          <div className="flex justify-center mt-6">
            <button
              className="px-6 py-2 bg-gradient-to-r from-[#EB8863] to-[#81198E] text-white rounded-md"
              onClick={handleCloseWarningPopup}
            >
              Cancel
            </button>
          </div>
        </div>
      
      ) : (
      <div
        ref={popupRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-md w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2A1F9D] dark:text-indigo-300">
            {isCollateralOverlay
              ? "Collateral Information"
              : isDebtInfo
              ? "Debt Information"
              : "User Information"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {isCollateralOverlay ? (
          // Collateral Overlay Content with checkboxes for asset selection
          <div>
            <div className="mb-6">
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-indigo-300 mb-2">
                Collateral Asset
              </h3>
              {/* Collateral Asset selection with checkboxes */}
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedAsset === "cketh"}
                    onChange={() => handleAssetSelection("cketh")}
                  />
                  <img src={cketh} alt="ETH" className="w-6 h-6" />
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedAsset === "ckbtc"}
                    onChange={() => handleAssetSelection("ckbtc")}
                  />
                  <img src={ckbtc} alt="BTC" className="w-6 h-6" />
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedAsset === "icp"}
                    onChange={() => handleAssetSelection("icp")}
                  />
                  <img src={icp} alt="ICP" className="w-6 h-6" />
                </label>
              </div>
              {/* Render asset details based on selected checkboxes */}
              {renderAssetDetails(selectedAsset)}
              <div className="flex items-center mt-2">
              <img
                src={Vector}
                alt="Vector Image"
                className="w-4 h-4 mr-1"
              />
              <h1 className="text-xs font-medium">100 ICP</h1>
             
            </div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                title="Back"
                className="py-2 px-9 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white"
                onClick={() => setIsCollateralOverlay(false)}
              >
                Back
              </button>
              <button
                className="px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#EB8863] to-[#81198E] rounded-md"
                onClick={handleCallLiquidation}
              >
                Call Liquidation
              </button>
            </div>
          </div>
  
        ) : isDebtInfo ? (
          // Debt Information Content
          <div>
            <div className="mb-6">
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-indigo-300 mb-2">
                Debt Asset
              </h3>
              <div className="mb-4 relative w-10 h-10">
                {/* Icons representing debt assets - overlaying each other */}
                <img
                  src={cketh}
                  alt="ckETH"
                  className="w-6 h-6 absolute top-0 left-0"
                />
                <img
                  src={ckbtc}
                  alt="ckBTC"
                  className="w-6 h-6 absolute top-0 left-4"
                />
                <img
                  src={icp}
                  alt="ICP"
                  className="w-6 h-6 absolute top-0 left-8"
                />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm">
                <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                  Close Factor
                </p>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  50%
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm text-[#F30606] mt-4 flex justify-between items-center mb-56">
                <p className="text-lg font-bold text-[#2A1F9D] dark:text-gray-400">
                  Amount to Repay
                </p>
                <p className="text-xs font-normal">1.00</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                title="Back"
                className="py-2 px-9 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white"
                onClick={() => setIsDebtInfo(false)} // Go back to User Info view
              >
                Back
              </button>
              <button
                className="px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#EB8863] to-[#81198E] rounded-md"
                onClick={handleNextClick}
              >
                NEXT
              </button>
            </div>
          </div>
        ) : (
          // User Information Content
          <div>
          <div className="mb-6">
            <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-indigo-300 mb-2">
              Section 1
            </h3>
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100">
                <p className="text-lg font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-gray-400">
                  User Principle
                </p>
                <p className="text-xs font-medium text-[#2A1F9D] opacity-50">
                  {principal}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm text-[#F30606]">
                <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                  User Health Factor
                </p>
                <p className="text-xs font-medium">1.00</p>
              </div>
            </div>
          </div>
          <div className="w-full h-[0.5px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 opacity-50"></div>
          <div className="mb-6">
            <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-indigo-300 mb-2">
              Section 2
            </h3>
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100">
                <p className="text-lg font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-gray-400">
                  My Wallet Balance
                </p>
                <p className="text-xs font-medium text-[#2A1F9D] opacity-50">
                  0.0032560 Max
                </p>
              </div>
            </div>
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 text-sm text-[#F30606]">
                <p className="text-lg font-normal text-[#2A1F9D] mb-1 dark:text-gray-400">
                  My Health Factor
                </p>
                <p className="text-xs font-medium">1.00</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleNextClick}
              className="py-2 px-4 text-sm font-semibold text-white bg-gradient-to-r from-[#EB8863] to-[#81198E] rounded-md"
            >
              NEXT
            </button>
          </div>
        </div>
        )}
      </div>
      )} 
    </div>
  );
};

export default UserInformationPopup;
