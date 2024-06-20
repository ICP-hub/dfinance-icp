import React from 'react';
import { useLocation } from 'react-router-dom';
import { transactionHistory } from '../../utils/constants'; // Adjust the path as per your project structure

const TransactionHistory = () => {
  const location = useLocation();
  const shouldRenderTransactionHistory = location.pathname === '/dashboard/transaction-history';

  return (
    <div className="w-full lg:w-12/12 mt-12">
      {shouldRenderTransactionHistory && (
        <div className="w-full min-h-[500px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl relative"> {/* Added relative positioning */}
           <h1 className="text-[#2A1F9D] font-bold text-xl md:text-2xl my-2 ml-2">Transaction History</h1> 
          {transactionHistory.length === 0 ? (
            <div className="text-center mt-40">
              <p className="text-[#2A1F9D] text-sm font-semibold">
              Transaction History is not currently available for this market.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
                <thead>
                  <tr className="text-left text-[#233D63]">
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3 whitespace-nowrap">Type</th>
                    <th className="p-3 whitespace-nowrap">Amount</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((transaction) => (
                    <tr key={transaction.id} className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg">
                      <td className="p-3 align-top">{transaction.date}</td>
                      <td className="p-3 align-top">{transaction.type}</td>
                      <td className={`p-3 align-top ${transaction.type === 'Borrowed' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'Borrowed' ? '-' : '+'} ${transaction.amount}
                      </td>
                      <td className={`p-3 align-top ${transaction.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {transaction.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
