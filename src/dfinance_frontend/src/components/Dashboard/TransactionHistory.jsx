import React, { useEffect, useState } from "react"
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom"
import { transactionHistory } from "../../utils/constants"; // Adjust the path as per your project structure
import { MdContentCopy } from "react-icons/md"; // Import MdContentCopy icon
import { toast } from 'react-toastify'; // Import toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import { useAuth } from "../../utils/useAuthClient"
import { Modal } from "@mui/material"
import { useDispatch, useSelector } from 'react-redux'
import {
  setIsWalletConnected,
  setWalletModalOpen
} from '../../redux/reducers/utilityReducer'
import {
  WALLET_ASSETS_TABLE_ROW,
  WALLET_ASSETS_TABLE_COL,
} from "../../utils/constants"
const TransactionHistory = () => {
  const location = useLocation();
  const {
    isAuthenticated,
    login,
  } = useAuth();
  const navigate = useNavigate();
  const shouldRenderTransactionHistory =
    location.pathname === "/dashboard/transaction-history";
    const dispatch = useDispatch()
    const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility)
    const handleWalletConnect = () => {
      console.log("connrcterd");
      dispatch(setWalletModalOpen(!isWalletModalOpen))
      // dispatch(setIsWalletCreated(true))
    }
  
    const handleWallet = () => {
      dispatch(setWalletModalOpen(!isWalletModalOpen))
      dispatch(setIsWalletConnected(true))
      navigate('/dashboard')
    }
    useEffect(() => {
      if (isWalletCreated) {
        navigate('/dashboard')
      }
    }, [isWalletCreated]);
    useEffect(() => {
      if (!isAuthenticated) {
        navigate('/dashboard'); // Navigate to dashboard when wallet is disconnected
      }
    }, [isAuthenticated, history]);
  
    const [inputValue, setInputValue] = useState('');
    const handleInputChange = (event) => {
      setInputValue(event.target.value);
    };
  
    const loginHandler = async (val) => {
      await login(val);
      // navigate("/");
  
      // await existingUserHandler();
    };
  // Function to handle copy action
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${text} to clipboard!`, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  
  return (
    <div className="w-full lg:w-12/12 mt-12">
      {shouldRenderTransactionHistory && (
        <div className="w-full min-h-[500px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl relative dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <h1 className={`text-[#2A1F9D] font-bold text-xl md:text-2xl my-2  pb-4 dark:text-darkText ${transactionHistory.length > 0 ? 'lg:border-b-2 border-[#fff]' : ''}`}>
            Transaction History
          </h1>
          {transactionHistory.length === 0 ? (
            <div className="text-center mt-40">
              <p className="text-[#2A1F9D] text-sm font-semibold dark:text-darkText">
                Transaction History is not currently available for this market.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <div className="hidden md:block"> {/* Display table on medium screens and above */}
                <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText mt-2">
                  <thead>
                    <tr className="text-left text-[#2A1F9D] dark:text-darkText">
                      <th className="py-2 px-4">Transaction Hash</th>
                      <th className="py-2 px-4">Block</th>
                      <th className="py-2 px-4">Methods</th>
                      <th className="py-2 px-4">Age</th>
                      <th className="py-2 px-4">From</th>
                      <th className="py-2 px-4">To</th>
                      <th className="py-2 px-4">Value</th>
                      <th className="py-2 px-4">Txn Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((tx, index) => (
                      <tr key={tx.id} className="w-full font-semibold text-[#4659CF]  hover:bg-[#ddf5ff8f] dark:hover:bg-[#5d59b0] rounded-lg">
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                          <span >{`${tx.hash.slice(0, 10)}...`}</span>
          
                            <button
                              className="ml-2 focus:outline-none"
                              onClick={() => copyToClipboard(tx.hash)}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">{tx.block}</td>
                        <td className="py-2 px-4">
                          <div className="bg-[#ADB0FF]  text-[#2A1F9D] rounded-full p-2">
                            <center><span className="text-sm dark:text-darkText">{tx.method}</span></center>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">{tx.age}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.from.slice(0, 10)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none"
                              onClick={() => copyToClipboard(tx.from)}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>


                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.to.slice(0, 10)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none"
                              onClick={() => copyToClipboard(tx.to)}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">{tx.value}</td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">{tx.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden"> {/* Display mobile-friendly layout on small screens */}
                {transactionHistory.map((tx, index) => (
                  <>
                    <p className="text-[#5B62FE] text-[14px] mb-3 dark:text-darkTextSecondary">{tx.age}</p>
                    <div key={tx.id} className="w-full border border-[#2A1F9D] dark:border-darkTextSecondary rounded-lg shadow-lg mb-6 p-4 dark:[#FEFEFE] dark:bg-[#2b2c4a]">

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">Transaction Hash:</span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{tx.hash}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={() => copyToClipboard(tx.hash)}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base dark:text-darkText ">Block:</span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{tx.block}</span>
                      </div>


                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base dark:text-darkText">From:</span>
                        <div className="flex items-center">
                          <span className="ml-2  text-[#2A1F9D] font-semibold text-base dark:text-darkText">To:</span>

                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#4659CF] text-xs dark:text-darkTextSecondary1">{tx.from}</span>
                        <button
                          className=" focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                          onClick={() => copyToClipboard(tx.from)}
                        >
                          <MdContentCopy />
                        </button>
                        <div className="flex items-center ">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{tx.to}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={() => copyToClipboard(tx.to)}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2 ">
                        <span className="text-[#2A1F9D] font-semibold text-base dark:text-darkText">Method:</span>
                        <span className="ml-2 text-xs bg-[#ADB0FF]  text-[#2A1F9D] rounded-full py-1 px-4 dark:text-darkText">{tx.method}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base dark:text-darkText">Value:</span>
                        <span className="ml-2 text-[#4659CF] dark:text-darkTextSecondary1">{tx.value}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base dark:text-darkText">Txn Fee:</span>
                        <span className="ml-2 text-[#4659CF] dark:text-darkTextSecondary1">{tx.fee}</span>
                      </div>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
         {!isAuthenticated && <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
            <div className='w-[300px] absolute bg-gray-100  shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
              <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
              <div className='flex flex-col gap-2 mt-3 text-sm'>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("ii")}>
                  Internet Identity
                  <div className='w-8 h-8'>
                    <img src={"https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                  Plug
                  <div className='w-8 h-8'>
                    <img src={"/plug.png.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                  Bifinity
                  <div className='w-8 h-8'>
                    <img src={"/bifinity.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText" onClick={() => loginHandler("nfid")}>
                  NFID
                  <div className='w-8 h-8'>
                    <img src={"/nfid.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
              </div>
              <p className='w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>Track wallet balance in read-only mode</p>

              <div className="w-full">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-[#233D63] focus:outline-none focus:border-blue-500 placeholder:text-[#233D63] dark:border-darkTextSecondary1 dark:placeholder:text-darkTextSecondary1 text-gray-600 dark:text-darkTextSecondary1 text-xs rounded-md dark:bg-transparent"
                  placeholder="Enter ethereum address or username"
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
          </Modal>}
    </div>
  );
};

export default TransactionHistory;
