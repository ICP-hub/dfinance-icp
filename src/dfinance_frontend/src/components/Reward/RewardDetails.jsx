import React, { useState } from "react";
import Element from "../../../public/element/Elements.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dfinLogo from "../../../public/assests-icon/Dfinance Coin 2D.png";
import icpLogo from "../../../public/assests-icon/ICP.svg";
import ckUSDTLogo from "../../../public/assests-icon/ckUSDT.svg";
import { ExternalLink } from "lucide-react";

const RewardDetails = () => {
  const userHasLockedTokens = true;
  const userStats = {
    yourLockedDLP: "18.33K",
    lockedAPR: "12%",
    yourLockedDLPUSD: "$35.98K USD",
    yourReward: "$74.92K",
  };
  const safePeriod = 90; // Safe unstake period in days
  const lockedPools = [
    {
      id: 1,
      name: "DFIN/ICP",
      logos: [dfinLogo, icpLogo],
      lpLocked: "5.21K",
      lockedAPR: "12.5%",
      dfinReward: "0.85",
      lockedDate: "2025-02-15",
      unlockDate: "2025-05-15",
      daysRemaining: 45,
    },
    {
      id: 3,
      name: "DFIN/ckUSDT",
      logos: [dfinLogo, ckUSDTLogo],
      lpLocked: "4.37K",
      lockedAPR: "18.7%",
      dfinReward: "0.92",
      lockedDate: "2025-01-01",
      unlockDate: "2025-01-10",
      daysRemaining: 0,
    },
  ];

  // Modal states
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isEarlyRedeemModalOpen, setIsEarlyRedeemModalOpen] = useState(false);
  const [isConfirmRedeemModalOpen, setIsConfirmRedeemModalOpen] =
    useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // success or error
  const [isLoading, setIsLoading] = useState(false);

  // Format date from YYYY-MM-DD to MMM DD, YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if unlock date has been reached
  const isUnlockDateReached = (unlockDate) => {
    return new Date(unlockDate) <= new Date();
  };

  // Calculate time remaining until unlock date
  const calculateDaysUntilUnlock = (unlockDate) => {
    const end = new Date(unlockDate);
    const today = new Date();
    if (today >= end) return 0;
    const diffTime = Math.abs(end - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate days passed since unlock date
  const calculateDaysPassedSinceUnlock = (unlockDate) => {
    const unlockDay = new Date(unlockDate);
    const today = new Date();
    if (today < unlockDay) return 0;
    const diffTime = Math.abs(today - unlockDay);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate remaining days in safe period
  const calculateSafeUnstakeDaysRemaining = (unlockDate) => {
    const daysPassed = calculateDaysPassedSinceUnlock(unlockDate);
    return Math.max(0, safePeriod - daysPassed);
  };

  // Calculate early redeem penalty
  const calculateEarlyRedeemAmount = (originalAmount, daysRemaining) => {
    // Penalty based on remaining days in safe period
    const penaltyPercentage = (daysRemaining / safePeriod) * 50; // 50% max penalty
    return (originalAmount * (1 - penaltyPercentage / 100)).toFixed(2);
  };

  // Handle redeem button click
  const handleRedeemClick = (pool) => {
    setSelectedPool(pool);

    // Check if it's after unlock date but within safe period
    const unlockReached = isUnlockDateReached(pool.unlockDate);
    const safePeriodRemaining = calculateSafeUnstakeDaysRemaining(
      pool.unlockDate
    );

    // Open the first modal showing DFIN reward details
    setIsRedeemModalOpen(true);
  };

  // Handle the redeem action from the first modal
  const handleRedeemAction = () => {
    setIsRedeemModalOpen(false);

    // Check if it's safe period or fully unlocked
    const safePeriodRemaining = calculateSafeUnstakeDaysRemaining(
      selectedPool.unlockDate
    );

    if (safePeriodRemaining > 0) {
      // If in safe period, show early redeem modal
      setIsEarlyRedeemModalOpen(true);
    } else {
      // If fully unlocked, show confirmation modal
      setIsConfirmRedeemModalOpen(true);
    }
  };

  // Handle the final redeem action
  const handleFinalRedeem = () => {
    // Close all modals
    setIsRedeemModalOpen(false);
    setIsEarlyRedeemModalOpen(false);
    setIsConfirmRedeemModalOpen(false);

    // Determine the redeemed amount
    const redeemedAmount = isEarlyRedeemModalOpen
      ? calculateEarlyRedeemAmount(
          selectedPool.dfinReward,
          calculateSafeUnstakeDaysRemaining(selectedPool.unlockDate)
        )
      : selectedPool.dfinReward;

    // Show toast notification
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
  };

  // Handle the claim asset action
  const handleClaimAsset = (pool) => {
    setIsLoading(true);

    // Extract the asset name from the pool name
    const poolParts = pool.name.split("/");
    const assetName = poolParts[1]; // Gets the second part (ICP or ckUSDT)

    // Simulate API call with timeout
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`30 ${assetName} has been added to your wallet`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }, 2000);
  };

  // Get pool status details
  const getPoolStatus = (pool) => {
    const unlockReached = isUnlockDateReached(pool.unlockDate);
    const safePeriodRemaining = calculateSafeUnstakeDaysRemaining(
      pool.unlockDate
    );

    if (!unlockReached) {
      return {
        status: "Locked",
        statusClass: "bg-orange-100 text-orange-800",
        statusText: `${calculateDaysUntilUnlock(pool.unlockDate)} days left`,
        canRedeem: false,
        buttonText: `Locked`,
      };
    } else if (safePeriodRemaining > 0) {
      return {
        status: "In Safe Period",
        statusClass: "bg-yellow-100 text-yellow-800",
        // statusText: "Unlocked",
        statusText: `${safePeriodRemaining} days left`,
        canRedeem: true,
        buttonText: "Redeem DFIN",
      };
    } else {
      return {
        status: "Unlocked",
        statusClass: "bg-green-100 text-green-800",
        statusText: "Unlocked",
        canRedeem: true,
        buttonText: "Redeem DFIN",
      };
    }
  };

  const getAssetName = (poolName) => {
    const parts = poolName.split("/");
    return parts.length > 1 ? parts[1] : "";
  };

  // Toast component
  const Toast = ({ message, type }) => {
    return (
      <div
        className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}
      >
        {message}
      </div>
    );
  };

  const handleOutsideClick = (e, setStateFunction) => {
    if (e.target === e.currentTarget) {
      setStateFunction(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-1 py-4">
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Stats Overview */}
      <div className="bg-white dark:bg-gradient dark:bg-[#16163B] rounded-xl shadow-md p-4 py-1 mb-[55px] md:w-[70vw] dxl:w-[40vw]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 md:border-b-0 md:border-r">
            <p className="text-[#233D63] dark:text-gray-300 text-sm mb-2">
              Your locked LP
            </p>
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#4137A8] dark:bg-blue-300 mr-2"></div>
              <h2 className="text-[20px] font-bold dark:text-white text-[#2a1f9d]">
                {userStats.yourLockedDLP}
              </h2>
            </div>
            <p className="text-[#2a1f9d] dark:text-gray-300 text-[12px]">
              {userStats.yourLockedDLPUSD}
            </p>
          </div>
          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
            <p className="text-[#233D63] text-sm dark:text-gray-300 mb-2">
              Locked APR
            </p>
            <h2 className="text-[20px] font-bold dark:text-white text-[#2a1f9d]">
              {userStats.lockedAPR}
            </h2>
          </div>
          <div className="p-4 border-gray-200 dark:border-gray-700">
            <p className="text-[#233D63] text-sm dark:text-gray-300 mb-2">
              Your Reward
            </p>
            <div className="flex">
              <h2 className="text-[20px] font-bold dark:text-white text-[#2a1f9d]">
                {userStats.yourReward}
              </h2>
              <img
                src="/assests-icon/Dfinance Coin 2D.png"
                alt="Dfinance Coin"
                className="w-6 h-6 ml-2 mt-[2px]"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Reward Pools */}
      {userHasLockedTokens ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#2a1f9d] dark:text-white">
              Liquidity pools
            </h2>
          </div>
          {/* List view for desktop and table for mobile */}
          <div className="bg-gradient-to-r from-white/0 to-white/0 dark:from-darkGradientStart dark:to-darkGradientEnd rounded-xl dxl:shadow-md overflow-hidden">
            {/* Desktop view - horizontal layout */}
            <div className="hidden dxl:block">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-[#16163B]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Pool
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      LP Locked
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Locked APR
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      DFIN Reward
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Locked Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Unlock Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 tracking-wider"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#121330] divide-y divide-gray-200 dark:divide-gray-800">
                  {lockedPools.map((pool) => {
                    const statusInfo = getPoolStatus(pool);
                    const assetName = getAssetName(pool.name);
                    return (
                      <tr key={pool.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex space-x-0">
                              <div className=" flex items-center">
                                <img
                                  src={pool.logos[0]}
                                  alt="pool_icon"
                                  className="w-8 h-8 rounded-full z-10"
                                />
                                <img
                                  src={pool.logos[1]}
                                  alt="pool_icon"
                                  className="w-8 h-8 rounded-full -ml-1"
                                />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-[#2A1F9D] dark:text-gray-50">
                                {pool.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4137A8] dark:text-gray-300">
                          {pool.lpLocked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">
                          {pool.lockedAPR}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4137A8] dark:text-gray-300">
                          {pool.dfinReward} DFIN
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4137A8] dark:text-gray-300">
                          {formatDate(pool.lockedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4137A8] dark:text-gray-300">
                          {formatDate(pool.unlockDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap ">
                          <div className="flex flex-col">
                            <div className="w-fit">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.statusClass}`}
                              >
                                {statusInfo.statusText}
                              </span>
                            </div>
                            {statusInfo.status === "Unlocked" && (
                              <button
                                onClick={() => handleClaimAsset(pool)}
                                className="text-blue-500 hover:text-blue-700 text-xs mt-1 italic"
                              >
                                Claim your {assetName}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRedeemClick(pool)}
                            disabled={!statusInfo.canRedeem}
                            className={`px-4 py-2 rounded-lg ${
                              !statusInfo.canRedeem
                                ? "bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] opacity-60 cursor-not-allowed"
                                : "bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white"
                            }`}
                          >
                            {statusInfo.buttonText}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile view - card grid */}
            <div className="block dxl:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                {lockedPools.map((pool) => {
                  const statusInfo = getPoolStatus(pool);
                  const assetName = getAssetName(pool.name);
                  return (
                    <div
                      key={pool.id}
                      className="bg-white dark:bg-[#19183D] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      {/* Pool header */}
                      <div className="bg-gray-50 dark:bg-[#252347] p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                          <div className=" flex items-center">
                            <img
                              src={pool.logos[0]}
                              alt="pool_icon"
                              className="w-8 h-8 rounded-full z-10"
                            />
                            <img
                              src={pool.logos[1]}
                              alt="pool_icon"
                              className="w-8 h-8 rounded-full -ml-1"
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {pool.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                      {/* Pool details */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              LP Locked
                            </p>
                            <p className="font-semibold dark:text-gray-100">
                              {pool.lpLocked}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              Locked APR
                            </p>
                            <p className="font-semibold text-green-500">
                              {pool.lockedAPR}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              DFIN Reward
                            </p>
                            <p className="font-semibold dark:text-gray-100">
                              {pool.dfinReward} DFIN
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              Locked Date
                            </p>
                            <p className="font-semibold dark:text-gray-100">
                              {formatDate(pool.lockedDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              Unlock Date
                            </p>
                            <p className="font-semibold dark:text-gray-100">
                              {formatDate(pool.unlockDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <div className="flex flex-col">
                              <p
                                className={`font-semibold ${
                                  statusInfo.status === "Locked"
                                    ? "text-orange-500"
                                    : statusInfo.status === "In Safe Period"
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                {statusInfo.statusText}
                              </p>
                              <span>
                                {statusInfo.status === "Unlocked" && (
                                  <button
                                    onClick={() => handleClaimAsset(pool)}
                                    className="text-blue-500 hover:text-blue-700 text-xs mt-1 italic"
                                  >
                                    Claim your {assetName}
                                  </button>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Redeem button - disabled during lock period */}
                        <div className="mt-4">
                          <button
                            onClick={() => handleRedeemClick(pool)}
                            disabled={!statusInfo.canRedeem}
                            className={`w-full py-2 px-4 rounded-lg ${
                              !statusInfo.canRedeem
                                ? "bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] opacity-60 cursor-not-allowed"
                                : "bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white"
                            }`}
                          >
                            {statusInfo.buttonText}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
            <div className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none">
              <img
                src={Element}
                alt="Elements"
                className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
              />
            </div>
            <div className="relative text-center z-10">
              <h2 className="text-[#2A1F9D] font-semibold my-2 text-lg dark:text-darkText">
                No Locked Positions
              </h2>
              <p className="text-[#737373] my-2 font-medium text-center dark:text-darkTextSecondary">
                You haven't locked any LP tokens yet. Create a lend position in
                the platform first, then follow the required steps to earn
                rewards.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Initial Reward Modal - Show DFIN reward details */}
      {isRedeemModalOpen && selectedPool && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => handleOutsideClick(e, setIsRedeemModalOpen)}
          >
            <div className="bg-white dark:bg-[#252347] rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Your DFIN reward
              </h3>
              <div className=" mb-6 bg-gray-50 dark:bg-[#16163B] p-4 rounded-lg">
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-orange-300 bg-clip-text text-transparent">
                  {selectedPool.dfinReward} DFIN
                </p>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 text-[13px]">
                    Safe unstake period = {safePeriod} days
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-[13px]">
                    Time remaining till safe unstake ={" "}
                    {calculateSafeUnstakeDaysRemaining(selectedPool.unlockDate)}{" "}
                    days
                  </p>
                </div>
              </div>
              <div className="flex justify-between gap-4 text-[13px]">
                <button
                  onClick={() => setIsRedeemModalOpen(false)}
                  className="w-1/2 py-2 px-4 bg-gray-200 dark:bg-[#16163B] hover:bg-gray-300 rounded-lg dark:text-white"
                >
                  Cancel
                </button>
                {calculateSafeUnstakeDaysRemaining(selectedPool.unlockDate) >
                0 ? (
                  <button
                    onClick={handleRedeemAction}
                    className="w-1/2 py-2 px-4 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg"
                  >
                    Early Redeem
                  </button>
                ) : (
                  <button
                    onClick={handleRedeemAction}
                    className="w-1/2 py-2 px-4 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg"
                  >
                    Redeem
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Early Redeem Modal - When in safe period */}
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

      {/* Confirmation Modal - When fully unlocked */}
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

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" rounded-full p-3">
            <div className="animate-spin rounded-full h-12 w-12 border border-b-[3px] border-gray-100 dark:border-gray-200"></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RewardDetails;
