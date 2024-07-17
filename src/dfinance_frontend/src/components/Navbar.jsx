import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ArrowDownUp } from "lucide-react";
import { Info } from "lucide-react";
import MobileTopNav from "./Home/MobileTopNav";
import { useAuth } from "../utils/useAuthClient";
import { setUserData } from "../redux/reducers/userReducer";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { Switch } from "@mui/material";
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import Button from "./Button";
import { useRef } from "react";

import { styled } from "@mui/material/styles";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import loader from "../../public/loader.svg";
import ARROW from "../../public/ARROW.svg";
import { INITIAL_ETH_VALUE, INITIAL_1INCH_VALUE } from "../utils/constants";
import { toggleTheme } from "../redux/reducers/themeReducer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Drawer } from "@mui/material";
import CloseIcon from "./Home/CloseIcon";
import MenuIcon from "./Home/MenuIcon";
import TestnetModePopup from "./Dashboard/testnetmode";
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../utils/constants";
import {
  setIsWalletConnected,
  setWalletModalOpen,
} from "../redux/reducers/utilityReducer";
import settingsicon from "../../public/settings.png";
import ThemeToggle from "./ThemeToggle";
import settingsIcon from "../../public/Settings.svg";
import Vector from "../../public/Vector.svg";
import Group216 from "../../public/Group216.svg";
// import SwitchTokensPopup from './Dashboard/SwitchToken';
import Popup from "./Dashboard/Morepopup";
import CustomizedSwitches from "./MaterialUISwitch";
import { toggleTestnetMode } from "../redux/reducers/testnetReducer";

export default function Navbar({ isHomeNav }) {
  const isMobile = window.innerWidth <= 1115; // Adjust the breakpoint as needed
  const renderThemeToggle = !isMobile;
  const [isMobileNav, setIsMobileNav] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { isWalletModalOpen, isWalletConnected } = useSelector(
    (state) => state.utility
  );
  const theme = useSelector((state) => state.theme.theme);
  const [switchTokenDrop, setSwitchTokenDrop] = useState(false);

  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const handleCloseDropdownOnScroll = () => {
    setSwitchWalletDrop(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
    // You can add similar logic for other dropdowns if needed
  };

  useEffect(() => {
    // Add event listener for scroll to window or container
    window.addEventListener("scroll", handleCloseDropdownOnScroll);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleCloseDropdownOnScroll);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Close the switchWalletDrop dropdown when location changes
    setSwitchWalletDrop(false);
    setSwitchTokenDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
  }, [location]);

  const [ethValue, setEthValue] = useState("0.00");
  const [oneInchValue, setOneInchValue] = useState("0.00");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [balance, setBalance] = useState(0); // Example balance, replace with actual balance
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [showTestnetPopup, setShowTestnetPopup] = useState(false);
  const handleEthChange = (e) => {
    const value = e.target.value;
    setEthValue(value);
    const eth = parseFloat(value);
    const inch = eth * 32.569;
    setOneInchValue(inch.toFixed(2));
  };
  const [showWarning, setShowWarning] = useState(false);
  const handleOneInchChange = (e) => {
    const value = e.target.value;
    setOneInchValue(value);
    const inch = parseFloat(value);
    const eth = inch / 32.569;
    setEthValue(eth.toFixed(2));
  };

  const handleSwitchClick = () => {
    const temp = ethValue;
    setEthValue(oneInchValue);
    setOneInchValue(temp);
    setInterchangeValues(!interchangeValues);

    setSelectedToken(selectedToken === "ETH" ? "1INCH" : "ETH");
  };
  const handleTransaction = () => {
    // Perform transaction logic here
    if (selectedToken === "ETH" && Number(ethValue) > balance) {
      setInsufficientBalance(true);
    } else {
      // Perform transaction
      console.log(
        `Transaction initiated with ${selectedToken} and amount ${selectedToken === "ETH" ? ethValue : oneInchValue
        }`
      );
    }
  };
  const handleInputFocus = () => {
    setShowTransactionOverlay(true);
    setIsInputFocused(true);
  };

  // Function to handle input blur
  const handleInputBlur = () => {
    setShowTransactionOverlay(false);
    setIsInputFocused(false);
  };
  const {
    isAuthenticated,
    login,
    logout,
    principal,
    reloadLogin,
    accountIdString,
  } = useAuth();

  const handleCreateInternetIdentity = () => {
    login();
  };

  const handleLogout = () => {
    dispatch(setUserData(null));
    logout();
  };
  const handleButtonClick = () => {
    setShowTestnetPopup(true);
    console.log("kjfsh");
    setDropdownVisible(false);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);

    setIsPopupVisible(false);
  };

  const handleClosePopup = () => {
    setShowTestnetPopup(false);
  };
  const handleSwitchToken = () => {
    setSwitchTokenDrop(!switchTokenDrop);
    setSwitchWalletDrop(false);
    setIsPopupVisible(false);
    setDropdownVisible(false);
    setShowTestnetPopup(false);
  };

  const handleSwitchWallet = () => {
    if (switchWalletDrop) {
      logout(); // Logout when disconnecting
    } else {
      setSwitchWalletDrop(!switchWalletDrop);
      setSwitchTokenDrop(false);
      setDropdownVisible(false);
      setIsPopupVisible(false);
      setShowTestnetPopup(false);
    }
  };

  const handleClickAway = () => {
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
    setIsPopupVisible(false);
    setShowTestnetPopup(false);
  };

  const handleCopyAddress = () => {
    console.log("Copy Address clicked");
  };

  const handleViewOnExplorerClick = () => {
    console.log("View on Explorer clicked");
  };

  const handleLaunchApp = () => {
    navigate("/dashboard"); // Directly navigate to /dashboard/main
  };
  const handleClose = () => {
    setSwitchTokenDrop(false);
  };
  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen(!isWalletModalOpen));
    // dispatch(setIsWalletCreated(true))
  };

  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
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
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : theme === "dark";
  });

  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);

  const previousIsTestnetMode = useRef(isTestnetMode);

  const handleTestnetModeToggle = () => {
    navigate("/dashboard");
    dispatch(toggleTestnetMode());
  };

  useEffect(() => {
    if (previousIsTestnetMode.current !== isTestnetMode) {
      if (previousIsTestnetMode.current !== undefined) {
        toast.dismiss(); // Dismiss any existing toasts
      }
      toast.success(
        `Testnet mode ${isTestnetMode ? "enabled" : "disabled"} successfully!`
      );
      previousIsTestnetMode.current = isTestnetMode;
    }
  }, [isTestnetMode]);

  const handleDropdownToggle = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
  };

  const hash = window.location.hash;

  useEffect(() => {
    if (hash) {
      const ele = document.querySelector(hash);
      if (ele) {
        ele.scrollIntoView({ behavior: "smooth" });
      }
    }
    console.log(hash);
  }, [hash]);

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth <= 760);

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    // Cleanup: remove event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePopupToggle = () => {
    setIsPopupVisible((prevVisible) => !prevVisible);
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

  React.useEffect(() => {
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

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div className="w-full">
          <nav className="w-full py-4 lg:py-10  flex items-center justify-between">
            <div className="lg:block lgx:block dxl:flex justify-center items-center sxs3:block sxs3:mt-3">
              <img
                src={
                  theme === "dark"
                    ? "/DFinance-Dark.svg"
                    : "/DFinance-Light.svg"
                }
                alt="DFinance"
                className="w-[100px] md:w-[150px] lg:w-auto sxs3:w-[130px]  sxs3:mb-3 md:mb-1"
              />
              {!isHomeNav && isTestnetMode && (
                <button
                  className="bg-[#4659CF] z-50   hover:bg-blue-700 text-white font-bold p-2 rounded flex items-center text-[12px] w-20 h-6 lg:ml-3 -mt-1 sxs3:ml-10"
                  onClick={handleButtonClick}
                >
                  TESTNET
                  <Info size={20} className="ml-1" />
                </button>
              )}

              {showTestnetPopup && (
                <TestnetModePopup
                  onClose={handleClosePopup}
                  setIsTestnetMode={setIsTestnetMode}
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
                className="z-50 mt-6 -ml-6"
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
                            className="text-[#2A1F9D]  ps-20 px-6 py-2 text-lg nav-link dark:text-darkTextSecondary"
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
                                  className="text-[#2A1F9D] relative px-5 py-2 text-lg nav-link dark:text-darkTextSecondary cursor-pointer"
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
                <div className=" text-nowrap">
                  <Button
                    title={"Launch App"}
                    onClickHandler={handleLaunchApp}
                  />
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
                      {isMobileNav ? <CloseIcon /> : <MenuIcon />}{" "}
                      {/* Toggle between Menu and X icons */}
                    </div>
                  </div>
                )}
              </div>
            ) : isAuthenticated ? (
              <div className="hidden lg:flex gap-2 sxs3:flex  md:flex ">
                <div className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-[10px] shadow-md border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-2 py-[10px] px-3"
                    onClick={handleSwitchToken}
                  >
                    <span className="hidden lg1:flex">Switch Token</span>
                    <ArrowDownUp size={15} />
                  </div>

                  <div className="relative">
                    {switchTokenDrop && (
                      <>
                        {" "}
                        <div
                          className="fixed inset-0 bg-black opacity-40 z-40"
                          onClick={() => setSwitchTokenDrop(false)}
                        ></div>
                        <div className="w-[380px] absolute -left-[160px] mt-6 rounded-xl bg-white shadow-xl  border p-6 z-50 dark:bg-darkOverlayBackground dark:border-none dark:shadow-2xl">
                          <h1 className="font-bold text-xl text-[#2A1F9D] dark:text-darkText text-nowrap">
                            Switch Tokens
                          </h1>

                          <div className="w-full mb-5 my-2 bg-gradient-to-r from-[#e9ebfa] to-[#e5ddd4] text-center py-2 rounded-md dark:bg-gradient-to-r dark:from-darkGradientStart dark:to-darkGradientEnd ">
                            <p className="text-[12px] text-[#EB8863] text-left px-4">
                              Please switch to Ethereum.
                              <span className=" text-xs text-[#EB8863] underline cursor-pointer ml-2 italic">
                                Switch Network
                              </span>
                            </p>
                          </div>

                          <div className="flex justify-between items-center my-2 mt-4 mb-3">
                            <div className="flex justify-center items-center  gap-x-1">
                              <img
                                src={loader}
                                alt="Connect Wallet"
                                className="w-4 h-4"
                              />
                              <label className="text-sm font-light text-[#2A1F9D]  justify-start dark:text-darkText">
                                Token
                              </label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[12px] text-[#2A1F9D] dark:text-darkText">
                                Slippage <b>0.10%</b>
                              </span>

                              <img
                                src="/settings.png"
                                alt="settings_icon"
                                className="object-contain w-[20px] h-[20px]"
                              />
                            </div>
                          </div>
                          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 cursor-pointer px-4 py-1 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                            <div className="w-3/12">
                              <input
                                value={
                                  selectedToken === "ETH"
                                    ? ethValue
                                    : oneInchValue
                                }
                                onChange={
                                  selectedToken === "ETH"
                                    ? handleEthChange
                                    : handleOneInchChange
                                }
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                className="focus:outline-none bg-transparent w-full placeholder:text-sm text-gray-500 dark:bg-darkBackground/5 dark:text-darkText text-center"
                                placeholder="0.00"
                              />
                              <p className="text-sm text-gray-500 ml-6">$0</p>
                            </div>
                            <div className="w-9/12 flex flex-col items-end">
                              <div className="w-auto flex items-center gap-2">
                                <img
                                  src={loader}
                                  alt="connect_wallet_icon"
                                  className="w-6 h-6"
                                />
                                <span className="text-lg text-[#2A1F9D] dark:text-darkText">
                                  ETH
                                </span>
                                <svg
                                  className="w-4 h-4 text-[#2A1F9D] dark:text-darkText"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.67l3.71-3.44a.75.75 0 011.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <p className="text-xs mt-2 text-[#2A1F9D] dark:text-darkText">
                                {" "}
                                Balance: {balance} Max
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-center my-1">
                            <img
                              src={ARROW}
                              alt="Switch Icon"
                              className="w-6 h-6 cursor-pointer dark:text-darkText"
                              onClickHandler={handleSwitchClick}
                            />
                          </div>

                          <div>
                            <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 cursor-pointer px-4 py-1 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                              <div className="w-3/12">
                                <input
                                  value={
                                    selectedToken === "ETH"
                                      ? ethValue
                                      : oneInchValue
                                  }
                                  onChange={
                                    selectedToken === "ETH"
                                      ? handleEthChange
                                      : handleOneInchChange
                                  }
                                  onFocus={handleInputFocus}
                                  onBlur={handleInputBlur}
                                  className="text-center text-sm focus:outline-none bg-transparent w-full placeholder:text-sm text-gray-500 dark:bg-darkBackground/5 dark:text-darkText"
                                  placeholder="0.00"
                                />
                                <p className="text-sm text-gray-500 ml-6">$0</p>
                              </div>
                              <div className="w-9/12 flex flex-col items-end">
                                <div className="w-auto flex items-center gap-2">
                                  <img
                                    src={loader}
                                    alt="connect_wallet_icon"
                                    className=" w-6 h-6"
                                  />
                                  <span className="text-lg text-[#2A1F9D] dark:text-darkText">
                                    1 INCH
                                  </span>
                                  <svg
                                    className="w-4 h-4 text-[#2A1F9D] dark:text-darkText"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.67l3.71-3.44a.75.75 0 011.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <p className="text-xs mt-2 text-[#2A1F9D] dark:text-darkText">
                                  {" "}
                                  Balance: {balance} Max
                                </p>
                              </div>
                            </div>
                            {isInputFocused && (
                              <div className="border-b border-gray-500 text-[#2A1F9D] p-4 mt-2 flex items-center justify-between dark:text-darkText ">
                                <p>1 ETH = 32.569 1INCH</p>
                                <p>
                                  <img
                                    src={Vector}
                                    alt=""
                                    className="inline w-4 h-4 mr-1 text-[#2A1F9D] ml-[90px] dark:text-darkText"
                                  />
                                  $18.75
                                </p>
                                <img
                                  src={Group216}
                                  alt=""
                                  className="inline w-4 h-4 text-[#2A1F9D]"
                                />
                              </div>
                            )}

                            {showTransactionOverlay && (
                              <div className="top-full left-0 mt-2 p-4 bg-white text-[#2A1F9D] dark:bg-darkBackground/5 dark:text-darkText ">
                                <h2 className="text-2xl text-[#2A1F9D] font-bold mb-4  dark:text-darkText">
                                  Transaction Overlay
                                </h2>
                                <div className="border border-gray-300 rounded-xl shadow-md top-full left-0 mt-2 p-6">
                                  <p>
                                    Min 1INCH Received:{" "}
                                    {selectedToken === "ETH"
                                      ? (ethValue * 32.569).toFixed(2)
                                      : oneInchValue}{" "}
                                    1INCH
                                  </p>
                                  <p>
                                    Min USD Received:{" "}
                                    {selectedToken === "ETH"
                                      ? (ethValue * 32.569 * 100).toFixed(2)
                                      : (oneInchValue * 100).toFixed(2)}{" "}
                                    USD
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div
                            className={`w-full my-2 text-[#EB8863] p-2 rounded-md ${isInputFocused ? "block" : "hidden"
                              }`}
                            style={{ maxWidth: "380px" }}
                          >
                            <div className="flex items-center">
                              <img
                                src="./Group 216.png"
                                alt=""
                                className="w-4 h-4 mr-2"
                                style={{ filter: "invert(1)" }}
                              />
                              <span className="text-left">
                                You don't have enough ETH in your account to pay
                                for transaction fees on the Ethereum network.
                                Please deposit ETH from another account.
                              </span>
                            </div>
                          </div>

                          {balance < ethValue && (
                            <div className="w-full  p-2 rounded-md ps-3 bg-[#BA5858] text-[#E92626] dark:text-darkText">
                              Not enough balance
                            </div>
                          )}
                          {/* Button */}
                          <div className="w-full flex justify-center mt-3">
                            <button
                              onClick={handleTransaction}
                              className=" w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#e6a6ef] rounded-xl border-b-2 dark:border-darkBackground/50 p-3 px-8 shadow-lg font-semibold text-[16px]"
                            >
                              Switch
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] shadow-[#00000040] text-sm cursor-pointer relative rounded-[10px] shadow-md border-b-[1px] border-white/40 dark:border-white/20">
                  <div
                    className="flex items-center gap-1 py-[9px] px-3  overflow-hidden"
                    onClick={handleSwitchWallet}
                  >
                    <img
                      src={loader}
                      alt="square"
                      className="object-contain w-5 h-5"
                    />
                    <span className="sxxs:text-[10px] lg:text-[10px] lg1:text-[12px] font-bold">
                      0x65.125s
                    </span>
                  </div>

                  {switchWalletDrop && (
                    <>
                      <div
                        className="fixed inset-0 bg-black opacity-40 z-40"
                        onClick={() => setSwitchWalletDrop(false)}
                      ></div>
                      <div
                        className="absolute min-w-[300px] md:px-5 md:py-6 px-5 py-6 top-full -left-[207px] lg1:ml-0 md:ml-24 mt-8 md:mt-4 rounded-xl  bg-white mb-4 z-50 dark:bg-darkOverlayBackground dark:border-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-full flex items-center gap-2">
                          <img src={loader} alt="square" className="w-8 h-8" />
                          <h1 className="font-bold text-xl text-blue-800 dark:text-darkText">
                            0x65.125ssdf
                          </h1>
                        </div>
                        <div className="flex flex-col-reverse   lg:block">
                          <div className="w-full flex flex-col lg1:flex-row justify-center mt-3  gap-3">
                            <Button
                              title="Switch Wallet"
                              className=" z-20 py-2 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white "
                              onClickHandler={handleSwitchWallet}
                            />
                            <Button
                              title="Disconnect"
                              className=" bg-gradient-to-tr from-orange-400 to-purple-700 border-b-3 dark:border-darkBackground rounded-lg py-2 px-9 shadow-lg text-sm font-light"
                              onClickHandler={handleLogout}
                            />
                          </div>

                          <div className="flex flex-col lg1:flex-row mt-3 gap-3 ">
                            {/* First Container */}
                            <div className="hidden lg1:flex justify-center">
                              <div
                                className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col"
                                style={{ height: "70px", width: "160px" }}
                              >
                                <span
                                  className="absolute top-1/4 transform -translate-y-1/2 text-blue-800 dark:text-darkTextSecondary"
                                  style={{ right: "55%" }}
                                >
                                  Network
                                </span>
                                <div className="absolute bottom-2 left-2 mt-4 flex items-center">
                                  <img
                                    src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"
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
                              <div
                                className="flex-1 flex flex-col  justify-center border border-gray-200 p-3 rounded-xl text-sm  dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col"
                              >
                                <div className="flex gap-5">
                                  <div className="flex items-center justify-center">
                                    <p className="text-blue-800 dark:text-darkText">Network</p>
                                  </div>

                                  <div className="flex items-center ml-auto">
                                    <img
                                      src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"
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

                            {/* Second Container */}
                            <div className=" w-full flex justify-center">
                              <div
                                className=" flex-1 flex flex-col lg1:items-center md:place-items-start justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground"
                                style={{ height: "70px", width: "160px" }}
                              >
                                <button
                                  className="text-blue-800 hover:text-gray-800 flex items-center -ml-4 dark:text-darkTextSecondary"
                                  onClick={handleCopyAddress}
                                >
                                  <GrCopy className="h-5 w-4 ml-4 lg1:ml-0" />
                                  <span className="ml-1">Copy Address</span>
                                </button>
                                <button
                                  className="text-blue-800 hover:text-gray-800 flex items-center mt-2 dark:text-darkTextSeconday"
                                  onClick={handleViewOnExplorerClick}
                                >
                                  <CiShare1 className="h-5 w-4  dark:text-darkText " />
                                  <span className="ml-1 text-nowrap dark:text-darkTextSecondary">
                                    View On Explorer
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
                        className="object-contain w-[40px] h-[40px] cursor-pointer sxs3:hidden md:block lg:block ml-1"
                        onClick={handleDropdownToggle}
                      />
                    )}
                    {dropdownVisible && (
                      <>
                        <div
                          className="fixed inset-0 bg-black opacity-40 z-40"
                          onClick={() => setDropdownVisible(false)}
                        ></div>
                        <div
                          className="absolute w-[280px] top-[60px] right-0 mt-2 p-3 bg-[#ffffff] text-[#2A1F9D] border-gray-300 rounded-xl shadow-md z-50 dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h2 className="text-[12px] text-[#2A1F9D] font-light mb-5 dark:text-darkText ml-2">
                            Settings
                          </h2>

                          {/* Dark Mode Setting */}
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

                          {/* Testnet Mode Setting */}
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
                      {isMobileNav ? <CloseIcon /> : <MenuIcon />}{" "}
                      {/* Toggle between Menu and X icons */}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // <Button title={"Connect Wallet"} onClickHandler={handleCreateInternetIdentity} />
              <div className="flex gap-3">
                <Button
                  title={"Connect Wallet"}
                  onClickHandler={handleWalletConnect}
                  className={
                    "my-2 bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-xl p-[11px] md:px-8 shadow-md shadow-[#00000040] font-medium text-sm sxs3:px-4 sxs1:text-[11px] md:text-[14px]"
                  }
                />
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {!isMobile ? (
                      <img
                        src={settingsIcon}
                        alt="settings_icon"
                        className="object-contain w-[40px] h-[40px] cursor-pointer sxs3:hidden md:block lg:block ml-1"
                        onClick={handleDropdownToggle}
                      />
                    ) : (
                      <MenuIcon />
                    )}
                    {dropdownVisible && (
                      <div className="absolute w-[280px] top-[80px] right-0 mt-2 p-3 bg-[#ffffff] text-[#2A1F9D] border-gray-300 rounded-xl shadow-md z-50 dark:bg-darkOverlayBackground dark:text-darkTextSecondary dark:border-none">
                        <h2 className="text-[12px] text-[#2A1F9D] font-light mb-5 dark:text-darkText ml-2">
                          Settings
                        </h2>

                        {/* Dark Mode Setting */}
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

                        {/* Testnet Mode Setting */}
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