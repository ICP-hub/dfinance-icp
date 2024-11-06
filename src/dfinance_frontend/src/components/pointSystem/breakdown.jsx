import React, { useState, useEffect } from 'react';
import { TRANSACTION_DATA } from '../../utils/constants';
import Pagination from "../Common/pagination";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const ITEMS_PER_PAGE = 10;
const BREAKPOINT = 1335;

const Breakdown = () => {
    const [isTableView, setIsTableView] = useState(window.innerWidth > BREAKPOINT);
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

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
        <div className="p-6">
            {Object.entries(TRANSACTION_DATA).map(([section, transactions]) => {
                const currentPage = currentPages[section] || 1;
                const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const currentTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                const isVisible = visibleSections[section];

                // Calculate total amount for this section
                const totalUsdValueSupply = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);


                return (
                    <div key={section} className="mb-8">
                        <div className="p-4 mb-8  bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 dark:bg-bottom-left-to-top-right-gradient  text-[#2A1F9D] dark:text-darkText rounded-lg  flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <h3 className="text-xl font-semibold">{section}</h3>
                                <div className="text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                                    <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                                        Total
                                    </span>{" "}
                                    ${formatNumber(totalUsdValueSupply)}
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
                                        <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-[#2A1F9D] dark:text-darkTextSecondary1">
                                            <div className="py-2">Asset</div>
                                            <div className="text-center py-2">Amount</div>
                                            <div className="text-center py-2">Asset Points</div>
                                            <div className="text-center py-2">Points Accrued</div>
                                            <div className="py-2 px-20">Timestamp</div>
                                        </div>
                                        <div className="divide-y divide-gray-300">
                                            {currentTransactions.length > 0 ? (
                                                currentTransactions.map((tx, index) => (
                                                    <div
                                                        key={index}
                                                        className="grid grid-cols-5 gap-4 py-4 text-[#2A1F9D] text-sm font-bold dark:text-darkText"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <img
                                                                src={tx.imageUrl}
                                                                alt={tx.assetName}
                                                                className="w-6 h-6 rounded-full"
                                                            />
                                                            <span>{tx.assetName}</span>
                                                        </div>
                                                        <div className="text-center">{tx.amount}</div>
                                                        <div className="text-center">{tx.assetPoints}</div>
                                                        <div className="text-center">{tx.points}</div>
                                                        <div className="flex flex-col items-center text-center text-nowrap">
    <span className="text-gray-500">
        {new Date(tx.timestamp).toLocaleDateString('en-GB')}{" "}
        <strong className="ml-1 text-black dark:text-white">
            {new Date(tx.timestamp).toLocaleTimeString('en-GB')}
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
                                        <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-[#2A1F9D] dark:text-darkTextSecondary1 mb-2">
                                            <div>Asset</div>
                                            <div className="text-center">Amount</div>
                                            <div className="text-center">Asset Points</div>
                                            <div className="text-center">More</div>
                                        </div>
                                        {currentTransactions.length > 0 ? (
                                            currentTransactions.map((tx, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-4 gap-4 py-4 border-b text-[#2A1F9D] text-sm font-bold dark:text-darkText"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <img
                                                            src={tx.imageUrl}
                                                            alt={tx.assetName}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                        <span>{tx.assetName}</span>
                                                    </div>
                                                    <div className="text-center">{tx.amount}</div>
                                                    <div className="text-center">{tx.assetPoints}</div>
                                                    <div className="text-center">
                                                        <button onClick={() => toggleDropdown(index)}>
                                                            {openDropdown[index] ? <ChevronUp /> : <ChevronDown />}
                                                        </button>
                                                    </div>

                                                    {/* Additional Info Dropdown */}
                                                    {openDropdown[index] && (
                                                        <div className="col-span-4 mt-2 p-2 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 dark:bg-bottom-left-to-top-right-gradient  text-[#2A1F9D]   dark:text-darkText rounded-lg">
                                                            <p>
                                                                <span className="font-semibold">Points Accrued:</span> {tx.points}
                                                            </p>
                                                            <p className="mt-1">
                                                                <span className="font-semibold">Timestamp:</span>{" "}
                                                                <span className="text-gray-500 ml-1">
                                                                    {new Date(tx.timestamp).toLocaleDateString('en-GB')}
                                                                </span>{" "}
                                                                <strong className="ml-1">
                                                                    {new Date(tx.timestamp).toLocaleTimeString('en-GB')}
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
                                            onPageChange={(pageNumber) => handlePageChange(section, pageNumber)}
                                        />
                                    </div>
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
