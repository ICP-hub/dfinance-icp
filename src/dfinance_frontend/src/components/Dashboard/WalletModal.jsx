import React, { useState, useEffect } from "react";
import { Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useStoicAuth } from "../../utils/useStoicAuth"; // Import Stoic Hook
import {
  setIsWalletConnected,
  setWalletModalOpen,
  setConnectedWallet,
} from "../../redux/reducers/utilityReducer";
import { setUserData } from "../../redux/reducers/userReducer";
import icplogo from "../../../public/wallet/icp.png";
import nfid from "../../../public/wallet/nfid.png";
import stoiclogo from "../../../public/wallet/stoicwallet_logo.webp"; // Stoic Wallet Logo

const WalletModal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isWalletCreated, isWalletModalOpen, isSwitchingWallet, connectedWallet } = useSelector((state) => state.utility);

  // Get authentication clients
  const { login: loginII, logout: logoutII, isAuthenticated } = useAuth();
  const { login: stoicLogin, logout: stoicLogout, isAuthenticated: isStoicAuthenticated } = useStoicAuth();

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  const handleWalletConnect = () => {
    dispatch(setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false }));
  };

  const loginHandler = async (wallet) => {
    try {
      if (wallet === "stoic") {
        await stoicLogin(); // Login using Stoic Wallet
      } else {
        await loginII(wallet); // Login using AuthClient for other wallets
      }
      dispatch(setConnectedWallet(wallet));
    } catch (error) {
      console.error(`Login failed for ${wallet}:`, error);
    }
  };

  const loginHandlerIsSwitch = async (wallet) => {
    handleLogout();
    try {
      if (wallet === "stoic") {
        await stoicLogout();
        await stoicLogin();
      } else {
        await logoutII();
        await loginII(wallet);
      }
      dispatch(setConnectedWallet(wallet));
      dispatch(setWalletModalOpen({ isOpen: false, isSwitching: false }));
    } catch (error) {
      console.error(`Wallet switch failed for ${wallet}:`, error);
    }
  };

  const handleLogout = () => {
    dispatch(setUserData(null));
    if (connectedWallet === "stoic") {
      stoicLogout();
    } else {
      logoutII();
    }
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem("connectedWallet");
    if (savedWallet) {
      dispatch(setConnectedWallet(savedWallet));
    }
  }, [dispatch]);

  useEffect(() => {
    const reAuthenticate = async () => {
      if (connectedWallet && !isAuthenticated && connectedWallet !== "stoic") {
        await loginHandler(connectedWallet);
      } else if (connectedWallet === "stoic" && !isStoicAuthenticated) {
        await stoicLogin();
      }
    };
    reAuthenticate();
  }, [connectedWallet, isAuthenticated, isStoicAuthenticated]);

  return (
    <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
      <div className="w-[300px] absolute bg-gray-100 shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins">
        {connectedWallet ? (
          <h1 className="font-bold text-[#2A1F9D] dark:text-darkText">Switch Wallet</h1>
        ) : (
          <h1 className="font-bold text-[#2A1F9D] dark:text-darkText">Connect a Wallet</h1>
        )}
        <h1 className="text-xs text-gray-500 dark:text-darkTextSecondary mt-3 italic">
          {connectedWallet && (
            <>
              <span className="text-[#2A1F9D] dark:text-blue-400 font-semibold">
                {connectedWallet.toUpperCase()}
              </span>
              <span> is connected</span>
            </>
          )}
        </h1>

        {/* Wallet Selection List */}
        <div className="flex flex-col gap-2 mt-3 text-sm">
          {connectedWallet !== "ii" && (
            <div
              className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:text-darkText"
              onClick={() => (isSwitchingWallet ? loginHandlerIsSwitch("ii") : loginHandler("ii"))}
            >
              Internet Identity
              <div className="w-8 h-8">
                <img src={icplogo} alt="connect_wallet_icon" className="object-fill w-9 h-8 bg-white p-1 rounded-[20%]" />
              </div>
            </div>
          )}

          {connectedWallet !== "nfid" && (
            <div
              className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:text-darkText"
              onClick={() => (isSwitchingWallet ? loginHandlerIsSwitch("nfid") : loginHandler("nfid"))}
            >
              NFID
              <div className="w-8 h-8">
                <img src={nfid} alt="connect_wallet_icon" className="object-fill w-9 h-8 bg-white p-1 rounded-[20%]" />
              </div>
            </div>
          )}

          {connectedWallet !== "stoic" && (
            <div
              className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:text-darkText"
              onClick={() => (isSwitchingWallet ? loginHandlerIsSwitch("stoic") : loginHandler("stoic"))}
            >
              Stoic Wallet
              <div className="w-8 h-8">
                <img src={stoiclogo} alt="connect_wallet_icon" className="object-fill w-9 h-8 bg-white p-1 rounded-[20%]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WalletModal;
