import React, { useEffect, useState } from "react";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import { STACK_DETAILS_TABS } from "../../utils/constants";

import { useAuths } from "../../utils/useAuthClient";
import Element from "../../../public/element/Elements.svg";
import StakesConnected from "../../components/Stake/StakesConnected";

import icplogo from "../../../public/wallet/icp.png";
import WalletModal from "../../components/Dashboard/WalletModal";

const StakeDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isWalletCreated, isWalletModalOpen } = useSelector(
    (state) => state.utility
  );
  const { isAuthenticated } = useAuths();

  const handleWalletConnect = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen));
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  return (
    <>
      <div className="w-full">
        <h1 className="text-[#2A1F9D] text-xl inline-flex items-center  dark:text-darkText ml-1">
          Available on
          <img src={icplogo} alt="Icp Logo" className="mx-2 w-9 h-9 mr-3" />
          ICP Mainnet
        </h1>
        <div className="w-full flex flex-col  md2:flex-row mt-6">
          <div className="w-full md2:w-8/12 dxl:w-9/12">
            <h1 className="text-[#2A1F9D] font-bold text-xl dark:text-darkText">
              Staking
            </h1>
            <p className="text-[#5B62FE] text-sm text-justify mt-3 dark:text-darkTextSecondary">
              In the ICP network, token holders can stake their assets in the
              Safety Module to enhance the protocol's security while earning
              incentives. During a shortfall event, your stake may be partially
              used to cover the deficit, offering an additional layer of
              protection for the protocol. 
              <a href="#" className="underline">
                Learn more about risks involved
              </a>
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center flex-wrap text-[#4659CF] gap-6 dark:text-darkText">
          {STACK_DETAILS_TABS.map((data, index) => (
            <div key={index} className="relative group mb-11 mt-5">
              <button className="relative font-light text-sm dark:text-darkText dark:opacity-80">
                {data.title}
                <hr className="ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />
                <span className="mt-1 absolute top-full left-0 font-bold opacity-100 dark:opacity-100 transition-opacity text-[20px] text-[#2A1F9D] dark:text-darkBlue">
                  {data.count}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* isAuthenticated */}
      {isAuthenticated ? (
        <StakesConnected />
      ) : (
        <div className="relative w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
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
          <p className="text-[#737373] my-2  text-center font-light dark:text-darkTextSecondary">
            We couldn’t detect a wallet. Connect a wallet to stake and view your
            balance.
          </p>

          <Button title="Connect Wallet" onClickHandler={handleWalletConnect} />

          <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap justify-center align-center">
            <div className="flex relative text-white p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText  min-w-[250px]">
              <div className="flex w-full align-center items-center">
                <img src={icplogo} alt="Icp Logo" className="mx-2 w-6 h-6" />
                <h1 className="font-bold">XYZ</h1>
              </div>
              <div className="flex flex-col justify-center items-center">
                <span className="text-[12px]">Staking APR</span>
                <h1 className="font-bold ml-auto">6.24%</h1>
              </div>
            </div>
            <div className="flex relative text-white p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText  min-w-[250px]">
              <div className="flex w-full align-center items-center">
                <img src={icplogo} alt="Icp Logo" className="mx-2 w-6 h-6" />
                <h1 className="font-bold">XYZ</h1>
              </div>
              <div className="flex flex-col justify-center items-center">
                <span className="text-[12px]">Staking APR</span>
                <h1 className="font-bold ml-auto">6.24%</h1>
              </div>
            </div>
            <div className="flex relative text-white p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText  min-w-[250px]">
              <div className="flex w-full align-center items-center">
                <img src={icplogo} alt="Icp Logo" className="mx-2 w-6 h-6" />
                <h1 className="font-bold">XYZ</h1>
              </div>
              <div className="flex flex-col justify-center items-center">
                <span className="text-[12px]">Staking APR</span>
                <h1 className="font-bold ml-auto">6.24%</h1>
              </div>
            </div>
          </div>

          {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
        </div>
      )}
    </>
  );
};

export default StakeDetails;
