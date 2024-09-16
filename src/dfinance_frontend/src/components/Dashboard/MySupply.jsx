import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import React from "react";
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_ROWS,
  MY_ASSET_TO_SUPPLY_TABLE_ROW,
  MY_ASSET_TO_BORROW_TABLE_COL,
  MY_ASSET_TO_BORROW_TABLE_ROW,
  MY_BORROW_ASSET_TABLE_COL,
  MY_BORROW_ASSET_TABLE_ROWS,
} from "../../utils/constants";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import EModeButton from "./DashboardPopup/Emode";
import Button from "../Common/Button";
import { Switch } from "@mui/material";
import { Check, Eye, EyeOff, Info } from "lucide-react";
import MySupplyModal from "./MySupplyModal";
import WithdrawPopup from "./DashboardPopup/WithdrawPopup";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
import BorrowPopup from "./DashboardPopup/BorrowwPopup";
import PaymentDone from "./DashboardPopup/PaymentDone";
import { useNavigate } from "react-router-dom";
import Borrow from "./DashboardPopup/BorrowPopup";
import Repay from "./DashboardPopup/Repay";
import { useAuth } from "../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { useEffect } from "react";
import { useCallback } from "react";
import { useMemo } from "react";
import useAssetData from "../Common/useAssets";
import ckBTC from '../../../public/assests-icon/ckBTC.png';
import ckETH from '../../../public/assests-icon/cketh.png';
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../declarations/ckbtc_ledger";
import { useParams } from "react-router-dom";

const MySupply = () => {
  const [userData, setUserData] = useState();
  const navigate = useNavigate();
  const { state, pathname } = useLocation();
  const {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
  } = useAuth()

  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);

  const [balance, setBalance] = useState(null);
  const [usdBalance, setUsdBalance] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);

  const ledgerActorckBTC = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER, ledgerIdlFactoryckBTC), [createLedgerActor]);

  const ledgerActorckETH = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKETH_LEDGER, ledgerIdlFactoryckETH), [createLedgerActor]);

  const fetchBalance = useCallback(
    async (assetType) => {
      if (isAuthenticated && principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          let balance;

          if (assetType === "ckBTC" && ledgerActorckBTC) {
            balance = await ledgerActorckBTC.icrc1_balance_of(account);
            setCkBTCBalance(balance.toString());  // Set ckBTC balance
          } else if (assetType === "ckETH" && ledgerActorckETH) {
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            setCkETHBalance(balance.toString());  // Set ckETH balance
          } else {
            throw new Error("Unsupported asset type or ledger actor not initialized");
          }

          console.log(`Fetched Balance for ${assetType}:`, balance.toString());
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      }
    },
    [isAuthenticated, ledgerActorckBTC, ledgerActorckETH, principalObj]
  );

  useEffect(() => {
    if (ckBTCBalance && conversionRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * conversionRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, conversionRate]);

  useEffect(() => {
    if (ckETHBalance && conversionRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * conversionRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }
  }, [ckETHBalance, conversionRate]);


  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setConversionRate(data['internet-computer'].usd);
      console.log("Fetched Conversion Rate:", data['internet-computer'].usd);
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      setError(error);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBalance('ckBTC'), fetchBalance('ckETH'), fetchConversionRate()]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);


  useEffect(() => {
    if (balance && conversionRate) {
      const balanceInUsd = (parseFloat(balance) * conversionRate).toFixed(2);
      setUsdBalance(balanceInUsd);
    }
  }, [balance, conversionRate]);

  const { assets, reserveData, filteredItems } = useAssetData();
  const filteredReserveData = Object.fromEntries(filteredItems);
  console.log(filteredReserveData)



  function formatNumber(num) {
    if (num === null || num === undefined) {
      return '0';
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";

  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
  });
  console.log("hello", isModalOpen);

  useEffect(() => {
    const fetchUserData = async () => {
      if (backendActor) {
        try {
          const result = await getUserData(principal.toString());
          console.log('get_user_data:', result);
          setUserData(result);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        console.error('Backend actor initialization failed.');
      }
    };
    fetchUserData();
  }, [principal, backendActor]);

  const getUserData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(user);
      console.log('get_user_data in mysupply:', result);
      return result;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const handleModalOpen = (type, asset, image, supplyRateAPR) => {
    console.log("Handle modal opened");
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
      supplyRateAPR: supplyRateAPR,
    });
  };
  const theme = useSelector((state) => state.theme.theme);
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
  const [activeSection, setActiveSection] = useState("supply");
  const [isVisible, setIsVisible] = useState(true);
  const [isBorrowVisible, setIsBorrowVisible] = useState(true);
  const [isborrowVisible, setIsborrowVisible] = useState(true);
  const [isSupplyVisible, setIsSupplyVisible] = useState(true);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  const toggleBorrowVisibility = () => {
    setIsBorrowVisible(!isBorrowVisible);
  };
  const toggleborrowVisibility = () => {
    setIsborrowVisible(!isborrowVisible);
  };
  const toggleSupplyVisibility = () => {
    setIsSupplyVisible(!isSupplyVisible);
  };
  const renderModalOpen = (type) => {
    console.log(type);
    switch (type) {
      case "borrow":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <BorrowPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "borroww":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <Borrow
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <SupplyPopup
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                balance={0}
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );
      case "withdraw":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <WithdrawPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "payment":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <PaymentDone
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "repay":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <Repay
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      default:
        return null;
    }
  };
  const hasNoBorrows = MY_BORROW_ASSET_TABLE_ROWS.length === 0;
  const noBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center ">
      <div className="w-20 h-15">
        <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
      </div>
      <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
        Nothing borrowed yet
      </p>
    </div>
  );
  const noSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center ">
      <div className="w-20 h-15">
        <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
      </div>
      <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
        Nothing supplied yet
      </p>
    </div>
  );
  const noAssetsToSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center ">
      <div className="w-20 h-15">
        <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
      </div>
      <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
        No assets to supply.
      </p>
    </div>
  );
  const noAssetsToBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center ">
      <div className="w-20 h-15">
        <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
      </div>
      <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
        No assets to borrow.
      </p>
    </div>
  );

  const [collateral, setCollateral] = useState(false);


  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      const item = filteredItems[0][1].Ok;
      setCollateral(item.can_be_collateral);
    }
  }, [filteredItems]);

  let supply_rate_apr = "0";
  let borrow_rate_apr = "0";

  if (filteredItems && filteredItems.length > 0) {
    const item = filteredItems[0][1].Ok;
    supply_rate_apr = item.supply_rate_apr ? item.supply_rate_apr[0].toString() : "0";
    borrow_rate_apr = item.borrow_rate ? item.borrow_rate[0].toString() : "0";
  }


  return (
    <div className="w-full flex-col lg:flex-row flex gap-6">
      <div className="flex justify-center -mb-38 lg:hidden">
        <button
          className={`w-1/2 py-2  ${activeSection === "supply"
            ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
            : "text-[#2A1F9D] opacity-50  dark:text-darkTextSecondary1"
            }`}
          onClick={() => setActiveSection("supply")}
        >
          &#8226; Supply
        </button>
        <button
          className={`w-1/2 py-1  ${activeSection === "borrow"
            ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
            : "text-[#2A1F9D] opacity-50 dark:text-darkTextSecondary"
            }`}
          onClick={() => setActiveSection("borrow")}
        >
          &#8226; Borrow
        </button>

        <div className="ml-auto lg:hidden sxs3:flex align-center justify-center">
          {isAuthenticated && shouldRenderTransactionHistoryButton && (
            <a href="/dashboard/transaction-history" className="block">
              <button className=" text-nowrap px-2 py-2 md:px-4 md:py-2 border border-[#2A1F9D] text-[#2A1F9D] bg-[#ffff] rounded-lg shadow-md hover:shadow-[#00000040] font-semibold text-sm cursor-pointer relative dark:bg-darkOverlayBackground dark:text-darkText dark:border-none">
                Transactions
              </button>
            </a>
          )}
        </div>
      </div>

      <div className="w-full lg:w-6/12 mt-6 md:mt-4 lg:mt-20">
        <div
          className={`${activeSection === "supply" ? "block" : "hidden"
            } lg:block`}
        >
          <div
            className={`w-full overflow-scroll lgx:overflow-none hide-scrollbar  ${isSupplyVisible ? "min-h-[200px]" : "min-h-[100px]"
              } py-6 px-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Your supplies
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4"
                onClick={toggleSupplyVisibility}
              >
                {isSupplyVisible ? "Hide" : "Show"}
                {isSupplyVisible ? (
                  <EyeOff size={16} className="ml-2" />
                ) : (
                  <Eye size={16} className="ml-2" />
                )}
              </button>
            </div>

            {/* Content for Mobile Screens */}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isSupplyVisible && (
                <>
                  {userData?.Ok?.reserves?.length === 0 || filteredItems.length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div
                      className={`relative mt-4 overflow-y-auto scrollbar-custom ${filteredItems.length > 1
                        ? "max-h-[280px]"
                        : "max-h-auto"
                        }`}
                    >
                      {/* Container for the scrollable content */}
                      <div
                        className={`w-full ${filteredItems.length > 1 ? "h-full" : ""
                          }`}
                      >
                        {filteredItems.slice(0, 8).map((item, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText`}
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              {item[0] === "ckBTC" && (
                                <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                              )}
                              {item[0] === "ckETH" && (
                                <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                              )}
                              <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                {item[0]}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-4 mt-6">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                Wallet Balance:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{ckBTCBalance}</p>
                                    <p className="font-light">${formatNumber(ckBTCUsdBalance)}</p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{ckETHBalance}</p>
                                    <p className="font-light">${formatNumber(ckETHUsdBalance)}</p>
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="flex justify-end text-xs dark:text-darkText">
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                ${formatNumber(usdBalance)}
                              </p>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-6 mb-1">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2 mb-2">
                                {item[1].Ok.supply_rate_apr}%
                              </p>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-3 mb-4">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                Can Be Collateral
                              </p>
                              <div className="-mr-3 -mt-4 mb-4">
                                <CustomizedSwitches />
                              </div>
                            </div>
                            <div className="flex justify-center gap-2 mt-2 mb-2">
                              <Button
                                title={"Supply"}
                                onClickHandler={() =>
                                  handleModalOpen("supply", item.asset, item.image)
                                }
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg"
                              />
                              <Button
                                title={"Withdraw"}
                                onClickHandler={() =>
                                  handleModalOpen("withdraw", item.asset, item.image)
                                }
                                className={`w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent`}
                              />
                            </div>
                            {index !== MY_SUPPLY_ASSET_TABLE_ROWS.length - 1 && (
                              <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Content for Desktop Screens */}
            <div className="hidden xl:block">
              {isSupplyVisible && (
                <>
                  {userData?.Ok?.reserves[0].reduce(
                    (total, reserveGroup) => total + (reserveGroup[1]?.asset_supply || 0),
                    0
                  ) === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative max-h-[260px] overflow-hidden">
                      <div className="w-full z-10 sticky top-0">
                        <div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-5">Asset</div>
                          <div className="p-5">Wallet Balance</div>
                          <div className="p-5">Apy</div>
                          <div className="p-5">Can be Collateral</div>
                          <div className="p-5"></div>
                        </div>
                      </div>

                      {/* Scrollable Content Area */}
                      <div
                        className={`w-full h-auto max-h-[calc(100%-40px)] overflow-y-auto scrollbar-custom ${userData?.Ok?.reserves?.filter((reserveGroup) => reserveGroup[1].asset_supply > 0).length > 3
                          ? "h-[260px]"
                          : ""
                          }`}
                      >
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {userData?.Ok?.reserves[0].map((reserveGroup, index) => (
                            reserveGroup[1]?.asset_supply > 0 && (
                              <div
                                key={index}
                                className="grid grid-cols-[2.1fr_1.2fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                              >
                                <div className="p-3 align-top flex items-center gap-2">
                                  {reserveGroup[1]?.reserve === "ckBTC" && (
                                    <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  {reserveGroup[1]?.reserve === "ckETH" && (
                                    <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  {reserveGroup[1]?.reserve}
                                </div>
                                <div className="ml-5 align-top flex flex-col">
                                  {reserveGroup[1]?.reserve === "ckETH" && (
                                    <>
                                      <p>{ckETHBalance}</p>
                                      <p className="font-light">${formatNumber(ckETHUsdBalance)}</p>
                                    </>
                                  )}
                                  {reserveGroup[1]?.reserve === "ckBTC" && (
                                    <>
                                      <p>{ckBTCBalance}</p>
                                      <p className="font-light">${formatNumber(ckBTCUsdBalance)}</p>
                                    </>
                                  )}
                                </div>
                                <div className="ml-4 align-top">{supply_rate_apr}%</div>
                                <div className=" align-top flex items-center justify-center ml-5 -mr-4">
                                  <CustomizedSwitches />
                                </div>
                                <div className="p-3 align-top flex gap-2 pt-2">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() =>
                                      handleModalOpen("supply", reserveGroup[1]?.reserve, (reserveGroup[1]?.reserve === "ckBTC" && ckBTC) || (reserveGroup[1]?.reserve === "ckETH" && ckETH), supply_rate_apr)
                                    }
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                  />
                                  <Button
                                    title={"Withdraw"}
                                    onClickHandler={() =>
                                      handleModalOpen("withdraw", reserveGroup[1]?.reserve, reserveGroup[1]?.image)
                                    }
                                    className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                  />
                                </div>
                              </div>
                            )
                          ))}
                        </div>

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>






          </div>

          <div
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${isVisible ? "min-h-[200px]" : "min-h-[100px]"
              } py-6 px-6 bg-gradient-to-r from-[#4659CF]/40   to-[#FCBD78]/40  rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Assets to supply
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4"
                onClick={toggleVisibility}
              >
                {isVisible ? "Hide" : "Show"}
                {isVisible ? (
                  <EyeOff size={16} className="ml-2" />
                ) : (
                  <Eye size={16} className="ml-2" />
                )}
              </button>
            </div>
            {/* mobile screen  */}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isVisible && (
                <>
                  {filteredItems.length === 0 ? (
                    noAssetsToSupplyMessage
                  ) : (
                    <div className="relative mt-4 max-h-[280px] overflow-y-auto scrollbar-custom">
                      {/* Container for the content */}
                      <div className="w-full">
                        {filteredItems.slice(0, 8).map(
                          (item, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText"
                            >
                              <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                {item[0] === "ckBTC" && (
                                  <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                )}
                                {item[0] === "ckETH" && (
                                  <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                )}
                                <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                  {item[0]}
                                </span>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 mt-6">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Wallet Balance:
                                </p>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  <p>{balance}</p>
                                </p>
                              </div>
                              <div className="flex justify-end text-xs mb-2">
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  ${formatNumber(usdBalance)}
                                </p>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  APY:
                                </p>
                                <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                  {item[1].Ok.supply_rate_apr}%
                                </p>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-4 mb-4">
                                <p className="text-nowrap text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Can Be Collateral
                                </p>
                                <div className="w-full flex items-center justify-end dark:text-darkText">
                                  <Check color={checkColor} size={16} />
                                </div>
                              </div>
                              <div className="flex justify-center gap-2 mt-2">
                                <Button
                                  title={"Supply"}
                                  onClickHandler={() =>
                                    handleModalOpen(
                                      "supply",
                                      item[0],
                                      (item[0] === "ckBTC" && ckBTC) || (item[0] === "ckETH" && ckETH),
                                      item[1]?.supply_rate_apr
                                    )
                                  }
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    navigate("/dashboard/asset-details")
                                  }
                                  className={`w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter`}
                                />
                              </div>
                              {index !==
                                filteredItems.length - 1 && (
                                  <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* for desktop screen */}
            <div className="hidden xl:block">
              {isVisible && (
                <>
                  {filteredItems.length === 0 ? (
                    noAssetsToSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative max-h-[260px] overflow-hidden">
                      {/* Fixed Header */}
                      <div className="w-full z-10 sticky top-0 ">
                        <div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-5">Asset</div>
                          <div className="p-5">Wallet Balance</div>
                          <div className="p-5">Apy</div>
                          <div className="p-5">Can be Collateral</div>
                          <div className="p-5"></div>
                        </div>
                      </div>

                      {/* Scrollable Content Area */}
                      <div
                        className={`w-full h-auto max-h-[calc(100%-40px)] overflow-y-auto scrollbar-custom ${filteredItems.length > 3
                          ? "h-[260px]"
                          : ""
                          }`}
                      >
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {filteredItems.slice(0, 8).map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[2.1fr_1.2fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                            >
                              <div className="p-3 align-top flex items-center gap-2">
                                {item[0] === "ckBTC" && (
                                  <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                )}
                                {item[0] === "ckETH" && (
                                  <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                )}
                                {item[0]}
                              </div>
                              <div className="p-3 align-top flex flex-col">
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{ckBTCBalance}</p>
                                    <p className="font-light">${formatNumber(ckBTCUsdBalance)}</p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{ckETHBalance}</p>
                                    <p className="font-light">${formatNumber(ckETHUsdBalance)}</p>
                                  </>
                                )}
                              </div>

                              <div className="ml-2 align-top">{item[1].Ok.supply_rate_apr}%</div>
                              <div className="-ml-3 align-top flex items-center justify-center dark:text-darkText">
                                <Check color={checkColor} size={16} />
                              </div>
                              <div className="p-3 align-top flex gap-2 pt-2">
                                <Button
                                  title={"Supply"}
                                  onClickHandler={() =>
                                    handleModalOpen(
                                      "supply",
                                      item[0],
                                      (item[0] === "ckBTC" && ckBTC) || (item[0] === "ckETH" && ckETH),
                                      item[1]?.Ok.supply_rate_apr
                                    )
                                  }
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    navigate("/dashboard/asset-details")

                                  }
                                  className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
      <div className="w-full lg:w-6/12 md:-mt-10 lg:mt-20">
        <div
          className={`${activeSection === "borrow" ? "block" : "hidden"
            } lg:block`}
        >
          <div
            className={`w-full overflow-scroll lgx:overflow-none hide-scrollbar  ${isborrowVisible ? "min-h-[200px]" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Your borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0"
                onClick={toggleborrowVisibility}
              >
                {isborrowVisible ? "Hide" : "Show"}
                {isborrowVisible ? (
                  <EyeOff className="ml-2" size={16} />
                ) : (
                  <Eye size={16} className="ml-2" />
                )}
              </button>
            </div>

            {/* E-Mode section for mobile screens only */}
            {/* <div className="md:block lgx:block xl:hidden flex flex-col items-start mt-2 ml-2">
              <div className="flex items-center space-x-4">
                <span className="text-[#2A1F9D] opacity-50 font-semibold dark:text-darkText">
                  E-Mode
                </span>
                <EModeButton />
              </div>
            </div>
            <div className="hidden xl:flex items-center space-x-4  ml-40 -mt-8">
              <div className="flex items-center space-x-4">
                <span className="text-[#2A1F9D] opacity-50 font-semibold dark:text-darkText">
                  E-Mode
                </span>
                <EModeButton />
              </div>
            </div> */}


            {/* mobile screen for borrow */}
            <div className="block xl:hidden">
              {isborrowVisible && (
                <>
                  {userData?.Ok?.reserves?.length === 0 || filteredItems.length === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                      <div className="relative mt-4 max-h-[280px] overflow-y-auto scrollbar-custom">
                        {/* Container for the content */}
                        <div className="w-full">
                          {filteredItems.slice(0, 8).map(
                            (item, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText"
                              >
                                <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                  {item[0] === "ckBTC" && (
                                    <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  {item[0] === "ckETH" && (
                                    <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                    {item[0]}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-4">
                                    Debt
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText mt-4">
                                    <p>{balance}</p>
                                  </p>
                                </div>
                                <div className="flex justify-end text-xs font-semibold">
                                  <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                    ${formatNumber(usdBalance)}
                                  </p>
                                </div>
                                <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-2">
                                    APY:
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2">
                                    {item[1].Ok.supply_rate_apr}%
                                  </p>
                                </div>
                                <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    APY Type:
                                  </p>
                                  <p className="text-right text-white bg-[#79779a] px-4 border border-white rounded-lg p-2 dark:text-darkText">
                                    varible
                                  </p>
                                </div>

                                <div className="flex justify-center gap-2 mt-4">
                                  <Button
                                    title={"Borrow"}
                                    onClickHandler={() =>
                                      handleModalOpen(
                                        "borrow",
                                        item.asset,
                                        item.image
                                      )
                                    }
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                                  />
                                  <Button
                                    title={"Repay"}
                                    onClickHandler={() =>
                                      handleModalOpen(
                                        "repay",
                                        item.asset,
                                        item.image
                                      )
                                    }
                                    className={`w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter`}
                                  />
                                </div>
                                {index !==
                                  filteredItems.length - 1 && (
                                    <div className="border-t border-[#2A1F9D] my-4 opacity-50"></div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* desktop screen */}
            <div className="hidden xl:block">
              {isborrowVisible && (
                <>
                  {userData?.Ok?.reserves[0].reduce(
                    (total, reserveGroup) => total + (reserveGroup[1]?.asset_supply || 0),
                    0
                  ) === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="w-full h-auto mt-6 relative max-h-[260px] overflow-hidden">
                      {/* Container for the fixed header */}
                      <div className="w-full sticky top-0 z-10 ">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-3 ml-1">Asset</div>
                          <div className="p-3 -ml-[1px]">Debt</div>
                          <div className="p-3">Apy</div>
                          <div className="p-3">Apy type</div>
                          <div className="p-3"></div>{" "}
                          {/* Empty for the action buttons */}
                        </div>
                      </div>
                      {/* Scrollable table body */}
                      <div
                        className={`w-full h-auto max-h-[calc(100%-40px)] overflow-y-auto scrollbar-custom ${userData?.Ok?.reserves?.filter((reserveGroup) => reserveGroup[1].asset_supply > 0).length > 3
                          ? "h-[260px]"
                          : ""
                          }`}
                      >
                        <div className="w-full text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText mt-5">
                          {userData?.Ok?.reserves[0].map((reserveGroup, index) => (
                            reserveGroup[1]?.asset_supply > 0 && (
                              <div
                                key={index}
                                className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs mt-1"
                              >
                                <div className="p-3 flex items-center gap-2">
                                  {reserveGroup[1]?.reserve === "ckBTC" && (
                                    <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  {reserveGroup[1]?.reserve === "ckETH" && (
                                    <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                  )}
                                  {reserveGroup[1]?.reserve}
                                </div>
                                <div className="p-3">
                                  <div className="flex flex-col">
                                    {reserveGroup[1]?.reserve === "ckETH" && (
                                      <>
                                        <p>{ckETHBalance}</p>
                                        <p className="font-light">${formatNumber(ckETHUsdBalance)}</p>
                                      </>
                                    )}
                                    {reserveGroup[1]?.reserve === "ckBTC" && (
                                      <>
                                        <p>{ckBTCBalance}</p>
                                        <p className="font-light">${formatNumber(ckBTCUsdBalance)}</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="p-3">{borrow_rate_apr}%</div>
                                <div className="p-3">
                                  <div className="w-full flex">
                                    variable
                                  </div>
                                </div>
                                <div className="p-3 flex gap-2">
                                  <Button
                                    title={"Borrow"}
                                    onClickHandler={() =>
                                      handleModalOpen(
                                        "borrow",
                                        item.asset,
                                        item.image
                                      )
                                    }
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5 font-semibold text-xs"
                                  />
                                  <Button
                                    title={"Repay"}
                                    onClickHandler={() =>
                                      handleModalOpen(
                                        "repay",
                                        item.asset,
                                        item.image
                                      )
                                    }
                                    className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                  />
                                </div>
                              </div>
                            )
                          ))}
                        </div>

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>


          </div>

          <div
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${isBorrowVisible ? "min-h-auto" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40 to-[#FCBD78]/40 rounded-[30px]  dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Assets to borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0"
                onClick={toggleBorrowVisibility}
              >
                {isBorrowVisible ? "Hide" : "Show"}
                {isBorrowVisible ? (
                  <EyeOff className="ml-2" size={16} />
                ) : (
                  <Eye size={16} className="ml-2" />
                )}
              </button>
            </div>
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isSupplyVisible && (
                <>
                  {filteredItems.length === 0 ? (
                    noAssetsToBorrowMessage
                  ) : (
                    <div className="relative mt-4 max-h-[290px] overflow-y-auto scrollbar-none">
                      {/* Container for the content */}
                      <div className="w-full">
                        {filteredItems.slice(0, 8).map(
                          (item, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText"
                            >
                              <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                {item[0] === "ckBTC" && (
                                  <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                )}
                                {item[0] === "ckETH" && (
                                  <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                )}
                                <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                  {item[0]}
                                </span>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 mt-6">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Wallet Balance:
                                </p>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  {balance}
                                </p>
                              </div>
                              <div className="flex justify-end text-xs">
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  ${formatNumber(usdBalance)}
                                </p>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-1">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  APY:
                                </p>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2 mb-2">
                                  {item[1].Ok.supply_rate_apr}%
                                </p>
                              </div>
                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-3 mb-4">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Can Be Collateral
                                </p>
                                <div className="-mr-3 -mt-4 mb-4">
                                  <CustomizedSwitches />
                                </div>
                              </div>
                              <div className="flex justify-center gap-2 mt-2 mb-2">
                                <Button
                                  title={"Supply"}
                                  onClickHandler={() =>
                                    handleModalOpen(
                                      "supply",
                                      item.asset,
                                      item.image
                                    )
                                  }
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg"
                                />
                                <Button
                                  title={"Withdraw"}
                                  onClickHandler={() =>
                                    handleModalOpen(
                                      "withdraw",
                                      item.asset,
                                      item.image
                                    )
                                  }
                                  className="w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent"
                                />
                              </div>
                              {index !==
                                filteredItems.length - 1 && (
                                  <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* DESKTOP */}
            <div className="hidden xl:block">
              {isBorrowVisible && (
                <>
                  <div className="bg-[#AEADCB] opacity-80 mt-2 px-2 py-2 mb-2 rounded-lg flex items-center">
                    <span className="text-white dark:text-darkText ms-4 text-sm">
                      To borrow, you need to supply any asset to be used as
                      collateral.
                    </span>
                    <Info className="ml-4 text-[#2A1F9D]" />
                  </div>

                  {/* Combined Borrow and Supply sections with a max height of 260px */}
                  <div className="w-full max-h-[250px] overflow-y-auto scrollbar-custom">
                    {/* Borrow Section */}
                    {/* {MY_ASSET_TO_BORROW_TABLE_ROW.length === 0 ? (
                      noAssetsToBorrowMessage
                    ) : (
                      <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1">
                            {MY_ASSET_TO_BORROW_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 whitespace-nowrap">
                                {index === 2 ? item.header2 : item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MY_ASSET_TO_BORROW_TABLE_ROW.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                              >
                                <td className="p-3 align-top">
                                  <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
                                    <img
                                      src={item.image}
                                      alt={item.asset}
                                      className="w-8 h-8 rounded-full"
                                    />
                                    {item.asset}
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="flex flex-col">
                                    <p>{item.wallet_balance_count}</p>
                                    <p className="font-light">
                                      ${item.wallet_balance}M
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="flex flex-col">
                                    <p>{item.apy}</p>
                                    <p className="font-light break-words">
                                      {item.apy_desc.slice(0, 18)}
                                      <br />
                                      {item.apy_desc.slice(18, 32)}
                                      <br />
                                      {item.apy_desc.slice(32)}
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-3">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "borrow",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                    />
                                    <Button
                                      title={"Details"}
                                      onClickHandler={() =>
                                        handleModalOpen("payment")
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )} */}

                    {/* Gradient border line after the borrow section */}
                    {/* <div className="relative">
                      <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] opacity-50" />
                    </div> */}

                    {/* Supply Section */}
                    {filteredItems.length === 0 ? (
                      noAssetsToBorrowMessage
                    ) : (
                      <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText mt-4">
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1">
                            {MY_ASSET_TO_SUPPLY_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 whitespace-nowrap">
                                {index === 2 ? item.header1 : item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                              >
                                <td className="p-3 align-top">
                                  <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
                                    {item[0] === "ckBTC" && (
                                      <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full" />
                                    )}
                                    {item[0] === "ckETH" && (
                                      <img src={ckETH} alt="cketh logo" className="w-8 h-8 rounded-full" />
                                    )}
                                    {item[0]}
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="flex flex-col">
                                    {item[0] === "ckBTC" && (
                                      <>
                                        <p>{ckBTCBalance}</p>
                                        <p className="font-light">${formatNumber(ckBTCUsdBalance)}</p>
                                      </>
                                    )}
                                    {item[0] === "ckETH" && (
                                      <>
                                        <p>{ckETHBalance}</p>
                                        <p className="font-light">${formatNumber(ckETHUsdBalance)}</p>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 align-center mt-1.5">
                                  <p >{item[1].Ok.borrow_rate}%</p>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-3 -mr-[3.8rem]">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "borroww",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                    />
                                    <Button
                                      title={"Details"}
                                      onClickHandler={() =>
                                        handleModalOpen("payment")
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {renderModalOpen(isModalOpen.type)}
    </div>
  );
};

export default MySupply;