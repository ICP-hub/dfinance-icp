import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import MobileTopNav from "../Home/MobileTopNav";
import { useAuth } from "../../utils/useAuthClient";
import { setUserData } from "../../redux/reducers/userReducer";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import Button from "../Common/button";
import { useRef } from "react";
import { joyRideTrigger } from "../../redux/reducers/joyRideReducer";
import { FaWallet } from "react-icons/fa";
import loader from "../../../public/helper/loader.svg";
import { toggleTheme } from "../../redux/reducers/themeReducer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CloseIcon from "../Home/CloseIcon";
import MenuIcon from "../Home/MenuIcon";
import TestnetModePopup from "../Dashboard/DashboardPopup/Testnetmode";
import coinSound from "../../../public/sound/caching_duck_habbo.mp3";

import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../../utils/constants";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import ThemeToggle from "../Common/themeToggle";
import settingsIcon from "../../../public/helper/settings.svg";
import Popup from "../Dashboard/DashboardPopup/Morepopup";
import CustomizedSwitches from "../Common/materialUISwitch";
import icplogo from "../../../public/wallet/icp.png";
import { IoIosRocket } from "react-icons/io";
import DFinance from "../../../public/home/favicon.png";
import { toggleSound } from "../../redux/reducers/soundReducer";

import useAssetData from "../customHooks/useAssets";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import { Principal } from "@dfinity/principal";
import useFunctionBlockStatus from "../customHooks/useFunctionBlockStatus";
import { toggleDashboardRefresh } from "../../redux/reducers/dashboardDataUpdateReducer";

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
  const { isBlocked } = useFunctionBlockStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const theme = useSelector((state) => state.theme.theme);
  const { assets, AssetImages } = useAssetData();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : theme === "dark";
  });
  const isMobile = window.innerWidth <= 1115;
  const isMobile2 = window.innerWidth <= 640;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth <= 760);
  const renderThemeToggle = !isMobile;
  const dispatch = useDispatch();
  const { isWalletModalOpen } = useSelector((state) => state.utility);
  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);
  const previousIsTestnetMode = useRef(isTestnetMode);
  const { isAuthenticated, login, logout, principal, accountIdString } =
    useAuth();
  const [asset, setAsset] = useState("ICP");
  const [amount, setAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isButtonDisabled = false;
  const isProduction = process.env.DFX_PRODUCTION === "true";

  const {
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const toggleRefresh = useSelector(
    (state) => state.faucetUpdate.refreshTrigger
  );
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const [showTestnetPopup, setShowTestnetPopup] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTransferDropdownOpen, setIsTransferDropDownOpen] = useState(false);
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState("");
  const popupPosition = { top: 0, left: 0 };

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  // Function to handle the click event on the "Transfer" button
  const toggleDropdown = () => {
    setIsTransferDropDownOpen(!isTransferDropdownOpen);
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
  };

  // Function to handle the click event on the "Deposit" button
  const toggleDepositDropdown = () => {
    setShowDepositPopup(!showDepositPopup);
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
  };

  const hash = window.location.hash;
  const ledgerActors = useSelector((state) => state.ledger);

  // Function to handle the click event on the "sound" toggle button
  const handleSoundToggle = () => {
    dispatch(toggleSound());
  };
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleTransfer();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };
  //error messages
  const errorMessages = {
    NoReserveDataFound:
      "The reserve data for the selected asset could not be found. Please check the asset or try again later.",
    FailedToUpdatePrice:
      "Failed to update the reserve prices. Please try again later.",
    ValidationError:
      "The supply validation failed. Ensure your inputs are correct.",
    InterestRateUpdateFailed:
      "Unable to update interest rates. Please retry the operation.",
    ErrorMintTokens:
      "Minting of tokens failed. Your account state has been rolled back. Try again later.",
    Default: "An unexpected error occurred. Please try again later.",
  };

  // asset balances for retrieving the walet balance
  const assetBalances = {
    ICP: ckICPBalance,
    ckETH: ckETHBalance,
    ckUSDT: ckUSDTBalance,
    ckBTC: ckBTCBalance,
    ckUSDC: ckUSDCBalance,
  };
  const supplyBalance = assetBalances[asset] || 0;

  // Function to handle the click event on the "Approve" button
  const handleApprove = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

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
      ledgerActor = ledgerActors.ckUSDT;
    }
    let amountAsNat64 = Math.round(amount.replace(/,/g, "") * Math.pow(10, 8));
    const scaledAmount = amountAsNat64;

    try {
      await ledgerActor.icrc2_approve({
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: scaledAmount,
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
          subaccount: [],
        },
      });
      setIsApproved(true);
      toast.success(`Approval successful!`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
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
  };

  // Function to handle the transfer action
  const handleTransfer = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
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
        ledgerActor = ledgerActors.ckUSDT;
      }

      let amountAsNat64 = Math.round(
        amount.replace(/,/g, "") * Math.pow(10, 8)
      );
      const scaledAmount = amountAsNat64;

      const transferFromArgs = {
        from: {
          owner: Principal.fromText(principal),
          subaccount: [],
        },
        to: {
          owner: Principal.fromText(receiverAddress),
          subaccount: [],
        },
        amount: scaledAmount,
        fee: [0],
        memo: [],
        created_at_time: [],
        spender_subaccount: [],
      };

      const response = await ledgerActor.icrc2_transfer_from(transferFromArgs);
      dispatch(toggleDashboardRefresh());

      if ("Ok" in response) {
        setIsTransferDropDownOpen(false);

        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }

        toast.success(`Transfer successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if ("Err" in response) {
        handleTransferError(response.Err);
      }
    } catch (error) {
      handleTransferException(error);
    }
  };

  // Helper functions for error handling
  const handleTransferError = (errorKey) => {
    const errorMsg = errorKey?.toString() || "An unexpected error occurred";
    console.error("Error:", errorKey);

    if (typeof errorKey === "object" && "BLOCKEDFORONEHOUR" in errorKey) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setIsTransferDropDownOpen(false);
      setIsLoading(false);
    } else if (errorMsg.toLowerCase().includes("panic")) {
      setShowPanicPopup(true);
      setIsVisible(false);
    } else if (
      errorMsg.toLowerCase().includes("out of cycles") ||
      errorMsg.includes("Reject text: Canister")
    ) {
      toast.error("Canister is out of cycles. Admin has been notified.", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else if (errorMsg.toLowerCase().includes("SupplyCapExceeded")) {
      toast.error("Supply cap is exceeded.", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else if (errorMsg.toLowerCase().includes("unauthorized access")) {
      toast.error(
        "Unauthorized access. Only platform or controllers can perform this action.",
        {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
    } else {
      const userFriendlyMessage =
        errorMessages[errorKey] || errorMessages.Default;
      toast.error(`Supply failed: ${userFriendlyMessage}`, {
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
  };

  // Function to handle transfer exceptions
  const handleTransferException = (error) => {
    const message = error.message || "transfer action failed!";
    console.error(`Error: ${message}`);
    const msgLower = message.toLowerCase();

    if (msgLower.includes("panic")) {
      setShowPanicPopup(true);
      setIsVisible(false);
    } else if (msgLower.includes("invalid character")) {
      toast.error("Invalid principal ID format ", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else if (
      msgLower.includes("out of cycles") ||
      message.includes("Reject text: Canister")
    ) {
      toast.error("Canister is out of cycles. Admin has been notified.", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else {
      toast.error(`Error: ${message}`, {
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
  };

  //funtion for handle amount change
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  // Function to handle the click event on the "Max" button
  const handleMaxClick = () => {
    setAmount(supplyBalance.toString());
  };

  // Function to handle the click event on the "Tour" button
  const handleTour = () => {
    dispatch(joyRideTrigger());
    navigate("/dashboard");
  };

  // Function to handle the click event on the "Settings" button
  const handleCloseDropdownOnScroll = () => {
    setSwitchWalletDrop(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
  };

  const handleCreateInternetIdentity = () => {
    login();
  };

  // Function to handle the click event on the "Logout" button
  const handleLogout = () => {
    dispatch(setUserData(null));
    logout();
  };

  // Function to handle the click event on the "Testnet Mode" button
  const handleButtonClick = () => {
    setShowTestnetPopup(true);
    setDropdownVisible(false);
    setSwitchWalletDrop(false);

    setIsPopupVisible(false);
  };

  const handleClosePopup = () => {
    setShowTestnetPopup(false);
  };

  // Function to handle the click event on the "Switch Wallet" button
  const handleSwitchWallet = () => {
    setSwitchWalletDrop(!switchWalletDrop);
    setDropdownVisible(false);
    setIsPopupVisible(false);
    setShowTestnetPopup(false);
  };

  //function to click outside the dropdown
  const handleClickAway = () => {
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
    setIsPopupVisible(false);
    setShowTestnetPopup(false);
    setShowDepositPopup(false);
    setIsTransferDropDownOpen(false);
  };

  // Function to handle the click event on the "Copy" button
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

  // Function to handle the click event on the "Launch app" button
  const handleLaunchApp = () => {
    navigate("/dashboard");
  };

  // Function to handle the click event on the "Wallet Connect" button
  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  // Function to handle the click event on the "TestnetMode" button
  const handleTestnetModeToggle = () => {
    if (!isProduction) {
      const url = `https://cszmy-vyaaa-aaaak-quhea-cai.icp0.io/dashboard/?openWallet=true`;
      console.log("Redirecting to:", url);
      window.location.replace(url);
    } else {
      console.log("Production mode — redirection blocked.");
    }
  };

  // Function to handle the dropdown to open
  const handleDropdownToggle = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  // Function to handle the click event on the "More" button
  const handlePopupToggle = () => {
    setIsPopupVisible((prevVisible) => !prevVisible);
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
  };

  // Function to handle the click event on the "Settings" button
  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

  //Function to truncate the string
  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  const switchWallet = () => {
    dispatch(setWalletModalOpen({ isOpen: true, isSwitching: true }));
  };

  // Function to handle the click event on the "Logo" button
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

  //function to trunccate the decimals up to 8 digits
  const truncateToEightDecimals = (value) => {
    const multiplier = Math.pow(10, 8);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(8);
  };

  // Function to validate the receiver address
  const validateReceiverAddress = (value) => {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      console.error("Receiver address is required.");
      return;
    }

    try {
      Principal.fromText(trimmedValue);
    } catch (error) {
      const errorMsg = error.toString();

      if (errorMsg.toLowerCase().includes("invalid character")) {
        const match = errorMsg.match(/"(.+?)"/);
        const invalidChar = match ? match[1] : "?";
        console.error(
          `Principal ID contains an invalid character: "${invalidChar}"`
        );
      } else {
        console.error("Invalid principal ID format.");
      }

      console.error("Principal validation error:", errorMsg);
    }
  };

  // Function to handle the change event on the receiver address input
  const handleReceiverChange = (e) => {
    const value = e.target.value.trim();
    setReceiverAddress(value);
    validateReceiverAddress(value);
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  // Close the dropdown when the user scrolls
  useEffect(() => {
    window.addEventListener("scroll", handleCloseDropdownOnScroll);
    return () => {
      window.removeEventListener("scroll", handleCloseDropdownOnScroll);
    };
  }, []);

  // when dropdown open scroll is locked
  useEffect(() => {
    const shouldLockScroll = showDepositPopup || isTransferDropdownOpen;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showDepositPopup, isTransferDropdownOpen]);

  // Fetch balance and conversion rate when the component mounts or when dependencies change
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchBalance("ckUSDT"),
          fetchConversionRate(),
        ]);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    dashboardRefreshTrigger,
    toggleRefresh,
  ]);

  // funtion for Closing the dropdown when the user change location
  useEffect(() => {
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
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

              {!isHomeNav && isTestnetMode && !isProduction && (
                <button
                  className="bg-[#4659CF]  z-50  hover:bg-blue-700 text-white font-bold rounded-full md:rounded  text-[12px] p-1 md:px-2 md:py-[1px] md:pt-[2px] mt-[1px] ml-3"
                  onClick={handleButtonClick}
                >
                  <div className="flex items-center justify-center">
                    <p className="hidden md:flex">TESTNET</p>
                    <Info size={15} className=" ml-0 md:ml-1 -mt-[1px]" />
                  </div>
                </button>
              )}

              {showTestnetPopup && (
                <TestnetModePopup
                  onClose={handleClosePopup}
                  handleTestnetModeToggle={handleTestnetModeToggle}
                />
              )}
              <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                transition:Bounce
                pauseOnHover
                theme={isDarkMode ? "dark" : "light"}
                className="z-60 mt-6 "
              />
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
                        } else if (isTestnetMode && link.testnet) {
                          return (
                            <React.Fragment key={index}>
                              <NavLink
                                to={link.route}
                                className="text-[#2A1F9D] px-5 py-2 text-lg nav-link dark:text-darkTextSecondary"
                              >
                                {link.title}
                              </NavLink>
                              {link.title === "Faucet" && (
                                <>
                                  <span
                                    className="text-[#2A1F9D] relative px-5 py-2 text-lg nav-link dark:text-darkTextSecondary cursor-pointer button1"
                                    onClick={handlePopupToggle}
                                  >
                                    •••
                                  </span>
                                  {isPopupVisible && (
                                    <Popup
                                      position={popupPosition}
                                      onClose={() => setIsPopupVisible(false)}
                                    />
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          );
                        } else if (!isTestnetMode && !link.testnet) {
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
              <div className="flex items-center gap-2">
                <div className="flex justify-end">
                  <div className="relative">
                    {isTransferDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setIsTransferDropDownOpen(false);
                              setIsDropdownOpen(false);
                              setReceiverAddress("");
                              setAmount("");
                              setIsApproved(false);
                            }
                          }}
                        >
                          <div className="w-[325px] lg1:w-[400px] absolute bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 px-6 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
                            <div className="flex justify-between items-center">
                              <h1 className="font-semibold text-xl">
                                Transfer
                              </h1>
                              <button
                                onClick={() => setIsTransferDropDownOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="flex flex-col gap-2 mt-5 text-sm">
                              <div className="w-full">
                                <div className="w-full flex justify-between my-2">
                                  <h1>Amount</h1>
                                </div>
                                <div className="w-full flex justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 py-2 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                                  <div className="flex flex-col items-start w-[45%] lg:gap-[2rem] gap-[2.5rem]">
                                    <input
                                      type="text"
                                      value={amount}
                                      onChange={handleAmountChange}
                                      disabled={
                                        supplyBalance === 0 || isApproved
                                      }
                                      className="lg:text-lg placeholder:text-sm lg:placeholder:text-md focus:outline-none px-2 py-1 bg-gray-100 rounded-md w-full dark:bg-darkBackground/5 dark:text-darkText"
                                      placeholder={`Enter Amount `}
                                    />
                                    <p className="text-[12px] text-gray-500 -mb-1"></p>
                                  </div>

                                  <div className="flex flex-col items-end gap-3">
                                    <div className="w-auto flex gap-2 items-center">
                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setIsDropdownOpen(!isDropdownOpen)
                                          }
                                          className="flex items-center gap-2 focus:outline-none"
                                        >
                                          {asset && (
                                            <img
                                              src={
                                                AssetImages[
                                                  assets.indexOf(asset)
                                                ]
                                              }
                                              alt={asset}
                                              className="object-fill w-6 h-6 rounded-full"
                                            />
                                          )}
                                          <span className="text-lg">
                                            {asset}
                                          </span>
                                          <svg
                                            className={`w-4 h-4 transition-transform ${
                                              isDropdownOpen ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M19 9l-7 7-7-7"
                                            ></path>
                                          </svg>
                                        </button>

                                        {isDropdownOpen && (
                                          <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                                            onClick={(e) => {
                                              if (
                                                e.target === e.currentTarget
                                              ) {
                                                setIsDropdownOpen(false);
                                              }
                                            }}
                                          >
                                            <div className="absolute right-[40px] mt-2 w-48 origin-top-right bg-white dark:bg-darkOverlayBackground border dark:border-gray-600 border-gray-300 rounded-xl shadow-md z-10">
                                              <div className="py-1">
                                                {assets.map((a) => {
                                                  const assetIndex =
                                                    assets.indexOf(a);

                                                  return (
                                                    <button
                                                      key={a}
                                                      className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-darkBackground/10"
                                                      onClick={() => {
                                                        if (a !== asset) {
                                                          setAmount("");
                                                        }
                                                        setAsset(a);
                                                        setIsDropdownOpen(
                                                          false
                                                        );
                                                      }}
                                                    >
                                                      {assetIndex !== -1 &&
                                                        AssetImages[
                                                          assetIndex
                                                        ] && (
                                                          <img
                                                            key={assetIndex}
                                                            src={
                                                              AssetImages[
                                                                assetIndex
                                                              ]
                                                            }
                                                            alt={a || "asset"}
                                                            className="rounded-full w-5 h-5 mt-1"
                                                          />
                                                        )}

                                                      <span>{a}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                      <p className="text-[11px] text-gray-500 text-right w-full font-semibold">
                                        Wallet Balance:
                                      </p>
                                      <div className="flex gap-1 items-center">
                                        <p className="text-[12px] text-gray-500 -mb-[3px]">
                                          {truncateToEightDecimals(
                                            supplyBalance
                                          )}
                                        </p>
                                        <p
                                          className={`text-[12px] px-2 py-0 rounded-md button1 ${
                                            supplyBalance === 0 || isApproved
                                              ? "text-gray-400 cursor-not-allowed"
                                              : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                                          }`}
                                          onClick={() => {
                                            if (
                                              supplyBalance > 0 &&
                                              !isApproved
                                            ) {
                                              handleMaxClick();
                                            }
                                          }}
                                        >
                                          Max
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="w-full">
                                <div className="w-full flex items-center my-2">
                                  <h1>Receiver Principal Address</h1>
                                  <span className="relative cursor-pointer ">
                                    <span className="group inline-flex ml-1 mt-1">
                                      <Info
                                        size={14}
                                        className="text-[#233D63] dark:text-darkText dark:opacity-50"
                                      />
                                      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                        Only Principal IDs are accepted here.
                                      </div>
                                    </span>
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                                  <input
                                    type="text"
                                    value={receiverAddress}
                                    onChange={handleReceiverChange}
                                    disabled={supplyBalance === 0 || isApproved}
                                    className="w-full text-sm lg:text-base placeholder:text-sm placeholder:opacity-70 px-2 py-1 bg-transparent focus:outline-none dark:text-darkText"
                                    placeholder="Enter Receiver Address"
                                  />
                                </div>
                              </div>

                              <div className="w-full mt-3">
                                {amount > 0 && amount > supplyBalance && (
                                  <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                                    <div className="text-white text-[12px]">
                                      Insufficient wallet balance to transfer{" "}
                                      {asset}.
                                    </div>
                                  </div>
                                )}

                                {supplyBalance <= 0 && (
                                  <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                                    <div className="text-white text-[12px]">
                                      You do not have any {asset} in your wallet
                                      for transferring. Please deposit {asset}{" "}
                                      before attempting to transfer.
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-col gap-4 mt-4">
                                  <button
                                    onClick={() => !isApproved && handleClick()}
                                    className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                                      isApproved ||
                                      isLoading ||
                                      isButtonDisabled ||
                                      amount <= 0 ||
                                      supplyBalance <= 0 ||
                                      amount > supplyBalance
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    disabled={
                                      isApproved ||
                                      isLoading ||
                                      amount <= 0 ||
                                      supplyBalance <= 0 ||
                                      amount > supplyBalance
                                    }
                                  >
                                    Approve {asset} to continue
                                  </button>

                                  <button
                                    onClick={() => isApproved && handleClick()}
                                    className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${
                                      !isApproved ||
                                      isButtonDisabled ||
                                      isLoading ||
                                      amount <= 0 ||
                                      supplyBalance <= 0 ||
                                      amount > supplyBalance
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                    disabled={
                                      !isApproved ||
                                      isLoading ||
                                      amount <= 0 ||
                                      supplyBalance <= 0 ||
                                      amount > supplyBalance
                                    }
                                  >
                                    Transfer
                                  </button>
                                </div>

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
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {showDepositPopup && (
                      <>
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setShowDepositPopup(false);
                            }
                          }}
                        >
                          <div className="w-[325px] lg1:w-[400px] absolute bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 px-6 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
                            <div className="flex justify-between items-center">
                              <h1 className="font-semibold text-xl">Deposit</h1>
                              <button
                                onClick={() => setShowDepositPopup(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="flex flex-col gap-2 mt-5 text-sm">
                              <div className="w-full">
                                <div className="w-full flex justify-between my-2">
                                  <h1>Receiver Address</h1>
                                </div>
                                <div className="w-full flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                                  <textarea
                                    value={principal}
                                    readOnly
                                    rows={2}
                                    className="w-full resize-none text-[13px] lg:text-[13px] placeholder:text-sm placeholder:opacity-70 px-1 py-1 bg-transparent focus:outline-none dark:text-darkText"
                                  />
                                  <GrCopy
                                    className="h-5 w-4 ml-4 lg1:ml-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-darkText"
                                    onClick={() => {
                                      navigator.clipboard.writeText(principal);
                                      toast.dismiss();
                                      toast.success(`Principal Coppied !`, {
                                        className: "custom-toast",
                                        position: "top-center",
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                      });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="w-full">
                                <div className="w-full flex justify-between my-2">
                                  <h1>Account Id</h1>
                                </div>
                                <div className="w-full flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                                  <textarea
                                    value={accountIdString}
                                    readOnly
                                    rows={2}
                                    className="w-full resize-none text-[13px] lg:text-[13px] placeholder:text-sm placeholder:opacity-70 px-1 py-1 bg-transparent focus:outline-none dark:text-darkText"
                                  />
                                  <GrCopy
                                    className="h-5 w-4 ml-4 lg1:ml-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-darkText"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        accountIdString
                                      );
                                      toast.dismiss();
                                      toast.success(`Account Id  Coppied !`, {
                                        className: "custom-toast",
                                        position: "top-center",
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="hidden lg:flex gap-2 sxs3:flex  md:flex  select-none">
                  {}
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
                            <img
                              src={loader}
                              alt="square"
                              className="w-8 h-8"
                            />
                            <h1 className="font-bold md:text-xl text-[17px] text-blue-800 dark:text-darkText">
                              {truncateString(principal, 20)}
                            </h1>
                          </div>
                          <div className="flex flex-col-reverse   lg:block">
                            <div className="w-full flex flex-col lg1:flex-row justify-center mt-3 gap-3">
                              <div className="w-full flex flex-col gap-3 mb-3">
                                <div className="flex flex-row gap-3">
                                  <Button
                                    title="Transfer"
                                    className="z-20 py-2 px-9 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2 w-full"
                                    onClickHandler={toggleDropdown}
                                  />
                                  <Button
                                    title="Deposit"
                                    className="z-20 py-2 px-9 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2 w-full"
                                    onClickHandler={toggleDepositDropdown}
                                  />
                                </div>

                                <div className="flex flex-row gap-3">
                                  <Button
                                    title="Switch Wallet"
                                    className="z-20 py-2 px-9 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2 w-full text-nowrap"
                                    onClickHandler={switchWallet}
                                  />
                                  <Button
                                    title="Disconnect"
                                    className="bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100% dark:text-darkText dark:bg-[#BA5858] border-b-3 dark:border-darkBackground rounded-lg py-2 px-9 shadow-lg text-sm font-light w-full"
                                    onClickHandler={handleLogout}
                                  />
                                </div>
                              </div>
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
                                  Enabling this will allow the user to hear
                                  sound when supply, borrow, repay, or withdraw
                                  actions are performed.
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
