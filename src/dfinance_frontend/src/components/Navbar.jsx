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
} from '../utils/constants';
import { setIsWalletConnected, setWalletModalOpen } from '../redux/reducers/utilityReducer';

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
      );
    } else {
      dispatch(setUserData(null));
      // navigate('/');
    }
  }, [isAuthenticated]);

  const hash = window.location.hash;

  useEffect(() => {
    if (hash) {
      const ele = document.querySelector(hash);
      if (ele) {
        ele.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

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

            <div className="gap-4 hidden lg:flex">
              {!isHomeNav
                ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
                    <NavLink
                      key={index}
                      to={link.route}
                      className="text-[#2a1f9d] px-3 py-2 text-lg"
                    >
                      {link.title}
                    </NavLink>
                  ))
                : HOME_TOP_NAV_LINK.map((link, index) => (
                    <NavLink
                      key={index}
                      to={link.route}
                      className="text-[#233D63] px-3"
                    >
                      {link.title}
                    </NavLink>
                  ))}
            </div>

            {isHomeNav && (
              <Button title={'Launch App'} onClickHandler={handleLaunchApp} />
            )}

            {isAuthenticated && !isHomeNav && (
              <div className="hidden lg:flex gap-6">
                <div className="my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-3 p-2 px-3"
                    onClick={handleSwitchToken}
                  >
                    <span>Switch Token</span>
                    <ArrowDownUp />
                  </div>

                  {switchTokenDrop && <SwitchWallet />}
                </div>
                <div className="flex items-center gap-3 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-sm cursor-pointer relative">
                  <div
                    className="flex items-center gap-3 p-2 px-3"
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
                    <div className="absolute p-4 top-full right-0 mt-4 rounded-lg bg-gray-100 shadow-xl border mb-4 z-10">
                      <div className="w-full flex items-center gap-3 mt-2">
                        <img
                          src="/connect_wallet_icon.png"
                          alt="connect_wallet_icon"
                          className="w-10 h-10"
                        />
                        <h1 className="font-semibold text-2xl text-blue-800">
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
                        />
                      </div>

                      <div className="flex mt-3 gap-3 ">
                        {/* First Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative" style={{ height: '70px', width: '160px' }}>
                            <span className="absolute top-1/4 transform -translate-y-1/2 text-blue-800" style={{ right: '55%' }}>Network</span>
                            <div className="absolute bottom-2 left-2 mt-4 flex items-center">
                              <img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="w-6 h-6" />
                              <span className="ml-2 text-base text-blue-800">ICP</span>
                            </div>
                          </div>

                        </div>

                        {/* Second Container */}
                        <div className="flex justify-center">
                          <div className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-lg text-sm relative" style={{ height: '70px', width: '160px' }}>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center -ml-2" onClick={handleCopyAddress}>
                              <GrCopy className="h-5 w-4" />
                              <span className="ml-1">Copy Address</span>
                            </button>
                            <button className="text-blue-800 hover:text-gray-800 flex items-center mt-2" onClick={handleViewOnExplorerClick}>
                              <CiShare1 className="h-5 w-4" />
                              <span className="ml-1 text-nowrap">View On Explorer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAuthenticated && location.pathname === '/dashboard/main' && (
              
                <div className="flex items-center gap-3 my-2 bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md shadow-xl shadow-[#00000040] font-semibold text-sm cursor-pointer relative">
                <Button
                          title="Connect Wallet"
                          className="my-2 whitespace-nowrap bg-gradient-to-r text-white from-[#EB886399] to-[#81198E99] rounded-md p-3 px-8 shadow-lg font-semibold text-sm"
                          onClickHandler={handleSwitchToken}
                        />
                </div>
              
            )}

            <button
              type="button"
              className="text-[#2A1F9D] cursor-pointer block lg:hidden"
              onClick={() => setIsMobileNav(true)}
            >
              <Menu />
            </button>
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
