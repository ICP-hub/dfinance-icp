import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { transactionHistory } from "../../utils/constants";
import { MdContentCopy } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../utils/useAuthClient";
import { useDispatch, useSelector } from "react-redux";
import Element from "../../../public/element/Elements.svg";
import {
  setIsWalletConnected,
  setWalletModalOpen,
} from "../../redux/reducers/utilityReducer";
import Pagination from "../Common/pagination";
const ITEMS_PER_PAGE = 10;

const TransactionHistory = () => {
  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [Showsearch, setShowSearch] = useState(false);
  const [filteredTransactionHistory, setFilteredTransactionHistory] =
    useState(transactionHistory);
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const shouldRenderTransactionHistory =
    location.pathname === "/dashboard/transaction-history";
  const dispatch = useDispatch();
  const { isWalletCreated, isWalletModalOpen } = useSelector(
    (state) => state.utility
  );
  const [searchQuery, setSearchQuery] = useState("");

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const handleWalletConnect = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen));
  };

  const [inputValue, setInputValue] = useState("");
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };

  const handleWallet = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen));
    dispatch(setIsWalletConnected(true));
    navigate("/dashboard");
  };
  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard");
    }
  }, [isWalletCreated]);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, history]);

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  useEffect(() => {
    const filtered = transactionHistory.filter((tx) =>
      tx.method.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransactionHistory(filtered);
  }, [searchQuery]);

  const loginHandler = async (val) => {
    await login(val);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${text} to clipboard!`, {
      className: "custom-toast",
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const totalPages = Math.ceil(
    filteredTransactionHistory.length / ITEMS_PER_PAGE
  );
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const currentItems = filteredTransactionHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRowClick = (transaction) => {
    navigate(`/dashboard/transaction/${transaction.id}`, {
      state: { transaction },
    });
  };

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */
  return (
    <div className="relative w-full lg:w-12/12">
      {transactionHistory.length === 0 && (
        <div className="absolute right-0 top-0 h-full md:w-1/2 pointer-events-none sxs3:w-[65%] z-[-1]">
          <img
            src={Element}
            alt="Elements"
            className="h-full w-full object-cover rounded-r-3xl opacity-70 filter drop-shadow-[0_0_0_#fffff] dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
          />
        </div>
      )}
      {shouldRenderTransactionHistory && (
        <div className="w-full min-h-[400px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl relative dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <div
            className={`flex justify-between items-center pb-6 ${
              transactionHistory.length > 0 ? "lg:border-b-2 border-[#fff]" : ""
            }`}
          >
            <h1
              className={`text-[#2A1F9D] font-bold text-xl md:text-2xl my-2 dark:text-darkText `}
            >
              Transaction History
            </h1>
            <div className="ml-auto flex items-center">
              {Showsearch && (
                <input
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Search transactions"
                  style={{ fontSize: "0.75rem" }}
                  className={`placeholder-gray-500 w-[400px] md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent text-black dark:text-white ${
                    Showsearch
                      ? "animate-fade-left flex"
                      : "animate-fade-right hidden"
                  }`}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
              )}
              <svg
                onClick={showSearchBar}
                className="cursor-pointer button"
                width="55"
                height="25"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z"
                  stroke="url(#paint0_linear_293_865)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M11.2613 11.5531L13.4638 13.75"
                  stroke="url(#paint1_linear_293_865)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_293_865"
                    x1="3.5"
                    y1="3.5"
                    x2="13.5"
                    y2="14"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#2E28A5" />
                    <stop offset="1" stop-color="#FAAA98" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_293_865"
                    x1="12.3625"
                    y1="11.5531"
                    x2="12.3625"
                    y2="13.75"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#C88A9B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          {Showsearch && (
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search transactions"
              className={`placeholder-gray-500 w-[250px] -mt-5 mb-2 block md:hidden z-20 px-4 py-[2px] focus:outline-none box bg-transparent text-black dark:text-white ${
                Showsearch
                  ? "animate-fade-left flex"
                  : "animate-fade-right hidden"
              }`}
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          )}

          {filteredTransactionHistory.length === 0 ? (
            <div className="mt-[120px] flex flex-col justify-center align-center place-items-center ">
              <div className="w-20 h-15">
                <img
                  src="/Transaction/empty file.gif"
                  alt="empty"
                  className="w-30"
                />
              </div>
              <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
                No transaction found!
              </p>
            </div>
          ) : (
            <div className="w-full overflow-auto  ">
              <div className="hidden md:block">
                <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-[12px] lg:text-sm dark:text-darkText mt-2">
                  <thead>
                    <tr className="text-left text-[#2A1F9D] dark:text-darkText">
                      <th className="py-3 px-4">Transaction Hash</th>
                      <th className="py-3 ps-6">Methods</th>
                      <th className="py-3 px-8">Time</th>
                      <th className="py-3 px-4">From</th>
                      <th className="py-3 px-4">To</th>
                      <th className="py-3 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((tx, index) => (
                      <tr
                        key={tx.id}
                        onClick={() => handleRowClick(tx)}
                        className="w-full text-[#4659CF] hover:bg-[#ddf5ff8f] dark:hover:bg-[#5d59b0] rounded-lg h-[50px] cursor-pointer "
                      >
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.hash.slice(0, 14)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none hover:text-blue-400 hover:dark:text-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(tx.hash);
                              }}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="bg-[#ADB0FF]  text-[#2A1F9D] rounded-full px-1 py-1 mr-10">
                            <center>
                              <span className="text-[12px] dark:text-darkText">
                                {tx.method}
                              </span>
                            </center>
                          </div>
                        </td>
                        <td className="py-2 px-8 dark:text-darkTextSecondary">
                          {tx.age}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.from.slice(0, 14)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none hover:text-blue-400 hover:dark:text-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(tx.hash);
                              }}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center dark:text-darkTextSecondary1">
                            <span>{`${tx.to.slice(0, 14)}...`}</span>
                            <button
                              className="ml-2 focus:outline-none hover:text-blue-400 hover:dark:text-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(tx.hash);
                              }}
                            >
                              <MdContentCopy />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 dark:text-darkTextSecondary">
                          {tx.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden">
                {currentItems.map((tx, index) => (
                  <>
                    <p className="text-[#5B62FE] text-[14px] mb-3 dark:text-darkTextSecondary">
                      {tx.age}
                    </p>
                    <div
                      key={tx.id}
                      className="w-full border border-[#2A1F9D] dark:border-darkTextSecondary rounded-lg shadow-lg mb-6 p-4 dark:[#FEFEFE] dark:bg-[#2b2c4a]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          Transaction
                        </span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{`${tx.hash.slice(
                            0,
                            14
                          )}...`}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.hash);
                            }}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          Block:
                        </span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">
                          {tx.block}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          Method:
                        </span>
                        <div className="bg-[#ADB0FF] text-[#2A1F9D] rounded-2xl px-3">
                          <center>
                            <span className="text-[12px] dark:text-darkText">
                              {tx.method}
                            </span>
                          </center>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          From:
                        </span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">
                            {" "}
                            {`${tx.from.slice(0, 14)}...`}
                          </span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.hash);
                            }}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          To:
                        </span>
                        <div className="flex items-center">
                          <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary1">{`${tx.from.slice(
                            0,
                            14
                          )}...`}</span>
                          <button
                            className="ml-2 focus:outline-none text-[#4659CF] dark:text-darkTextSecondary1"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.hash);
                            }}
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          Value:
                        </span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">
                          {tx.value}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2A1F9D] font-semibold text-base text-nowrap dark:text-darkText">
                          Txn Fee:
                        </span>
                        <span className="ml-2 text-xs text-[#4659CF] dark:text-darkTextSecondary">
                          {tx.fee}
                        </span>
                      </div>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {filteredTransactionHistory.length > 0 && (
        <div className="flex justify-center mt-4 gap-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
