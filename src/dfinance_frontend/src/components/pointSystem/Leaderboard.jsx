import React, { useEffect, useState } from "react";
import { leaderboardData as originalLeaderboardData } from "../../utils/constants";
import Pagination from "../Common/pagination";
import { useAuth } from "../../utils/useAuthClient";

const ITEMS_PER_PAGE = 10;
const BREAKPOINT = 1280;

const Leaderboard = () => {
  const { principal, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedLeaderboardData, setSortedLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [isTableView, setIsTableView] = useState(window.innerWidth > BREAKPOINT);

  const truncatePrincipal = (principal) => {
    return principal.length > 14 ? `${principal.slice(0, 14)}...` : principal;
  };

  useEffect(() => {
    let sortedData = [...originalLeaderboardData];
    sortedData.sort((a, b) => parseInt(a.rank.replace("#", "")) - parseInt(b.rank.replace("#", "")));

    const userEntryIndex = sortedData.findIndex(entry => entry.principal === principal);
    if (userEntryIndex !== -1) {
      const userEntry = { ...sortedData[userEntryIndex], rank: `#${userEntryIndex + 1}` };
      setUserRank(userEntry);
    }

    setSortedLeaderboardData(sortedData);
  }, [principal]);

  useEffect(() => {
    const handleResize = () => {
      setIsTableView(window.innerWidth > BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(sortedLeaderboardData.length / ITEMS_PER_PAGE);
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = sortedLeaderboardData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getRankStyle = (rank) => {
    switch (rank) {
      case "#1":
        return { color: "#FFD700", fontWeight: "bold" }; // Gold color for 1st place
      case "#2":
        return { color: "#C0c0c0", fontWeight: "bold" }; // Silver color for 2nd place
      case "#3":
        return { color: "#CD7F32", fontWeight: "bold" }; // Bronze color for 3rd place
      default:
        return {}; // Default style for other ranks
    }
  };

  const getCardBorderColorClass = (rank, entryPrincipal) => {
    if (entryPrincipal === principal) {
      return "border-blue-500 ring-blue-500"; // Permanent color for authenticated user's principal
    }
  
    switch (rank) {
      case "#1":
        return "border-yellow-300 ring-yellow-500"; // Gold for 1st place
      case "#2":
        return "border-gray-400 ring-gray-400"; // Silver for 2nd place
      case "#3":
        return "border-[#CD7F32] ring-[#CD7F32]"; // Bronze for 3rd place
      default:
        return "border-gray-300 ring-gray-300"; // Default for others
    }
  };

  return (
    <div className="w-full max-w-8xl mx-auto lg:px-0.5 p-10 -mt-8 ">
      <div className="w-full max-w-8xl mx-auto lg:px-0.5">
        
        {isTableView ? (
          <div className="w-full max-w-10xl overflow-x-auto">
            <table className="w-full text-[#2A1F9D] font-medium text-xs md:text-sm lg:text-base dark:text-darkText mt-1  ">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary1">
                  <th className="py-2 px-6 ">Rank</th>
                  <th className="py-2 px-6 ">Principal</th>
                  <th className="py-2 px-6 text-nowrap ">Supply Points</th>
                  <th className="py-2 px-6 text-nowrap  ">Borrow Points</th>
                  <th className="py-2 px-6 text-nowrap ">Liquidity Points</th>
                  <th className="py-2 px-6 text-nowrap ">Boosts</th>
                  <th className="py-2 px-6 text-nowrap ">Total Points</th>
                </tr>
              </thead>
              <tbody className="mt-2">
                {userRank && (
                  <>
                    <tr className={`hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg cursor-pointer${getCardBorderColorClass(userRank.rank, userRank.principal)}`}>
                      <td className="py-6 px-6" style={getRankStyle(userRank.rank)}>{userRank.rank}</td>
                      <td className="py-6 px-6">{truncatePrincipal(userRank.principal)}</td>
                      <td className="py-6 px-10 ">{userRank.supplyPoints}</td>
                      <td className="py-6 px-6">{userRank.borrowPoints}</td>
                      <td className="py-6 px-10">{userRank.liquidityPoints}</td>
                      <td className="py-6 px-6">{userRank.boosts}</td>
                      <td className="py-6 px-6">{userRank.totalPoints}</td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="text-center">
                      <hr className="my-4 border-gray-600 dark:border-gray-600 w-20 mx-auto " />

                      </td>
                    </tr>
                  </>
                )}

                {currentItems.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg cursor-pointer mt-8 ${getCardBorderColorClass(entry.rank, entry.principal)}`}
                  >
                    <td className="py-2 px-6" style={getRankStyle(entry.rank)}>{entry.rank}</td>
                    <td className="py-2 px-6">{truncatePrincipal(entry.principal)}</td>
                    <td className="py-2 px-10">{entry.supplyPoints}</td>
                    <td className="py-2 px-6">{entry.borrowPoints}</td>
                    <td className="py-2 px-10">{entry.liquidityPoints}</td>
                    <td className="py-2 px-6">{entry.boosts}</td>
                    <td className="py-2 px-6">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="block">
            {userRank && (
              <>
                <div className={`p-4 mb-4 mt-6 text-[#2A1F9D] font-medium text-xs md:text-sm lg:text-base dark:text-darkText rounded-md shadow-md ring-1 ${getCardBorderColorClass(userRank.rank, userRank.principal)}`}>
                  <div className="flex justify-between items-center">
                    <span style={getRankStyle(userRank.rank)}>{userRank.rank}</span>
                    <span className="font-semibold">{truncatePrincipal(userRank.principal)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>Supply Points: {userRank.supplyPoints}</div>
                    <div>Borrow Points: {userRank.borrowPoints}</div>
                    <div>Liquidity Points: {userRank.liquidityPoints}</div>
                    <div>Boosts: {userRank.boosts}</div>
                  </div>
                  <div className="mt-2 font-semibold text-lg">
                    Total Points: {userRank.totalPoints}
                  </div>
                </div>
                <hr className="my-4 border-gray-600 dark:border-white w-20 mx-auto px-5" />

              </>
            )}

            {currentItems.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 mb-4 rounded-md text-sm text-[#2A1F9D] font-medium md:text-sm lg:text-base dark:text-darkText shadow-md border-1 ring-1 ${getCardBorderColorClass(entry.rank, entry.principal)}`}
              >
                <div className="flex justify-between items-center">
                  <span style={getRankStyle(entry.rank)}>{entry.rank}</span>
                  <span className="font-semibold">{truncatePrincipal(entry.principal)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>Supply Points: {entry.supplyPoints}</div>
                  <div>Borrow Points: {entry.borrowPoints}</div>
                  <div>Liquidity Points: {entry.liquidityPoints}</div>
                  <div>Boosts: {entry.boosts}</div>
                </div>
                <div className="mt-2 font-semibold text-lg">
                  Total Points: {entry.totalPoints}
                </div>
              </div>
            ))}
          </div>
        )}

{sortedLeaderboardData.length > 0 && (
        <div className="flex justify-center mt-4 gap-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default Leaderboard;
