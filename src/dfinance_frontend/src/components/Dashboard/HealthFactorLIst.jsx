import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { SlidersHorizontal } from "lucide-react";
import { useSelector } from "react-redux";
import WalletModal from "./WalletModal";
import Lottie from "../Common/Lottie";
import useAssetData from "../customHooks/useAssets";
import MiniLoader from "../Common/MiniLoader";
import Error from "../../pages/Error";
import { Infinity, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { useLocation } from "react-router-dom";
import Pagination from "../Common/pagination";

/**
 * HealthFactorList Component
 *
 * Fetches and displays a list of users with their associated health factors
 * @returns {JSX.Element} - Returns the HealthFactorList component displaying users' health factors and additional details.
 */

const HealthFactorList = () => {
  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const { backendActor, isAuthenticated, fetchReserveData, createLedgerActor } =
    useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [userAccountDataa, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});
  const filterRef = useRef(null);
  const [like, setLike] = useState(false);
  const [healthFactorLoading, setHealthFactorLoading] = useState(true);
  const {
    assets,
    AssetImages,
    filteredItems,
    asset_supply,
    asset_borrow,
    fetchAssetSupply,
    fetchAssetBorrow,
    loading: filteredDataLoading,
  } = useAssetData();

  const [showFilter, setShowFilter] = useState(false);
  const [healthFilter, setHealthFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [assetBalances, setAssetBalances] = useState([]);
  const { isSwitchingWallet } = useSelector((state) => state.utility);
  const cachedData = useRef({});
  const popupRef = useRef(null);
  const location = useLocation();
  const userAccountData = location.state?.userAccountData || {};
  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
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
      const result = await backendActor.guard_admin_only();

      if ("Ok" in result) {
        setLike(true); // Admin verified
      } else {
        console.warn("Not an admin:", result.Err);
        setLike(false); // Not admin
      }
    } catch (error) {
      console.error("Error checking admin status:", error.message);
      setError(error.message);
      setLike(false); // Fallback to false

      if (error.message.toLowerCase().includes("freeze canister")) {
        setIsFreezePopupVisible(true);
      }
    }
  };

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

      if (allUsers.length > 0) {
        setUsers(allUsers);
        setHealthFactorLoading(false);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setHealthFactorLoading(false);
    }
  };

  const fetchAssetData = async () => {
    const balances = {};
    const batchSize = 5;

    const processUsersInBatches = async (usersBatch) => {
      for (const [principal, userData] of usersBatch) {
        if (!principal) continue;

        const userBalances = {};

        await Promise.all(
          assets.map(async (asset) => {
            const reserveDataForAsset = await fetchReserveData(asset);
            const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
            const debtTokenId =
              reserveDataForAsset?.Ok?.debt_token_canister?.[0];

            const assetBalance = {
              dtokenBalance: null,
              debtTokenBalance: null,
            };

            try {
              const formattedPrincipal = Principal.fromText(
                principal.toString()
              );
              const account = { owner: formattedPrincipal, subaccount: [] };

              if (dtokenId) {
                const dtokenActor = createLedgerActor(dtokenId, idlFactory);
                if (dtokenActor) {
                  const balance = await dtokenActor.icrc1_balance_of(account);
                  assetBalance.dtokenBalance = Number(balance);
                }
              }

              if (debtTokenId) {
                const debtTokenActor = createLedgerActor(
                  debtTokenId,
                  idlFactory1
                );
                if (debtTokenActor) {
                  const balance = await debtTokenActor.icrc1_balance_of(
                    account
                  );
                  assetBalance.debtTokenBalance = Number(balance);
                }
              }
            } catch (error) {
              console.error(`Error processing balances for ${asset}:`, error);
            }

            userBalances[asset] = assetBalance;
          })
        );

        balances[principal] = userBalances;

        setAssetBalances((prevBalances) => ({
          ...prevBalances,
          [principal]: userBalances,
        }));
      }
    };

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await processUsersInBatches(batch);
    }
  };

  /**
   * This function fetches the user account data for a specific principal. It uses caching to avoid fetching data
   * for the same principal multiple times. The fetched data is stored in the `cachedData` ref.
   *
   * @param {string} principal - The principal of the user whose account data is being fetched.
   */
  const fetchUserAccountDataWithCache = async (principal) => {
    if (backendActor && isAuthenticated) {
      setHealthFactorLoading(true);

      const principalString = principal.toString();

      const userBalance = assetBalances[principalString];
      if (!userBalance) {
        setHealthFactorLoading(false);
        return;
      }

      if (cachedData.current[principalString]) {
        setUserAccountData((prev) => ({
          ...prev,
          [principalString]: cachedData.current[principalString],
        }));
        setHealthFactorLoading(false);
        return;
      }

      try {
        if (!principalString || cachedData.current[principalString]) return;

        const principalObj = Principal.fromText(principalString);

        if (!userBalance) {
          setHealthFactorLoading(false);
        }

        const user = users.find(
          ([userPrincipal]) => userPrincipal.toString() === principalString
        );

        if (user) {
          const userInfo = user[1];

          const reserves = userInfo?.reserves?.flat() || [];

          let assetBalancesObj = [];
          let borrowBalancesObj = [];

          reserves.forEach(([asset, assetInfo]) => {
            const assetBalance = BigInt(
              userBalance?.[asset]?.dtokenBalance || 0
            );
            const borrowBalance = BigInt(
              userBalance?.[asset]?.debtTokenBalance || 0
            );

            if (assetBalance > 0n) {
              assetBalancesObj.push({
                balance: assetBalance,
                name: asset,
              });
            }
            if (borrowBalance > 0n) {
              borrowBalancesObj.push({
                balance: borrowBalance,
                name: asset,
              });
            }
          });

          const assetBalancesParam =
            assetBalancesObj.length > 0 ? [assetBalancesObj] : [];
          const borrowBalancesParam =
            borrowBalancesObj.length > 0 ? [borrowBalancesObj] : [];

          const result = await backendActor.get_user_account_data(
            [principalObj],
            assetBalancesParam,
            borrowBalancesParam
          );

          if (result?.Err === "ERROR :: Pending") {
            console.warn("Pending state detected. Retrying...");
            setTimeout(() => fetchUserAccountDataWithCache(principal), 1000);
            return;
          }

          if (result?.Ok) {
            cachedData.current[principalString] = result;
            setUserAccountData((prev) => ({
              ...prev,
              [principalString]: result,
            }));
          }
        } else {
          console.error("User not found for principal:", principalString);
        }
      } catch (error) {
        console.error("Error fetching user account data:", error.message);
      } finally {
        setHealthFactorLoading(false);
      }
    }
  };

  const showSearchBar = () => {
    setShowSearch(!showSearch);
  };

  const openPopup = (principal, data) => {
    const rawHealthFactor =
      Math.trunc((Number(data.healthFactor) / 1e10) * 100) / 100;

    const extractedData = {
      principal,
      totalCollateral: Number(data.collateral) / 1e8,
      totalDebt: Number(data.debt) / 1e8,
      liquidationThreshold: Number(data.liquidationThreshold) / 1e8,
      availableBorrow: Number(data.availableBorrow) / 1e8,
      healthFactor: rawHealthFactor < 100 ? rawHealthFactor : "Infinity",
    };

    setSelectedUser(extractedData);
  };

  // Function to get the asset supply value
  const getAssetSupplyValue = (asset, principal) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]);
      return supplyValue;
    }
    return;
  };

  // Function to get the asset borrow value
  const getAssetBorrowValue = (asset, principal) => {
    if (asset_borrow[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]);
      return borrowValue;
    }
    return;
  };
  const closePopup = () => {
    setSelectedUser(null);
  };
  const usersPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter users based on search query and health factor
  const filteredUsers = Object.entries(userAccountData).filter(
    ([principal, data]) => {
      if (!data || !data.healthFactor) return false;

      const healthFactor =
        Math.trunc((Number(data.healthFactor) / 1e10) * 100) / 100;
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

  // Pagination logic

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Function to download the Excel file
  const downloadExcel = () => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) {
      console.error("No data available to export.");
      return;
    }

    const data = Object.entries(userAccountData).map(([principal, user]) => {
      const healthFactor = user.healthFactor
        ? Math.trunc((Number(user.healthFactor) / 1e10) * 100) / 100
        : 0;

      return {
        Principal: principal,
        "Total Collateral": user.collateral
          ? (Number(user.collateral) / 1e8).toFixed(2)
          : "0",
        "Total Debt": user.debt ? (Number(user.debt) / 1e8).toFixed(2) : "0",
        "Available Borrow": user.availableBorrow
          ? (Number(user.availableBorrow) / 1e8).toFixed(2)
          : "0",
        "Liquidation Threshold": user.liquidationThreshold
          ? (Number(user.liquidationThreshold) / 1e8).toFixed(2)
          : "0",
        "Health Factor":
          user.healthFactor &&
          (Number(user.healthFactor) >= 3.4028236692093848e28 ||
            healthFactor > 100)
            ? "Infinity"
            : healthFactor,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users Data");

    worksheet["!cols"] = [
      { wch: 60 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
    ];

    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    worksheet["!autofilter"] = { ref: "A1:G1" };

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cell_address]) continue;

      worksheet[cell_address].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    const fileName = `User_Health_Factors_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.xlsx`;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataBlob, fileName);
  };

  // Function to download user data
  const downloadUserData = (selectedUser) => {
    if (!selectedUser) {
      console.error("No user selected.");
      return;
    }

    const userData = users
      .find(([principal]) => principal.toString() === selectedUser.principal)
      ?.at(1);
    if (!userData) {
      console.error("User data not found.");
      return;
    }

    const reserves = userData?.reserves || [];

    const data = reserves.flat().map(([asset, assetInfo]) => {
      const currentLiquidity = Number(assetInfo?.liquidity_index ?? 0n) / 1e8;
      const currentDebtIndex =
        Number(assetInfo?.variable_borrow_index ?? 0n) / 1e8;

      const userAssetBalance = assetBalances[selectedUser.principal]?.[
        asset
      ] || {
        dtokenBalance: 0,
        debtTokenBalance: 0,
      };

      const assetBalance = Number(userAssetBalance.dtokenBalance) / 1e8 || 0;
      const debtBalance = Number(userAssetBalance.debtTokenBalance) / 1e8 || 0;

      const supplyValue = Number(getAssetSupplyValue(asset)) || 0;
      const borrowValue = Number(getAssetBorrowValue(asset)) || 0;

      const assetSupply =
        currentLiquidity > 0
          ? Math.trunc(
              (Math.trunc((assetBalance / currentLiquidity) * 1e8) *
                supplyValue) /
                1e8
            )
          : 0;

      const assetBorrow =
        currentDebtIndex > 0
          ? (debtBalance * borrowValue) / (currentDebtIndex * 1e8)
          : 0;

      return {
        Principal: selectedUser.principal,
        Asset: asset,
        "Liquidity Index": currentLiquidity || 0,
        "Variable Borrow Index": currentDebtIndex || 0,
        "Total Asset Supply": formatValue(assetSupply),
        "Total Asset Borrow": formatValue(assetBorrow),
      };
    });

    const overviewData = [
      {
        Principal: selectedUser.principal,
        "Total Collateral": selectedUser.totalCollateral.toFixed(2),
        "Available Borrow": selectedUser.availableBorrow.toFixed(2),
        "Liquidation Threshold": selectedUser.liquidationThreshold.toFixed(2),
        "Health Factor": selectedUser.healthFactor,
        "Total Debt": selectedUser.totalDebt.toFixed(2),
      },
    ];

    const workbook = XLSX.utils.book_new();

    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

    const reservesSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, reservesSheet, "User Reserves");

    const overviewColumnWidths = [
      { wch: 60 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
    ];

    const reservesColumnWidths = [
      { wch: 60 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
    ];

    overviewSheet["!cols"] = overviewColumnWidths;
    reservesSheet["!cols"] = reservesColumnWidths;

    Object.keys(overviewSheet).forEach((cell) => {
      if (cell.match(/^[A-Z]1$/)) {
        overviewSheet[cell].s = { font: { bold: true } };
      }
    });

    Object.keys(reservesSheet).forEach((cell) => {
      if (cell.match(/^[A-Z]1$/)) {
        reservesSheet[cell].s = { font: { bold: true } };
      }
    });

    overviewSheet["!autofilter"] = { ref: "A1:G1" };
    overviewSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    reservesSheet["!autofilter"] = { ref: "A1:F1" };
    reservesSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataBlob, `${selectedUser.principal}_data.xlsx`);
  };

  // Function to format the value
  const formatValue = (num) => {
    if (num < 1) return num.toFixed(7);

    if (num >= 1e12)
      return num % 1e12 === 0
        ? num / 1e12 + "T"
        : (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)
      return num % 1e9 === 0 ? num / 1e9 + "B" : (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6)
      return num % 1e6 === 0 ? num / 1e6 + "M" : (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3)
      return num % 1e3 === 0 ? num / 1e3 + "K" : (num / 1e3).toFixed(2) + "K";

    return num.toFixed(2);
  };
  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    setCurrentPage((prevPage) =>
      Math.min(prevPage, Math.ceil(filteredUsers.length / usersPerPage) || 1)
    );
  }, [filteredUsers]);

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

  useEffect(() => {
    getAllUsers();
  }, []);

  useEffect(() => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) return;
    const updatedHealthFactors = {};
    Object.entries(userAccountData).forEach(([principal, data]) => {
      if (data?.Ok && Array.isArray(data.Ok) && data.Ok.length > 4) {
        updatedHealthFactors[principal] =
          Math.trunc((Number(data.Ok[4]) / 1e10) * 100) / 100;
      } else {
        updatedHealthFactors[principal] = null;
      }
    });

    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);

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
    if (users.length > 0) {
      fetchAssetData();
    }
  }, [users, assets]);

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

        const healthFactor =
          Math.trunc((Number(data.Ok[4]) / 1e10) * 100) / 100;
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

  useEffect(() => {
    const fetchSupplyData = async () => {
      if (assets.length === 0) return;

      try {
        for (const asset of assets) {
          await fetchAssetSupply(asset);
        }
      } catch (error) {
        console.error("Error fetching supply data:", error);
      }
    };

    const fetchBorrowData = async () => {
      if (assets.length === 0) return;

      try {
        for (const asset of assets) {
          await fetchAssetBorrow(asset);
        }
      } catch (error) {
        console.error("Error fetching borrow data:", error);
      }
    };

    fetchSupplyData();
    fetchBorrowData();
  }, [assets]);

  useEffect(() => {
    if (users.length > 0) {
      fetchAssetData();
    }
  }, [users, assets]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */
  return like ? (
    <div id="health-page" className="w-full mt-10">
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
                className="placeholder-gray-500 w-[300px] mr-4 z-20 px-4 py-[4px] focus:outline-none box bg-transparent text-black dark:text-white"
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
          {showSearch && (
            <div className="absolute top-full left-0 w-full px-3 mt-4 md:hidden">
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Search assets"
                className={`placeholder-gray-500 ml-[5px] w-[95%] block md:hidden z-20 px-6 py-[3px]  mb-3  focus:outline-none box bg-transparent text-black dark:text-white ${
                  showSearch
                    ? "animate-fade-left flex"
                    : "animate-fade-right hidden"
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="relative ml-3 flex items-center space-x-4">
            {/* Filter Icon */}
            <SlidersHorizontal
              size={20}
              onClick={() => setShowFilter(!showFilter)}
              className="cursor-pointer transition-colors duration-300 
             text-[#695fd4] dark:text-white hover:text-[#4c43b8]"
            />

            {/* Download Excel Icon */}
            <Download
              size={20}
              onClick={downloadExcel}
              className="cursor-pointer transition-colors duration-300 
            text-[#695fd4] dark:text-white hover:text-[#4c43b8]"
            />

            {/* Filter Dropdown */}
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
        ) : filteredUsers.length === 0 && !healthFactorLoading ? (
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
              <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText border-collapse mt-4">
                <thead>
                  <tr className="text-left text-[#233D63] dark:text-darkTextSecondary dark:opacity-80">
                    <th className="text-xs lg:text-sm px-1 py-5">
                      User Principal
                    </th>
                    <th className="text-xs lg:text-sm px-3 py-5 hidden sm:table-cell text-center">
                      Total Collateral
                    </th>
                    <th className="text-xs lg:text-sm px-3 py-5 hidden sm:table-cell text-center">
                      Total Debt
                    </th>
                    <th className="text-xs lg:text-sm px-3 py-5 text-center">
                      Health Factor
                    </th>
                    <th className="text-xs lg:text-sm px-3 py-5 text-end">
                      User Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(([principal, data], index) => {
                    if (!data) return null; // Ensure data exists

                    const totalCollateral = Number(data.collateral) / 1e8;
                    const totalDebt = Number(data.debt) / 1e8;
                    const healthFactor =
                      Math.trunc((Number(data.healthFactor) / 1e10) * 100) /
                      100;

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
                          ${totalDebt.toFixed(2)}
                        </td>
                        <td className="px-3 py-6 text-center">
                          <span
                            className={`flex items-center justify-center gap-1 ${
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
                            {healthFactor > 100 ? (
                              <>
                                <Infinity className="w-4 h-4 dark:text-darkText text-[#2A1F9D]" />
                              </>
                            ) : (
                              healthFactor.toFixed(2)
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-6 text-end">
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
            <div className="w-full flex justify-center mt-10">
              <div id="pagination" className="flex gap-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            ref={popupRef}
            className="bg-white dark:bg-darkOverlayBackground shadow-xl ring-1 ring-black/10 dark:ring-white/20 flex flex-col text-white dark:text-darkText z-50 rounded-[20px] p-6 w-[325px] lg1:w-[400px]"
          >
            {/* Header with Download Icon */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#FCBD78] dark:text-darkText text-center">
                User Details
              </h3>

              {/* 📥 Download Icon */}
              <Download
                size={20}
                className="cursor-pointer text-[#4659CF] dark:text-darkTextSecondary hover:text-[#FCBD78]"
                onClick={() => downloadUserData(selectedUser)}
              />
            </div>

            <p className="text-sm mt-4">
              <span className="text-[#233D63] dark:text-darkText">
                {selectedUser.principal}
              </span>
            </p>

            {/* User Assets Section */}
            <div className="mt-4">
              <h4 className="text-sm font-bold text-[#4659CF] dark:text-darkTextSecondary">
                User Assets:
              </h4>
              <div className="flex flex-wrap gap-4 mt-2">
                {users
                  .find(
                    ([principal]) =>
                      principal.toString() === selectedUser.principal
                  )
                  ?.at(1)
                  ?.reserves?.flat()
                  ?.map(([asset, assetInfo]) => {
                    // Extract values
                    const currentLiquidity = Number(
                      assetInfo?.liquidity_index || 0n
                    );
                    const currentDebtIndex = Number(
                      assetInfo?.variable_borrow_index || 0n
                    );

                    // Extract user balances
                    const userAssetBalance = assetBalances[
                      selectedUser.principal
                    ]?.[asset] || {
                      dtokenBalance: 0,
                      debtTokenBalance: 0,
                    };

                    const assetBalance =
                      Number(userAssetBalance.dtokenBalance) || 0;
                    const debtBalance =
                      Number(userAssetBalance.debtTokenBalance) || 0;

                    const supplyValue = Number(getAssetSupplyValue(asset)) || 0;
                    const borrowValue = Number(getAssetBorrowValue(asset)) || 0;

                    // Compute asset supply & borrow
                    const assetSupply =
                      currentLiquidity > 0
                        ? (assetBalance * supplyValue) /
                          (currentLiquidity * 1e8)
                        : 0;

                    const assetBorrow =
                      currentDebtIndex > 0
                        ? (debtBalance * borrowValue) / (currentDebtIndex * 1e8)
                        : 0;
                    const assetIndex = assets.indexOf(asset);
                    return (
                      <div key={asset} className="relative group">
                        {/* 🌟 Asset Image */}
                        <img
                          key={assetInfo}
                          src={
                            assetIndex !== -1
                              ? AssetImages[assetIndex]
                              : undefined
                          }
                          alt={asset || "asset"}
                          className="rounded-[50%] w-7"
                        />

                        {/* ✨ Hover Effect to Show Supply & Borrow ✨ */}
                        <div className="absolute hidden group-hover:block bg-[#fcfafa] text-[#233D63] lg:left-1/2 left-28 transform -translate-x-1/2 shadow-xl ring-2 ring-black/30 dark:ring-white/40 w-[180px] dark:bg-darkOverlayBackground dark:text-darkText text-xs rounded-lg p-2 bottom-14 z-50">
                          <p>Asset Supply: {formatValue(assetSupply)}</p>
                          <p>Asset Borrow: {formatValue(assetBorrow)}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* User Information */}
            <div className="bg-gray-100 hover:bg-gray-200 dark:bg-[#1D1B40] text-[#233D63] dark:text-darkText rounded-xl p-5 flex flex-col space-y-3 mt-4">
              <p className="text-sm flex justify-between">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Available Borrow:
                </span>
                <span>${selectedUser.availableBorrow.toFixed(2)}</span>
              </p>

              <p className="text-sm flex justify-between">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Liquidation Threshold:
                </span>
                <span>${selectedUser.liquidationThreshold.toFixed(2)}</span>
              </p>

              <p className="text-sm flex justify-between sm:hidden">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Collateral:
                </span>
                <span>${selectedUser.totalCollateral.toFixed(2)}</span>
              </p>

              <p className="text-sm flex justify-between sm:hidden">
                <span className="text-[#4659CF] dark:text-darkTextSecondary dark:opacity-80">
                  Total Debt:
                </span>
                <span>${selectedUser.totalDebt.toFixed(2)}</span>
              </p>
            </div>

            {/* Close Button */}
            <button
              className="mt-6 w-full bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-xl shadow-md px-5 py-1 text-lg font-semibold"
              onClick={closePopup}
            >
              Close
            </button>
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
