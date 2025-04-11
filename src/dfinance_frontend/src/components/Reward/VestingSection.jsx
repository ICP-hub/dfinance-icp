import React, { useState } from "react";
import { Info, ExternalLink } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dfinLogo from "../../../public/assests-icon/Dfinance Coin 2D.png";
import { useNavigate } from "react-router-dom";

export default function VestingSection() {
  // Modal states
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isEarlyRedeemModalOpen, setIsEarlyRedeemModalOpen] = useState(false);
  const [isConfirmRedeemModalOpen, setIsConfirmRedeemModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const safePeriod = 90;
  const navigate = useNavigate();

  const statsData = {
    totalDLPLocked: {
      value: "10.45M",
      usdValue: "$1.46M USD",
    },
    totalDailyFees: {
      value: "21%",
    },
    yourDLPLocked: {
      value: "0.00",
      usdValue: "$0.00 USD",
    },
    yourShare: {
      percentage: "0.00000%",
      multiplier: "Avg. multiplier: 0.00x",
    },
    yourAnnualRevenue: {
      value: "14%",
    },
  };

  const lockPeriods = [
    { period: "1 month", apr: "0.06% APR" },
    { period: "3 months", apr: "0.26% APR" },
    { period: "6 months", apr: "0.65% APR" },
    { period: "12 months", apr: "1.62% APR" },
  ];

  const vestingData = {
    dfinReward: "2.50",
    unlockDate: "2025-06-10",
    lockedDate: "2025-03-10",
  };

  const handleOutsideClick = (e, setStateFunction) => {
    if (e.target === e.currentTarget) {
      setStateFunction(false);
    }
  };

  const calculateSafeUnstakeDaysRemaining = (unlockDate) => {
    const unlockDay = new Date(unlockDate);
    const today = new Date();
    if (today < unlockDay) return safePeriod;
    const diffTime = Math.abs(today - unlockDay);
    const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, safePeriod - daysPassed);
  };

  const calculateEarlyRedeemAmount = (originalAmount, daysRemaining) => {
    const penaltyPercentage = (daysRemaining / safePeriod) * 50;
    return (originalAmount * (1 - penaltyPercentage / 100)).toFixed(2);
  };

  const handleRedeemClick = () => {
    setSelectedPool(vestingData);
    setIsConfirmRedeemModalOpen(true);
  };

  const handleExitEarlyClick = () => {
    setSelectedPool(vestingData);
    setIsEarlyRedeemModalOpen(true);
  };

  const handleFinalRedeem = () => {
    setIsLoading(true);

    const redeemedAmount = isEarlyRedeemModalOpen
      ? calculateEarlyRedeemAmount(
          selectedPool.dfinReward,
          calculateSafeUnstakeDaysRemaining(selectedPool.unlockDate)
        )
      : selectedPool.dfinReward;

    setTimeout(() => {
      setIsRedeemModalOpen(false);
      setIsEarlyRedeemModalOpen(false);
      setIsConfirmRedeemModalOpen(false);
      setIsLoading(false);

      setToastMessage(`Successfully redeemed ${redeemedAmount} DFIN!`);
      toast.dismiss();
      toast.success(`Successfully redeemed ${redeemedAmount} DFIN!`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      setToastType("success");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }, 2000);
  };

  const handleSupplyMore = () => {
    navigate("/dashboard");
    setTimeout(() => {
      const element = document.getElementById("dashboard-assets-to-supply");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 lg1:grid-cols-12 gap-6 mb-6">
        {/* Left Panel - Takes less space (5 columns) */}
        <div className="lg:col-span-5 bg-gradient-to-r from-[#4659CF]/30 to-[#FCBD78]/30 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd rounded-3xl border shadow-md p-5 sm:p-6 border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total dLP locked */}
            <div className="sm:border-r border-gray-200 dark:border-gray-700 pr-2 sm:pr-4">
              <div className="flex items-center mb-2">
                <p className="text-[11px] sm:text-[12px] md:text-xs text-blue-800 dark:text-gray-400">
                  Total LP locked
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-[#4036A8] dark:bg-blue-500 mr-2 flex items-center justify-center"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                  {statsData.totalDLPLocked.value}
                </h2>
              </div>
              <p className="text-[12px] sm:text-[12px] md:text-[13px] text-gray-700 dark:text-gray-400 mt-1">
                {statsData.totalDLPLocked.usdValue}
              </p>
            </div>

            {/* Total daily platform fees */}
            <div>
              <div className="flex items-center mb-2">
                <p className="text-[11px] sm:text-[12px] md:text-xs text-blue-800 dark:text-gray-400">
                  Global APR
                </p>
                <Info className="w-3 h-3 text-blue-800 dark:text-gray-400 ml-1" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                {statsData.totalDailyFees.value}
              </h2>
            </div>
          </div>
        </div>

        {/* Right Panel - Takes more space (7 columns) */}
        <div className="lg:col-span-7 bg-gradient-to-r from-[#4659CF]/30 to-[#FCBD78]/30 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd rounded-3xl shadow-md p-5 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
            {/* Your dLP locked */}
            <div className="sm:border-r border-gray-200 dark:border-gray-700 pr-2 sm:pr-4">
              <div className="flex items-center mb-2">
                <p className="text-[11px] sm:text-[12px] md:text-xs text-blue-800 dark:text-gray-400">
                  Your LP locked
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-[#4036A8] dark:bg-blue-500 mr-2 flex items-center justify-center"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                  {statsData.yourDLPLocked.value}
                </h2>
              </div>
              <p className="text-[12px] sm:text-[13px] md:text-sm text-gray-700 dark:text-gray-400 mt-1">
                {statsData.yourDLPLocked.usdValue}
              </p>
            </div>

            {/* Your share */}
            <div className="sm:border-r border-gray-200 dark:border-gray-700 sm:px-2 md:px-4">
              <div className="flex items-center mb-2">
                <p className="text-[11px] sm:text-[12px] md:text-xs text-blue-800 dark:text-gray-400">
                  Your share
                </p>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                {statsData.yourShare.percentage}
              </h2>
              <p className="text-[12px] sm:text-[12px] md:text-[13px] text-gray-700 dark:text-gray-400 mt-1">
                {statsData.yourShare.multiplier}
              </p>
            </div>

            {/* Your annual revenue */}
            <div className="sm:pl-2 md:pl-4">
              <div className="flex items-center mb-2">
                <p className="text-[11px] sm:text-[12px] md:text-xs text-blue-800 dark:text-gray-400">
                  Your APR
                </p>
                <Info className="w-3 h-3 text-gray-500 dark:text-gray-400 ml-1" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                {statsData.yourAnnualRevenue.value}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout for dLP and Vesting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* dLP Overview Section */}
        <div className="bg-gradient-to-r from-[#4659CF]/30 to-[#FCBD78]/30 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd rounded-3xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800 px-2 py-1">
          <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4">
            <h3 className="text-sm sm:text-sm md:text-md font-medium text-[#4036A8] dark:text-white">
              Your Total Collateral
            </h3>
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 from-[40%] via-pink-400 via-[80%] to-orange-300 bg-clip-text text-transparent">
                  2.3k
                </p>

                <span className="text-gray-600 dark:text-gray-400"></span>
              </div>
            </div>

            <p className="text-[12px] sm:text-[12px] md:text-[13px] text-blue-800 dark:text-gray-200 mt-2">
              Minimum Eligibility criteria = 5%
            </p>
          </div>

          <div className="p-4 mb-1">
            <div className="flex align-center gap-1 mb-[1rem] mt-[0.5rem] p-1">
              <Info className="w-3 h-4 text-gray-700 dark:text-gray-400 ml-1" />
              <p className="text-[11px] sm:text-[11px] md:text-xs text-gray-700 dark:text-gray-400">
                In order to eligible for DFIN emission, you have to add
                liquidity of at least 115
              </p>
            </div>
            <div className="flex gap-4 px-2 py-0">
              {" "}
              <button
                className="w-full bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white font-medium py-2 rounded-[11.5px] text-[12px] sm:text-[12px] md:text-[13px]"
                onClick={handleSupplyMore}
              >
                Supply more
              </button>
              <button className="w-full bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white font-medium py-2 rounded-[11.5px] text-[12px] sm:text-[12px] md:text-[13px]">
                Add liquidity
              </button>
            </div>
          </div>
        </div>

        {/* Vesting Overview Section */}
        <div className="bg-gradient-to-r from-[#4659CF]/30 to-[#FCBD78]/30 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd rounded-3xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-800 px-2 py-1">
          <div className="border-b-1 border-gray-200 dark:border-gray-800 px-5 py-4">
            <h3 className="text-sm sm:text-sm md:text-md font-medium text-[#4036A8] dark:text-white">
              Vesting overview
            </h3>
          </div>
          {/* Currently Vesting  */}
          <div className="px-5 py-5 border-t border-gray-200 dark:border-gray-800">
            <p className="text-[12px] sm:text-[12px] md:text-[13px] text-blue-800 dark:text-gray-400 mb-4">
              Currently vesting
            </p>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <img
                    src={dfinLogo}
                    alt="dfinLogo"
                    className="w-5 h-5 mr-2 -mt-[1px]"
                  />
                  <span className="text-xl sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                    {vestingData.dfinReward}
                  </span>
                </div>
                <p className="text-[12px] sm:text-[13px] md:text-sm text-blue-800 dark:text-gray-400 mt-1">
                  $0.30 USD
                </p>
              </div>
              <div className="flex flex-col items-end">
                <button className="bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white font-medium py-2 px-6 rounded-xl text-[12px] sm:text-[12px] md:text-[13px]">
                  Add liquidity
                </button>
                <p className="text-[9px] sm:text-[10px] md:text-[10px] lg:text-[12px] italic mt-2 text-blue-800 dark:text-blue-400">
                  No exit penalty for adding liquidity
                </p>

                <div className="mt-3 inline-block rounded-[11px] bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] p-[2px]">
                  <div className="dark:bg-[#16163B] bg-[#F1E3D3] dark:text-white text-blue-800 rounded-[10px]">
                    <button
                      onClick={handleExitEarlyClick}
                      className="bg-transparent text-[12px] sm:text-[12px] md:text-[13px] py-[6px] px-6 rounded-[10px] font-medium"
                    >
                      Exit early
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <span className="text-[12px] sm:text-[12px] md:text-[13px] text-blue-800 dark:text-gray-400 mr-2">
                    Penalty:
                  </span>
                  <span className="text-[12px] sm:text-[12px] md:text-[13px] text-[#4036A8] dark:text-white">
                    0.00 DFIN
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-2 mt-6">
              {" "}
              <Info className="w-3 h-4 text-gray-700 dark:text-gray-400" />
              <p className="text-[11px] sm:text-[11px] md:text-xs text-gray-700 dark:text-gray-400">
                Early withdrawal from a vest will incur a penalty between 25-90%
                based on a linear schedule of elapsed time.
              </p>
            </div>
          </div>

          {/* Vested */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-800">
            <p className="text-[12px] sm:text-[12px] md:text-[13px] text-blue-800 dark:text-gray-400 mb-4">
              Vested
            </p>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <img
                    src={dfinLogo}
                    alt="dfinLogo"
                    className="w-5 h-5 mr-2 -mt-[1px]"
                  />
                  <span className="text-xl sm:text-xl md:text-2xl font-medium text-[#4036A8] dark:text-white">
                    0.00
                  </span>
                </div>
                <p className="text-[12px] sm:text-[13px] md:text-sm text-blue-800 dark:text-gray-400 mt-1">
                  $0.00 USD
                </p>
              </div>

              <div className="inline-block rounded-[11px] bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] p-[2px]">
                <div className="dark:bg-[#16163B] bg-[#F1E3D3] dark:text-white text-blue-800 rounded-[10px]">
                  <button
                    onClick={handleRedeemClick}
                    className="bg-transparent text-[12px] sm:text-[12px] md:text-[13px] py-[6px] px-6 rounded-[10px] font-medium"
                  >
                    Redeem
                  </button>
                </div>
              </div>
            </div>
            <p className="w-3 h-4 text-gray-500 dark:text-gray-400" />
            <p className="text-[11px] sm:text-[11px] md:text-xs text-gray-700 dark:text-gray-400 mt-2">
              DFIN that has completed the 90 day vesting period.
            </p>
          </div>
        </div>
      </div>

      {/* Early Redeem Modal */}
      {isEarlyRedeemModalOpen && selectedPool && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleOutsideClick(e, setIsEarlyRedeemModalOpen)}
        >
          <div className="bg-white dark:bg-[#252347] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              Early Redeem
            </h3>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-[14px]">
                Your safe unstake period is not completed. Do you really want to
                unstake now?
              </p>
              <div className="bg-gray-50 dark:bg-[#16163B] p-4 rounded-lg mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-[14px]">
                  You will receive:
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-orange-300 bg-clip-text text-transparent">
                  {calculateEarlyRedeemAmount(
                    selectedPool.dfinReward,
                    calculateSafeUnstakeDaysRemaining(selectedPool.unlockDate)
                  )}{" "}
                  DFIN
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-[13px]">
                  Original reward: {selectedPool.dfinReward} DFIN
                </p>
              </div>
              <a
                href="https://whimsical.com/dfinance-economy-overview-YAozP1ywWyW6doGYncnucC@2bsEvpTYFZsxPTPQr9kYGzDSEAE43NMKnr5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex text-[12px] text-blue-500 hover:underline cursor-pointer italic"
              >
                Learn more about the penalty{" "}
                <ExternalLink className="ml-1" size={16} color="#4169E1" />
              </a>
            </div>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => setIsEarlyRedeemModalOpen(false)}
                className="w-1/2 py-2 px-4 text-[13px] bg-gray-200 dark:bg-[#16163B] hover:bg-gray-300 rounded-lg dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalRedeem}
                className="w-1/2 py-2 px-4 text-[13px] bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - When clicking Redeem */}
      {isConfirmRedeemModalOpen && selectedPool && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleOutsideClick(e, setIsConfirmRedeemModalOpen)}
        >
          <div className="bg-white dark:bg-[#252347] rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-7">
              <p className="text-gray-600 dark:text-gray-300 mb-4 font-bold text-xl">
                Congratulations! You have earned
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-blue-500 to-pink-500 to-orange-300 bg-clip-text text-transparent mb-2">
                {selectedPool.dfinReward} DFIN
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-[13px]">
                Click on redeem to get your reward amount.
              </p>
            </div>
            <div className="flex justify-between gap-4 text-[13px]">
              <button
                onClick={() => setIsConfirmRedeemModalOpen(false)}
                className="w-1/2 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg dark:bg-[#16163B] dark:hover:bg-[#1c1c45] dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalRedeem}
                className="w-1/2 py-2 px-4 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-full p-3">
            <div className="animate-spin rounded-full h-12 w-12 border border-b-[3px] border-gray-100 dark:border-gray-200"></div>
          </div>
        </div>
      )}
    </div>
  );
}
