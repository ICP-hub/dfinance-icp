import React, { useEffect, useState } from "react";
import Button from "../Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {setIsWalletConnected,setWalletModalOpen,setConnectedWallet,} from "../../redux/reducers/utilityReducer";
import { Modal } from "@mui/material";
import { useAuth } from "../../utils/useAuthClient";
import Element from "../../../public/element/Elements.svg";
import MySupply from "./MySupply";
import icplogo from "../../../public/wallet/icp.png";
import nfid from "../../../public/wallet/nfid.png";
import { Principal } from "@dfinity/principal";
import { setUserData } from "../../redux/reducers/userReducer";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../declarations/ckbtc_ledger";
import { useMemo } from "react";
import WalletModal from "./WalletModal";
import { Wallet } from "lucide-react";

const CreateWallet = () => {
  const dispatch = useDispatch();
  const { isWalletModalOpen,isSwitchingWallet} = useSelector((state) => state.utility);
  const { isAuthenticated, principal, createLedgerActor } =useAuth();

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const principalObj = Principal.fromText(principal);

  const [balance, setBalance] = useState(null);

  const ledgerActorckBTC = useMemo(
    () =>
      createLedgerActor(
        process.env.CANISTER_ID_CKBTC_LEDGER,
        ledgerIdlFactoryckBTC
      ),
    [createLedgerActor]
  );

  const ledgerActorckETH = useMemo(
    () =>
      createLedgerActor(
        process.env.CANISTER_ID_CKETH_LEDGER,
        ledgerIdlFactoryckETH
      ),
    [createLedgerActor]
  );

  useEffect(() => {
    const fetchBalance = async () => {
      if (isAuthenticated && ledgerActorckBTC && principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          const balance = await ledgerActorckBTC.icrc1_balance_of(account);
          setBalance(balance.toString());
        } catch (error) {
        }
      }
    };

    fetchBalance();
  }, [isAuthenticated, ledgerActorckBTC, principalObj]);

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
          <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />
        </div>
      )}

      {(isSwitchingWallet || !isAuthenticated) && (
       <WalletModal />
      )}
    </>
  );
};

export default CreateWallet;
