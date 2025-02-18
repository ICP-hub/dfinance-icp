import React from "react";
import Button from "../Common/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsWalletConnected,
  setWalletModalOpen,
  setConnectedWallet,
} from "../../redux/reducers/utilityReducer";
import { Modal } from "@mui/material";
import { useAuths } from "../../utils/useAuthClient";
import Element from "../../../public/element/Elements.svg";
import MySupply from "./MySupply";
import WalletModal from "./WalletModal";
import { Wallet } from "lucide-react";
import {
  ConnectWallet,
  useBalance,
  useIdentityKit,
} from "@nfid/identitykit/react";
const CreateWallet = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const dispatch = useDispatch();
  const { isWalletModalOpen, isSwitchingWallet } = useSelector(
    (state) => state.utility
  );
  const { isAuthenticated, principal, createLedgerActor } = useAuths();
  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };
  const ConnectBtn = ({ onClick }) => (
    <Button title="Connect Wallet" onClickHandler={onClick} />
  );
  return (
    <>
      {isAuthenticated ? (
        <MySupply />
      ) : (
        <div className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
          <div className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none">
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
            Please connect your wallet to see your supplies, borrowings anf open
            positions.
          </p>
          <ConnectWallet
            connectButtonComponent={ConnectBtn}
            className="rounded-full bg-black"
          />
        </div>
      )}

      {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
    </>
  );
};

export default CreateWallet;
