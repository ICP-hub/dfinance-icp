import React, { useState } from "react";
import { Modal } from "@mui/material";
import Button from "../Common/Button";
import icplogo from "../../../public/wallet/icp.png";
import nfid from "../../../public/wallet/nfid.png";
import {
  setIsWalletConnected,
  setWalletModalOpen,
  setConnectedWallet,
} from "../../redux/reducers/utilityReducer";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { setUserData } from "../../redux/reducers/userReducer";

/**
 * WalletModal Component
 *
 * This component displays a modal for connecting and switching between wallets.
 * @returns {JSX.Element} - Returns the WalletModal component for wallet connection and switching.
 */
const WalletModal = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);
  const { login, logout, isAuthenticated } = useAuth();

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const handleWallet = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
    dispatch(setIsWalletConnected(true));
    navigate("/dashboard");
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  /**
   * Handles switching the connected wallet.
   * It logs out the current wallet, switches to the new wallet, and authenticates the new wallet.
   *
   * @param {string} val - The wallet type to switch to (e.g., "ii" or "nfid").
   * @returns {void}
   */
  const loginHandlerIsSwitch = async (val) => {
    handleLogout();
    await logout();
    await login(val);
    dispatch(setConnectedWallet(val));
    dispatch(setWalletModalOpen({ isOpen: false, isSwitching: false }));
  };

  /**
   * This function handles logging in with a selected wallet.
   * @param {string} val - The wallet type to connect to.
   */
  const loginHandler = async (val) => {
    await login(val);
    dispatch(setConnectedWallet(val));
  };

  const handleLogout = () => {
    dispatch(setUserData(null));
    logout();
  };
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
  const walletDisplayName = (wallet) => {
    switch (wallet) {
      case "ii":
        return "Internet Identity";
      case "plug":
        return "Plug";
      case "bifinity":
        return "Bitfinity";
      case "nfid":
        return "NFID";
      default:
        return "Unknown Wallet";
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
      if (connectedWallet && !isAuthenticated) {
        await loginHandler(connectedWallet);
      }
    };
    reAuthenticate();
  }, [connectedWallet, isAuthenticated]);

  /* ===================================================================================
   *                                  RENDERED COMPONENT
   * =================================================================================== */

  return (
    <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
      <div className="w-[300px] absolute bg-gray-100 shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins">
        {connectedWallet ? (
          <h1 className="font-bold text-[#2A1F9D] dark:text-darkText">
            Switch wallet
          </h1>
        ) : (
          <h1 className="font-bold text-[#2A1F9D] dark:text-darkText">
            Connect a wallet
          </h1>
        )}
        <h1 className="text-xs text-gray-500 dark:text-darkTextSecondary mt-3 italic">
          {connectedWallet && (
            <>
              <span className="text-[#2A1F9D] dark:text-blue-400 font-semibold">
                {walletDisplayName(connectedWallet)}
              </span>
              <span> is connected</span>
            </>
          )}
        </h1>
        <div className="flex flex-col gap-2 mt-3 text-sm">
          {connectedWallet !== "ii" && (
            <div
              className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30  dark:text-darkText"
              onClick={() => {
                isSwitchingWallet
                  ? loginHandlerIsSwitch("ii")
                  : loginHandler("ii");
              }}
            >
              Internet Identity
              <div className="w-8 h-8">
                <img
                  src={icplogo}
                  alt="connect_wallet_icon"
                  className="object-fill w-9 h-8 bg-white p-1 rounded-[20%]"
                />
              </div>
            </div>
          )}

          {connectedWallet !== "nfid" && (
            <div
              className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30  dark:text-darkText"
              onClick={() => {
                isSwitchingWallet
                  ? loginHandlerIsSwitch("nfid")
                  : loginHandler("nfid");
              }}
            >
              NFID
              <div className="w-8 h-8">
                <img
                  src={nfid}
                  alt="connect_wallet_icon"
                  className="object-fill w-9 h-8 bg-white p-1 rounded-[20%]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WalletModal;
