import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Info, ArrowLeft, X, Check } from "lucide-react";
import MobileTopNav from "../Home/MobileTopNav";
import { useAuth } from "../../utils/useAuthClient";
import { setUserData } from "../../redux/reducers/userReducer";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import Button from "../Common/Button";
import { useRef } from "react";
import { joyRideTrigger } from "../../redux/reducers/joyRideReducer";
import { FaWallet } from "react-icons/fa";
import loader from "../../../public/Helpers/loader.svg";
import { toggleTheme } from "../../redux/reducers/themeReducer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CloseIcon from "../Home/CloseIcon";
import MenuIcon from "../Home/MenuIcon";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import dfin from "../../../public/Helpers/Dfinance Coin 2D.svg";
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../../utils/constants";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import ThemeToggle from "../Common/ThemeToggle";
import settingsIcon from "../../../public/Helpers/Settings(1).svg";
import Popup from "../Dashboard/DashboardPopup/Morepopup";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import { toggleTestnetMode } from "../../redux/reducers/testnetReducer";
import icplogo from "../../../public/wallet/icp.png";
import { IoIosRocket } from "react-icons/io";
import DFinance from "../../../public/home/favicon.png";
import { toggleSound } from "../../redux/reducers/soundReducer";
import ZapIntoDlpContent from "../Dashboard/DashboardPopup/LP tokenPopup/addLiquidity";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
/**
 * Navbar Component
 *
 * The Navbar provides navigation links, wallet connection options,
 * testnet mode toggle, dark mode switch, and account-related actions.
 *
 * @param {boolean} isHomeNav - Determines if the navbar is in home mode or dashboard mode.
 * @returns {JSX.Element} - Navbar component.
 */

export default function Navbar({ isHomeNav }) {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const navigate = useNavigate();
  const location = useLocation();
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const theme = useSelector((state) => state.theme.theme);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : theme === "dark";
  });
  const isMobile = window.innerWidth <= 1115;
  const isMobile2 = window.innerWidth <= 640;
  const renderThemeToggle = !isMobile;
  const dispatch = useDispatch();
  const { isWalletModalOpen } = useSelector((state) => state.utility);

  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);
  const previousIsTestnetMode = useRef(isTestnetMode);
  const { isAuthenticated, login, logout, principal } = useAuth();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [switchTokenDrop, setSwitchTokenDrop] = useState(false);
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const [showTestnetPopup, setShowTestnetPopup] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth <= 760);

  const [showPopup, setShowPopup] = useState(false);
  const [confirmPopup, setShowConfirmPopup] = useState(false);
  const [successPopup, setSuccesPopup] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("6 months");

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();
  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const handleNavigate = () => {
    navigate("/pointsystem");
  };
  const hash = window.location.hash;

  const handleSoundToggle = () => {
    dispatch(toggleSound());
  };

  const handleTour = () => {
    dispatch(joyRideTrigger());
    navigate("/dashboard");
  };

  const handleCloseDropdownOnScroll = () => {
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
  };

  const handleCreateInternetIdentity = () => {
    login();
  };

  const handleLogout = () => {
    dispatch(setUserData(null));
    logout();
  };

  const handleButtonClick = () => {
    setDropdownVisible(false);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
  };

  const handleSwitchWallet = () => {
    setSwitchWalletDrop(!switchWalletDrop);
    setSwitchTokenDrop(false);
    setDropdownVisible(false);
  };

  const handleClickAway = () => {
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
  };

  const copyToClipboard = () => {
    if (principal) {
      navigator.clipboard
        .writeText(principal)
        .then(() => {
          toast.dismiss();
          toast.success(`Principal copied to clipboard`, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        })
        .catch((err) => {
          toast.error(`Failed to copy: ` + err, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        });
    }
  };

  const handleLaunchApp = () => {
    navigate("/dashboard");
  };

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const handleTestnetModeToggle = () => {
    const url = `https://bn2g3-lqaaa-aaaaj-azykq-cai.icp0.io/dashboard?openWallet=true`;
    // dispatch(toggleTestnetMode());

    window.location.replace(url);
  };

  const handleDropdownToggle = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  const handlePopupToggle = () => {
    setSwitchWalletDrop(false);
    setSwitchTokenDrop(false);
    setDropdownVisible(false);
  };

  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  const switchWallet = () => {
    dispatch(setWalletModalOpen({ isOpen: true, isSwitching: true }));
  };

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo(0, 0);
    } else {
      navigate("/dashboard");
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
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
    // Get the value from the input field
    let value = e.target.value;
    
    // Check if the input contains more than 6 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 6) {
        // Limit to 6 decimal places
        value = `${parts[0]}.${parts[1].substring(0, 6)}`;
      }
    }
    
    // Calculate USD value
    const usd = parseFloat(value || 0) * selected1.price;
    
    // Check if the USD value exceeds total deposit
    if (usd > totalDeposit) {
      // Recalculate the token amount to match max USD value
      value = (totalDeposit / selected1.price).toFixed(6);
      setAmount1(value);
      setUsdValue1(totalDeposit);
    } else {
      // Update state with valid values
      setAmount1(value);
      setUsdValue1(usd);
    }
    
    // Handle second token if second section is active
    if (secondSectionActive && usd && rdntToken?.price) {
      const newAmount2 = (Math.min(usd, totalDeposit) / rdntToken.price).toFixed(6);
      setAmount2(newAmount2);
      setUsdValue2(Math.min(usd, totalDeposit)); // keep them in sync, respecting the limit
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
    // Get the value from the input field
    let value = e.target.value;
    
    // Check if the input contains more than 5 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 5) {
        // Limit to 5 decimal places
        value = `${parts[0]}.${parts[1].substring(0, 5)}`;
      }
    }
    
    // Update RDNT amount
    setAmount2(value);
    
    const rate = 200; // USD value per 1 RDNT
    const usd = parseFloat(value || 0) * rate;
    
    // Check if the USD value exceeds total deposit
    if (usd > totalDeposit) {
      // Recalculate the RDNT amount to match max USD value
      const adjustedValue = (totalDeposit / rate).toFixed(5);
      setAmount2(adjustedValue);
      setUsdValue2(totalDeposit);
      
      // Sync first token with the limited amount
      if (selected1?.price) {
        const newAmount1 = (totalDeposit / selected1.price).toFixed(5);
        setAmount1(newAmount1);
        setUsdValue1(totalDeposit);
      }
    } else {
      // Update states with valid values
      setUsdValue2(usd);
      
      // Convert USD to selected token's amount
      if (usd && selected1?.price) {
        const newAmount1 = (usd / selected1.price).toFixed(5);
        setAmount1(newAmount1);
        setUsdValue1(usd); // keep the USD value synced
      } else {
        setAmount1("");
        setUsdValue1(0);
      }
    }
  };

  const [isLoading, setIsLoading] = useState(false);
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
  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    window.addEventListener("scroll", handleCloseDropdownOnScroll);
    return () => {
      window.removeEventListener("scroll", handleCloseDropdownOnScroll);
    };
  }, []);

  useEffect(() => {
    setSwitchWalletDrop(false);
    setSwitchTokenDrop(false);
    setDropdownVisible(false);
  }, [location]);

  useEffect(() => {
    if (isAuthenticated === true) {
      dispatch(
        setUserData({
          name: generateRandomUsername(),
          isAuth: isAuthenticated,
          principal,
          imageUrl:
            "https://res.cloudinary.com/dzfc0ty7q/image/upload/v1714272826/avatars/Web3_Avatar-36_xouxfd.svg",
        })
      );
    } else {
      dispatch(setUserData(null));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (previousIsTestnetMode.current !== isTestnetMode) {
      if (previousIsTestnetMode.current !== undefined) {
        toast.dismiss();
      }
      toast.success(
        `Testnet mode ${isTestnetMode ? "enabled" : "disabled"} successfully!`,
        {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
        }
      );
      previousIsTestnetMode.current = isTestnetMode;
    }
  }, [isTestnetMode]);

  useEffect(() => {
    if (hash) {
      const ele = document.querySelector(hash);
      if (ele) {
        ele.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === "dark") {
      htmlElement.classList.add("dark");
      bodyElement.classList.add("dark");
      bodyElement.style.backgroundColor = "#070a18";
      setIsDarkMode(true);
    } else {
      htmlElement.classList.remove("dark");
      bodyElement.classList.remove("dark");
      bodyElement.style.backgroundColor = "";
      setIsDarkMode(false);
    }
  }, [theme, isDarkMode]);
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
  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div className="w-full">
          <nav className="w-full py-4 md:py-5 dxl:py-9 flex items-center justify-between">
            <div className="flex justify-center items-center ">
              <div className="flex items-center gap-3 justify-center">
                <img
                  src={DFinance}
                  alt="DFinance"
                  onClick={handleLogoClick}
                  className="w-[40px] md:w-[40px] lg:w-[40px] sxs3:w-[40px] cursor-pointer"
                />
                <h1
                  className="dark:text-darkText text-[#4137A8] font-semibold text-[1.4rem] md:text-[2rem] cursor-pointer"
                  onClick={handleLogoClick}
                >
                  DFinance
                </h1>
              </div>
            </div>
            {!isMobile && (
              <>
                <div className="gap-6 hidden  lg:flex lg:ps-10 dark:text-darkText justify-beteen items-center">
                  {!isHomeNav
                    ? DASHBOARD_TOP_NAV_LINK.map((link, index) => {
                        if (link.alwaysPresent) {
                          return (
                            <NavLink
                              key={index}
                              to={link.route}
                              className="text-[#2A1F9D]  ps-20 px-6 py-2 text-lg nav-link dark:text-darkTextSecondary anchor-transition"
                            >
                              {link.title}
                            </NavLink>
                          );
                        } else if (
                          !isTestnetMode &&
                          !link.testnet &&
                          link.title !== "Faq"
                        ) {
                          return (
                            <NavLink
                              key={index}
                              to={link.route}
                              className="text-[#2A1F9D] px-5 py-2 text-lg nav-link dark:text-darkTextSecondary"
                            >
                              {link.title}
                            </NavLink>
                          );
                        }
                        return null;
                      })
                    : HOME_TOP_NAV_LINK.map((link, index) => (
                        <NavLink
                          key={index}
                          target={link.target}
                          to={link.route}
                          className="text-[#2A1F9D] px-3 py-2 text-lg nav-link dark:text-darkTextSecondary"
                        >
                          {link.title}
                        </NavLink>
                      ))}
                </div>
              </>
            )}

            {isHomeNav ? (
              <div className="flex gap-2">
                <div className="text-nowrap">
                  {isMobile2 ? (
                    <div
                      className="w-10 h-10 border-b-[0.3px] border-gray-400 dark:border-gray-600 bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/90 dark:to-[#81198E]/90 flex items-center justify-center rounded-lg shadow-[#00000040] shadow-sm cursor-pointer mr-1 button1"
                      onClick={handleLaunchApp}
                    >
                      <IoIosRocket color="white" size={28} />
                    </div>
                  ) : (
                    <Button
                      title="Launch App"
                      onClickHandler={handleLaunchApp}
                    />
                  )}
                </div>

                <div className="flex align-center justify-center">
                  {renderThemeToggle && <ThemeToggle />}
                </div>

                {isMobile && (
                  <div className="flex justify-center align-center items-center">
                    <div
                      onClick={() => setIsMobileNav(!isMobileNav)}
                      className="cursor-pointer"
                    >
                      {isMobileNav ? <CloseIcon /> : <MenuIcon />} {}
                    </div>
                  </div>
                )}
              </div>
            ) : isAuthenticated ? (
              <div className="hidden lg:flex gap-2 sxs3:flex md:flex select-none items-center h-[60px]">
                <div className="flex items-center gap-1 my-2 bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white shadow-[#00000040] text-sm cursor-pointer relative rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20">
                  {!isMobile2 && (
                    <div
                      className="flex items-center lg:gap-1 py-[9px] px-3 overflow-hidden button1"
                      onClick={handleSwitchWallet}
                    >
                      <img
                        src={loader}
                        alt="square"
                        className="object-contain w-5 h-5 -mr-[3px]"
                      />

                      <span className="sxxs:text-[10px] lg:text-[10px] lg1:text-[12px] font-bold ml-1">
                        {truncateString(principal, 6)}
                      </span>
                    </div>
                  )}

                  {switchWalletDrop && (
                    <>
                      <div
                        className="fixed inset-0 bg-black opacity-40 z-50"
                        onClick={() => setSwitchWalletDrop(false)}
                        style={{ pointerEvents: "none" }}
                      ></div>
                      <div
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg1:absolute lg1:top-[160px] lg1:-left-[60px] lg1:transform lg1:-translate-x-1/2 lg1:mt-2 min-w-[300px] md:px-5 md:py-6 px-5 py-6 rounded-xl bg-white mb-4 z-50 dark:bg-darkOverlayBackground dark:border-none"
                        onClick={(e) => e.stopPropagation()}
                        style={{ pointerEvents: "auto" }}
                      >
                        <div className="w-full flex items-center gap-2">
                          <img src={loader} alt="square" className="w-8 h-8" />
                          <h1 className="font-bold md:text-xl text-[17px] text-blue-800 dark:text-darkText">
                            {truncateString(principal, 20)}
                          </h1>
                        </div>
                        <div className="flex flex-col-reverse   lg:block">
                          <div className="w-full flex flex-col lg1:flex-row justify-center mt-3  gap-3">
                            <Button
                              title="Switch Wallet"
                              className=" z-20 py-2 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2"
                              onClickHandler={switchWallet}
                            />
                            <Button
                              title="Disconnect"
                              className="bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100%  dark:text-darkText dark:bg-[#BA5858] border-b-3 dark:border-darkBackground rounded-lg py-2 px-9 shadow-lg text-sm font-light"
                              onClickHandler={handleLogout}
                            />
                          </div>

                          <div className="flex flex-col lg1:flex-row mt-3 gap-3 ">
                            {}
                            <div className="hidden lg1:flex justify-center">
                              <div
                                className="flex-1 flex flex-col items-center gap-[7px] justify-center place-items-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col"
                                style={{ height: "70px", width: "160px" }}
                              >
                                <span
                                  className="  text-blue-800 dark:text-darkTextSecondary"
                                  style={{ right: "55%" }}
                                >
                                  Network
                                </span>
                                <div className="flex items-center gap-1">
                                  <img
                                    src={icplogo}
                                    alt="Icp Logo"
                                    className="w-6 h-6"
                                  />
                                  <span className="ml-2 text-base font-bold text-blue-800 dark:text-darkText">
                                    ICP
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="lg1:hidden lg:flex justify-center">
                              <div className="flex-1 flex flex-col  justify-center border border-gray-200 p-3 rounded-xl text-sm  dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col">
                                <div className="flex gap-5">
                                  <div className="flex items-center justify-center">
                                    <p className="text-blue-800 dark:text-darkText">
                                      Network
                                    </p>
                                  </div>

                                  <div className="flex items-center ml-auto">
                                    <img
                                      src={icplogo}
                                      alt="Icp Logo"
                                      className="w-6 h-6"
                                    />
                                    <span className="ml-2 text-base font-bold text-blue-800 dark:text-darkText">
                                      ICP
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {}
                            <div className=" w-full flex justify-center">
                              <div
                                className=" flex-1 flex flex-col lg1:items-center justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground"
                                style={{ height: "70px", width: "160px" }}
                              >
                                <button
                                  className="text-blue-800 hover:text-gray-800 flex items-center -ml-4 dark:text-darkTextSecondary button1"
                                  onClick={copyToClipboard}
                                >
                                  <GrCopy className="h-5 w-4 ml-4 lg1:ml-6" />
                                  <span className="ml-1">Copy principal</span>
                                </button>
                                <button
                                  className="text-blue-800 hover:text-gray-800 flex items-center mt-2 dark:text-darkTextSeconday button1"
                                  onClick={() =>
                                    (window.location.href = "/faucet")
                                  }
                                >
                                  <CiShare1 className="h-5 -ml-[1px] w-[18px] dark:text-darkText" />
                                  <span className="ml-1 text-nowrap dark:text-darkTextSecondary">
                                    Faucet Asset
                                  </span>
                                </button>
                              </div>
                            </div>{" "}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {!isMobile && (
                      <img
                        src={settingsIcon}
                        alt="settings_icon"
                        className="object-contain w-[40px] h-[40px] cursor-pointer sxs3:hidden md:block lg:block ml-1 button1"
                        onClick={handleDropdownToggle}
                      />
                    )}
                    {dropdownVisible && (
                      <>
                        <div
                          className="fixed inset-0 bg-black bg-opacity-50 z-50"
                          onClick={() => setDropdownVisible(false)}
                        ></div>
                        <div
                          className="absolute w-[280px] top-[55px] right-0 mt-2 p-3 bg-[#ffffff] text-[#2A1F9D] border-gray-300 rounded-xl shadow-md z-50 dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h2 className="text-[12px] text-[#2A1F9D] font-light mb-5 dark:text-darkText ml-2">
                            Settings
                          </h2>

                          {}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex flex-row items-center justify-around">
                              <label
                                htmlFor="darkMode"
                                className="ml-2 text-lg font-semibold text-[#2A1F9D] dark:text-darkText"
                              >
                                Dark Mode
                              </label>
                            </div>
                            <div className="flex items-center justify-center ml-3 place-content-center -mr-4">
                              <span className="text-[13px] mr-2">
                                {isDarkMode ? "ON" : "OFF"}
                              </span>
                              <CustomizedSwitches
                                checked={isDarkMode}
                                onChange={handleDarkModeToggle}
                              />
                            </div>
                          </div>

                          {}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <label
                                htmlFor="testnetMode"
                                className="ml-2 text-lg font-semibold text-[#2A1F9D] dark:text-darkText"
                              >
                                Testnet Mode
                              </label>
                            </div>
                            <div className="flex items-center justify-center ml-3 place-content-center -mr-4">
                              <span className="text-[13px] mr-2">
                                {isTestnetMode ? "ON" : "OFF"}
                              </span>
                              <CustomizedSwitches
                                checked={isTestnetMode}
                                onChange={handleTestnetModeToggle}
                              />
                            </div>
                          </div>

                          {}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex flex-row items-center justify-around relative group">
                              <label
                                htmlFor="soundMode"
                                className="ml-2 text-lg font-semibold text-[#2A1F9D] dark:text-darkText flex items-center"
                              >
                                Sound
                                <Info
                                  size={16}
                                  className="ml-2 cursor-pointer"
                                />
                              </label>

                              {}
                              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-2 shadow-lg border border-gray-300 w-[15vw] ">
                                Enabling this will allow the user to hear sound
                                when supply, borrow, repay, or withdraw actions
                                are performed.
                              </div>
                            </div>

                            <div className="flex items-center justify-center ml-3 place-content-center -mr-4">
                              <span className="text-[13px] mr-2">
                                {isSoundOn ? "ON" : "OFF"}
                              </span>
                              <CustomizedSwitches
                                checked={isSoundOn}
                                onChange={handleSoundToggle}
                              />
                            </div>
                          </div>
                          <div className="flex align-center justify-center w-[93%] border-t-2 dark:border-gray-300/20 border-gray-500/25 mx-auto my-4 mb-5"></div>
                          <div className="flex w-full align-center justify-center mb-2">
                            <button
                              type="button"
                              className="w-[95%] bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg p-[9px] px-8 shadow-sm shadow-[#00000040] font-medium text-[12px] h-auto z-10 opacity-100"
                              onClick={handleTour}
                            >
                              Start Guide Tour
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isMobile && (
                  <div className="flex justify-center align-center items-center">
                    <div
                      onClick={() => setIsMobileNav(!isMobileNav)}
                      className="cursor-pointer"
                    >
                      {isMobileNav ? <CloseIcon /> : <MenuIcon />} {}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  className="broder-b-[1px] bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-xl p-[11px] md:px-7 shadow-sm shadow-[#00000040] font-medium text-sm sxs3:px-4 sxs1:text-[11px] md:text-[14px] flex items-center justify-center"
                  onClick={handleWalletConnect}
                >
                  <div className="flex items-center justify-center">
                    <p className="hidden md:flex">Connect Wallet</p>
                    <div>
                      <FaWallet size={17} className="ml-0 md:hidden" />
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {!isMobile ? (
                      <img
                        src={settingsIcon}
                        alt="settings_icon"
                        className="object-contain w-[40px] h-[40px] cursor-pointer sxs3:hidden md:block lg:block ml-1 button1"
                        onClick={handleDropdownToggle}
                      />
                    ) : (
                      <div className="flex justify-center align-center items-center ml-1">
                        <div
                          onClick={() => setIsMobileNav(!isMobileNav)}
                          className="cursor-pointer"
                        >
                          {isMobileNav ? <CloseIcon /> : <MenuIcon />} {}
                        </div>
                      </div>
                    )}
                    {dropdownVisible && (
                      <div className="absolute w-[280px] top-[80px] right-0 mt-2 p-3 bg-[#ffffff] text-[#2A1F9D] border-gray-300 rounded-xl shadow-md z-50 dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none">
                        <h2 className="text-[12px] text-[#2A1F9D] font-light mb-5 dark:text-darkText ml-2">
                          Settings
                        </h2>

                        {}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex flex-row items-center justify-around">
                            <label
                              htmlFor="darkMode"
                              className="ml-2 text-lg font-semibold text-[#2A1F9D] dark:text-darkText"
                            >
                              Dark Mode
                            </label>
                          </div>
                          <div className="flex items-center justify-center ml-3 place-content-center -mr-4">
                            <span className="text-[13px] mr-2">
                              {isDarkMode ? "ON" : "OFF"}
                            </span>
                            <CustomizedSwitches
                              checked={isDarkMode}
                              onChange={handleDarkModeToggle}
                            />
                          </div>
                        </div>

                        {}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <label
                              htmlFor="testnetMode"
                              className="ml-2 text-lg font-semibold text-[#2A1F9D] dark:text-darkText"
                            >
                              Testnet Mode
                            </label>
                          </div>
                          <div className="flex items-center justify-center ml-3 place-content-center -mr-4">
                            <span className="text-[13px] mr-2">
                              {isTestnetMode ? "ON" : "OFF"}
                            </span>
                            <CustomizedSwitches
                              checked={isTestnetMode}
                              onChange={handleTestnetModeToggle}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </ClickAwayListener>
      {console.log("isDashboardRoute", isDashboardRoute)}
      {!isDashboardRoute && (
        <div
          className="relative w-full rounded-3xl px-6 py-4 mb-4 shadow-lg
        bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-slate-800
        dark:bg-gradient-to-r dark:from-blue-950/80 dark:via-blue-900/30 dark:to-teal-900/20 dark:text-white
        border-2 border-[#4659CF]/60 dark:border-teal-800 ring-1 overflow-hidden"
        >
          {/* Top border - left to right */}
          <div className="absolute top-0 left-0 h-0.5 w-1/6 bg-gradient-to-r from-transparent via-purple-600 to-transparent dark:bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-slide-right" />

          {/* Bottom border - right to left */}
          <div className="absolute bottom-0 right-0 h-0.5 w-1/6 bg-gradient-to-l from-transparent via-purple-600 to-transparent dark:bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-slide-left" />

          {/* Left border - bottom to top */}
          <div className="absolute left-0 bottom-0 w-0.5 h-1/2 bg-gradient-to-t from-transparent via-purple-600 to-transparent dark:bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-slide-up-left" />

          {/* Right border - top to bottom */}
          <div className="absolute right-0 top-0 w-0.5 h-1/2 bg-gradient-to-b from-transparent via-purple-600 to-transparent dark:bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-slide-down" />

          {/* Top row with title and APR info - flex column on mobile, row on larger screens */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-0.5">
            <h2 className="text-[15px]  text-[#12315c] dark:text-darkText md:text-lg lg:text-xl font-medium max-w-xl mb-1 lg:mb-0">
              Unleash the full power of Dfinance with locked LP
            </h2>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col">
            <p className="text-[#233D63] dark:text-gray-200 text-xs font-light md:text-sm mb-5 md:mb-4">
              Earn Dfinance Token on your Locked LP.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3 mt-2 mb-1">
                <button
                  onClick={openModal}
                  className="flex items-center bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90%
                text-white rounded-lg px-3 py-2 shadow-[#00000040]
                  font-medium text-xs"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1.5"
                  >
                    <path
                      d="M13 10V3L4 14H11V21L20 10H13Z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Liquidity
                </button>
                <button
                  className="flex items-center bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90%
                   text-white rounded-lg px-3 py-2 shadow-[#00000040]
                   font-medium text-xs"
                >
                  <span>Learn more</span>
                  <ArrowRight className="ml-1 h-3 w-3 md:h-3.5 md:w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-2 -mb-1">
                <button
                  className="bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-xl p-[11px] md:px-7 shadow-sm shadow-[#00000040] font-medium text-sm sxs3:px-4 sxs1:text-[11px] md:text-[14px] flex items-center justify-center"
                  onClick={handleWalletConnect}
                >
                  <div className="flex items-center justify-center">
                    <p className="hidden md:flex">Connect Wallet</p>
                    <div>
                      <FaWallet size={17} className="ml-0 md:hidden" />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Custom animation styles */}
          <style jsx>{`
            @keyframes slide-right {
              0% {
                left: -25%;
              }
              100% {
                left: 100%;
              }
            }
            .animate-slide-right {
              animation: slide-right 6s ease-in-out infinite;
            }

            @keyframes slide-left {
              0% {
                right: -25%;
              }
              100% {
                right: 100%;
              }
            }
            .animate-slide-left {
              animation: slide-left 6s ease-in-out infinite;
            }

            @keyframes slide-down {
              0% {
                top: -25%;
              }
              100% {
                top: 100%;
              }
            }
            .animate-slide-down {
              animation: slide-down 6s ease-in-out infinite;
            }

            @keyframes slide-up-left {
              0% {
                bottom: -25%;
              }
              100% {
                bottom: 100%;
              }
            }
            .animate-slide-up-left {
              animation: slide-up-left 6s ease-in-out infinite;
            }
          `}</style>
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
      <MobileTopNav
        isMobileNav={isMobileNav}
        setIsMobileNav={setIsMobileNav}
        isHomeNav={isHomeNav}
        handleCreateInternetIdentity={handleCreateInternetIdentity}
        handleLogout={handleLogout}
      />
    </>
  );
}
