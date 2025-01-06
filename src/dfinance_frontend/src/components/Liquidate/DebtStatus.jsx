import React, { useEffect, useState, useMemo } from "react";
import {
  LIQUIDATION_USERLIST_ROW,
  LIQUIDATION_USERLIST_COL,
} from "../../utils/constants";
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
import useFormatNumber from "../customHooks/useFormatNumber";
import useAssetData from "../Common/useAssets";
import useUserData from "../customHooks/useUserData";
import MiniLoader from "../Common/MiniLoader";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
const DebtStatus = () => {
  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userAccountData, setUserAccountData] = useState({});
  const { userData } = useUserData();
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetSupply, setAssetSupplied] = useState({});
  const [assetBorrow, setAssetBorrowed] = useState({});
  const [assetBalances, setAssetBalances] = useState([]);
  const {
    assets,
    reserveData,
    filteredItems,
    asset_supply,
    asset_borrow,
    fetchAssetSupply,
    fetchAssetBorrow,
    loading: filteredDataLoading,
  } = useAssetData();
  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };
  const [supplyDataLoading, setSupplyDataLoading] = useState(true);
  const [borrowDataLoading, setBorrowDataLoading] = useState(true);
  const navigate = useNavigate();
  const {
    getAllUsers,
    user,
    backendActor,
    principal,
    fetchReserveData,
    createLedgerActor,
  } = useAuth();
  const [users, setUsers] = useState([]);

  const [userLoadingStates, setUserLoadingStates] = useState({});

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
  }, [getAllUsers]);
  const [liquidationLoading, setLiquidationLoading] = useState(true);
 const stableUserAccountData = useMemo(() => userAccountData, [userAccountData]);
const stableUsers = useMemo(() => users, [users]);

useEffect(() => {
  console.log("Effect triggered in users");
  console.log("Users:", stableUsers);
  console.log("UserAccountData:", stableUserAccountData);
  console.log("User:", user);

  setLiquidationLoading(true);

  if (
    stableUsers &&
    Array.isArray(stableUsers) &&
    Object.keys(stableUserAccountData || {}).length === stableUsers.length
  ) {
    const filtered = stableUsers
      .map((item) => {
        if (!item || !item[0]) return null;
        const principal = item[0];
        const accountData = stableUserAccountData?.[principal];

        const totalDebt = Number(accountData?.Ok?.[1]) / 1e8 || 0;
        const totalCollateral = Number(accountData?.Ok?.[0]) / 1e8 || 0;
        const healthFactor = accountData
          ? Number(accountData?.Ok?.[4]) / 10000000000
          : 0;
          const liquidationThreshold =
          Number(accountData?.Ok?.[3]) / 100000000 ||
          0;
          console.log("liquidationThreshold",accountData?.Ok?.[3])
        return {
          reserves: item[1]?.reserves || [],
          principal,
          healthFactor,
          item,
          totalDebt,
          totalCollateral,
          liquidationThreshold,
          
        };
      })
      .filter(
        (mappedItem) =>
          mappedItem &&
          mappedItem.healthFactor >1 &&
          mappedItem.principal.toString() !== user.toString() &&
          mappedItem.totalDebt > 0
      );

    if (filtered && filtered.length > 0) {
      console.log("Updating filteredUsers:", filtered);
      setFilteredUsers(filtered);
      setLiquidationLoading(false); // Stop loading only when filteredUsers is valid
    } else {
      console.log("No valid filtered users found yet.");
      setFilteredUsers([]); // Ensure filteredUsers is reset to an empty array
    }
  }
}, [stableUsers, stableUserAccountData]);

// Ensure loading stops when all users and account data are processed
useEffect(() => {
  if (
    stableUsers &&
    stableUsers.length > 0 &&
    Object.keys(stableUserAccountData || {}).length === stableUsers.length
  ) {
    setLiquidationLoading(false); // Stop loading only when processing is complete
  }
}, [stableUsers, stableUserAccountData]);

  
  const handleDetailsClick = (item) => {
    setSelectedAsset(item);
    setShowUserInfoPopup(true);
  };

  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  const handleChevronClick = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const dispatch = useDispatch();
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const cachedData = useRef({});

const fetchUserAccountDataWithCache = async (userData) => {
  const principal = userData?.principal;
  if (!principal || cachedData.current[principal]) return; // Skip if already cached

  try {
    const result = await backendActor.get_user_account_data([principal]);
    if (result) {
      cachedData.current[principal] = result; // Cache the result
      setUserAccountData((prev) => ({ ...prev, [principal]: result }));
    }
  } catch (error) {
    console.error(`Error fetching data for principal: ${principal}`, error);
  }
};

useEffect(() => {
  if (!users || users.length === 0) return;

  console.log(`Fetching account data for ${users.length} users...`);

  // Parallelize fetching with Promise.all
  Promise.all(
    users.map((userData) => {
      const principal = userData[0];
      if (principal) return fetchUserAccountDataWithCache({ ...userData, principal });
      return null; // Skip invalid users
    })
  )
    .then(() => console.log("All user account data fetched"))
    .catch((error) => console.error("Error fetching user account data in batch:", error));
}, [users]);

  
  
  const fetchAssetData = async () => {
    const balances = {};

    await Promise.all(
      filteredUsers.map(async (mappedItem) => {
        const principal = mappedItem.principal;
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

            const account = { owner: principal, subaccount: [] };

            if (dtokenId) {
              const dtokenActor = createLedgerActor(dtokenId, idlFactory);
              if (dtokenActor) {
                try {
                  const balance = await dtokenActor.icrc1_balance_of(account);
                  const formattedBalance = Number(balance);
                  assetBalance.dtokenBalance = formattedBalance;
                } catch (error) {
                  console.error(
                    `Error fetching dtoken balance for ${asset}:`,
                    error
                  );
                }
              }
            }

            if (debtTokenId) {
              const debtTokenActor = createLedgerActor(
                debtTokenId,
                idlFactory1
              );
              if (debtTokenActor) {
                try {
                  const balance = await debtTokenActor.icrc1_balance_of(
                    account
                  );
                  const formattedBalance = Number(balance);
                  assetBalance.debtTokenBalance = formattedBalance;
                } catch (error) {
                  console.error(
                    `Error fetching debt token balance for ${asset}:`,
                    error
                  );
                }
              }
            }

            userBalances[asset] = assetBalance;
          })
        );

        balances[principal] = userBalances;
      })
    );

    setAssetBalances(balances);
  };

  useEffect(() => {
    if (filteredUsers.length > 0) {
      fetchAssetData();
    }
  }, [filteredUsers, assets, users]);

  const getBalanceForPrincipalAndAsset = (
    principal,
    assetName,
    balanceType
  ) => {
    const userBalances = assetBalances[principal] || {};

    const assetBalance = userBalances[assetName];

    return assetBalance ? assetBalance[balanceType] || 0 : 0;
  };

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
  }, [assets]);
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

  
  

  const calculateAssetSupply = (assetName, mappedItem, reserveData) => {
    const reserve = reserveData?.[assetName];
    const currentLiquidity = reserve?.Ok?.liquidity_index;
    const assetBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal,
        assetName,
        "dtokenBalance"
      ) || 0;

    // Calculate asset supply
    return (
      (Number(assetBalance) * Number(getAssetSupplyValue(assetName))) /
      (Number(currentLiquidity) * 1e8)
    );
  };

  const calculateAssetBorrow = (assetName, mappedItem, reserveData) => {
    const reserve = reserveData?.[assetName];
    const DebtIndex = reserve?.Ok?.debt_index;
    const assetBorrowBalance =
      getBalanceForPrincipalAndAsset(
        mappedItem.principal,
        assetName,
        "debtTokenBalance"
      ) || 0;

    // Calculate asset borrow
    return (
      (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetName))) /
      (Number(DebtIndex) * 1e8)
    );
  };

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

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

  const truncateText = (text, length) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }
  }, [showPopup]);

  const formatNumber = useFormatNumber();
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
      {console.log("filteredUsers", filteredUsers)}
      <div className="w-full mt-6">
        {liquidationLoading ? (
          // Show loader while loading
          <div className="h-[400px] flex justify-center items-center">
            <MiniLoader isLoading={true} />
          </div>
        ) : !liquidationLoading &&
          filteredUsers &&
          filteredUsers.length === 0 ? (
          // Show "No users found" only when loading is complete and filteredUsers is processed
          <div className="flex flex-col justify-center align-center place-items-center my-[13rem] mb-[18rem]">
            <div className="w-20 h-15">
              <img
                src="/Transaction/empty file.gif"
                alt="empty"
                className="w-30"
              />
            </div>
            <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
              No users found!
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
                  {currentItems.map((mappedItem, index) => {
                    const userLoading =
                      userLoadingStates[mappedItem.principal.toText()];
                    return (
                      <tr
                        key={index}
                        className={`w-full font-bold hover:bg-[#ddf5ff8f]  rounded-lg ${
                          index !== users.length - 1
                            ? "gradient-line-bottom"
                            : ""
                        }`}
                      >
                        <td className="p-2 align-top py-8 ">
                          <div className="flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mt-2">
                            <p>
                              {truncateText(mappedItem.principal.toText(), 14)}
                            </p>
                          </div>
                        </td>
                        <td className="p-2 align-top py-8 ">
                          <div className="flex flex-row ml-2 mt-2">
                            <div>
                              <p className="font-medium">
                                {`$${formatValue(mappedItem.totalDebt)}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 align-top hidden md:table-cell py-8">
                          <div className="flex gap-2 items-center">
                            {Array.isArray(mappedItem?.reserves?.[0]) &&
                              mappedItem.reserves[0].map((item, index) => {
                                const assetName = item?.[0];

                                const assetSupply = calculateAssetSupply(
                                  assetName,
                                  mappedItem,
                                  reserveData
                                );
                                const assetBorrow = calculateAssetBorrow(
                                  assetName,
                                  mappedItem,
                                  reserveData
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
                              })}
                          </div>
                        </td>
                        <td className="p-5 align-top hidden md:table-cell py-8">
                          <div className="flex gap-2 items-center">
                            {Array.isArray(mappedItem?.reserves?.[0]) &&
                              mappedItem.reserves[0].map((item, index) => {
                                const assetName = item?.[0];
                                const reserve = reserveData?.[assetName];
                                const assetSupply = calculateAssetSupply(
                                  assetName,
                                  mappedItem,
                                  reserveData
                                );
                                const assetBorrow = calculateAssetBorrow(
                                  assetName,
                                  mappedItem,
                                  reserveData
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
                              })}
                          </div>
                        </td>

                        {}
                        <td className="p-3 align-top flex py-8">
                          <div className="w-full flex justify-end align-center">
                            <Button
                              title={<span className="inline">Liquidate</span>}
                              className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-[5px] px-9 py-3 shadow-md shadow-[#00000040] font-semibold text-[12px] lg:px-5 lg:py-[5px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[4px]"
                              onClickHandler={() =>
                                handleDetailsClick(mappedItem)
                              }
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
