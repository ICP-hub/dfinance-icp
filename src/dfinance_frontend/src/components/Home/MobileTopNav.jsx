import React, { useState, useEffect, useRef } from "react";
import { Drawer, useMediaQuery } from "@mui/material";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../redux/reducers/themeReducer";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toggleSound } from "../../redux/reducers/soundReducer";
import { Info } from "lucide-react";
import { toggleTestnetMode } from "../../redux/reducers/testnetReducer";
import loader from "../../../public/Helpers/loader.svg";
import { setUserData } from "../../redux/reducers/userReducer";
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../../utils/constants";
import {
  setIsWalletConnected,
  setWalletModalOpen,
} from "../../redux/reducers/utilityReducer";
import Button from "../Common/Button";
import icplogo from "../../../public/wallet/icp.png";
import { ArrowUpDown } from "lucide-react";
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import { joyRideTrigger } from "../../redux/reducers/joyRideReducer";

const MobileTopNav = ({
  isMobileNav,
  setIsMobileNav,
  isHomeNav,
  handleCreateInternetIdentity,
  handleLogout,
}) => {
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : theme === "dark";
  });
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);

  const handleSoundToggle = () => {
    dispatch(toggleSound());
  };

  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);
  const previousIsTestnetMode = useRef(isTestnetMode);

  const handleTestnetModeToggle = () => {
    navigate("/dashboard");
    dispatch(toggleTestnetMode());
  };

  useEffect(() => {
    if (previousIsTestnetMode.current !== isTestnetMode) {
      if (previousIsTestnetMode.current !== undefined) {
        toast.dismiss();
      }
      toast.success(
        `Testnet mode ${isTestnetMode ? "enabled" : "disabled"} successfully!`
      );
      previousIsTestnetMode.current = isTestnetMode;
    }
  }, [isTestnetMode]);

  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode));
      return newMode;
    });
  };

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
  }, [theme]);

  const isLargeScreen = useMediaQuery("(min-width: 1134px)");
  const isMobile2 = window.innerWidth <= 640;

  const {
    isAuthenticated,
    login,
    logout,
    principal,
    reloadLogin,
    accountIdString,
  } = useAuth();

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

  const handleClose = () => {
    setIsMobileNav(false);
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

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  useEffect(() => {
    setSwitchWalletDrop(false);
  }, [location]);

  const handleSwitchWallet = () => {
    if (switchWalletDrop) {
      logout();
    } else {
      setSwitchWalletDrop(!switchWalletDrop);
    }
  };

  const handleViewOnExplorerClick = () => {};

  if (isLargeScreen) {
    return null;
  }

  const switchWallet = () => {
    dispatch(setWalletModalOpen({ isOpen: true, isSwitching: true }));
  };

  const handleTour = () => {
    console.log("button triggered");
    dispatch(joyRideTrigger());
    handleClose();
    navigate("/dashboard");
  };

  return (
    <Drawer
      anchor={"right"}
      open={isMobileNav}
      onClose={handleClose}
      PaperProps={{
        style: {
          width: "80vw",
          maxWidth: "440px",
          height: "100vh",
          maxHeight: "calc(100vh - 60px)",
          marginTop: "30px",
          marginBottom: "20px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        },
      }}
    >
      <div className="flex flex-col pt-6 p-4 bg-white dark:bg-darkOverlayBackground font-poppins w-full h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-[#AEADCB] dark:text-darkTextPrimary">
            Menu
          </h2>
          <button
            onClick={handleClose}
            className="text-[#AEADCB] dark:text-darkTextPrimary"
          >
            <X size={24} />
          </button>
        </div>

        {isAuthenticated && isMobile2 && (
          <div className="flex items-center gap-1 my-2 mx-2 mb-4 p-1 bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white shadow-[#00000040] text-[12px] cursor-pointer relative rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20">
            <div
              className="flex items-center lg:gap-1 py-[9px] px-3 overflow-hidden button1"
              onClick={() => {
                handleSwitchWallet();
              }}
            >
              <img
                src={loader}
                alt="square"
                className="object-contain w-5 h-5 -mr-[3px]"
              />
              <span className=" font-bold ml-3">
                {truncateString(principal, 18)}
              </span>
            </div>

            {switchWalletDrop && (
              <>
                <div
                  className="fixed inset-0 bg-black opacity-40 z-40"
                  onClick={() => setSwitchWalletDrop(false)}
                ></div>
                <div
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg1:absolute lg1:top-[160px] lg1:-left-[60px] lg1:transform lg1:-translate-x-1/2 lg1:mt-2 min-w-[300px] md:px-5 md:py-6 px-5 py-6 rounded-xl bg-white mb-4 z-50 dark:bg-darkOverlayBackground dark:border-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full flex items-center gap-2">
                    <img src={loader} alt="square" className="w-8 h-8" />
                    <h1 className="font-bold md:text-xl text-[17px] text-blue-800 dark:text-darkText">
                      {truncateString(principal, 20)}
                    </h1>
                  </div>
                  <div className="flex flex-col-reverse   lg:block">
                    {}

                    <div className="flex flex-col lg1:flex-row mt-3 gap-3 ">
                      {}
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
                          className=" flex-1 flex flex-col lg1:items-center md:place-items-start justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground"
                          style={{ height: "70px", width: "160px" }}
                        >
                          <button
                            className="text-blue-800 hover:text-gray-800 flex items-center -ml-4 dark:text-darkTextSecondary"
                            onClick={copyToClipboard}
                          >
                            <GrCopy className="h-5 w-4 ml-4 lg1:ml-0" />
                            <span className="ml-1">Copy Address</span>
                          </button>
                          <button
                            className="text-blue-800 hover:text-gray-800 flex items-center mt-2 dark:text-darkTextSeconday justify-start"
                            onClick={() => (window.location.href = "/faucet")}
                          >
                            <CiShare1 className="h-5 w-4 dark:text-darkText" />
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
        )}

        {!isHomeNav
          ? DASHBOARD_TOP_NAV_LINK.map((link, index) => {
              if (link.alwaysPresent) {
                return (
                  <NavLink
                    key={index}
                    to={link.route}
                    className="text-[#2A1F9D] mt-5 p-3 font-bold text-sm dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                    style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                    onClick={handleClose}
                  >
                    {link.title}
                  </NavLink>
                );
              } else if (isTestnetMode && link.testnet) {
                return (
                  <React.Fragment key={index}>
                    <NavLink
                      to={link.route}
                      className="text-[#2A1F9D] mt-5 p-3 font-bold text-sm dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                      style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                      onClick={handleClose}
                    >
                      {link.title}
                    </NavLink>
                    {link.title === "Faucet" && <>{}</>}
                  </React.Fragment>
                );
              } else if (!isTestnetMode && !link.testnet) {
                return (
                  <NavLink
                    key={index}
                    to={link.route}
                    className="text-[#2A1F9D] mt-5 p-3 text-sm font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                    style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                    onClick={handleClose}
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
                className="text-[#2A1F9D] text-sm mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                onClick={handleClose}
              >
                {link.title}
              </NavLink>
            ))}

        <h2 className="text-sm my-4 font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2 mt-8">
          Settings
        </h2>
        <div className="p-2 dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 transition-colors duration-300 ease-in-out mx-2 my-1 text-sm">
          <div className="flex flex-col space-y-1 ">
            <div className="flex items-center justify-between">
              <label
                htmlFor="darkMode"
                className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
              >
                Dark Mode
              </label>
              <div className="flex items-center gap-3 text-[#2A1F9D] dark:text-darkTextSecondary">
                {isDarkMode ? "On" : "Off"}

                <div className="-mr-4">
                  <CustomizedSwitches
                    checked={isDarkMode}
                    onChange={handleDarkModeToggle}
                  />
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center justify-between text-sm">
                <label
                  htmlFor="testnetMode"
                  className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
                >
                  Testnet Mode
                </label>
                <div className="flex items-center gap-3 dark:text-darkTextSecondar">
                  {isTestnetMode ? "On" : "Off"}
                  <div className="-mr-4">
                    <CustomizedSwitches
                      checked={isTestnetMode}
                      // onChange={handleTestnetModeToggle}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center relative group">
                <label
                  htmlFor="darkMode"
                  className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
                >
                  Sound
                </label>

                {}
                <Info size={16} className="ml-2 cursor-pointer" />

                {}
                <div className="absolute left-36 transform -translate-x-[40%] bottom-full mb-2 hidden group-hover:block items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-2 shadow-lg border border-gray-300 w-[30vw]">
                  Enabling this will allow the user to hear sound when supply,
                  borrow, repay, or withdraw functions are executed.
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#2A1F9D] dark:text-darkTextSecondary">
                {isSoundOn ? "On" : "Off"}

                <div className="-mr-4">
                  <CustomizedSwitches
                    checked={isSoundOn}
                    onChange={handleSoundToggle}
                  />
                </div>
              </div>
            </div>
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
      {isAuthenticated && (
        <div className="w-full flex flex-col lg1:flex-row justify-center  p-4  gap-3 bg-white dark:dark:bg-darkOverlayBackground">
          <Button
            title="Switch Wallet"
            className=" z-20 py-3 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white font-poppins"
            onClickHandler={switchWallet}
          />
          <Button
            title="Disconnect"
            className="bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100% border-b-3 dark:border-darkBackground text-white dark:text-darkText rounded-lg py-3 px-9 shadow-lg text-sm font-poppins"
            onClickHandler={handleLogout}
          />
        </div>
      )}
    </Drawer>
  );
};

export default MobileTopNav;
