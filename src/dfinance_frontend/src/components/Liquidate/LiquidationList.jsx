import React, { useEffect, useState, useCallback, useMemo } from "react";
import { LIQUIDATION_USERLIST_COL } from "../../utils/constants";
import Button from "../Common/button";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useRef } from "react";
import { Principal } from "@dfinity/principal";
import Pagination from "../Common/pagination";
import UserInformationPopup from "./UserInformation";
import useAssetData from "../customHooks/useAssets";
import MiniLoader from "../Common/miniLoader";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import Lottie from "../Common/lottie";
import { useReserveData } from "../../context/ReserveDataContext";
import { SCALING_FACTOR } from '../../utils/constants';
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
  const popupRef = useRef(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [assetBalances, setAssetBalances] = useState([]);
  const [liquidationUsers, setLiquidationUsers] = useState([]);
  const [liquidationLoading, setLiquidationLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [userAccountData, setUserAccountData] = useState([]);
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const {
    assets,
    AssetImages,
    asset_supply,
    asset_borrow,
    fetchAssetSupply,
    fetchAssetBorrow,
  } = useAssetData();

  const {
    getAllUsers,
    user,
    backendActor,
    createLedgerActor,
    verifyCertificate,
  } = useAuth();

  const { batchFetchReserveData } = useReserveData();

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  /**
   * Fetches the total number of users from the backend.
   */
  const getTotalUser = async () => {
    if (!backendActor) {
      console.error("Error: Backend actor is not initialized.");
      throw new Error("Backend actor not initialized");
    }

    try {
      const result = await backendActor.get_total_users();
      const userData = result?.[0];
      const cert = result?.[1];

      if (cert) {
        try {
          const verified = await verifyCertificate(cert);
          if (!verified) {
            console.error("Certificate verification failed for total users");
            return null;
          }
        } catch (verificationError) {
          console.error(
            "Error verifying certificate for total users:",
            verificationError
          );
          return null;
        }
      }

      setTotalUsers(userData || 0);
      return userData || 0;
    } catch (error) {
      console.error("Error fetching total users:", error);
      throw error;
    }
  };

  /**
   * Fetches a list of users eligible for liquidation.
   * @param {number} totalPages - The total number of pages.
   * @param {number} pageSize - The number of users per page.
   * @returns {Promise<Array>} - Returns an array of liquidation users.
   */
  const fetchLiquidationUsers = async (totalPages, pageSize) => {
    try {
      const result = await backendActor.get_liquidation_users_concurrent(
        totalPages,
        pageSize
      );
      const parsedResult = result.map(
        ([principal, userAccountData, userData]) => ({
          principal: Principal.fromUint8Array(principal),
          collateral: userAccountData.collateral,
          debt: userAccountData.debt,
          ltv: userAccountData.ltv,
          liquidationThreshold: userAccountData.liquidation_threshold,
          healthFactor: userAccountData.health_factor,
          availableBorrow: userAccountData.available_borrow,
          hasZeroLtvCollateral: userAccountData.has_zero_ltv_collateral,
          userData: userData,
        })
      );

      setUserAccountData((prev) => ({
        ...prev,
        ...parsedResult.reduce((acc, { principal, userAccountData }) => {
          acc[principal] = userAccountData;
          return acc;
        }, {}),
      }));
      return parsedResult;
    } catch (error) {
      console.error("Error fetching liquidation users:", error);
      throw error;
    }
  };

  const handleDetailsClick = (item) => {
    setSelectedAsset(item);
    setShowUserInfoPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  //Function to filter the users based on the search query
  const { relevantItems, currentItems, totalPages } = useMemo(() => {
    // Early return if data isn't ready
    if (liquidationLoading || !Array.isArray(liquidationUsers) || liquidationUsers.length === 0) {
      return { relevantItems: [], currentItems: [], totalPages: 0 };
    }

    // Step 1: Filter valid users
    const filtered = liquidationUsers.filter((item) => {
      return (
        item.principal?._arr?.toText() !== user?.toString() &&
        typeof item.debt !== "undefined" &&
        item.debt !== 0n &&
        typeof item.collateral !== "undefined" &&
        item.collateral !== 0n &&
        Array.isArray(item.userData?.reserves) && // ensures reserves exists
        item.userData.reserves.length > 0         // ensures at least one reserve
      );
    });

    // Step 2: Pagination
    const ITEMS_PER_PAGE = 8;
    const pages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const validPage = Math.min(Math.max(1, currentPage), pages);

    // Prevent stale page numbers
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }

    const lastIndex = validPage * ITEMS_PER_PAGE;
    const firstIndex = lastIndex - ITEMS_PER_PAGE;
    const items = filtered.slice(firstIndex, lastIndex);

    // Final structured return
    return {
      relevantItems: filtered,
      currentItems: items,
      totalPages: pages
    };
  }, [liquidationUsers, liquidationLoading, currentPage, user, setCurrentPage]);

  // Function to fetch asset data for each user
  const fetchAssetData = async () => {
    const reserveDataMap = await batchFetchReserveData(assets);

    const balances = {};

    await Promise.all(
      currentItems.map(async (mappedItem) => {
        const principal = mappedItem.principal?._arr;
        if (!principal) return;

        const userBalances = {};
        const account = { owner: principal, subaccount: [] };

        await Promise.all(
          assets.map(async (asset) => {
            const reserveDataForAsset = reserveDataMap[asset]?.Ok[0];

            if (!reserveDataForAsset) {
              console.warn(`No valid reserve data found for ${asset}`);
              userBalances[asset] = {
                dtokenBalance: null,
                debtTokenBalance: null,
              };
              return;
            }

            const dtokenId = reserveDataForAsset.d_token_canister?.[0];
            const debtTokenId = reserveDataForAsset.debt_token_canister?.[0];

            const assetBalance = {
              dtokenBalance: null,
              debtTokenBalance: null,
            };

            const tokenRequests = [];

            if (dtokenId) {
              const dtokenActor = createLedgerActor(dtokenId, idlFactory);
              if (dtokenActor) {
                tokenRequests.push(
                  dtokenActor
                    .icrc1_balance_of(account)
                    .then((balance) => {
                      assetBalance.dtokenBalance = Number(balance);
                    })
                    .catch((error) => {
                      console.error(
                        `Error fetching dtoken balance for ${asset}:`,
                        error
                      );
                    })
                );
              }
            }

            if (debtTokenId) {
              const debtTokenActor = createLedgerActor(
                debtTokenId,
                idlFactory1
              );
              if (debtTokenActor) {
                tokenRequests.push(
                  debtTokenActor
                    .icrc1_balance_of(account)
                    .then((balance) => {
                      assetBalance.debtTokenBalance = Number(balance);
                    })
                    .catch((error) => {
                      console.error(
                        `Error fetching debt token balance for ${asset}:`,
                        error
                      );
                    })
                );
              }
            }

            await Promise.all(tokenRequests);
            userBalances[asset] = assetBalance;
          })
        );

        balances[principal] = userBalances;
      })
    );

    setAssetBalances(balances);
  };

  //Function to get balance for a specific principal and asset
  const getBalanceForPrincipalAndAsset = (
    principal,
    assetName,
    balanceType
  ) => {
    const userBalances = assetBalances[principal] || {};
    const assetBalance = userBalances[assetName];
    return assetBalance ? assetBalance[balanceType] || 0 : 0;
  };

  const getAssetSupplyValue = useCallback(
    (asset) => {
      if (asset_supply[asset] !== undefined) {
        const supplyValue = Number(asset_supply[asset][0]);
        return supplyValue;
      }
      return 0;
    },
    [asset_supply]
  );

  // Function to get asset borrow value
  const getAssetBorrowValue = useCallback(
    (asset) => {
      if (asset_borrow[asset] !== undefined) {
        const borrowValue = Number(asset_borrow[asset][0]);
        return borrowValue;
      }
      return 0;
    },
    [asset_borrow]
  );

  // Function to calculate asset supply
  const calculateAssetSupply = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];
    let currentLiquidity = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        currentLiquidity = reserveGroup[1]?.liquidity_index || 0;
      }
    });
    const assetBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal?._arr,
        assetName,
        "dtokenBalance"
      ) || 0;
    if (!currentLiquidity) return 0;

    const safeAssetBalance =
      typeof assetBalance === "bigint" ? Number(assetBalance) : assetBalance;
    const safeCurrentLiquidity =
      typeof currentLiquidity === "bigint"
        ? Number(currentLiquidity)
        : currentLiquidity;
    const supplyValue = Number(getAssetSupplyValue(assetName));
    return Math.trunc(
      Math.trunc(safeAssetBalance / safeCurrentLiquidity) * supplyValue
    );
  };

  //funxtion to calculate asset borrow
  const calculateAssetBorrow = (assetName, mappedItem) => {
    const reserves = mappedItem?.userData?.reserves?.[0] || [];

    let debtIndex = 0;
    reserves.map((reserveGroup) => {
      if (reserveGroup[0] === assetName) {
        debtIndex = reserveGroup[1]?.variable_borrow_index || 0;
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

  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      closePopup();
    }
  };

  const truncateText = (text, length) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
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
    (async () => {
      try {
        await getTotalUser();
      } catch (error) {
        console.error("Failed to fetch total users:", error.message);
      }
    })();
  }, []);

  //Function to fetch  each user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [getAllUsers, liquidateTrigger]);

  //Function to fetch  data for each user
  useEffect(() => {
    console.log("Starting liquidation data loading process");

    const loadData = async () => {
      setLiquidationLoading(true);

      try {
        let userCount = totalUsers;
        if (userCount === null || userCount === undefined) {
          userCount = await getTotalUser();
        }

        if (userCount !== null && userCount !== undefined) {
          const usersPerPage = 10;
          const calculatedPages = Math.ceil(Number(userCount) / usersPerPage);

          const userData = await fetchLiquidationUsers(calculatedPages, usersPerPage);

          if (userData && userData.length >= 0) {
            setLiquidationUsers(userData);
          }
        } else {
          console.warn("Invalid user count, cannot proceed with fetching liquidation users");
        }
      } catch (error) {
        console.error("Failed to load liquidation data:", error);
      } finally {
        setTimeout(() => {
          setLiquidationLoading(false);
        }, 200);
      }
    };

    loadData();
  }, [totalUsers, liquidateTrigger]);



 useEffect(() => {
  if (currentItems.length > 0 && assets.length > 0) {
    fetchAssetData();
  }
}, [currentItems, assets, liquidationUsers]);

  //Funtion to fetch asset supply and borrow data
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
  }, [assets, liquidateTrigger]);

  // useeffect for Closing popup when click outside
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
        ) : currentItems === undefined ||
          currentItems === null ||
          currentItems.length === 0 ? (
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
                    return (
                      <tr
                        key={index}
                        className={`w-full font-bold hover:bg-[#ddf5ff8f]  rounded-lg ${index !== liquidationUsers.length - 1
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
                                {`$${formatValue(Number(item.debt) / SCALING_FACTOR)}`}
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
                                  const assetBorrow = calculateAssetBorrow(
                                    assetName,
                                    item
                                  );
                                  if (assetBorrow > 0) {
                                    const assetIndex =
                                      assets.indexOf(assetName);

                                    return (
                                      <img
                                        key={index}
                                        src={
                                          assetIndex !== -1
                                            ? AssetImages[assetIndex]
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

                                  if (assetSupply > 0) {
                                    const assetIndex =
                                      assets.indexOf(assetName);

                                    return (
                                      <img
                                        key={index}
                                        src={
                                          assetIndex !== -1
                                            ? AssetImages[assetIndex]
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
                        { }
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
