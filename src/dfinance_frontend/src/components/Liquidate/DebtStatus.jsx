import React, { useEffect, useState, useMemo } from "react";
import { LIQUIDATION_USERLIST_COL } from "../../utils/constants";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useRef } from "react";
import { Principal } from "@dfinity/principal";
import Pagination from "../../components/Common/pagination";
import UserInformationPopup from "./userInformation";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useAssetData from "../customHooks/useAssets";
import MiniLoader from "../Common/MiniLoader";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import Lottie from "../Common/Lottie";
import pLimit from "p-limit";
/**
 * DebtStatus Component
 *
 * This component manages the list of users with outstanding debts,
 * calculates their borrowing power, and determines liquidation risks.
 * It fetches user data, account balances, asset reserves, and liquidation statuses.
 *
 * @returns {JSX.Element} - Returns the DebtStatus component.
 */
const DebtStatus = () => {
  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const liquidateTrigger = useSelector(
    (state) => state.liquidateUpdate.LiquidateTrigger
  );
  const theme = useSelector((state) => state.theme.theme);
  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [assetBalances, setAssetBalances] = useState([]);
  const [liquidationUsers, setLiquidationUsers] = useState([]);
  const [liquidationLoading, setLiquidationLoading] = useState(false);
  const [error, setError] = useState("");
  const [supplyDataLoading, setSupplyDataLoading] = useState(true);
  const [borrowDataLoading, setBorrowDataLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userLoadingStates, setUserLoadingStates] = useState({});
  const [totalUsers, setTotalUsers] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cachedData = useRef({});
 const [userAccountData, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const {
    assets,
    filteredItems,
    asset_supply,
    asset_borrow,
    fetchAssetSupply,
    fetchAssetBorrow,
    loading: filteredDataLoading,
  } = useAssetData();
  const navigate = useNavigate();
  const {
    
    user,
    backendActor,
    fetchReserveData,
    createLedgerActor,
    isAuthenticated
  } = useAuth();

  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  /**
   * Fetches the total number of users from the backend.
   */
    const getAllUsers = async () => {
      if (!backendActor) {
        console.error("Backend actor not initialized");
        return;
      }
  
      try {
        const allUsers = await backendActor.get_all_users();
        console.log("Retrieved Users:", allUsers);
  
        // ✅ Use a Set to Store Unique Users
        const uniqueUsers = new Map();
  
        for (const user of allUsers) {
          uniqueUsers.set(user[0], user); // Use Map to ensure unique values
        }
  
        setUsers([...uniqueUsers.values()]); // ✅ Convert Map back to array & update state
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    useEffect(() => {
      getAllUsers();
    }, []);

  /**
   * Fetches a list of users eligible for liquidation.
   * @param {number} totalPages - The total number of pages.
   * @param {number} pageSize - The number of users per page.
   * @returns {Promise<Array>} - Returns an array of liquidation users.
   */
  useEffect(() => {
    console.log("User:", user);
    console.log("Users:", users);
    console.log("UserAccountData:", userAccountData);
  
    if (
      users &&
      Array.isArray(users) &&
      Object.keys(userAccountData || {}).length === users.length
    ) {
      const filtered = users
        .map((item) => {
          if (!item || !item[0]) return null;
  
          const principal = item[0];
          const accountData = userAccountData?.[principal];
  
          // ✅ Fix `totalDebt` to prevent NaN
          const totalDebt = Number(accountData?.Ok?.[1] || 0n) / 1e8;
          const healthFactor = accountData
            ? Number(accountData?.Ok?.[4] || 0n) / 1e10
            : 0;
  
          return {
            reserves: item[1]?.reserves || [],
            principal: principal,
            healthFactor: healthFactor,
            item,
            totalDebt,
          };
        })
        .filter(
          (mappedItem) =>
            mappedItem &&
            mappedItem.healthFactor > 1 &&
            mappedItem.principal.toText() !== user.toText() && // ✅ Fix `.toString()` issue
            mappedItem.totalDebt > 0
        );
  
      setFilteredUsers(filtered);
      console.log("Filtered Users:", filtered);
    }
  }, [users, userAccountData, user]);
  
  /**
   * Fetches and caches user account data to avoid redundant API calls.
   * @param {Object} userData - The user data object.
   */
  console.log("filteredUsers",filteredUsers)
 const fetchUserAccountDataWithCache = async (principal) => {
     if (backendActor && isAuthenticated) {
       const principalString = principal.toString();
 
       const userBalance = assetBalances[principalString];
       if (!userBalance) {
         return;
       }
       console.log("userBalance before function:", userBalance);
 
       if (cachedData.current[principalString]) {
         setUserAccountData((prev) => ({
           ...prev,
           [principalString]: cachedData.current[principalString],
         }));
         return;
       }
 
       try {
         if (!principalString || cachedData.current[principalString]) return;
 
         const principalObj = Principal.fromText(principalString);
 
         if (!userBalance) {
           console.error(
             "No data found for userBalance for this principal:",
             principalString
           );
 
           return;
         }
         const user = users.find(
           ([userPrincipal]) => userPrincipal.toString() === principalString
         );
 
         if (user) {
           const userInfo = user[1];
           console.log("userInfo", userInfo);
 
           const reserves = userInfo?.reserves?.flat() || [];
           console.log("reserves:", reserves);
 
           let assetBalancesObj = [];
           let borrowBalancesObj = [];
 
           reserves.forEach(([asset, assetInfo]) => {
             console.log("assetInfo:", assetInfo);
 
             const assetBalances = BigInt(
               userBalance?.[asset]?.dtokenBalance || 0
             );
             const borrowBalances = BigInt(
               userBalance?.[asset]?.debtTokenBalance || 0
             );
 
             if (assetBalances > 0n) {
               assetBalancesObj.push({
                 balance: assetBalances,
                 name: asset,
               });
             }
             if (borrowBalances > 0n) {
               borrowBalancesObj.push({
                 balance: borrowBalances,
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
 
           console.log("Backend result:", result);
 
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
       }
     }
   };
 
   useEffect(() => {
    console.log("useEffect triggered");
    console.log("Users:", users);
    console.log("Total users:", users?.length);
    console.log("Asset balance:", assetBalances);
  
    if (!users || users.length === 0) {
      console.log("No users found, exiting useEffect.");
      return;
    }
  
    // ✅ Filter users with Health Factor < 1 before processing
    const filteredUsers = users.filter(([principal, userData]) => {
      const rawHealthFactor = userAccountData?.[principal]?.Ok?.[4] || 0n; // Get raw value
      const healthFactor = rawHealthFactor >= 340282366920938463463374607431768211455n
        ? Infinity // Convert max BigInt to Infinity
        : Number(rawHealthFactor) / 1e10; // Otherwise, process normally
    
      console.log(`User: ${principal}, Health Factor: ${healthFactor}`);
    
      return healthFactor < 1; // ✅ Correctly filters non-infinity users
    });
    
  
    console.log(`Filtered Users (Health Factor < 1): ${filteredUsers.length}`);
  
    if (filteredUsers.length === 0) {
      console.log("No users found with health factor < 1, skipping processing.");
      return;
    }
  
    // Dynamically determine batch size based on filtered user count
    const totalUsers = filteredUsers.length;
    let batchSize;
  
    if (totalUsers >= 10000) {
      batchSize = 1000;
    } else if (totalUsers >= 5000) {
      batchSize = 500;
    } else if (totalUsers >= 2000) {
      batchSize = 100;
    } else {
      batchSize = 100; // ✅ Reduced batch size for better control
    }
  
    console.log(`Batch size determined: ${batchSize}`);
  
    const userChunks = [];
    for (let i = 0; i < totalUsers; i += batchSize) {
      userChunks.push(filteredUsers.slice(i, i + batchSize));
    }
  
    console.log(`Total batches created: ${userChunks.length}`);
  
    // ✅ Limit concurrency per batch (process all batches together, but queue inside each batch)
    const processBatchesInParallelWithQueue = async () => {
      try {
        await Promise.all(
          userChunks.map(async (batch, batchIndex) => {
            console.log(
              `🚀 Starting Batch ${batchIndex + 1} (size: ${batch.length})`
            );
  
            // Each batch gets its own `p-limit(1)` to process requests **one by one** inside the batch
            const batchQueue = pLimit(1);
  
            await Promise.all(
              batch.map(([principal]) =>
                batchQueue(async () => {
                  if (principal) {
                    console.log(
                      `Requesting data for: ${principal} in Batch ${
                        batchIndex + 1
                      }`
                    );
                    await fetchUserAccountDataWithCache(principal);
                    console.log(
                      `✅ Completed request for: ${principal} in Batch ${
                        batchIndex + 1
                      }`
                    );
                  }
                })
              )
            );
  
            console.log(`✅ Completed Batch ${batchIndex + 1}`);
          })
        );
  
        console.log("🎉 All batches completed!");
      } catch (error) {
        console.error("❌ Error in processing batches:", error);
      }
    };
  
    processBatchesInParallelWithQueue();
  }, [users, assetBalances, userAccountData]); // ✅ Added `userAccountData` to dependencies
  
console.log("userAccountData",userAccountData)
  const handleDetailsClick = (item) => {
    setSelectedAsset(item);
    setShowUserInfoPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const relevantItems = liquidationUsers.filter((item) => {
    console.log("Item:", item); // ✅ Check full structure
  
    if (!Array.isArray(item) || item.length < 2) return false; // ✅ Ensure valid structure
  
    const principalObj = item[0]; // ✅ Extract `Principal` correctly
    if (!principalObj || typeof principalObj.toText !== "function") return false; // ✅ Ensure it's valid
  
    const principal = principalObj.toText(); // ✅ Convert Principal properly
    const userData = item[1]; // ✅ User's financial data
  
    // ✅ Ensure `total_debt` and `total_collateral` exist & are arrays
    const debt = Array.isArray(userData.total_debt) && userData.total_debt.length > 0 ? userData.total_debt[0] : 0n;
    const collateral = Array.isArray(userData.total_collateral) && userData.total_collateral.length > 0 ? userData.total_collateral[0] : 0n;
  
    // ✅ Debug logs
    console.log(`Principal: ${principal}, User: ${user.toString()}`);
    console.log(`Debt: ${debt}, Collateral: ${collateral}`);
  
    return (
      principal !== user.toString() && // ✅ Compare properly
      debt !== 0n && 
      collateral !== 0n
    );
  });
  
  console.log("Final relevantItems:", relevantItems);
  

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(relevantItems.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = relevantItems.slice(indexOfFirstItem, indexOfLastItem);
console.log("currentItems",currentItems)
  
useEffect(() => {
    if (users.length > 0) {
      fetchAssetData();
    }
  }, [users, assets]);

const fetchAssetData = async () => {
    const balances = {};
    const totalUsers = users.length;
    let batchSize;

    if (totalUsers >= 10000) {
      batchSize = 1000;
    } else if (totalUsers >= 5000) {
      batchSize = 500;
    } else if (totalUsers >= 2000) {
      batchSize = 100;
    } else {
      batchSize = 100; // If fewer users, process all at once
    }
 // Adjust this based on your system's capacity

    const processUsersInBatches = async (usersBatch) => {
      for (const [principal, userData] of usersBatch) {
        if (!principal) continue;

        const userBalances = {};

        await Promise.all(
          assets.map(async (asset) => {
            const reserveDataForAsset = await fetchReserveData(asset);
            console.log("reserveDataForAsset", reserveDataForAsset);
            const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
            const debtTokenId =
              reserveDataForAsset?.Ok?.debt_token_canister?.[0];
            console.log("dtokenId", dtokenId);

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

        // ✅ Update state progressively to avoid UI freeze
        setAssetBalances((prevBalances) => ({
          ...prevBalances,
          [principal]: userBalances,
        }));
      }
    };

    // ✅ Process users in batches
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await processUsersInBatches(batch);
    }
  };

  

  const getBalanceForPrincipalAndAsset = (
    principal,
    assetName,
    balanceType
  ) => {
    const userBalances = assetBalances[principal] || {};
    const assetBalance = userBalances[assetName];
    return assetBalance ? assetBalance[balanceType] || 0 : 0;
  };

  const getAssetSupplyValue = (asset, principal) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]);
      return supplyValue;
    }

    return;
  };

  const getAssetBorrowValue = (asset, principal) => {
    if (asset_borrow[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]);
      return borrowValue;
    }

    return;
  };

  const calculateAssetSupply = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    console.log("reserve in asset supply", reserves);
    let currentLiquidity = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        currentLiquidity = reserveGroup[1]?.liquidity_index || 0;
        console.log("Liquidity Index for", assetName, ":", currentLiquidity);
      }
    });

    const assetBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "dtokenBalance"
      ) || 0;

    if (!currentLiquidity) return 0;

    return Math.trunc(
      (Number(assetBalance) * Number(getAssetSupplyValue(assetName))) /
        Number(currentLiquidity)
    );
  };

  const calculateAssetBorrow = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    console.log("reserves in borrow", reserves);
    let debtIndex = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        debtIndex = reserveGroup[1]?.variable_borrow_index || 0;
        console.log("Debt Index for", assetName, ":", debtIndex);
      }
    });

    const assetBorrowBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "debtTokenBalance"
      ) || 0;

    if (!debtIndex) return 0;

    return Math.trunc(
      (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetName))) /
        Number(debtIndex)
    );
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const popupRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      closePopup();
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text || typeof text !== "string") {
      return ""; // ✅ Return an empty string if text is undefined or not a string
    }
  
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };
  

  const formatValue = (value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return "0.00";
    }
    if (numericValue === 0) {
      return "0.00";
    } else if (numericValue >= 1) {
      return numericValue.toFixed(2);
    } else {
      return numericValue.toFixed(7);
    }
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

 

  

  
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

    console.log(
      " Updated Health Factors (Divided by 1e8):",
      updatedHealthFactors
    );
    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);

 

  useEffect(() => {
    const fetchSupplyData = async () => {
      if (assets.length === 0) return;
      setSupplyDataLoading(true);
      try {
        for (const asset of assets) {
          await fetchAssetSupply(asset);
        }
      } catch (error) {
        setSupplyDataLoading(false);
        console.error("Error fetching supply data:", error);
      } finally {
        setSupplyDataLoading(false);
      }
    };

    const fetchBorrowData = async () => {
      if (assets.length === 0) return;
      setBorrowDataLoading(true);
      try {
        for (const asset of assets) {
          await fetchAssetBorrow(asset);
        }
      } catch (error) {
        setBorrowDataLoading(false);
        console.error("Error fetching borrow data:", error);
      } finally {
        setBorrowDataLoading(false);
      }
    };

    fetchSupplyData();
    fetchBorrowData();
  }, [assets, liquidateTrigger]);

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }
  }, [showPopup]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div className="w-full">
      <div className="w-full md:h-[40px] flex items-center mt-8">
        <h1
          id="liquidation1"
          className="text-[#2A1F9D] font-bold text-lg dark:text-darkText"
        >
          Debt users list
        </h1>
      </div>
      <div className="w-full mt-6">
        {liquidationLoading ? (
          <div className="h-[400px] flex justify-center items-center">
            <MiniLoader isLoading={true} />
          </div>
        ) : !liquidationLoading && currentItems && currentItems.length === 0 ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[13rem] mb-[18rem]">
            <div className="mb-3 -ml-3 -mt-5">
              <Lottie />
            </div>
            <p className="text-[#8490ff] text-sm dark:text-[#c2c2c2] opacity-90">
              NO USERS FOUND!
            </p>
          </div>
        ) : (
          <div className="w-full min-h-[390px] mt-6 p-0 mb-20 select-none">
            <div className="w-full overflow-auto content">
              <table className="w-full text-[#2A1F9D] font-[500] text-sm md:text-sm lg:text-sm dark:text-darkText">
                <thead>
                  <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                    {LIQUIDATION_USERLIST_COL.slice(0, 2).map((item, index) => (
                      <td
                        key={index}
                        className="p-3 pl-1 whitespace-nowrap py-4"
                      >
                        {item.header}
                      </td>
                    ))}
                    <td className="p-3 hidden md:table-cell">
                      {LIQUIDATION_USERLIST_COL[2]?.header}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {LIQUIDATION_USERLIST_COL[3]?.header}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {LIQUIDATION_USERLIST_COL[4]?.header}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => {
                    const userLoading =
                      userLoadingStates[item.principal?._arr.toText()];
                    return (
                      <tr
                        key={index}
                        className={`w-full font-bold hover:bg-[#ddf5ff8f]  rounded-lg ${
                          index !== liquidationUsers.length - 1
                            ? "gradient-line-bottom"
                            : ""
                        }`}
                      >
                        <td className="p-2 align-top py-8 ">
                          <div className="flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mt-2">
                            <p>
                              {truncateText(
                                item.principal?._arr?.toString(),
                                14
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="p-2 align-top py-8 ">
                          <div className="flex flex-row ml-2 mt-2">
                            <div>
                              <p className="font-medium">
                                {`$${formatValue(Number(item.debt) / 1e8)}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 align-top hidden md:table-cell py-8">
                          <div className="flex gap-2 items-center">
                            {Array.isArray(item?.userData?.reserves?.[0]) &&
                              item?.userData?.reserves?.[0].map(
                                (mappedItem, index) => {
                                  const assetName = mappedItem?.[0];
                                  const assetSupply = calculateAssetSupply(
                                    assetName,
                                    item
                                  );
                                  const assetBorrow = calculateAssetBorrow(
                                    assetName,
                                    item
                                  );

                                  if (assetBorrow > 0) {
                                    return (
                                      <img
                                        key={index}
                                        src={
                                          assetName === "ckBTC"
                                            ? ckBTC
                                            : assetName === "ckETH"
                                            ? ckETH
                                            : assetName === "ckUSDC"
                                            ? ckUSDC
                                            : assetName === "ICP"
                                            ? icp
                                            : assetName === "ckUSDT"
                                            ? ckUSDT
                                            : undefined
                                        }
                                        alt={assetName || "asset"}
                                        className="rounded-[50%] w-7"
                                      />
                                    );
                                  }
                                  return null;
                                }
                              )}
                          </div>
                        </td>
                        <td className="p-5 align-top hidden md:table-cell py-8">
                          <div className="flex gap-2 items-center">
                            {Array.isArray(item?.userData?.reserves?.[0]) &&
                              item?.userData?.reserves?.[0].map(
                                (mappedItem, index) => {
                                  const assetName = mappedItem?.[0];
                                  const assetSupply = calculateAssetSupply(
                                    assetName,
                                    item
                                  );
                                  const assetBorrow = calculateAssetBorrow(
                                    assetName,
                                    item
                                  );
                                  const item1 = filteredItems.find(
                                    (item) => item[0] === assetName
                                  );
                                  const reserveliquidationThreshold =
                                    Number(
                                      item1?.[1]?.Ok.configuration
                                        .liquidation_threshold
                                    ) / 100000000 || 0;
                                  console.log(
                                    "reserveliquidationThreshold",
                                    reserveliquidationThreshold
                                  );
                                  if (assetSupply > 0) {
                                    return (
                                      <img
                                        key={index}
                                        src={
                                          assetName === "ckBTC"
                                            ? ckBTC
                                            : assetName === "ckETH"
                                            ? ckETH
                                            : assetName === "ckUSDC"
                                            ? ckUSDC
                                            : assetName === "ICP"
                                            ? icp
                                            : assetName === "ckUSDT"
                                            ? ckUSDT
                                            : undefined
                                        }
                                        alt={assetName || "asset"}
                                        className="rounded-[50%] w-7"
                                      />
                                    );
                                  }
                                  return null;
                                }
                              )}
                          </div>
                        </td>
                        {}
                        <td className="p-3 align-top flex py-8">
                          <div className="w-full flex justify-end align-center">
                            <Button
                              title={<span className="inline">Liquidate</span>}
                              className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-[5px] px-9 py-3 shadow-md shadow-[#00000040] font-semibold text-[12px] lg:px-5 lg:py-[5px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[4px]"
                              onClickHandler={() => handleDetailsClick(item)}
                            />
                          </div>
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
      {showUserInfoPopup && selectedAsset && (
        <UserInformationPopup
          onClose={() => setShowUserInfoPopup(false)}
          mappedItem={selectedAsset}
          principal={selectedAsset.principal}
          userAccountData={userAccountData[selectedAsset.principal]}
          assetSupply={asset_supply}
          assetBorrow={asset_borrow}
          assetBalance={assetBalances}
        />
      )}
    </div>
  );
};

export default DebtStatus;