import React, { useState ,useEffect } from "react";
import { Info, ExternalLink ,X, Check} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dfinLogo from "../../../public/assests-icon/Dfinance Coin 2D.png";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import dfin from "../../../public/Helpers/Dfinance Coin 2D.svg";
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
  const [showPopup, setShowPopup] = useState(false);
  const [confirmPopup, setShowConfirmPopup] = useState(false);
  const [successPopup, setSuccesPopup] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("6 months");
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [usdValue1, setUsdValue1] = useState(0);
  const [usdValue2, setUsdValue2] = useState(0);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [selected1, setSelected1] = useState({
    name: "USDT",
    icon: ckUSDT,
    price: 3000,
  });
  const [rdntToken] = useState({ name: "DFIN", icon: dfin });
  const [secondSectionActive, setSecondSectionActive] = useState(false);
  const [availableDFIN, setAvailableDFIN] = useState(100); // replace 100 with actual data from props, API, etc.

  // Sample conversion rate: 1 ETH = 2000 RDNT (you would replace with real rates)
  const conversionRate = 2000;
  const totalDeposit = 1000000; // your constant deposit value (example)
  const activeValue = secondSectionActive ? usdValue1 + usdValue2 : usdValue1;
  const percentage = ((activeValue / totalDeposit) * 100).toFixed(2);
  const clampedPercentage = Math.min(
    (activeValue / totalDeposit) * 100,
    100
  ).toFixed(2);
  console.log("clampedPercentage", clampedPercentage);
  const tokenOptions = [
    { name: "USDT", icon: ckUSDT },
    { name: "ICP", icon: icp },
  ];

  const handleTokenChange = (tokenName) => {
    const token = tokenOptions.find((t) => t.name === tokenName);
    setSelected1(token);
    setShowDropdown1(false);

    // Recalculate value1 based on the new token selection
    if (amount2) {
      const tokenConversionRate = getConversionRate(rdntToken.name, token.name);
      const newAmount1 = (parseFloat(amount2) / tokenConversionRate).toFixed(6);
      setAmount1(newAmount1);
      setUsdValue1(parseFloat(newAmount1) * token.price);
    }
  };

  // Get conversion rate between tokens (simplified example)
  const getConversionRate = (fromToken, toToken) => {
    // Handle RDNT to specific tokens
    if (fromToken === "RDNT" && toToken === "USDT") return 0.67; // 1 RDNT = 0.67 USDT
    if (fromToken === "RDNT" && toToken === "ICP") return 0.1; // 1 RDNT = 0.1 ICP
    if (fromToken === "RDNT" && toToken === "ETH") return 0.0005; // 1 RDNT = 0.0005 ETH

    // Handle specific tokens to RDNT
    if (fromToken === "USDT" && toToken === "RDNT") return 1.5; // 1 USDT = 1.5 RDNT
    if (fromToken === "ICP" && toToken === "RDNT") return 10; // 1 ICP = 10 RDNT
    if (fromToken === "ETH" && toToken === "RDNT") return 2000; // 1 ETH = 2000 RDNT

    // Default fallback for unspecified pairs
    return 1;
  };

  const handleAmount1Change = (e) => {
    const value = e.target.value;
    setAmount1(value);

    const usd = parseFloat(value || 0) * selected1.price;
    setUsdValue1(usd);

    if (secondSectionActive && usd && rdntToken?.price) {
      const newAmount2 = (usd / 200).toFixed(6); // 200 = RDNT's USD rate
      setAmount2(newAmount2);
      setUsdValue2(usd); // keep them in sync
    } else {
      setAmount2("");
      setUsdValue2(0);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = (totalDeposit / selected1.price).toFixed(6);
    setAmount1(maxAmount);
    setUsdValue1(totalDeposit);

    if (secondSectionActive && rdntToken?.price) {
      const rdntAmount = (totalDeposit / 200).toFixed(6); // assuming 1 RDNT = $200
      setAmount2(rdntAmount);
      setUsdValue2(totalDeposit);
    }
  };

  const handleAmount2Change = (e) => {
    const value = e.target.value;
    setAmount2(value);

    const rate = 200; // USD value per 1 RDNT (example)
    const usd = parseFloat(value || 0) * rate;
    setUsdValue2(usd);

    // Now convert USD to selected token's amount
    if (usd && selected1?.price) {
      const newAmount1 = (usd / selected1.price).toFixed(6);
      setAmount1(newAmount1);
      setUsdValue1(usd); // keep the USD value synced
    } else {
      setAmount1("");
      setUsdValue1(0);
    }
  };

  
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsApproved(true);
      setIsLoading(false);
      toast.dismiss();
      toast.success("Approval successfull!", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }, 1500);
  };
  
  useEffect(() => {
    if (isApproved) {
      setIsApproved(false);
    }
  }, [amount1, amount2, selected1]);

  const handleAddLiquidity = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.dismiss();
      toast.success("Liquidity added successfully!", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setIsModalOpen(false);
      setShowPopup(true);
    }, 1500);
  };
  const isDashboardRoute = location.pathname === "/";

  const handleClosePopup = () => {
    setShowPopup(false);
    setShowConfirmPopup(true);
  };
  const handleConfirmPopup = () => {
    setShowConfirmPopup(false);
  };
  const handleLockPopup = () => {
    setSuccesPopup(false);
  };
  const handleContinue = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      setShowPopup(false);
      setShowConfirmPopup(true);
    }, 1500);
  };
  const handleLock = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(
        `Locked for ${selectedDuration} with ${
          selectedDuration === "6 months"
            ? "36.52%"
            : selectedDuration === "12 months"
            ? "91.3%"
            : selectedDuration === "3 months"
            ? "14.61%"
            : "3.65%"
        } APR`,
        {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          type: "success", // If you need to specify the type, include it in the options object
        }
      );
      setShowConfirmPopup(false);
      setSuccesPopup(true);
    }, 1500);
  };

  const handleMaxClick2 = () => {
    const dfinPrice = 200;
    const maxAmount = usdValue2 / dfinPrice;
    setAmount2(maxAmount);
    setUsdValue2(availableDFIN);

    if (secondSectionActive && selected1?.price) {
      const newAmount = (availableDFIN / selected1.price).toFixed(6); // assuming 1 RDNT = $200
      setAmount1(newAmount);
      setUsdValue1(availableDFIN);
    }
  };
  const toggleSecondSection = () => {
    setSecondSectionActive(!secondSectionActive);
    if (!secondSectionActive) {
      // When opening second section, start with empty value
      setAmount2("");
      setUsdValue2(0);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showPopup]);

  useEffect(() => {
    if (confirmPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [confirmPopup]);

  useEffect(() => {
    if (successPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [successPopup]);
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
              <button  onClick={openModal}
              className="w-full bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white font-medium py-2 rounded-[11.5px] text-[12px] sm:text-[12px] md:text-[13px]">
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
                <button  onClick={openModal}
                className="bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white font-medium py-2 px-6 rounded-xl text-[12px] sm:text-[12px] md:text-[13px]">
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
    {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={closeModal}
        >
          <div
            className="relative w-[325px] lg1:w-[420px] max-h-[100vh] overflow-y-auto bg-white dark:bg-darkOverlayBackground text-[#2A1F9D] dark:text-darkText shadow-xl rounded-2xl p-6 font-poppins scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-gray-200 dark:border-gray-800 pb-1 mt-0.5">
              <div className="w-8">{/* Empty div for spacing/balance */}</div>
              <h2 className="text-lg font-semibold text-center flex-grow">
                Add Liquidity
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 w-8"
                onClick={closeModal}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* RDNT Emissions Info */}
            <div
              className="p-3 b bg-gradient-to-r from-sky-200/40 via-blue-200/80 to-indigo-200/50 text-slate-800
                   dark:bg-gradient-to-r dark:from-blue-950 dark:via-blue-900/60 dark:to-teal-900/70 dark:text-white border-2 
                  border-blue-300 mb-4 rounded-xl"
            >
              <h3 className="font-medium text-xs dark:text-darkText/90 text-[14px]  mb-1">
                Want to activate Dfinance emissions?
              </h3>
              <p className="text-xs  dark:text-darkText/90 ">
                When your locked LP value is greater than 5% of your total
                deposit value you become emissions eligible.
              </p>
              <div className="flex items-center mt-3">
                <div className="w-4 h-4 rounded-full mr-1 flex items-center justify-center">
                  <img
                    src={dfin}
                    alt={selected1.name}
                    className="w-5 h-5 rounded-full object-contain"
                  />
                </div>
                <span className="text-xs  dark:text-darkText/90">
                  $
                  {activeValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ({clampedPercentage}%) out of ${totalDeposit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-transparent rounded-full mt-2 flex overflow-hidden relative">
                {/* The dynamic gradient progress bar */}
                <div
                  className="h-full bg-[#425b80] dark:bg-[#bccbe0] rounded-l-full transition-all duration-300"
                  style={{ width: `${clampedPercentage}%` }}
                ></div>

                {/* The background bar */}
                <div className="h-full bg-gray-400 opacity-50 rounded-r-full flex-1"></div>

                {/* Fixed separator at 5% position */}
                <div
                  className="absolute h-full w-[4px] bg-[#e1f3fe] dark:bg-[#1b2552] mr-2 "
                  style={{ left: "5%" }}
                ></div>
              </div>
            </div>

            {/* Input Section */}
            <div className="flex flex-col gap-4">
              {/* First Section */}
              <div
                className={`relative border ${
                  secondSectionActive
                    ? "border-gray-300 dark:bg-[#1D1B40] dark:border-gray-800 bg-gray-200 "
                    : "border-gray-300 dark:border-gray-600"
                } p-4 rounded-xl text-[#233D63] dark:text-gray-200 flex items-center justify-between`}
              >
                {/* Input Section */}
                <div className="w-[80%]relative -mt-6">
                  <input
                    type="text"
                    placeholder="0.0"
                    value={amount1}
                    onChange={handleAmount1Change}
                    className="w-full text-gray-900 dark:text-gray-200 text-[11px] md:text-lg font-medium bg-transparent focus:outline-none pr-24"
                    disabled={secondSectionActive}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.2 mb-1">
                    $
                    {usdValue1.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* Dropdown + Max button grouped */}
                <div className="flex flex-col items-end mt-0.5">
                  <div className="relative border border-gray-300 dark:border-gray-600 rounded-full">
                    <div
                      className="flex items-center rounded-lg px-2 py-1 text-gray-900 dark:text-gray-200 cursor-pointer ml-1"
                      onClick={() =>
                        !secondSectionActive && setShowDropdown1(!showDropdown1)
                      }
                    >
                      <img
                        src={selected1.icon}
                        alt={selected1.name}
                        className="w-5 h-5 rounded-full mr-2 object-contain"
                      />
                      <span className="text-xs">{selected1.name}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`ml-2 w-8 h-8 text-[#233D63] dark:text-gray-200 transition-transform duration-200 ${
                          showDropdown1 ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 9l6 6 6-6"
                        />
                      </svg>
                    </div>

                    {/* Dropdown list */}
                    {showDropdown1 && !secondSectionActive && (
                      <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-darkOverlayBackground border dark:border-gray-600  border-gray-300 rounded-xl shadow-md z-10">
                        {tokenOptions.map((token) => (
                          <div
                            key={token.name}
                            className="px-2 py-2 flex items-center dark:hover:bg-gray-700 hover:bg-sky-100 cursor-pointer"
                            onClick={() => handleTokenChange(token.name)}
                          >
                            <img
                              src={token.icon}
                              alt={token.name}
                              className="w-5 h-5 rounded-full mr-2 object-contain"
                            />
                            <span className="text-xs">{token.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Max button below dropdown */}
                  <button
                    onClick={handleMaxClick}
                    className="text-xs px-4 mt-4 py-1 text-[#233D63] dark:text-gray-200 border border-gray-300  dark:border-gray-600 rounded-full hover:bg-gray-400 hover:text-white transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Second Section - Either as Optional Button or Active Input */}
              {!secondSectionActive ? (
                // Optional RDNT to dLP Section Button
                <div
                  className="border border-gray-300 border-dashed  dark:border-gray-600 rounded-xl p-4 text-center text-sm text-gray-400 flex flex-col items-center cursor-pointer  transition-colors"
                  onClick={toggleSecondSection}
                >
                  <div className="w-8 h-8 rounded-full  flex items-center justify-center mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[13px] ">
                    Add DFIN to Liquidity (optional)
                  </span>
                </div>
              ) : (
                // Active RDNT Input Section
                <div className="relative border border-gray-300 dark:border-gray-600 p-4 rounded-xl  flex items-center justify-between">
                  {/* Close Button */}
                  <div
                    className="absolute -top-3 -right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer dark:bg-[#1D1B40] hover:bg-gray-100"
                    onClick={toggleSecondSection}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Input */}
                  <div className="w-[80%] relative -mt-6">
                    <input
                      type="text"
                      placeholder="0.0"
                      value={amount2}
                      onChange={handleAmount2Change}
                      className="w-full text-gray-900 dark:text-gray-200 text-[11px] font-medium bg-transparent focus:outline-none pr-24"
                    />
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 darkmt-0.2 mb-1">
                      $
                      {usdValue2.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Fixed Token + Max */}
                  <div className="flex flex-col items-end gap-1  -mt-2">
                    <div className="">
                      <div className="flex items-center rounded-lg px-3 py-2 text-white ml-1">
                        <img
                          src={rdntToken.icon}
                          alt={rdntToken.name}
                          className="w-5 h-5 rounded-full mr-2 object-contain"
                        />
                        <span className="text-xs text-[#233D63] dark:text-gray-200">
                          {rdntToken.name}
                        </span>
                      </div>
                    </div>

                    {/* Max Button */}
                    <button
                      onClick={handleMaxClick2}
                      className="text-xs px-4 mt-1 py-1 text-[#233D63] dark:text-gray-200 border border-gray-300  dark:border-gray-600 rounded-full hover:bg-gray-400 hover:text-white transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slippage */}

            {/* Continue Button */}
            <div className="flex flex-col">
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleApprove}
                  disabled={clampedPercentage < 5 || isLoading || isApproved}
                  className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-lg py-2 px-1 shadow-md font-semibold text-[13px] flex justify-center items-center w-1/2 transition-opacity ${
                    clampedPercentage < 5 || isApproved
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isApproved ? "Approved" : "Approve"}
                </button>

                <button
                  onClick={handleAddLiquidity}
                  disabled={clampedPercentage < 5 || isLoading || !isApproved}
                  className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-lg py-2 px-1 shadow-md font-semibold text-[13px] flex justify-center items-center w-1/2 transition-opacity ${
                    clampedPercentage < 5 || !isApproved
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Add Liquidity
                </button>
              </div>

              {/* Border added with spacing */}
              <div className="mt-4 border-b border-gray-300 dark:border-gray-700"></div>
            </div>

            {/* Footer Info */}
            <div className="pt-4 text-[10px] md:text-xs text-[#233D63] dark:text-gray-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Total value of deposited assets
                </span>
                <span>${totalDeposit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Required locked LP value for emissions
                </span>
                <span>${0.05 * totalDeposit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Currently locked
                </span>
                <span>${activeValue}</span>
              </div>
            </div>
          </div>
        </div>
      )}
       {showPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
                <div className="relative w-[325px] lg1:w-[420px] max-h-[80vh] overflow-y-auto bg-white dark:bg-darkOverlayBackground text-[#2A1F9D] dark:text-darkText shadow-xl rounded-2xl p-4 font-poppins scrollbar-none">
                  <div className="flex items-center justify-between mb-4 border-gray-200 dark:border-gray-800 pb-1 mt-0.5">
                    <div className="w-8">{/* Empty div for spacing/balance */}</div>
                    <h2 className="text-[14px] font-semibold text-center flex-grow">
                      Select Lock Duration
                    </h2>
                    <button
                      className="text-gray-400 hover:text-gray-600 w-8"
                      onClick={handleClosePopup}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
      
                  <div className="p-3">
                    <div className="mb-3 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600 pb-5">
                      <p className="text-gray-600 dark:text-gray-200 text-[12px]">
                        LP Token Value
                      </p>
                      <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                        $701
                      </p>
                    </div>
      
                    <p className="text-[#233D63] dark:text-gray-200 text-gray-600 mb-5 text-[12px] mt-5">
                      Please choose your locking duration
                    </p>
      
                    <div className="mb-4 rounded-2xl shadow-md overflow-hidden ">
                      <div className="bg-[#5a55b1]  text-white p-4 font-semibold text-center text-[13px]">
                        Maximum multiplier
                      </div>
      
                      <div className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                        <div
                          className={`p-4 flex items-center hover:bg-purple-50 dark:hover:bg-darkOverlayBackground cursor-pointer transition-colors ${
                            selectedDuration === "12 months"
                              ? "bg-purple-50 dark:bg-[#1D1B40] dark:border-gray-800"
                              : "bg-white dark:bg-[#1D1B40] "
                          }`}
                          onClick={() => setSelectedDuration("12 months")}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                selectedDuration === "12 months"
                                  ? "border-purple-600 bg-[#4659CF] dark:bg-blue-300 "
                                  : "border-gray-300 dark:border-gray-500"
                              } flex items-center justify-center mr-2`}
                            >
                              {selectedDuration === "12 months" && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="font-medium text-[12px] dark:text-gray-200">
                              12 months
                            </span>
                          </div>
                          <span className="ml-auto text-green-600 dark:text-green-400 font-semibold text-[12px]">
                            91.3% APR
                          </span>
                        </div>
      
                        <div
                          className={`p-4 flex items-center hover:bg-purple-50 dark:hover:bg-darkOverlayBackground cursor-pointer transition-colors ${
                            selectedDuration === "6 months"
                              ? "bg-purple-50 dark:bg-[#1D1B40] dark:border-gray-800"
                              : "bg-white dark:bg-[#1D1B40] "
                          }`}
                          onClick={() => setSelectedDuration("6 months")}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                selectedDuration === "6 months"
                                  ? "border-purple-600 bg-[#4659CF] dark:bg-blue-300  "
                                  : "border-gray-300 dark:border-gray-500"
                              } flex items-center justify-center mr-2`}
                            >
                              {selectedDuration === "6 months" && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="font-medium text-[12px] dark:text-gray-200">
                              6 months
                            </span>
                          </div>
                          <span className="ml-auto text-[#4659CF] dark:text-blue-300 font-semibold text-[12px]">
                            36.52% APR
                          </span>
                        </div>
      
                        <div
                          className={`p-4 flex items-center hover:bg-purple-50 dark:hover:bg-darkOverlayBackground cursor-pointer transition-colors ${
                            selectedDuration === "3 months"
                              ? "bg-purple-50 dark:bg-[#1D1B40] dark:border-gray-800"
                              : "bg-white dark:bg-[#1D1B40] "
                          }`}
                          onClick={() => setSelectedDuration("3 months")}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                selectedDuration === "3 months"
                                  ? "border-purple-600 bg-[#4659CF] dark:bg-blue-300  "
                                  : "border-gray-300 dark:border-gray-500"
                              } flex items-center justify-center mr-2`}
                            >
                              {selectedDuration === "3 months" && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="font-medium text-[12px] dark:text-gray-200">
                              3 months
                            </span>
                          </div>
                          <span className="ml-auto text-green-600 dark:text-green-400 font-semibold text-[12px]">
                            14.61% APR
                          </span>
                        </div>
      
                        <div
                          className={`p-4 flex items-center hover:bg-purple-50 dark:hover:bg-darkOverlayBackground cursor-pointer transition-colors ${
                            selectedDuration === "1 month"
                              ? "bg-purple-50 dark:bg-[#1D1B40] dark:border-gray-800"
                              : "bg-white dark:bg-[#1D1B40] "
                          }`}
                          onClick={() => setSelectedDuration("1 month")}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                selectedDuration === "1 month"
                                  ? "border-purple-600 bg-[#4659CF] dark:bg-blue-300  "
                                  : "border-gray-300 dark:border-gray-500"
                              } flex items-center justify-center mr-2`}
                            >
                              {selectedDuration === "1 month" && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className="font-medium text-[12px] dark:text-gray-200">
                              1 month
                            </span>
                          </div>
                          <span className="ml-auto text-green-600 dark:text-green-400 font-semibold text-[12px]">
                            3.65% APR
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-[0.2px] my-6 mt-7 dark:border-gray-700 "></div>
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-600 dark:text-gray-400 text-[12px]">
                        APR after lock
                      </span>
                      <span className="font-medium dark:text-gray-200 text-[12px]">
                        36.52%
                      </span>
                    </div>
      
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600 dark:text-gray-400 text-[12px]">
                        Your new annual rewards
                      </span>
                      <span className="bg-gradient-to-r from-blue-500 via-blue-500 to-pink-500 to-orange-300 bg-clip-text text-transparent text-xl font-bold -mt-2">
                        $1.75
                      </span>
                    </div>
                    <button
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-lg py-2 px-1 shadow-md font-semibold text-[13px] flex justify-center items-center transition-opacity "
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
            {confirmPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="w-[325px] lg1:w-[420px] max-h-[80vh] overflow-y-auto bg-white dark:bg-darkOverlayBackground text-[#2A1F9D] dark:text-darkText shadow-xl rounded-2xl p-4 font-poppins scrollbar-none">
                  <div className="flex items-center justify-between mb-4 border-gray-200 dark:border-gray-800 pb-1 mt-0.5">
                    <div className="w-8">{/* Empty div for spacing/balance */}</div>
                    <h2 className="text-[14px] font-semibold text-center flex-grow">
                      Confirm Your Lock
                    </h2>
                    <button
                      className="text-gray-400 hover:text-gray-600 w-8"
                      onClick={handleConfirmPopup}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
      
                  <div className="flex flex-col items-center py-6">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-blue-500 to-pink-500 to-orange-300 bg-clip-text text-transparent">
                      $1.75
                    </h1>
                    <p className="text-gray-800 dark:text-gray-200 font-medium mt-1 text-[13px]">
                      Your new annual rewards
                    </p>
      
                    <div className="mt-2 px-3 py-1 bg-green-100 rounded-full flex items-center">
                      <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center mr-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="text-[12px] text-green-600">
                        Eligible for emissions
                      </span>
                    </div>
                  </div>
      
                  <div className="">
                    <div className="flex justify-between py-1  px-4">
                      <div className="text-gray-600 dark:text-gray-400 text-[12px]">
                        Total deposit value
                      </div>
                      <div className="font-medium text-[12px] text-gray-800 dark:text-gray-200 ">
                        $21.76
                      </div>
                    </div>
                  </div>
      
                  <div>
                    <div className="flex justify-between py-1  px-4">
                      <div className="text-gray-600 dark:text-gray-400 text-[12px]">
                        LP Token to be locked
                      </div>
                      <div className="font-medium text-[12px] text-gray-800 dark:text-gray-200 ">
                        $701
                      </div>
                    </div>
      
                    <div className="flex justify-between py-1 px-4">
                      <div className="text-gray-600 dark:text-gray-400 text-[12px]">
                        Lock duration
                      </div>
                      <div className="font-medium text-[12px] text-gray-800 dark:text-gray-200 ">
                        {selectedDuration}
                      </div>
                    </div>
                    <div className="flex justify-between py-1 px-4">
                      <div className="text-gray-600 dark:text-gray-400 text-[12px]">
                        APR{" "}
                      </div>
                      <div className="font-medium text-[12px] text-gray-800 dark:text-gray-200 ">
                        36.52%
                      </div>
                    </div>
                  </div>
      
                  <div className="p-4">
                    <button
                      onClick={handleLock}
                      className="w-full bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-lg py-2 px-1 mt-1 shadow-md font-semibold text-[13px] flex justify-center items-center transition-opacity "
                    >
                      Lock
                    </button>
                  </div>
                </div>
              </div>
            )}
            {successPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="w-[325px] lg1:w-[420px] max-h-[80vh] overflow-y-auto bg-white dark:bg-darkOverlayBackground text-[#2A1F9D] dark:text-darkText shadow-xl rounded-2xl p-4 font-poppins scrollbar-none">
                  <div className="p-3 flex items-center mb-5">
                    <button
                      onClick={handleLockPopup}
                      className="mr-2 text-[#2A1F9D] dark:text-darkText"
                    ></button>
                    <h2 className="flex-grow text-center  text-[#2A1F9D] dark:text-darkText font-bold text-[14px]">
                      Locked Successfully
                    </h2>
                    <button
                      onClick={handleLockPopup}
                      className="text-[#2A1F9D] dark:text-darkText"
                    >
                      <X size={18} />
                    </button>
                  </div>
      
                  <div className="w-full flex flex-col items-center -mt-6">
                    <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
                      <Check />
                    </div>
      
                    <p className=" text-[14px]   ">
                      You have Locked <strong>$701 Lp token</strong>
                    </p>
                    <p className="text-[14px]   text-center mb-5 mt-4">
                      You will receive{" "}
                      <p className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-blue-500 to-pink-500 to-orange-300 bg-clip-text text-transparent mt-4">
                        $1.75
                      </p>
                    </p>
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
