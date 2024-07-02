import React from "react";
import { useLocation } from "react-router-dom";
import { transactionHistory } from "../../utils/constants"; // Adjust the path as per your project structure
import { MdContentCopy } from "react-icons/md"; // Import MdContentCopy icon

const TransactionHistory = () => {
  const location = useLocation();
  const shouldRenderTransactionHistory =
    location.pathname === "/dashboard/transaction-history";

  // Function to handle copy action
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${text} to clipboard!`);
  };

  return (
    <div className="w-full lg:w-12/12 mt-12">
      {shouldRenderTransactionHistory && (
        <div className="w-full min-h-[500px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl relative dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <h1 className={`text-[#2A1F9D] font-bold text-xl md:text-2xl my-2 ml-2 pb-4 dark:text-darkText ${transactionHistory.length > 0 ? 'lg:border-b-2 border-[#fff]' : ''}`}>
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
                      <tr key={tx.id} className="w-full font-semibold text-[#4659CF]  hover:bg-[#ddf5ff8f] rounded-lg">
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{tx.hash}</span>
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
                            <span>{tx.from}</span>
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
                            <span>{tx.to}</span>
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
                  
                  <div key={tx.id} className="w-full border border-[#2A1F9D] rounded-lg shadow-lg mb-4 p-4 dark:[#FEFEFE] dark:bg-darkBackground">
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
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
