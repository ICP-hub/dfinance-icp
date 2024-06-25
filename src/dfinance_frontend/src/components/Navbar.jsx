import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ArrowDownUp, } from 'lucide-react';
import MobileTopNav from './Home/MobileTopNav';
import { useAuth } from '../utils/useAuthClient';
import { setUserData } from '../redux/reducers/userReducer';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import { Switch } from "@mui/material"
import { GrCopy } from 'react-icons/gr';
import { CiShare1 } from 'react-icons/ci';
import Button from './Button';
import { INITIAL_ETH_VALUE, INITIAL_1INCH_VALUE } from '../utils/constants';
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../utils/constants"
import { setIsWalletConnected, setWalletModalOpen } from "../redux/reducers/utilityReducer"
import settingsicon from "../../public/settings.png";
import ThemeToggle from "./ThemeToggle"
import settingsIcon from "../../public/Settings.svg"
// import SwitchTokensPopup from './Dashboard/SwitchToken';
//  
export default function Navbar({ isHomeNav }) {
  const isMobile = window.innerWidth <= 768; // Adjust the breakpoint as needed
  const renderThemeToggle = !isMobile;
  const [isMobileNav, setIsMobileNav] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { isWalletModalOpen, isWalletConnected } = useSelector(
    (state) => state.utility
  );
  const [switchTokenDrop, setSwitchTokenDrop] = useState(false);
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [ethValue, setEthValue] = useState("0.00");
  const [oneInchValue, setOneInchValue] = useState("0.00");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [balance, setBalance] = useState(0); // Example balance, replace with actual balance
  const [insufficientBalance, setInsufficientBalance] = useState(false);

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

    setSelectedToken(selectedToken === 'ETH' ? '1INCH' : 'ETH');

  };
  const handleTransaction = () => {
    // Perform transaction logic here
    if (selectedToken === 'ETH' && Number(ethValue) > balance) {
      setInsufficientBalance(true);
    } else {
      // Perform transaction
      console.log(`Transaction initiated with ${selectedToken} and amount ${selectedToken === 'ETH' ? ethValue : oneInchValue}`);
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

  const handleSwitchToken = () => {
    setSwitchTokenDrop(!switchTokenDrop);
    setSwitchWalletDrop(false);
  };

  const handleSwitchWallet = () => {
    if (switchWalletDrop) {
      logout(); // Logout when disconnecting
    } else {
      setSwitchWalletDrop(!switchWalletDrop);
      setSwitchTokenDrop(false);
    }
  };

  const handleClickAway = () => {
    setSwitchTokenDrop(false);
    setSwitchWalletDrop(false);
    setDropdownVisible(false);
  };

  const handleCopyAddress = () => {
    console.log('Copy Address clicked');
  };

  const handleViewOnExplorerClick = () => {
    console.log('View on Explorer clicked');
  };

  const handleLaunchApp = () => {
    navigate('/dashboard/main'); // Directly navigate to /dashboard/main
  };
  const handleClose = () => {
    setSwitchTokenDrop(false);
  };
  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    // dispatch(setIsWalletCreated(true))
  }


  const [showTransactionOverlay, setShowTransactionOverlay] = useState(false);
  useEffect(() => {
    if (isAuthenticated === true) {
      dispatch(
        setUserData({
          name: generateRandomUsername(),
          isAuth: isAuthenticated,
          principal,
          imageUrl:
            'https://res.cloudinary.com/dzfc0ty7q/image/upload/v1714272826/avatars/Web3_Avatar-36_xouxfd.svg',
        })
      )
    } else {
      dispatch(setUserData(null))
    }
  }, [isAuthenticated]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTestnetMode, setIsTestnetMode] = useState(false);

  const handleDropdownToggle = () => {
    setDropdownVisible((prevVisible) => !prevVisible);
  };



  const handleDarkModeToggle = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleTestnetModeToggle = () => {
    setIsTestnetMode((prevMode) => !prevMode);
  };

  const hash = window.location.hash;

  useEffect(() => {
    if (hash) {
      const ele = document.querySelector(hash);
      if (ele) {
        ele.scrollIntoView({ behavior: 'smooth' });
      }
    }
    console.log(hash);
  }, [hash])

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <div className="w-full">
          <nav className="w-full py-4 lg:py-10 flex items-center justify-between">
            <img
              src="/DFinance-Light.svg"
              alt="DFinance"
              className="w-[100px] md:w-[150px] lg:w-auto"
            />

            <div className="gap-4 hidden lg:flex dark:text-darkText">
              {!isHomeNav
                ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
                  <NavLink
                    key={index}
                    to={link.route}
                    className="text-[#2a1f9d] px-3 py-2 text-lg nav-link"
                  >
                    {link.title}
                  </NavLink>
                ))
                : HOME_TOP_NAV_LINK.map((link, index) => (
                  <NavLink
                    key={index}
                    to={link.route}
                    className="text-[#233D63] px-3 py-2 text-lg nav-link"
                  >
                    {link.title}
                  </NavLink>
                ))}
            </div>


            {isHomeNav ? (
              <div className='flex gap-2'>
                <div className="ml-16 text-nowrap">
                  <Button title={"Launch App"} onClick={handleLaunchApp} />
                </div>
                <div >
                  {renderThemeToggle && <ThemeToggle />}
                </div>
              </div>

            ) : (isAuthenticated ? (
              <div className="hidden lg:flex gap-3">
                <div className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-lg shadow-xl shadow-[#00000040] text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-2 p-2 px-3"
                    onClick={handleSwitchToken}
                  >
                    <span>Switch Token</span>
                    <ArrowDownUp />
                  </div>
                  <div className="relative">
                    {switchTokenDrop && (
                      <div className="w-[350px] absolute -left-6 mt-4 rounded-md bg-white shadow-xl border p-4 z-50">
                        <h1 className="font-semibold text-2xl text-[#2A1F9D]">Switch Tokens</h1>

                        <div className="w-full my-2 bg-gradient-to-r from-[#e9ebfa] to-[#e5ddd4] text-center py-2 rounded-md">
                          <p className="text-xs text-[#EB8863] text-left px-4">
                            Please switch to Ethereum
                            <span className=" text-[#EB8863] underline cursor-pointer ml-2">Switch Network</span>
                          </p>
                        </div>


                        <div className="flex justify-between items-center my-2 mt-4">
                          <div className='flex justify-center items-center  gap-x-2'>
                            <img src="/square.png" alt="Connect Wallet" className=" left-3   w-8 h-8  " />
                            <label className=" text-sm font-medium text-[#2A1F9D]  justify-start">Token</label>

                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-[#2A1F9D]">Slippage 0.10%</span>

                            <img
                              src="/settings.png"
                              alt="settings_icon"
                              className="object-contain w-[20px] h-[20px]"
                            />
                          </div>
                        </div>
                        <div className="w-full my-4">
                          <div className="relative w-full mb-4">
                            <input
                              type="text"
                              value={selectedToken === 'ETH' ? ethValue : oneInchValue}
                              onChange={selectedToken === 'ETH' ? handleEthChange : handleOneInchChange}
                              onFocus={handleInputFocus}
                              onBlur={handleInputBlur}

                              className="w-full pl-12 pr-16 py-4 bg-[#f5f4f4]  focus:outline-none focus:border-[#9e3faa99] placeholder:text-sm text-black rounded-md"
                              placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                              <img src="/square.png" alt="ETH" className="w-4 h-4 text-gray-500" />
                              <span className="text-[#2A1F9D]">ETH</span>
                              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.67l3.71-3.44a.75.75 0 011.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="absolute left-0 bottom-0 text-gray-600 text-xs ml-12 mb-1 mt-1">$0</div>
                            <div className="absolute left-12 bottom-2 text-[#2A1F9D] text-xs ml-40 -mb-0.5">Balance: {balance} Max</div>
                          </div>

                          <div className="flex justify-center my-2">
                            <img src="/arrow.png" alt="Switch Icon" className="w-6 h-6 cursor-pointer" onClick={handleSwitchClick} />
                          </div>

                          <div className="relative w-full">
                            <input
                              type="text"
                              value={selectedToken === 'ETH' ? oneInchValue : ethValue}
                              onChange={selectedToken === 'ETH' ? handleOneInchChange : handleEthChange}
                              className="w-full pl-12 pr-16 py-4 bg-[#f5f4f4]  focus:outline-none focus:border-[#9e3faa99] placeholder:text-sm text-black rounded-md"
                              placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                              <img src="/square.png" alt="1INCH" className="w-4 h-4 text-gray-500" />
                              <span className="text-[#2A1F9D]">1INCH</span>
                              <svg className="w-4 h-4 text-[#2A1F9D]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.67l3.71-3.44a.75.75 0 011.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="absolute left-0 bottom-0 text-gray-500 text-xs ml-12 mb-1">$0</div>
                          </div>
                          {isInputFocused && (
                            <div className="border-b border-gray-500 text-[#2A1F9D] p-4 mt-2 flex items-center justify-between">
                              <p>1 ETH = 32.569 1INCH</p>
                              <p>
                                <img src="./Vector.png" alt="" className="inline w-4 h-4 mr-1 text-[#2A1F9D] ml-14" />$18.75
                              </p>
                              <img src="./Group 216.png" alt="" className="inline w-4 h-4 text-[#2A1F9D]" />
                            </div>
                          )}

                          {showTransactionOverlay && (
                            <div className="top-full left-0 mt-2 p-4 bg-white text-[#2A1F9D] ">
                              <h2 className="text-2xl text-[#2A1F9D] font-bold mb-4">Transaction Overlay</h2>
                              <div className='border border-gray-300 rounded-lg shadow-md top-full left-0 mt-2 p-6'>
                                <p >Min 1INCH Received: {selectedToken === 'ETH' ? (ethValue * 32.569).toFixed(2) : oneInchValue} 1INCH</p>
                                <p>Min USD Received: {selectedToken === 'ETH' ? (ethValue * 32.569 * 100).toFixed(2) : (oneInchValue * 100).toFixed(2)} USD</p>
                              </div>

                            </div>
                          )}

                        </div>

                        <div className={`w-full my-2 text-[#EB8863] p-2 rounded-md ${isInputFocused ? 'block' : 'hidden'}`} style={{ maxWidth: '380px' }}>
                          <div className="flex items-center">
                            <img src="./Group 216.png" alt="" className="w-4 h-4 mr-2" style={{ filter: 'invert(1)' }} />
                            <span className="text-left">
                              You don't have enough ETH in your account to pay for transaction fees on the Ethereum network. Please deposit ETH from another account.
                            </span>
                          </div>
                        </div>



                        {balance < ethValue && (
                          <div className="w-full  p-2 rounded-md ps-3 bg-[#f1a6a6] text-[#E92626]">
                            Not enough balance
                          </div>
                        )}
                        {/* Button */}
                        <div className="w-full flex justify-center mt-3">
                          <button
                            onClick={handleTransaction}
                            className=" w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#e6a6ef] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                          >
                            Switch
                          </button>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
                <div className="flex items-center gap-1 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-lg shadow-xl shadow-[#00000040] text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-1 p-2 px-3"
                    onClick={handleSwitchWallet}
                  >
                    <img
                      src={'/square.png'}
                      alt="square"
                      className="object-contain w-5 h-5"
                    />
                    <span>0x65.125s</span>
                  </div>

                  {switchWalletDrop && (
                    <div className="absolute p-4 top-full right-0 mt-4 rounded-lg bg-gray-100 shadow-xl border mb-4 z-10 dark:bg-darkOverlayBackground">
                      <div className="w-full flex items-center gap-3 mt-2">
                        <img
                          src="/square.png"
                          alt="square"
                          className="w-10 h-10"
                        />
                        <h1 className="font-semibold text-2xl text-blue-800 dark:text-darkText">
                          0x65.125ssdf
                        </h1>
                      </div>

                      <div className="w-full flex justify-center mt-3 gap-3">
                        <Button
                          title="Switch Wallet"
                          className="my-2 whitespace-nowrap bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                          onClickHandler={handleSwitchWallet}
                        />
                        <Button
                          title="Disconnect"

                          className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                          onClickHandler={handleLogout}
                        />
                      </div>

                      <div className="flex mt-3 gap-3 ">
                        {/* First Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative dark:border-currentFAQBackground" style={{ height: '70px', width: '160px' }}>
                            <span className="absolute top-1/4 transform -translate-y-1/2 text-blue-800 dark:text-darkTextSecondary" style={{ right: '55%' }}>Network</span>
                            <div className="absolute bottom-2 left-2 mt-4 flex items-center">
                              <img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="w-6 h-6" />
                              <span className="ml-2 text-base text-blue-800 dark:text-darkText">ICP</span>
                            </div>
                          </div>
                        </div>

                        {/* Second Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative dark:border-currentFAQBackground" style={{ height: '70px', width: '160px' }}>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center -ml-2 dark:text-darkTextSecondary" onClick={handleCopyAddress}>
                              <GrCopy className="h-5 w-4" />
                              <span className="ml-1">Copy Address</span>
                            </button>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center mt-2 dark:text-darkTextSeconday" onClick={handleViewOnExplorerClick}>
                              <CiShare1 className="h-5 w-4" />
                              <span className="ml-1 text-nowrap dark:text-darkTextSecondary">View On Explorer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <img
                      src={settingsIcon}
                      alt="settings_icon"
                      className="object-contain w-[40px] h-[40px] cursor-pointer"
                      onClick={handleDropdownToggle}
                    />
                    {dropdownVisible && (

                      <div className="absolute w-[280px] top-12 right-0 mt-2 p-4 bg-gray-100 text-[#2A1F9D] border border-gray-300 rounded-md shadow-md z-50">
                        <h2 className="text-lg text-[#2A1F9D] font-semibold mb-4"> Settings</h2>
                        {/* Dropdown content for dark mode and testnet mode */}
                        <div className="flex items-center mb-4">
                          <label htmlFor="darkMode" className="ml-2 text-lg font-bold text-[#2A1F9D]">Dark Mode</label>
                          <span className="ml-8">{isDarkMode ? 'ON' : 'OFF'}</span>
                          <Switch
                            checked={isDarkMode}
                            onChange={handleDarkModeToggle}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#fff",
                              },
                              "& .MuiSwitch-track": {
                                backgroundColor: '#fff',

                                boxShadow: '0 0 10px black',
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#1939ea",
                              },
                            }}
                          />
                        </div>
                        <div className="flex items-center">
                          <label htmlFor="testnetMode" className="ml-2 text-lg font-bold text-[#2A1F9D] text-nowrap">Testnet Mode</label>
                          <span className="ml-8">{isTestnetMode ? 'ON' : 'OFF'}</span>
                          <Switch
                            checked={isTestnetMode}
                            onChange={handleTestnetModeToggle}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#fff",
                              },
                              "& .MuiSwitch-track": {
                                backgroundColor: '#fff',

                                boxShadow: '0 0 10px black',
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#1939ea",
                              },
                            }}
                          />
                        </div>
                      </div>

                    )}
                  </div>
                </div>
              </div>
            ) : (
              // <Button title={"Connect Wallet"} onClickHandler={handleCreateInternetIdentity} />
              <div className='flex gap-1'>
                <Button title={"Connect Wallet"} onClickHandler={handleWalletConnect} />
                <div className='flex items-center justify-center'>
                  <img
                    src={settingsIcon}
                    alt="settings_icon"
                    className="object-contain w-[42px] h-[42px]"
                  />
                </div>
              </div>


            ))}

            {/* Mobile/Tablet Menu */}
            {isMobile && (
              <img
                src="/menu.png"
                alt="Clickable Image"
                className="cursor-pointer"
                onClick={() => {
                  // Perform your functionality here
                  setIsMobileNav(true); // Example functionality: set state to open mobile navigation
                }}
              />
           
           
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
