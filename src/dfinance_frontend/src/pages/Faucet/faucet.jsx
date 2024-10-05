import React, { useEffect, useState } from "react";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "@mui/material";
import { useAuth } from "../../utils/useAuthClient";
import FaucetDetails from "../../components/Faucet/FaucetDetails";
import Element from "../../../public/element/Elements.svg";
import { setUserData } from "../../redux/reducers/userReducer";
import {
  setIsWalletConnected,
  setWalletModalOpen,
  setConnectedWallet,
} from "../../redux/reducers/utilityReducer";
import icplogo from "../../../public/wallet/icp.png";
import plug from "../../../public/wallet/plug.png";
import bifinity from "../../../public/wallet/bifinity.png";
import nfid from "../../../public/wallet/nfid.png";

const Faucet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);
  console.log("isWalletswitching", isSwitchingWallet, connectedWallet);

  const { isAuthenticated, login, logout, principal, createLedgerActor } =
    useAuth();

  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const handleWallet = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
    dispatch(setIsWalletConnected(true));
    navigate("/dashboard/my-supply");
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  const loginHandlerIsSwitch = async (val) => {
    dispatch(setUserData(null));
    await logout();
    await login(val);
    dispatch(setConnectedWallet(val));
    dispatch(setWalletModalOpen({ isOpen: false, isSwitching: false }));
  };

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

  const [isTestnetMode, setIsTestnetMode] = useState(true); // Add state for testnet mode

  const handleTestnetModeToggle = () => {
    setIsTestnetMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/faucet-details");
    }
  }, [isWalletCreated]);

  return (
    <>
      {isTestnetMode && (
        <>
          <h1 className="text-[#2A1F9D] text-xl inline-flex items-center  dark:text-darkText -ml-1 py-2">
            <img
              src={icplogo}
              alt="Icp Logo"
              className="mx-2 w-9 h-9 mr-3 border-2 border-[#2A1F9D] rounded-[50%]"
            />
            ICP Market
          </h1>
          <div className="w-[85%] py-8 ml-2">
            <p className="text-[#707086] text-[14px] text-justify  dark:text-darkTextSecondary leading-relaxed">
              With testnet Faucet you can get free assets to test the Dfinance
              Protocol. Make sure to switch your wallet provider to the
              appropriate testnet network, select desired asset, and click
              ‘Faucet’ to get tokens transferred to your wallet. The assets on a
              testnet are not “real,” meaning they have no monetary value.
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
                  // Ensure image scales properly
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

              {(isSwitchingWallet || !isAuthenticated) && (
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
                          className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
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
                          className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
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
                    <p className="w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]">
                      Track wallet balance in read-only mode
                    </p>

                    <div className="w-full">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-[#233D63] focus:outline-none focus:border-blue-500 placeholder:text-[#233D63] dark:border-darkTextSecondary1 dark:placeholder:text-darkTextSecondary1 text-gray-600 dark:text-darkTextSecondary1 text-xs rounded-md dark:bg-transparent"
                        placeholder="Enter wallet address or username"
                      />
                    </div>

                    {inputValue && (
                      <div className="w-full flex mt-3">
                        <Button
                          title="Connect"
                          onClickHandler={handleWallet}
                          className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 px-20 shadow-lg font-semibold text-sm"
                        />
                      </div>
                    )}
                  </div>
                </Modal>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Faucet;
