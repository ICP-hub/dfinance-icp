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
import TestnetModePopup from "../Dashboard/DashboardPopup/testnetmode";
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../../utils/constants";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import ThemeToggle from "../Common/ThemeToggle";
import settingsIcon from "../../../public/Helpers/Settings.svg";
import Popup from "../Dashboard/DashboardPopup/Morepopup";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import { toggleTestnetMode } from "../../redux/reducers/testnetReducer";
import icplogo from "../../../public/wallet/icp.png";
import { IoIosRocket } from "react-icons/io";
import DFinanceDark from "../../../public/logo/DFinance-Dark.svg";
import DFinanceLight from "../../../public/logo/DFinance-Light.svg";
import star from "../../../public/Helpers/settings.svg";
import { toggleSound } from "../../redux/reducers/soundReducer";

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
  const { user } = useSelector((state) => state.user);
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
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth <= 760);

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
    setIsPopupVisible(false);
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
    setShowTestnetPopup(true);
    setDropdownVisible(false);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);

    setIsPopupVisible(false);
  };

  const handleClosePopup = () => {
    setShowTestnetPopup(false);
  };

  const handleSwitchWallet = () => {
    if (switchWalletDrop) {
      logout();
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

  const copyToClipboard = () => {
    if (principal) {
      navigator.clipboard
        .writeText(principal)
        .then(() => {
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
    navigate("/dashboard");
    dispatch(toggleTestnetMode());
  };

  const handleDropdownToggle = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setShowTestnetPopup(false);
    setIsPopupVisible(false);
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

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

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div className="w-full">
          <nav className="w-full py-4 md:py-5 dxl:py-9 flex items-center justify-between">
            <div className="flex justify-center items-center ">
              <img
                src={theme === "dark" ? DFinanceDark : DFinanceLight}
                alt="DFinance"
                onClick={handleLogoClick}
                className="w-[100px] md:w-[150px] lg:w-auto sxs3:w-[130px] md:mb-1 sxs3:mb-0 cursor-pointer"
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                  imageRendering: "crisp-edges",
                }}
              />

              {!isHomeNav && isTestnetMode && (
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
              <div className="hidden lg:flex gap-2 sxs3:flex md:flex select-none items-center h-[60px]">
                <button
                  onClick={handleNavigate}
                  className=" flex items-center gap-2 z-20 py-2.5 px-6  focus:outline-none box bg-transparent  shadow-lg  text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button1"
                >
                  {/* Custom Gradient Star */}
                  <img
                    src={star}
                    alt="DFinance"
                    className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5"
                    style={{
                      imageRendering: "-webkit-optimize-contrast",
                      imageRendering: "crisp-edges",
                    }}
                  />

                  {/* Gradient Text */}
                  <span className="bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent font-semibold">
                    0.00
                  </span>
                </button>
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
                                // onChange={handleTestnetModeToggle}
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
