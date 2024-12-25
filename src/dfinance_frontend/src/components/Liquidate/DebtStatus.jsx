import React, { useEffect, useState } from "react";
import {
  LIQUIDATION_USERLIST_ROW,
  LIQUIDATION_USERLIST_COL,
} from "../../utils/constants";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useRef } from "react";

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
  const [assetSupply, setAssetSupply] = useState({});
  const [assetBorrow, setAssetBorrow] = useState({});
  const { assets, reserveData, filteredItems } = useAssetData();

  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };

  const navigate = useNavigate();
  const { getAllUsers, user, backendActor } = useAuth();
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

  const fetchUserAccountData = async (userData) => {
    const principal = userData?.principal;

    if (!principal) {
      console.warn("Invalid principal for user:", userData);
      return;
    }

    setUserLoadingStates((prevState) => ({
      ...prevState,
      [principal]: true,
    }));

    if (backendActor) {
      try {
        const result = await backendActor.get_user_account_data([principal]);

        if (result?.Err === "ERROR :: Pending") {
          console.warn("Pending state detected. Retrying...");
          setTimeout(() => fetchUserAccountData(userData), 1000);
          return;
        }

        if (result) {
          setUserAccountData((prevState) => ({
            ...prevState,
            [principal]: result,
          }));

          setUserLoadingStates((prevState) => ({
            ...prevState,
            [principal]: false,
          }));
        } else {
          console.warn("No result returned for principal:", principal);
        }
      } catch (error) {
        console.error("Error fetching user account data:", error.message);
      }
    }
  };

  useEffect(() => {
    users.forEach((userData) => {
      const principal = userData[0] ? userData[0] : null;
      if (!principal) {
        console.warn("Invalid principal found in userData:", userData);
        return;
      }

      fetchUserAccountData({ ...userData, principal });
    });
  }, [users]);

  const fetchAssetSupply = async (asset, userData) => {
    const principal = userData?.principal;

    if (!principal) {
      console.warn("Invalid principal for user:", userData);
      return;
    }

    if (backendActor) {
      try {
        const result = await backendActor.get_asset_supply(asset, [principal]);

        if (result?.Err === "ERROR :: Pending") {
          console.warn("Pending state detected. Retrying...");
          setTimeout(() => fetchAssetSupply(asset, userData), 1000);
          return;
        }

        if (result?.Ok !== undefined) {
          setAssetSupply((prev) => ({
            ...prev,
            [principal]: {
              ...prev[principal],
              [asset]: result.Ok,
            },
          }));
        } else {
          console.warn("No result returned for asset:", asset);
        }
      } catch (error) {
        console.error("Error fetching asset supply:", error.message);
      }
    } else {
      console.warn("Backend actor not available");
    }
  };

  const fetchAssetBorrow = async (asset, userData) => {
    const principal = userData?.principal;

    if (!principal) {
      console.warn("Invalid principal for user:", userData);
      return;
    }

    if (backendActor) {
      try {
        const result = await backendActor.get_asset_debt(asset, [principal]);

        if (result?.Err === "ERROR :: Pending") {
          console.warn("Pending state detected. Retrying...");
          setTimeout(() => fetchAssetBorrow(asset, userData), 1000);
          return;
        }

        if (result?.Ok !== undefined) {
          setAssetBorrow((prev) => ({
            ...prev,
            [principal]: {
              ...prev[principal],
              [asset]: result.Ok,
            },
          }));
        } else {
          console.warn("No result returned for asset:", asset);
        }
      } catch (error) {
        console.error("Error fetching asset borrow:", error.message);
      }
    } else {
      console.warn("Backend actor not available");
    }
  };

  const getAssetSupplyValue = (principal, asset) => {
    if (assetSupply[principal]?.[asset] !== undefined) {
      return Number(assetSupply[principal][asset]) / 1e8;
    }
    return 0;
  };

  const getAssetBorrowValue = (principal, asset) => {
    if (assetBorrow[principal]?.[asset] !== undefined) {
      return Number(assetBorrow[principal][asset]) / 1e8;
    }
    return 0;
  };

  useEffect(() => {
    users.forEach((userData) => {
      const principal = userData[0] ? userData[0] : null;
      if (!principal) {
        console.warn("Invalid principal for user:", userData);
        return;
      }

      assets.forEach((asset) => {
        fetchAssetSupply(asset, { ...userData, principal });
        fetchAssetBorrow(asset, { ...userData, principal });
      });
    });
  }, [users, assets]);

  useEffect(() => {
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

          const totalDebt = Number(accountData?.Ok?.[1]) / 1e8 || 0;
          const healthFactor = accountData
            ? Number(accountData?.Ok?.[4]) / 10000000000
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
            mappedItem.healthFactor < 1 &&
            mappedItem.principal.toString() !== user.toString() &&
            mappedItem.totalDebt > 0
        );

      setFilteredUsers(filtered);
    }
    console.log("user",user)
  }, [users, userAccountData, user]);

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

      <div className="w-full mt-6">
        {}
        {filteredUsers.length === 0 ? (
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
                    const userLoading = userLoadingStates[mappedItem.principal.toText()];
                    return (
                      <tr
                        key={index}
                        className={`w-full font-bold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg ${
                          index !== users.length - 1
                            ? "gradient-line-bottom"
                            : ""
                        }`}
                      >
                        <td className="p-2 align-top py-8 ">
                          <div className="flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mt-2">
                            <p>{truncateText(mappedItem.principal.toText(), 14)}</p>
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
                                const assetSupply = getAssetSupplyValue(
                                  mappedItem.principal,
                                  assetName
                                );
                                const assetBorrow = getAssetBorrowValue(
                                  mappedItem.principal,
                                  assetName
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
                                console.log("mapped item in asset supply", mappedItem.principal)
                                const assetSupply = getAssetSupplyValue(
                                  mappedItem.principal,
                                  assetName
                                );
                                const assetBorrow = getAssetBorrowValue(
                                  mappedItem.principal,
                                  assetName
                                );
                                console.log("asset supply", assetSupply);
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

                        {/* <td className="p-3 align-top hidden md:table-cell pt-5 py-8">
                          {mappedItem.item.borrow_apy}
                        </td> */}
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
          assetSupply={assetSupply}
          assetBorrow={assetBorrow}
        />
      )}
    </div>
  );
};

export default DebtStatus;
