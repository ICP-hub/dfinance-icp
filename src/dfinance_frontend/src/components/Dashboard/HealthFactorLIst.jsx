import { useLocation } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { SlidersHorizontal, SlidersVertical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import WalletModal from "../../components/Dashboard/WalletModal";
import Lottie from "../../components/Common/Lottie";
import useAssetData from "../../components/Common/useAssets";
import MiniLoader from "../../components/Common/MiniLoader";
const HealthFactorList = () => {
  const { backendActor, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]); //  State to store users
  const { assets, reserveData, filteredItems, error, loading } =
    useAssetData(searchQuery);
  const [showFilter, setShowFilter] = useState(false);
  const [healthFilter, setHealthFilter] = useState(""); // Stores selected filter
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);
  const cachedData = useRef({}); //  Cache to store fetched user data
  const [userAccountData, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});
  const filterRef = useRef(null); // Reference for dropdown

  // Close dropdown when clicking outside
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
  const getAllUsers = async () => {
    if (!backendActor) {
      console.error("Backend actor not initialized");
      return;
    }

    try {
      const allUsers = await backendActor.get_all_users();
      console.log("Retrieved Users:", allUsers);

      setUsers(allUsers); //  Store users in state
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  //  Fetch Users on Component Mount
  useEffect(() => {
    getAllUsers();
  }, []);

  //  Fetch and cache user account data
  const fetchUserAccountDataWithCache = async (principal) => {
    if (!principal || cachedData.current[principal]) return; //  Skip if already cached

    try {
      const result = await backendActor.get_user_account_data([principal]);
      if (result) {
        cachedData.current[principal] = result; //  Cache result
        setUserAccountData((prev) => ({ ...prev, [principal]: result }));
      }
    } catch (error) {
      console.error(` Error fetching data for principal: ${principal}`, error);
    }
  };

  //  Fetch all user data in parallel, ensuring cache usage
  useEffect(() => {
    if (!users || users.length === 0) return; //  Ensure `users` is valid

    //  Fetch user data in parallel while respecting cache
    Promise.all(
      users.map(([principal]) => {
        if (principal) return fetchUserAccountDataWithCache(principal);
        return null; // Skip invalid users
      })
    )
      .then(() => console.log(" All user account data fetched"))
      .catch((error) =>
        console.error(" Error fetching user account data in batch:", error)
      );
  }, [users]); //  Runs when users change
  console.log("userAccountData", userAccountData);
  useEffect(() => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) return;

    const updatedHealthFactors = {};

    Object.entries(userAccountData).forEach(([principal, data]) => {
      if (data?.Ok && Array.isArray(data.Ok) && data.Ok.length > 4) {
        updatedHealthFactors[principal] = Number(data.Ok[4]) / 10000000000; //  Divide by 1e8
      } else {
        updatedHealthFactors[principal] = null; //  Handle missing values
      }
    });

    console.log(
      " Updated Health Factors (Divided by 1e8):",
      updatedHealthFactors
    );
    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);

  //  Extract and update Health Factor statistics

  const handleNavigate = (path) => {
    navigate(path);
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Function to toggle search bar visibility
  const showSearchBar = () => {
    setShowSearch(!showSearch);
  };
  // Function to Open Popup
  const openPopup = (principal, data) => {
    if (!data?.Ok || !Array.isArray(data.Ok) || data.Ok.length < 7) return;

    // Extract Unique Data Once
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

  // Function to Close Popup
  const closePopup = () => {
    setSelectedUser(null);
  };
  const popupRef = useRef(null);

  useEffect(() => {
    // Function to close popup when clicking outside
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    // Attach event listener when the popup is open
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Cleanup the event listener when popup closes
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closePopup]);
  useEffect(() => {
    // Disable scrolling when the popup is open
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
        const principalStr = principal.toLowerCase(); // Convert principal to lowercase

        // Apply search filter: Match principal OR health factor
        const matchesSearch =
          !searchQuery ||
          principalStr.includes(searchQuery.toLowerCase()) ||
          healthFactor.toString().includes(searchQuery);

        // Apply Health Factor filter
        const matchesFilter =
          !healthFilter ||
          (healthFilter === "<1" && healthFactor < 1) ||
          (healthFilter === ">1" && healthFactor > 1) ||
          (healthFilter === "∞" && healthFactor > 100);

        return matchesSearch && matchesFilter;
      }
    );

    return () => {
      // Ensure scrolling is enabled when the component unmounts
      document.body.style.overflow = "auto";
    };
  }, [selectedUser]);
  return (
    <div id="dashboard-page" className="w-full">
      {/* ICP Assets + Search Bar */}
      <div className="w-full md:h-[40px] flex items-center px-3 mt-4 md:-mt-8 lg:mt-8 relative">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText -ml-3">
          User Health Factors
        </h1>

        {/* 🔍 Search & 🔽 Filter */}
        <div className="ml-auto flex items-center">
          <div className="ml-auto -pr-5">
            {showSearch && (
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Search by Health Factor or User"
                className="placeholder-gray-500 w-[400px] mr-4 md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent text-black dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
          </div>
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

          {/* 🔽 Filter Button & Dropdown */}
          <div className="relative ml-3">
            <SlidersHorizontal
              size={20}
              onClick={() => setShowFilter(!showFilter)}
              className="cursor-pointer transition-colors duration-300 
             text-[#695fd4] dark:text-white hover:text-[#4c43b8]"
            />

            {/* Show dropdown when `showFilter` is true */}
            {showFilter && (
              <div className="fixed inset-0  z-50 bg-black bg-opacity-50">
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

        {/* Small Screen Search Bar */}
        {showSearch && (
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search assets"
            className="placeholder-gray-500 ml-[5px] w-[95%] block md:hidden z-20 px-6 py-[7px] mt-5 mb-1 focus:outline-none box bg-transparent text-black dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>
      {/* User Health Factors Table */}
      <div className="w-full mt-6">
        {loading ? (
          //  Show Loading Spinner While Fetching Users
          <div className="w-full mt-[200px] mb-[300px] flex justify-center items-center">
            <MiniLoader isLoading={true} />
          </div>
        ) : Object.keys(userAccountData).length === 0 && !loading ? (
          /*  No Data State */
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
              <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText">
                <thead>
                  <tr className=" text-left text-[#233D63] dark:text-darkTextSecondary dark:opacity-80">
                    <th className="p-5 ">User Principal</th>
                    <th className="p-5 hidden sm:table-cell text-left">
                      Total Collateral
                    </th>
                    <th className="p-5 hidden sm:table-cell text-left">
                      Total Borrowed
                    </th>
                    <th className="p-5 text-left ">Health Factor</th>
                    <th className="p-5 text-left">User Details</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(userAccountData)
                    .filter(([principal, data]) => {
                      if (
                        !data?.Ok ||
                        !Array.isArray(data.Ok) ||
                        data.Ok.length < 7
                      )
                        return false;

                      const healthFactor = Number(data.Ok[4]) / 1e10;
                      const principalStr = principal.toLowerCase();

                      // 🔍 Apply Search Filter (Principal or Health Factor)
                      const matchesSearch =
                        !searchQuery ||
                        principalStr.includes(searchQuery.toLowerCase()) ||
                        healthFactor.toString().includes(searchQuery);

                      // 🔽 Apply Health Factor Filter
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
                          className="w-full font-bold hover:bg-[#ddf5ff8f] rounded-lg border-b border-gray-300 "
                        >
                          <td className="p-6  text-left">
                            {principal.length > 20
                              ? `${principal.substring(0, 20)}...`
                              : principal}
                          </td>
                          <td className="p-6 hidden sm:table-cell text-left">
                            ${totalCollateral.toFixed(2)}
                          </td>
                          <td className="p-6 hidden sm:table-cell text-left">
                            ${totalBorrowed.toFixed(2)}
                          </td>
                          <td className="p-6 text-left">
                            <span
                              className={` ${
                                healthFactor > 100
                                  ? "text-yellow-500" // Infinity (♾️)
                                  : healthFactor === 0
                                  ? "text-red-500" // Default critical
                                  : healthFactor > 3
                                  ? "text-green-500" // Safe zone
                                  : healthFactor <= 1
                                  ? "text-red-500" // High risk
                                  : healthFactor <= 1.5
                                  ? "text-orange-600" // Medium risk
                                  : healthFactor <= 2
                                  ? "text-orange-400" // Lower risk
                                  : "text-orange-300" // Slightly risky
                              }`}
                            >
                              {healthFactor > 100
                                ? "♾️"
                                : healthFactor.toFixed(2)}
                            </span>
                          </td>

                          <td className="p-6 text-left">
                            <button
                              onClick={() =>
                                openPopup(principal, data, healthFactor)
                              }
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

      {/* Popup Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            ref={popupRef}
            className="bg-white dark:bg-darkOverlayBackground dark:text-darkText p-6 rounded-xl shadow-lg w-80 relative"
          >
            {/* Close Button */}
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
              <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                Principal:
              </b>
              <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                {" "}
                {selectedUser.principal}
              </span>
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <p className="text-sm">
                <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Available Borrow:
                </b>
                <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                  {" "}
                  ${selectedUser.availableBorrow.toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Liquidation Threshold:
                </b>
                <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                  {" "}
                  ${selectedUser.liquidationThreshold.toFixed(2)}
                </span>
              </p>

              {/* Moved Health Factor from Table to Popup */}
              <p className="text-sm sm:hidden">
                <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Collateral:
                </b>
                <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                  {" "}
                  ${selectedUser.totalCollateral.toFixed(2)}
                </span>
              </p>
              <p className="text-sm sm:hidden">
                <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Borrowed:
                </b>
                <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                  {" "}
                  ${selectedUser.totalBorrowed.toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <b className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Debt:
                </b>
                <span className="text-[#2A1F9D] dark:text-darkText font-bold">
                  {" "}
                  ${selectedUser.totalDebt.toFixed(2)}
                </span>
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={closePopup}
              className="mt-4 w-full bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg shadow-md px-5 py-2 text-[14px] font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
    </div>
  );
};

export default HealthFactorList;
