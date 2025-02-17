import React from 'react';
import {  useLocation } from 'react-router-dom';
import {  useSelector } from 'react-redux';
import { useAuth } from "../../utils/useAuthClient";
import WalletModal from './WalletModal';

const TransactionDetail = () => {
  const {  isSwitchingWallet } = useSelector(state => state.utility);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { transaction } = location.state;


  return (
    <div className="relative w-full mt-10 md:w-12/12 mx-auto my-6 min-h-[380px] md:min-h-[530px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-start justify-start bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">

      <div className="relative z-10 w-full">
        <h1 className={`text-[#2A1F9D] font-bold text-xl md:text-2xl my-4 pb-4 mb-6 dark:text-darkText lg:border-b-2 border-[#fff]`}>
          Transaction
        </h1>

        <div className="grid grid-cols-2 gap-5 mt-2 text-[#2A1F9D] dark:text-darkText">
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Hash:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.hash}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Type:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.method}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Status:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.status}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Index:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.block}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Time:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.timestamp}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">From:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.from}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">To:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.to}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Amount:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.value}</span>
          </div>
          <div className="col-span-2 flex items-start">
            <span className="font-medium w-1/4">Fee:</span>
            <span className="flex-1 md:ml-1 lg1:-ml-40 dark:text-darkTextSecondary1">{transaction.fee}</span>
          </div>
        </div>
      </div>

      {(isSwitchingWallet || !isAuthenticated) && (
       <WalletModal />
      )}
    </div>
  );
};

export default TransactionDetail;
