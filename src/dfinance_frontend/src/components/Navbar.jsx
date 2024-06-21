import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ArrowDownUp, Menu } from 'lucide-react';
import MobileTopNav from './Home/MobileTopNav';
import { useAuth } from '../utils/useAuthClient';
import { setUserData } from '../redux/reducers/userReducer';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import SwitchWallet from './SwitchWallet';
import { GrCopy } from 'react-icons/gr';
import { CiShare1 } from 'react-icons/ci';
import Button from './Button';
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../utils/constants"
import { setIsWalletConnected, setWalletModalOpen } from "../redux/reducers/utilityReducer"
import settingsicon from "../../public/settings.png";
import ThemeToggle from "./ThemeToggle"
import settingsIcon from "../../public/Settings.svg"

export default function Navbar({ isHomeNav }) {
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
    if (isWalletConnected) {
      setSwitchTokenDrop(!switchTokenDrop);
      setSwitchWalletDrop(false);
    } else {
      dispatch(setWalletModalOpen(!isWalletModalOpen));
    }
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

  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    // dispatch(setIsWalletCreated(true))
  }

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
      // navigate("/dashboard/my-supply")
    } else {
      dispatch(setUserData(null))
    }
    // navigate("/") 
  }, [isAuthenticated]);


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
                <Button
                  title={"Launch App"}
                  onClickHandler={handleLaunchApp}
                />
                <ThemeToggle />
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

                  {switchTokenDrop && (
                    <SwitchWallet />
                  )}
                </div>
                <div className="flex items-center gap-1 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-lg shadow-xl shadow-[#00000040] text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-1 p-2 px-3"
                    onClick={handleSwitchWallet}
                  >
                    <img
                      src={'/connect_wallet_icon.png'}
                      alt="connect_wallet_icon"
                      className="object-contain w-5 h-5"
                    />
                    <span>0x65.125s</span>
                  </div>

                  {switchWalletDrop && (
                    <div className="absolute p-4 top-full right-0 mt-4 rounded-lg bg-gray-100 shadow-xl border mb-4 z-10 dark:bg-darkOverlayBackground">
                      <div className="w-full flex items-center gap-3 mt-2">
                        <img
                          src="/connect_wallet_icon.png"
                          alt="connect_wallet_icon"
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
                          onClickHandler={handleSwitchToken}
                        />
                        <Button
                          title="Disconnect"
                          onClick={handleLogout}
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
                <div className='flex items-center justify-center'>
                  <img
                    src={settingsIcon}
                    alt="settings_icon"
                    className="object-contain w-[40px] h-[40px]"
                  />
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
            <button
              type="button"
              className="text-[#2A1F9D] cursor-pointer block lg:hidden"
              onClick={() => setIsMobileNav(true)}
            >
              <Menu />
            </button>
          </nav>
          <div className="w-full p-3 bg-slate-200 rounded-md flex lg:hidden dark:bg-darkBackground">

            <div className="w-full flex gap-6">
              <div className="w-full flex justify-center align-center my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-xs cursor-pointer relative">
                <div
                  className="flex items-center gap-3 p-2 px-3"
                  onClick={handleSwitchToken}
                >
                  <span>Switch Token</span>
                  <ArrowDownUp size={14} />
                </div>

                {switchTokenDrop && (
                  <div className="w-[250px] absolute left-0 mt-3 rounded-md bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl border p-4 z-50">
                    <h1 className="font-semibold">Switch Tokens</h1>

                    <div className="w-full my-2">
                      <input
                        type="text"
                        className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                      />
                    </div>
                    <div className="w-full my-2">
                      <input
                        type="text"
                        className="w-full p-2 bg-[#7D7D7D73] border border-transparent focus:outline-none focus:border focus:border-[#9e3faa99] placeholder:text-xs rounded-md"
                      />
                    </div>
                    <div className="w-full flex justify-center mt-3">
                      <Button
                        title="Switch"
                        className={
                          "my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full flex items-center justify-center gap-3 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-xs cursor-pointer relative">
                <div
                  className="flex items-center gap-3 p-1 px-1"
                  onClick={handleSwitchWallet}
                >
                  <img
                    src={"/connect_wallet_icon.png"}
                    alt="connect_wallet_icon"
                    className="object-contain w-4 h-4"
                  />
                  <span>0x65.125s</span>
                </div>

                {switchWalletDrop && (
                  <div className="absolute w-[250px] z-50 p-4 top-full right-0 mt-3 rounded-md bg-gradient-to-r from-[#242151] via-[#262353] to-[#2F2D61] bg-opacity-75 shadow-xl border">
                    <div className="w-full flex items-center gap-3">
                      <img
                        src="/connect_wallet_icon.png"
                        alt="connect_wallet_icon"
                        className="w-8 h-8"
                      />
                      <h1 className="font-semibold text-xl">0x65.125ssdf</h1>
                    </div>

                    <div className="w-full flex justify-center mt-3 gap-3">
                      <Button
                        title="Switch Wallet"
                        className={
                          "my-2 whitespace-nowrap bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 shadow-lg font-semibold text-xs"
                        }
                      />
                      <Button
                        title="Disconnect"
                        className={
                          "my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 shadow-lg font-semibold text-xs"
                        }
                      />
                    </div>
                    <div className="w-full flex justify-center mt-3 gap-3">
                      <div className="flex-1 bg-gray-400 p-4 rounded-md text-xs">
                      </div>
                      <div className="flex-1 bg-gray-400 p-4 rounded-md text-xs">
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {isAuthenticated && <div className="w-[89px] flex items-center justify-center gap-3 my-2 bg-white border-2 border-orange-100 rounded-md shadow-xl shadow-[#00000040] font-semibold text-xs cursor-pointer relative">
                <div
                  className="flex items-center gap-3 p-1 px-1"

                >
                  <img
                    src={settingsicon}
                    alt="settings_icon"
                    className="object-contain w-4 "
                  />
                </div>
              </div>}
            </div>
          </div>
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
