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
import Element from "../../../public/Elements.svg"
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
    <div className="relative w-full lg:w-12/12 ">
      {transactionHistory.length === 0 && <div className="absolute right-0 top-0 h-full md:w-1/2 pointer-events-none sxs3:w-[65%] z-[-1]">
        <img
          src={Element}
          alt="Elements"
          className="h-full w-full object-cover rounded-r-3xl opacity-70 filter drop-shadow-[0_0_0_#fffff] dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
        />
      </div>}
      {shouldRenderTransactionHistory && (
        <div className="w-full min-h-[500px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl relative dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <h1 className={`text-[#2A1F9D] font-bold text-xl md:text-2xl my-2  pb-6 dark:text-darkText ${transactionHistory.length > 0 ? 'lg:border-b-2 border-[#fff]' : ''}`}>
            Transaction History
          </h1>
          {transactionHistory.length === 0 ? (
            <div className="mt-[120px] flex flex-col justify-center align-center place-items-center">
              <div className="w-20 h-15">
                <img src="/empty file.gif" alt="empty" className="w-30" />
              </div>
              <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
                Transaction History is not currently available for this market.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <div className="hidden md:block"> {/* Display table on medium screens and above */}
                <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-[12px] lg:text-sm dark:text-darkText mt-2">
                  <thead>
                    <tr className="text-left text-[#2A1F9D] dark:text-darkText">
                      <th className="py-3 px-4">Transaction Hash</th>
                      <th className="py-3 px-4">Block</th>
                      <th className="py-3 px-4">Methods</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4">From</th>
                      <th className="py-3 px-4">To</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Txn Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((tx, index) => (
                      <tr key={tx.id} className="w-full text-[#4659CF]  hover:bg-[#ddf5ff8f] dark:hover:bg-[#5d59b0] rounded-lg h-[50px]">
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.hash.slice(0, 15)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none"
                              onClick={() => copyToClipboard(tx.hash)}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary mr-7">{tx.block}</td>
                        <td className="py-2 px-4">
                          <div className="bg-[#ADB0FF]  text-[#2A1F9D] rounded-full px-1 py-1 mr-5">
                            <center><span className="text-[12px] dark:text-darkText">{tx.method}</span></center>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">{tx.age}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.from.slice(0, 15)}...`}</span>
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
                            <span>{`${tx.to.slice(0, 15)}...`}</span>
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
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">Block:</span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">{tx.block}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">Method:</span>
                        <div className="bg-[#ADB0FF] text-[#2A1F9D] rounded-2xl px-3">
                          <center><span className="text-[12px] dark:text-darkText">{tx.method}</span></center>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">From:</span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{tx.from}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={() => copyToClipboard(tx.from)}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">To:</span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{tx.to}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={() => copyToClipboard(tx.to)}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">Value:</span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">{tx.value}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">Txn Fee:</span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">{tx.fee}</span>
                      </div>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
