import React, { useState } from 'react';
import { TRANSACTION_DATA } from '../../utils/constants';

const ITEMS_PER_PAGE = 10; // Number of assets to display per page

const Breakdown = () => {
    // State to manage current page for each section
    const [currentPages, setCurrentPages] = useState({});

    // Function to handle page change for a specific section
    const handlePageChange = (section, pageNumber) => {
        setCurrentPages((prev) => ({
            ...prev,
            [section]: pageNumber,
        }));
    };

    return (
        <div className="p-6">
            {/* Render each section (Supply, Borrow, Withdraw, Repay) */}
            {Object.entries(TRANSACTION_DATA).map(([section, transactions]) => {
                // Get current page for the section, default to 1
                const currentPage = currentPages[section] || 1;
                // Calculate total pages for the section
                const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
                // Calculate the current page's transactions
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const currentTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                return (
                    <div key={section} className="mb-8">
                        {/* Section Box */}
                        <div className="p-4 mb-4 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 dark:bg-bottom-left-to-top-right-gradient text-[#2A1F9D] dark:text-darkText rounded-md text-center">
                            <h3 className="text-xl font-semibold">{section}</h3>
                        </div>

                        {/* Table for Larger Screens */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left rounded-lg">
                                <thead className="text-[#2A1F9D] dark:text-darkTextSecondary1">
                                    <tr>
                                        <th className="py-2 px-4">Asset</th>
                                        <th className="py-2 px-4">Amount</th>
                                        <th className="py-2 px-4">Asset Points</th>
                                        <th className="py-2 px-4">Points Accrued</th>
                                        <th className="py-2 px-4">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTransactions.length > 0 ? (
                                        currentTransactions.map((tx, index) => (
                                            <React.Fragment key={index}>
                                                <tr className="text-[#2A1F9D] dark:text-darkText">
                                                    <td className="py-2 px-4 flex items-center space-x-2">
                                                        <img
                                                            src={tx.imageUrl}
                                                            alt={tx.assetName}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                        <span>{tx.assetName}</span>
                                                    </td>
                                                    <td className="py-4 px-4">{tx.amount}</td>
                                                    <td className="py-4 px-4">{tx.assetPoints}</td>
                                                    <td className="py-4 px-4">{tx.points}</td>
                                                    <td className="py-4 px-4 text-nowrap">
                                                        {new Date(tx.timestamp).toLocaleString('en-GB', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: false,
                                                        })}
                                                    </td>
                                                </tr>
                                                {/* Render a line if there are more transactions and this is not the last transaction */}
                                                {index < currentTransactions.length - 1 &&
                                                    currentTransactions.length > 1 && (
                                                        <tr>
                                                            <td colSpan="5" className="border-b border-gray-500" />
                                                        </tr>
                                                    )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-2 px-4 text-center">
                                                No transactions available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Card Layout for Small Screens */}
                        <div className="md:hidden space-y-4">
                            {currentTransactions.length > 0 ? (
                                currentTransactions.map((tx, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg shadow-md text-[#2A1F9D] dark:text-darkText`}
                                    >
                                        <div className="flex items-center mb-2">
                                            <img
                                                src={tx.imageUrl}
                                                alt={tx.assetName}
                                                className="w-6 h-6 rounded-full mr-2"
                                            />
                                            <h4 className="font-semibold">{tx.assetName}</h4>
                                        </div>
                                        <p>
                                            <span className="font-semibold">Amount:</span> {tx.amount}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Asset Points:</span> {tx.assetPoints}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Points Accrued:</span> {tx.points}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Timestamp:</span>{' '}
                                            {new Date(tx.timestamp).toLocaleString('en-GB', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false,
                                            })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p>No transactions available.</p>
                            )}
                        </div>

                        {/* Pagination Controls (appear only when totalPages > 1) */}
                        {totalPages > 1 && (
                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={() =>
                                        handlePageChange(section, currentPage > 1 ? currentPage - 1 : 1)
                                    }
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-[#2A1F9D] text-white rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="self-center text-[#2A1F9D] dark:text-darkText">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        handlePageChange(
                                            section,
                                            currentPage < totalPages ? currentPage + 1 : totalPages
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-[#2A1F9D] text-white rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Breakdown;
