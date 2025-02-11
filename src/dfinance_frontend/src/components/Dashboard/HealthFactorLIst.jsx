import { useLocation } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useAuths } from "../../utils/useAuthClient";
import { SlidersHorizontal, SlidersVertical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import WalletModal from "../../components/Dashboard/WalletModal";
import Lottie from "../../components/Common/Lottie";
import useAssetData from "../customHooks/useAssets";
import MiniLoader from "../../components/Common/MiniLoader";
import Error from "../../pages/Error";

/**
 * HealthFactorList Component
 *
 * Fetches and displays a list of users with their associated health factors
 * @returns {JSX.Element} - Returns the HealthFactorList component displaying users' health factors and additional details.
 */

const HealthFactorList = () => {
  const { backendActor, isAuthenticated } = useAuths();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [userAccountData, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});
  const filterRef = useRef(null);
  const [like, setLike] = useState(false);
  const [healthFactorLoading, setHealthFactorLoading] = useState(true);
  const { assets, reserveData, filteredItems, error, loading } =
    useAssetData(searchQuery);
  const [showFilter, setShowFilter] = useState(false);
  const [healthFilter, setHealthFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const { isSwitchingWallet } = useSelector((state) => state.utility);
  const cachedData = useRef({});
  const popupRef = useRef(null);

  /**
   * Checks the status of the backend controller using the `to_check_controller` method.
   * It updates the `like` state based on the result from the backend.
   *
   * @returns {void}
   */
  const checkControllerStatus = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.to_check_controller();
      console.log("Controller Status:", result);
      setLike(result);
    } catch (err) {
      console.error("Error fetching controller status:", err);
      setError("Failed to fetch controller status");
    }
  };

  useEffect(() => {
    checkControllerStatus();
  }, [backendActor]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * This function retrieves the list of all users from the backend by calling `get_all_users` method.
   * It then sets the retrieved users into the state.
   */
  const getAllUsers = async () => {
    if (!backendActor) {
      console.error("Backend actor not initialized");
      return;
    }

    try {
      const allUsers = await backendActor.get_all_users();
      console.log("Retrieved Users:", allUsers);

      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  /**
   * This function fetches the user account data for a specific principal. It uses caching to avoid fetching data
   * for the same principal multiple times. The fetched data is stored in the `cachedData` ref.
   *
   * @param {string} principal - The principal of the user whose account data is being fetched.
   */
  const fetchUserAccountDataWithCache = async (principal) => {
    setHealthFactorLoading(true)
    if (!principal || cachedData.current[principal]) return;

    try {
      const result = await backendActor.get_user_account_data([principal]);

      if (result) {
        cachedData.current[principal] = result;
        setUserAccountData((prev) => ({ ...prev, [principal]: result }));
      }
    } catch (error) {
      console.error(` Error fetching data for principal: ${principal}`, error);
      setHealthFactorLoading(false)
    }finally{
      setHealthFactorLoading(false)
    }
  };

  useEffect(() => {
    if (!users || users.length === 0) return;
    Promise.all(
      users.map(([principal]) => {
        if (principal) return fetchUserAccountDataWithCache(principal);
        return null;
      })
    )
      .then(() => console.log(" All user account data fetched"))
      .catch((error) =>
        console.error(" Error fetching user account data in batch:", error)
      );
  }, [users]);

  useEffect(() => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) return;
    const updatedHealthFactors = {};
    Object.entries(userAccountData).forEach(([principal, data]) => {
      if (data?.Ok && Array.isArray(data.Ok) && data.Ok.length > 4) {
        updatedHealthFactors[principal] = Number(data.Ok[4]) / 10000000000;
      } else {
        updatedHealthFactors[principal] = null;
      }
    });

    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const showSearchBar = () => {
    setShowSearch(!showSearch);
  };
  const openPopup = (principal, data) => {
    if (!data?.Ok || !Array.isArray(data.Ok) || data.Ok.length < 7) return;

    const extractedData = {
      principal,
      totalCollateral: Number(data.Ok[0]) / 1e8,
      totalBorrowed: Number(data.Ok[1]) / 1e8,
      availableBorrow: Number(data.Ok[2]) / 1e8,
      liquidationThreshold: Number(data.Ok[3]) / 1e8,
      healthFactor:
        Number(data.Ok[4]) === 340282366920938463463374607431768211455n
          ? "∞"
          : (Number(data.Ok[4]) / 100000000000).toFixed(2),
      totalDebt: Number(data.Ok[5]) / 1e8,
      isHealthy: data.Ok[6] ? "Yes" : "No",
    };

    setSelectedUser(extractedData);
  };

  const closePopup = () => {
    setSelectedUser(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closePopup]);

  useEffect(() => {
    if (selectedUser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    const filteredUsers = Object.entries(userAccountData).filter(
      ([principal, data]) => {
        if (!data?.Ok || !Array.isArray(data.Ok) || data.Ok.length < 7)
          return false;

        const healthFactor = Number(data.Ok[4]) / 1e10;
        const principalStr = principal.toLowerCase();

        const matchesSearch =
          !searchQuery ||
          principalStr.includes(searchQuery.toLowerCase()) ||
          healthFactor.toString().includes(searchQuery);

        const matchesFilter =
          !healthFilter ||
          (healthFilter === "<1" && healthFactor < 1) ||
          (healthFilter === ">1" && healthFactor > 1) ||
          (healthFilter === "∞" && healthFactor > 100);

        return matchesSearch && matchesFilter;
      }
    );

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedUser]);

  return like ? (
    <div id="health-page" className="w-full">
      <div className="w-full md:h-[40px] flex items-center px-3 mt-4 md:-mt-8 lg:mt-8 relative">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText -ml-3">
          Users List
        </h1>

        <div className="ml-auto flex items-center">
          {showSearch && (
            <div className="ml-auto -pr-5 hidden md:block">
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Search by Health Factor or User"
                className="placeholder-gray-500 w-[400px] mr-4 z-20 px-4 py-[7px] focus:outline-none box bg-transparent text-black dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <svg
            onClick={showSearchBar}
            className="cursor-pointer button"
            width="25"
            height="25"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z"
              stroke="url(#paint0_linear_293_865)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.2613 11.5531L13.4638 13.75"
              stroke="url(#paint1_linear_293_865)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                <stop stopColor="#2E28A5" />
                <stop offset="1" stopColor="#FAAA98" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_293_865"
                x1="12.3625"
                y1="11.5531"
                x2="12.3625"
                y2="13.75"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#C88A9B" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative ml-3">
            <SlidersHorizontal
              size={20}
              onClick={() => setShowFilter(!showFilter)}
              className="cursor-pointer transition-colors duration-300 
           text-[#695fd4] dark:text-white hover:text-[#4c43b8]"
            />
            {showFilter && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
                <div
                  ref={filterRef}
                  className="absolute right-4 mt-[200px] w-36 bg-white dark:bg-gray-800 shadow-md rounded-md z-50"
                >
                  <ul className="text-[#233D63] dark:text-darkTextSecondary dark:opacity-80">
                    <li
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setHealthFilter("<1");
                        setShowFilter(false);
                      }}
                    >
                      {"< 1"}
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setHealthFilter(">1");
                        setShowFilter(false);
                      }}
                    >
                      {"> 1"}
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setHealthFilter("∞");
                        setShowFilter(false);
                      }}
                    >
                      {"∞ (Infinity)"}
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setHealthFilter("");
                        setShowFilter(false);
                      }}
                    >
                      {"Clear Filter"}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full mt-6">
        {healthFactorLoading ? (
          <div className="w-full mt-[200px] mb-[300px] flex justify-center items-center">
            <MiniLoader isLoading={true} />
          </div>
        ) : Object.keys(userAccountData).length === 0 && !healthFactorLoading ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[10rem] mb-[14rem]">
            <div className="mb-7 -ml-3 -mt-5">
              <Lottie />
            </div>
            <p className="text-[#8490ff] text-sm font-medium dark:text-[#c2c2c2]">
              NO USERS FOUND!
            </p>
          </div>
        ) : (
          <div className="w-full">
          <div className="w-full overflow-auto content">
            <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText border-collapse">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary dark:opacity-80">
                  <th className="px-1 py-5">User Principal</th>
                  <th className="px-3 py-5 hidden sm:table-cell text-center">
                    Total Collateral
                  </th>
                  <th className="px-3 py-5 hidden sm:table-cell text-center">
                    Total Borrowed
                  </th>
                  <th className="px-3 py-5 text-center">Health Factor</th>
                  <th className="px-3 py-5 text-end">User Details</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(userAccountData)
                  .filter(([principal, data]) => {
                    if (!data?.Ok || !Array.isArray(data.Ok) || data.Ok.length < 7)
                      return false;
        
                    const healthFactor = Number(data.Ok[4]) / 1e10;
                    const principalStr = principal.toLowerCase();
        
                    const matchesSearch =
                      !searchQuery ||
                      principalStr.includes(searchQuery.toLowerCase()) ||
                      healthFactor.toString().includes(searchQuery);
        
                    const matchesFilter =
                      !healthFilter ||
                      (healthFilter === "<1" && healthFactor < 1) ||
                      (healthFilter === ">1" && healthFactor > 1) ||
                      (healthFilter === "∞" && healthFactor > 100);
        
                    return matchesSearch && matchesFilter;
                  })
                  .map(([principal, data], index) => {
                    const totalCollateral = Number(data.Ok[0]) / 1e8;
                    const totalBorrowed = Number(data.Ok[1]) / 1e8;
                    const healthFactor = Number(data.Ok[4]) / 1e10;
        
                    return (
                      <tr
                        key={index}
                        className="w-full font-bold hover:bg-[#ddf5ff8f] border-b border-gray-300"
                      >
                        <td className="px-1 py-6 text-left">
                          {principal.length > 20
                            ? `${principal.substring(0, 20)}...`
                            : principal}
                        </td>
                        <td className="px-3 py-6 hidden sm:table-cell text-center">
                          ${totalCollateral.toFixed(2)}
                        </td>
                        <td className="px-3 py-6 hidden sm:table-cell text-center">
                          ${totalBorrowed.toFixed(2)}
                        </td>
                        <td className="px-3 py-6 text-center">
                          <span
                            className={` ${
                              healthFactor > 100
                                ? "text-yellow-500"
                                : healthFactor === 0
                                ? "text-red-500"
                                : healthFactor > 3
                                ? "text-green-500"
                                : healthFactor <= 1
                                ? "text-red-500"
                                : healthFactor <= 1.5
                                ? "text-orange-600"
                                : healthFactor <= 2
                                ? "text-orange-400"
                                : "text-orange-300"
                            }`}
                          >
                            {healthFactor > 100 ? "♾️" : healthFactor.toFixed(2)}
                          </span>
                        </td>
        
                        <td className="px-3 py-6 text-end">
                          <button
                            onClick={() => openPopup(principal, data, healthFactor)}
                            className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white px-5 py-1 text-xs rounded-md hover:bg-opacity-80 transition"
                          >
                            More
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            ref={popupRef}
            className="bg-white dark:bg-darkOverlayBackground dark:text-darkText p-6 rounded-xl shadow-lg w-80 relative"
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-600"
              onClick={closePopup}
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-[#2A1F9D] dark:text-darkText">
              User Details
            </h3>
            <p className="text-sm">
              <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                Principal:
              </span>
              <span className="text-[#2A1F9D] dark:text-darkText ">
                {" "}
                {selectedUser.principal}
              </span>
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <p className="text-sm">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Available Borrow:
                </span>
                <span className="text-[#2A1F9D] dark:text-darkText ">
                  {" "}
                  ${selectedUser.availableBorrow.toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Liquidation Threshold:
                </span>
                <span className="text-[#2A1F9D] dark:text-darkText ">
                  {" "}
                  ${selectedUser.liquidationThreshold.toFixed(2)}
                </span>
              </p>

              <p className="text-sm sm:hidden">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Collateral:
                </span>
                <span className="text-[#2A1F9D] dark:text-darkText ">
                  ${selectedUser.totalCollateral.toFixed(2)}
                </span>
              </p>
              <p className="text-sm sm:hidden">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Borrowed:
                </span>
                <span className="text-[#2A1F9D] dark:text-darkText ">
                  ${selectedUser.totalBorrowed.toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Debt:
                </span>
                <span className="text-[#2A1F9D] dark:text-darkText ">
                  ${selectedUser.totalDebt.toFixed(2)}
                </span>
              </p>
            </div>

            
          </div>
        </div>
      )}
      {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
    </div>
  ) : (
    <Error />
  );
};

export default HealthFactorList;
