import React, { useState, useEffect } from "react";
import { TRANSACTION_DATA } from "../../utils/constants";
import Pagination from "../Common/pagination";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import useAssetData from "../customHooks/useAssets";
import MiniLoader from "../Common/MiniLoader";
import Lottie from "lottie-react";

const ITEMS_PER_PAGE = 10;
const BREAKPOINT = 1335;

const Breakdown = () => {
  const { loading, filteredItems } = useAssetData();
  const [isTableView, setIsTableView] = useState(
    window.innerWidth > BREAKPOINT
  );
  const [currentPages, setCurrentPages] = useState({});
  const [visibleSections, setVisibleSections] = useState(
    Object.keys(TRANSACTION_DATA).reduce((acc, section) => {
      acc[section] = false;
      return acc;
    }, {})
  );
  const [openDropdown, setOpenDropdown] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setIsTableView(window.innerWidth > BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePageChange = (section, pageNumber) => {
    setCurrentPages((prev) => ({
      ...prev,
      [section]: pageNumber,
    }));
  };

  const toggleSectionVisibility = (section) => {
    setVisibleSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleDropdown = (index) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatNumber = (num) => num.toLocaleString();

  return (
    <div className="p-0 md:p-6">
      {Object.entries(TRANSACTION_DATA).map(([section, transactions]) => {
        const currentPage = currentPages[section] || 1;
        const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const currentTransactions = transactions.slice(
          startIndex,
          startIndex + ITEMS_PER_PAGE
        );
        const isVisible = visibleSections[section];

        // Calculate total amount for this section
        const totalTransactionCount = transactions.length;

        return (
          <div key={section} className="mb-8">
            {loading ? (
              <div className="w-full mt-[200px] mb-[300px] flex justify-center items-center ">
                <MiniLoader isLoading={true} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col justify-center align-center place-items-center my-[10rem] mb-[14rem]">
                <div className="mb-7 -ml-3 -mt-5">
                  <Lottie />
                </div>
                <p className="text-[#8490ff] text-sm font-medium dark:text-[#c2c2c2]">
                  NO DATA FOUND!
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 mb-8  bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 dark:bg-bottom-left-to-top-right-gradient  text-[#2A1F9D] dark:text-darkText rounded-lg  flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-semibold  ss1:font-[500]">
                      {section}
                    </h3>
                    <div className="text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                      <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                        Count:
                      </span>{" "}
                      {totalTransactionCount}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSectionVisibility(section)}
                    className="text-sm text-[#2A1F9D] dark:text-darkText flex items-center"
                  >
                    {isVisible ? "Hide" : "Show"}
                    {isVisible ? (
                      <EyeOff size={16} className="ml-2" />
                    ) : (
                      <Eye size={16} className="ml-2" />
                    )}
                  </button>
                </div>

                {isVisible && (
                  <>
                    {isTableView ? (
                      <div>
                        {/* Table View */}
                        <div className="grid grid-cols-5 gap-10 font-[500] text-sm text-[#233D63] dark:text-darkTextSecondary">
                          <div className="flex items-center  text-center py-2">
                            Asset
                          </div>
                          <div className="flex items-center text-center py-2">
                            Amount
                          </div>
                          <div className="flex items-center text-center py-2">
                            Asset Points
                          </div>
                          <div className="flex items-center text-center py-2">
                            Points Accrued
                          </div>
                          <div className="py-2 px-28">Timestamp</div>
                        </div>
                        <div className="">
                          {currentTransactions.length > 0 ? (
                            currentTransactions.map((tx, index) => (
                              <div
                                key={index}
                                className={`grid grid-cols-5 gap-10 py-4 text-[#2A1F9D] text-sm dark:text-darkText hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg  ${
                                  index !== currentTransactions - 1
                                    ? "gradient-line-bottom"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center text-center space-x-2">
                                  <img
                                    src={tx.imageUrl}
                                    alt={tx.assetName}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span>{tx.assetName}</span>
                                </div>
                                <div className="flex items-center text-center py-2 px-2">
                                  ${tx.amount.toLocaleString()}
                                </div>
                                <div className="flex items-center text-center py-2 px-4">
                                  {tx.assetPoints.toLocaleString()}
                                </div>
                                <div className="flex items-center text-center py-2 px-4">
                                  {(
                                    tx.assetPoints * tx.amount
                                  ).toLocaleString()}
                                </div>

                                <div className="flex flex-col items-center text-end text-nowrap ml-8 py-2">
                                  <span className="text-gray-500">
                                    {new Date(tx.timestamp).toLocaleDateString(
                                      "en-GB"
                                    )}{" "}
                                    <strong className="ml-1 text-gray-600 dark:text-gray-400">
                                      {new Date(
                                        tx.timestamp
                                      ).toLocaleTimeString("en-GB")}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-4 text-center col-span-5">
                              No transactions available.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Small Screen View */}
                        <div className="grid grid-cols-3 gap-10 py-4 font-[500] text-sm text-[#233D63] dark:text-darkTextSecondary mb-2">
                          <div className=" flex items-center text-center ">
                            Asset
                          </div>
                          <div className="flex items-center text-center text-nowrap -ml-4">
                            Points Accured{" "}
                          </div>

                          <div className="flex items-center text-center ">
                            More
                          </div>
                        </div>
                        {currentTransactions.length > 0 ? (
                          currentTransactions.map((tx, index) => (
                            <div
                              key={index}
                              className={`grid grid-cols-3 gap-10 py-4  text-[#2A1F9D] text-sm font-medium dark:text-darkText  rounded-lg  ${
                                index !== currentTransactions - 1
                                  ? "gradient-line-bottom"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center text-center space-x-2 ">
                                <img
                                  src={tx.imageUrl}
                                  alt={tx.assetName}
                                  className="w-6 h-6 rounded-full"
                                />
                                <span>{tx.assetName}</span>
                              </div>
                              <div className=" flex items-center text-center px-4  ">
                                {" "}
                                {(tx.assetPoints * tx.amount).toLocaleString()}
                              </div>

                              <div className="flex items-center text-center px-4 ">
                                <button onClick={() => toggleDropdown(index)}>
                                  {openDropdown[index] ? (
                                    <ChevronUp />
                                  ) : (
                                    <ChevronDown />
                                  )}
                                </button>
                              </div>

                              {/* Additional Info Dropdown */}
                              {openDropdown[index] && (
                                <div className="col-span-3 -mt-4 p-2 text-sm font-medium shadow-md border-1 ring-1   text-[#2A1F9D]   dark:text-darkText rounded-lg">
                                  <p>
                                    <span className="font-[500] text-[#233D63] dark:text-darkTextSecondary">
                                      Assets Points:
                                    </span>{" "}
                                    {tx.assetPoints.toLocaleString()}
                                  </p>
                                  <p>
                                    <span className="font-[500] text-[#233D63] dark:text-darkTextSecondary">
                                      Amount:
                                    </span>{" "}
                                    ${tx.amount.toLocaleString()}
                                  </p>

                                  <p className="mt-1">
                                    <span className="font-[500] text-[#233D63] dark:text-darkTextSecondary">
                                      Timestamp:
                                    </span>{" "}
                                    <span className="text-gray-500 ml-1">
                                      {new Date(
                                        tx.timestamp
                                      ).toLocaleDateString("en-GB")}
                                    </span>{" "}
                                    <strong className="ml-1 text-gray-600 dark:text-gray-400">
                                      {new Date(
                                        tx.timestamp
                                      ).toLocaleTimeString("en-GB")}
                                    </strong>
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center col-span-4">
                            No transactions available.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="w-full flex justify-center mt-10">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={(pageNumber) =>
                            handlePageChange(section, pageNumber)
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Breakdown;
