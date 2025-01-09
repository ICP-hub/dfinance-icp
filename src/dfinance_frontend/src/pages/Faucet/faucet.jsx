import React, { useEffect, useState } from "react";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "@mui/material";
import { useAuth } from "../../utils/useAuthClient";
import FaucetDetails from "../../components/Faucet/FaucetDetails";
import Element from "../../../public/element/Elements.svg";
import { setUserData } from "../../redux/reducers/userReducer";
import {setIsWalletConnected,setWalletModalOpen,setConnectedWallet,} from "../../redux/reducers/utilityReducer";
import icplogo from "../../../public/wallet/icp.png";
import plug from "../../../public/wallet/plug.png";
import bifinity from "../../../public/wallet/bifinity.png";
import nfid from "../../../public/wallet/nfid.png";
import WalletModal from "../../components/Dashboard/WalletModal";

const Faucet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);

  const { isAuthenticated, login, logout, principal, createLedgerActor } =
    useAuth();

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const [isTestnetMode, setIsTestnetMode] = useState(true); // Add state for testnet mode

  const handleTestnetModeToggle = () => {
    setIsTestnetMode((prevMode) => !prevMode);
  };


  return (
    <>
      {isTestnetMode && (
        <>
          <div className="mb-10 ml-2">
            <p className="text-[#707086] text-[14px] text-justify  dark:text-darkTextSecondary leading-relaxed mt-3">
              With our testnet Faucet you can receive free assets to test the
              Dfinance Protocol. Make sure to switch your wallet provider to the
              appropriate testnet network, select desired asset, and click
              ‘Faucet’ to get tokens transferred to your wallet. The assets on
              our testnet are not “real,” meaning they have no monetary value.
            </p>
          </div>
          {isAuthenticated ? (
            <FaucetDetails />
          ) : (
            <div className="relative w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
              <div className="absolute right-0 top-0 h-full w-full md:w-1/2 pointer-events-none">
                <img
                  src={Element}
                  alt="Elements"
                  className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                 
                />
              </div>
              <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg dark:text-darkText">
                Please, connect your wallet
              </h1>
              <p className="text-[#737373] my-2 font-medium text-center dark:text-darkTextSecondary">
                Please connect your wallet to get free testnet assets
              </p>

              <Button
                title="Connect Wallet"
                onClickHandler={handleWalletConnect}
              />

              {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Faucet;
