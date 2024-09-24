import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '@mui/material';
import { setIsWalletConnected, setWalletModalOpen } from '../../redux/reducers/utilityReducer';
import { useAuth } from "../../utils/useAuthClient";
import icplogo from '../../../public/wallet/icp.png';
import plug from "../../../public/wallet/plug.png";
import bifinity from "../../../public/wallet/bifinity.png";
import nfid from "../../../public/wallet/nfid.png";

const TransactionDetail = () => {
  const dispatch = useDispatch();
  const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility);
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const { transaction } = location.state;
  const navigate = useNavigate();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleTakeMeBack = () => {
    navigate('/');
  };

  const handleWalletConnect = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen));
  };

  const handleWallet = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen));
    dispatch(setIsWalletConnected(true));
    navigate('/dashboard/my-supply');
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate('/dashboard/wallet-details');
    }
  }, [isWalletCreated]);

  const loginHandler = async (val) => {
    await login(val);
  };

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

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

      {!isAuthenticated && (
        <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
          <div className='w-[300px] bg-gray-100 shadow-xl rounded-lg p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
            <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
            <div className='flex flex-col gap-2 mt-3 text-sm'>
              <div
                className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
                onClick={() => loginHandler("ii")}
              >
                Internet Identity
                <div className='w-8 h-8'>
                  <img src={icplogo} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText">
                Plug
                <div className='w-8 h-8'>
                  <img src={plug} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText">
                Bifinity
                <div className='w-8 h-8'>
                  <img src={bifinity} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
              <div
                className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText"
                onClick={() => loginHandler("nfid")}
              >
                NFID
                <div className='w-8 h-8'>
                  <img src={nfid} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                </div>
              </div>
            </div>
            <p className='w-full text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>
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
  );
};

export default TransactionDetail;
