import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import React from "react";
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_BORROW_ASSET_TABLE_ROWS,
} from "../../utils/constants";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import Button from "../Common/Button";
import { Check, Eye, EyeOff, Info } from "lucide-react";
import MySupplyModal from "./MySupplyModal";
import WithdrawPopup from "./DashboardPopup/WithdrawPopup";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
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
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";
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
  } = useAuth();

  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);

  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [ckUSDCUsdRate, setCkUSDCUsdRate] = useState(null);
  const [ckICPUsdRate, setCkICPUsdRate] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ckBTCUsdRate, setCkBTCUsdRate] = useState(null);
  const [ckETHUsdRate, setCkETHUsdRate] = useState(null);

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {
          console.error("Error fetching asset principal:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };

    fetchAssetPrinciple();
  }, [principal, backendActor]);

  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      let result;
      switch (asset) {
        case "ckBTC":
          result = await backendActor.get_asset_principal("ckBTC");
          break;
        case "ckETH":
          result = await backendActor.get_asset_principal("ckETH");
          break;
        case "ckUSDC":
          result = await backendActor.get_asset_principal("ckUSDC");
          break;
        case "ICP":
          result = await backendActor.get_asset_principal("ICP");
          break;
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };
  const ledgerActorckBTC = useMemo(
    () =>
      assetPrincipal.ckBTC
        ? createLedgerActor(assetPrincipal.ckBTC, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckBTC]
  );

  const ledgerActorckETH = useMemo(
    () =>
      assetPrincipal.ckETH
        ? createLedgerActor(assetPrincipal.ckETH, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckETH]
  );

  const ledgerActorckUSDC = useMemo(
    () =>
      assetPrincipal.ckUSDC
        ? createLedgerActor(assetPrincipal.ckUSDC, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ckUSDC]
  );

  const ledgerActorICP = useMemo(
    () =>
      assetPrincipal.ICP
        ? createLedgerActor(assetPrincipal.ICP, ledgerIdlFactory)
        : null,
    [createLedgerActor, assetPrincipal.ICP]
  );

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, ckBTCUsdRate]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }
  }, [ckETHBalance, ckETHUsdRate]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate]);

  const pollInterval = 2000;

  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch("https://dfinance.kaifoundry.com/conversion-rates");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        throw new Error("Response was not valid JSON");
      }

      setCkBTCUsdRate(data.bitcoin.usd);
      setCkETHUsdRate(data.ethereum.usd);
      setCkUSDCUsdRate(data["usd-coin"].usd);
      setCkICPUsdRate(data["internet-computer"].usd);
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
      setError(error);
    }
  }, [ckBTCBalance, ckETHBalance, ckUSDCBalance, ckICPBalance, pollInterval]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversionRate();
    }, pollInterval);
    return () => clearInterval(intervalId);
  }, [fetchConversionRate]);

  const fetchBalance = useCallback(
    async (assetType) => {
      if (isAuthenticated && principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          let balance;

          if (assetType === "ckBTC") {
            if (!ledgerActorckBTC) {
              console.warn("Ledger actor for ckBTC not initialized yet");
              return;
            }
            balance = await ledgerActorckBTC.icrc1_balance_of(account);
            const formattedBalance = (balance / BigInt(100000000)).toString();
            setCkBTCBalance(formattedBalance); // Set ckBTC balance
          } else if (assetType === "ckETH") {
            if (!ledgerActorckETH) {
              console.warn("Ledger actor for ckETH not initialized yet");
              return;
            }
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            const formattedBalance = (balance / BigInt(100000000)).toString();
            setCkETHBalance(formattedBalance); // Set ckETH balance
          } else if (assetType === "ckUSDC") {
            if (!ledgerActorckUSDC) {
              console.warn("Ledger actor for ckUSDC not initialized yet");
              return;
            }
            balance = await ledgerActorckUSDC.icrc1_balance_of(account);
            const formattedBalance = (balance / BigInt(100000000)).toString();
            setCKUSDCBalance(formattedBalance); // Set ckUSDC balance
          } else if (assetType === "ICP") {
            if (!ledgerActorICP) {
              console.warn("Ledger actor for ICP not initialized yet");
              return;
            }
            balance = await ledgerActorICP.icrc1_balance_of(account);
            const formattedBalance = (balance / BigInt(100000000)).toString();
            setCkICPBalance(formattedBalance);
          
          } else {
            throw new Error(
              "Unsupported asset type or ledger actor not initialized"
            );
          }
          // console.log(`Fetched Balance for ${assetType}:`, balance.toString());
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      }
    },
    [
      isAuthenticated,
      ledgerActorckBTC,
      ledgerActorckETH,
      ledgerActorckUSDC,
      principalObj,
      ledgerActorICP,
    ]
  );

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchConversionRate(),
        ]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
  ]);

  const { assets, reserveData, filteredItems } = useAssetData();

  const filteredReserveData = Object.fromEntries(filteredItems);

  const [isCollateral, setIsCollateral] = useState(true);
  function formatNumber(num) {
    // Ensure num is a valid number
    const parsedNum = parseFloat(num);

    if (isNaN(parsedNum) || parsedNum === null || parsedNum === undefined) {
      return "0";
    }
    if (parsedNum >= 1000000000) {
      return (parsedNum / 1000000000).toFixed(1).replace(/.0$/, "") + "B";
    }
    if (parsedNum >= 1000000) {
      return (parsedNum / 1000000).toFixed(1).replace(/.0$/, "") + "M";
    }
    if (parsedNum >= 1000) {
      return (parsedNum / 1000).toFixed(1).replace(/.0$/, "") + "K";
    }
    return parsedNum.toFixed(2).toString();
  }

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";

  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
    balance: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (backendActor) {
        try {
          const result = await getUserData(principal.toString());
          setUserData(result);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
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
      console.log("get_user_data in mysupply:", result);
      return result;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  const handleModalOpen = (
    type,
    asset,
    image,
    supplyRateAPR,
    balance,
    reserveliquidationThreshold,
    liquidationThreshold,
    assetSupply,
    assetBorrow,
    totalCollateral,
    totalDebt,
    Ltv
  ) => {
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
      supplyRateAPR: supplyRateAPR,
      balance: balance,
      reserveliquidationThreshold: reserveliquidationThreshold,
      liquidationThreshold: liquidationThreshold,
      assetSupply: assetSupply,
      assetBorrow: assetBorrow,
      totalCollateral: totalCollateral,
      totalDebt: totalDebt,
      Ltv: Ltv,
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
  const [selectedAsset, setSelectedAsset] = useState(null);
  const handleDetailsClick = (asset, assetData) => {
    setSelectedAsset(asset);
    console.log("assetdetailsinMarket", assetData);
    navigate(`/dashboard/asset-details/${asset}`, { state: { assetData } });
  };
  const renderModalOpen = (type) => {
    switch (type) {
      case "borrow":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            setIsModalOpen={setIsModalOpen}
            children={
              <Borrow
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                balance={isModalOpen.balance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                Ltv={isModalOpen.Ltv}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            setIsModalOpen={setIsModalOpen}
            children={
              <SupplyPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                balance={isModalOpen.balance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
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
            setIsModalOpen={setIsModalOpen}
            children={
              <WithdrawPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                balance={isModalOpen.balance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                setIsModalOpen={setIsModalOpen}
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
            setIsModalOpen={setIsModalOpen}
            children={
              <Repay
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                balance={isModalOpen.balance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                setIsModalOpen={setIsModalOpen}
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
    <div className="mt-2 flex flex-col justify-center align-center place-items-center pb-6 pt-2">
      <div className="w-20 h-15">
        <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
      </div>
      <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
        No assets to borrow.
      </p>
    </div>
  );

  const [collateral, setCollateral] = useState(false);
  const isTableDisabled =
    !userData?.Ok?.reserves ||
    !userData?.Ok?.reserves[0] ||
    userData?.Ok?.reserves[0].every(
      (reserveGroup) => reserveGroup[1]?.asset_supply === 0
    );

  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      const item = filteredItems[0][1].Ok;
      setCollateral(item.can_be_collateral);
    }
  }, [filteredItems]);

  let current_liquidity_rate = "0";
  let borrow_rate_apr = "0";

  if (filteredItems && filteredItems.length > 0) {
    const item = filteredItems[0][1].Ok;
    current_liquidity_rate = item.current_liquidity_rate
      ? item.current_liquidity_rate[0]
      : "0";
    borrow_rate_apr = item.borrow_rate ? item.borrow_rate[0] : "0";
  }

  const [calculatedReserves, setCalculatedReserves] = useState([]);

  useEffect(() => {
    if (userData?.Ok?.reserves[0]) {
      const reservesWithCalculations = userData.Ok.reserves[0].map(
        (reserveGroup) => {
          const totalCollateralValue = reserveGroup[1]?.asset_supply || 0;
          const totalBorrowedValue = reserveGroup[1]?.asset_borrow || 0;
          const liquidationThreshold = userData?.liquidation_threshold || 0.8;

          const ltv =
            totalCollateralValue === 0
              ? 0
              : totalBorrowedValue / totalCollateralValue;

          const healthFactor =
            totalBorrowedValue === 0
              ? Infinity
              : (totalCollateralValue * liquidationThreshold) /
                totalBorrowedValue;

          return {
            ...reserveGroup,
            ltv: ltv.toFixed(2),
            healthFactor:
              healthFactor === Infinity ? "∞" : healthFactor.toFixed(2),
          };
        }
      );

      setCalculatedReserves(reservesWithCalculations);
    }
  }, [userData]);

  return (
    <div className="w-full flex-col lg:flex-row flex gap-6 -mt-10">
      <div className="flex justify-center -mb-38 lg:hidden">
        <button
          className={`w-1/2 py-2 button1 ${
            activeSection === "supply"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
              : "text-[#2A1F9D] opacity-50  dark:text-darkTextSecondary1"
          }`}
          onClick={() => setActiveSection("supply")}
        >
          &#8226; Supply
        </button>
        <button
          className={`w-1/2 py-1 button1 ${
            activeSection === "borrow"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
              : "text-[#2A1F9D] opacity-50 dark:text-darkTextSecondary"
          }`}
          onClick={() => setActiveSection("borrow")}
        >
          &#8226; Borrow
        </button>
      </div>

      <div className="w-full lg:w-6/12 mt-6 md:mt-4 lg:mt-20">
        <div
          className={`${
            activeSection === "supply" ? "block" : "hidden"
          } lg:block`}
        >
          <div
            className={`w-full overflow-scroll lgx:overflow-none hide-scrollbar  ${
              isSupplyVisible ? "min-h-[200px]" : "min-h-[100px]"
            } py-6 px-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Your supplies
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4 button1"
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
                  {!userData?.Ok?.reserves?.[0]?.length ||
                  userData.Ok.reserves[0].every(
                    (reserveGroup) => reserveGroup[1]?.asset_supply === 0
                  ) ? (
                    noSupplyMessage
                  ) : (
                    <div
                      className={`relative mt-4 overflow-y-auto scrollbar-custom ${
                        filteredItems.length > 1
                          ? "max-h-[280px]"
                          : "max-h-auto"
                      }`}
                    >
                      <div
                        className={`w-full ${
                          filteredItems.length > 1 ? "h-full" : ""
                        }`}
                      >
                        {userData?.Ok?.reserves[0]?.map(
                          (reserveGroup, index) => {
                            const asset = reserveGroup[1]?.reserve;
                            const assetSupply =
                              (reserveGroup[1]?.asset_supply || 0)/100000000;
                            const assetBorrow =
                              (reserveGroup[1]?.asset_borrow || 0)/100000000;;

                            if (assetSupply <= 0) return null;

                            const item = filteredItems.find(
                              (item) => item[0] === asset
                            );
                            const supplyRateApr =
                              item?.[1]?.Ok?.current_liquidity_rate || 0;

                            const liquidationThreshold =
                              userData.Ok?.liquidation_threshold * 100 || 0;
                            const reserveliquidationThreshold =
                              item?.[1]?.Ok.configuration.liquidation_threshold;
                            const ckBalance =
                              asset === "ckBTC"
                                ? ckBTCBalance
                                : asset === "ckETH"
                                ? ckETHBalance
                                : asset === "ckUSDC"
                                ? ckUSDCBalance
                                : asset === "ICP"
                                ? ckICPBalance
                                : null;

                            return (
                              <div
                                key={index}
                                className="p-3 rounded-lg dark:bg-darkSurface dark:text-darkText"
                              >
                                <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                  {asset === "ckBTC" && (
                                    <img
                                      src={ckBTC}
                                      alt="ckbtc logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset === "ckETH" && (
                                    <img
                                      src={ckETH}
                                      alt="cketh logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset === "ckUSDC" && (
                                    <img
                                      src={ckUSDC}
                                      alt="ckUSDC logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset === "ICP" && (
                                    <img
                                      src={icp}
                                      alt="ICP logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset}
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-4 mt-6">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Asset Supply:
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                    {assetSupply}
                                  </p>
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-6 mb-1">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    APY:
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                    {supplyRateApr * 100 < 0.1
                                      ? "<0.1%"
                                      : `${(supplyRateApr * 100).toFixed(2)}%`}
                                  </p>
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-3 mb-4">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Collateral
                                  </p>
                                  <div className="-mr-3 -mt-4 mb-4">
                                    <CustomizedSwitches checked={true} />
                                  </div>
                                </div>

                                <div className="flex justify-center gap-2 mt-2 mb-2">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() => {
                                      const reserveData =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0]
                                        );
                                      const assetSupply =
                                        (reserveData?.[1]?.asset_supply || 0)/100000000;
                                      const assetBorrow =
                                        (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                      const totalCollateral =
                                        userData?.Ok?.total_collateral || 0;

                                      const totalDebt =
                                        userData?.Ok?.total_debt || 0;
                                      console.log(
                                        "totaldebt and total collateral",
                                        totalDebt,
                                        totalCollateral
                                      );
                                      handleModalOpen(
                                        "supply",
                                        asset,
                                        (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
                                        supplyRateApr,
                                        ckBalance,
                                        reserveliquidationThreshold,
                                        liquidationThreshold,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt
                                      );
                                    }}
                                    className="bg-gradient-to-tr from-[#4659CF] via-[#D379AB] to-[#FCBD78] text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg font-inter"
                                  />

                                  <Button
                                    title={"Withdraw"}
                                    onClickHandler={() => {
                                      const reserveData =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0]
                                        );
                                      const totalCollateral =
                                        userData?.Ok?.total_collateral || 0;
                                      const totalDebt =
                                        userData?.Ok?.total_debt || 0;
                                      const assetSupply =
                                        (reserveData?.[1]?.asset_supply || 0)/100000000;
                                      const assetBorrow =
                                        (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                      handleModalOpen(
                                        "withdraw",
                                        asset,
                                        (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
                                        supplyRateApr,
                                        ckBalance,
                                        reserveliquidationThreshold,
                                        liquidationThreshold,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt
                                      );
                                    }}
                                    className="w-[380px] md:block lgx:block xl:hidden px-4 py-[7px] focus:outline-none box bg-transparent"
                                  />
                                </div>

                                {index !==
                                  userData.Ok.reserves[0].length - 1 && (
                                  <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                                )}
                              </div>
                            );
                          }
                        )}
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
                  {!userData?.Ok?.reserves ||
                  !userData?.Ok?.reserves[0] ||
                  userData?.Ok?.reserves[0].every(
                    (reserveGroup) => reserveGroup[1]?.asset_supply === 0
                  ) ? (
                    noSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative max-h-[300px] overflow-hidden">
                      <div className="w-full z-10 sticky top-0">
                        <div className="grid grid-cols-[2fr_1.14fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-5 pl-4">Asset</div>
                          <div className="p-5">Asset Supply</div>
                          <div className="p-5">Apy</div>
                          <div className="p-5"> Is Collateral</div>
                          <div className="p-5"></div>
                        </div>
                      </div>

                      {/* Scrollable Content Area */}
                      <div
                        className={`w-full h-auto max-h-[200px] overflow-y-auto scrollbar-custom ${
                          userData?.Ok?.reserves[0]?.filter(
                            (reserveGroup) => reserveGroup[1].asset_supply > 0
                          ).length > 3
                            ? "h-[260px]"
                            : ""
                        }`}
                      >
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {userData?.Ok?.reserves[0]?.map(
                            (reserveGroup, index) => {
                              const asset = reserveGroup[1]?.reserve;
                              const assetSupply =
                                (reserveGroup[1]?.asset_supply || 0)/100000000;
                               
                              const assetBorrow =
                                (reserveGroup[1]?.asset_borrow || 0)/100000000;

                              if (assetSupply <= 0) return null;

                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const supplyRateApr =
                                item?.[1]?.Ok?.current_liquidity_rate || 0;
                              const liquidationThreshold =
                                userData.Ok?.liquidation_threshold * 100 || 0;
                              const reserveliquidationThreshold =
                                item?.[1]?.Ok.configuration
                                  .liquidation_threshold;
                              const ckBalance =
                                asset === "ckBTC"
                                  ? ckBTCBalance
                                  : asset === "ckETH"
                                  ? ckETHBalance
                                  : asset === "ckUSDC"
                                  ? ckUSDCBalance
                                  : asset === "ICP"
                                  ? ckICPBalance
                                  : null;
                                 
                              return (
                                <div
                                  key={index}
                                  className="grid grid-cols-[2.2fr_1.13fr_0.9fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                                >
                                  <div className="p-3 pl-4 align-top flex items-center gap-2">
                                    {asset === "ckBTC" && (
                                      <img
                                        src={ckBTC}
                                        alt="ckbtc logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckETH" && (
                                      <img
                                        src={ckETH}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckUSDC" && (
                                      <img
                                        src={ckUSDC}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ICP" && (
                                      <img
                                        src={icp}
                                        alt="ICP logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset}
                                  </div>
                                  
                                  <div className="p-3 align-top flex flex-col">
                                    {assetSupply}
                                  </div>
                                  <div className=" p-3  align-top flex items-center ">
                                    {supplyRateApr * 100 < 0.1
                                      ? "<0.1%"
                                      : `${(supplyRateApr * 100).toFixed(2)}%`}
                                  </div>

                                  <div className=" align-top flex items-center ml-0 mr-0  lg:ml-6 lg:-mr-7">
                                    <CustomizedSwitches checked={true} />
                                  </div>
                                  <div className="p-3 align-top flex gap-2 pt-2">
                                    <Button
                                      title={"Supply"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          (reserveData?.[1]?.asset_supply || 0)/100000000;
                                        const assetBorrow =
                                          (reserveData?.[1]?.asset_borrow || 0)/100000000;

                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;
                                        handleModalOpen(
                                          "supply",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          supplyRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt
                                        );
                                      }}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5 font-semibold text-xs"
                                    />
                                    <Button
                                      title={"Withdraw"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;
                                        const assetSupply =
                                         ( reserveData?.[1]?.asset_supply || 0)/100000000;
                                        const assetBorrow =
                                         ( reserveData?.[1]?.asset_borrow || 0)/100000000;
                                        handleModalOpen(
                                          "withdraw",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          supplyRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt
                                        );
                                      }}
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                    />
                                  </div>
                                </div>
                              );
                            }
                          )}
                         
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${
              isVisible ? "min-h-[200px]" : "min-h-[100px]"
            } py-6 px-6 bg-gradient-to-r from-[#4659CF]/40   to-[#FCBD78]/40  rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Assets to supply
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4 button1"
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
                        {filteredItems.slice(0, 8).map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText"
                          >
                            <div className="p-3 align-top flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              {item[0] === "ckBTC" && (
                                <img
                                  src={ckBTC}
                                  alt="ckbtc logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ckETH" && (
                                <img
                                  src={ckETH}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ckUSDC" && (
                                <img
                                  src={ckUSDC}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ICP" && (
                                <img
                                  src={icp}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
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
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{ckBTCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckBTCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{ckETHBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckETHUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>{ckUSDCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckUSDCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>{ckICPBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckICPUsdBalance)}
                                    </p>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                {item[1].Ok.current_liquidity_rate * 100 < 0.1
                                  ? "<0.1%"
                                  : `${(
                                      item[1].Ok.current_liquidity_rate * 100
                                    ).toFixed(2)}%`}
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
                                onClickHandler={() => {
                                  const reserveData =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === item[0]
                                    );
                                  const assetSupply =
                                    ( reserveData?.[1]?.asset_supply || 0)/100000000;
                                  const assetBorrow =
                                    (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                  const totalCollateral =
                                    userData?.Ok?.total_collateral || 0;
                                  const totalDebt =
                                    userData?.Ok?.total_debt || 0;

                                  handleModalOpen(
                                    "supply",
                                    item[0],
                                    (item[0] === "ckBTC" && ckBTC) ||
                                      (item[0] === "ckETH" && ckETH) ||
                                      (item[0] === "ckUSDC" && ckUSDC) ||
                                      (item[0] === "ICP" && icp),
                                    item[1]?.Ok.current_liquidity_rate,
                                    item[0] === "ckBTC"
                                      ? ckBTCBalance
                                      : item[0] === "ckETH"
                                      ? ckETHBalance
                                      : item[0] === "ckUSDC"
                                      ? ckUSDCBalance
                                      : item[0] === "ICP"
                                      ? ckICPBalance
                                      : null,
                                    item[1]?.Ok.configuration
                                      .liquidation_threshold,

                                    userData.Ok?.liquidation_threshold * 100,

                                    assetSupply,
                                    assetBorrow,
                                    totalCollateral,
                                    totalDebt
                                  );
                                }}
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                              />

                              <Button
                                title={"Details"}
                                onClickHandler={() =>
                                  handleDetailsClick(item[0], item[1])
                                }
                                className="w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter"
                              />
                            </div>
                            {index !== filteredItems.length - 1 && (
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

            {/* for desktop screen */}
            <div className="hidden xl:block">
              {isVisible && (
                <>
                  {filteredItems.length === 0 ? (
                    noAssetsToSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative max-h-[300px] overflow-hidden">
                      {/* Fixed Header */}
                      <div className="w-full z-10 sticky top-0 ">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-5 pl-4">Asset</div>
                          <div className="p-5">Wallet Balance</div>
                          <div className="p-5">Apy</div>
                          <div className="p-5">Can be Collateral</div>
                          <div className="p-5"></div>
                        </div>
                      </div>

                      {/* Scrollable Content Area */}
                      <div className="w-full h-auto max-h-[200px] overflow-y-auto scrollbar-custom">
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {filteredItems.slice(0, 8).map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[2.15fr_1.2fr_0.9fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                            >
                              <div className="p-3 pl-4 align-top flex items-center gap-2">
                                {item[0] === "ckBTC" && (
                                  <img
                                    src={ckBTC}
                                    alt="ckbtc logo"
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                {item[0] === "ckETH" && (
                                  <img
                                    src={ckETH}
                                    alt="cketh logo"
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                {item[0] === "ckUSDC" && (
                                  <img
                                    src={ckUSDC}
                                    alt="ckusdc logo"
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                {item[0] === "ICP" && (
                                  <img
                                    src={icp}
                                    alt="icp logo"
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                {item[0]}
                              </div>
                              <div className="p-3 align-top flex flex-col">
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{ckBTCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckBTCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{ckETHBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckETHUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>{ckUSDCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckUSDCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>{ckICPBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckICPUsdBalance)}
                                    </p>
                                  </>
                                )}
                              </div>

                              <div className="ml-2 align-top">
                                {item[1].Ok.current_liquidity_rate * 100 < 0.1
                                  ? "<0.1%"
                                  : `${(
                                      item[1].Ok.current_liquidity_rate * 100
                                    ).toFixed(2)}%`}
                              </div>

                              <div className="p-3 -ml-3 align-top flex items-center justify-center dark:text-darkText">
                                <Check color={checkColor} size={16} />
                              </div>
                              <div className="p-3 align-top flex gap-2 pt-2">
                                <Button
                                  title={"Supply"}
                                  onClickHandler={() => {
                                    const reserveData =
                                      userData?.Ok?.reserves[0]?.find(
                                        (reserveGroup) =>
                                          reserveGroup[0] === item[0]
                                      );
                                    const assetSupply =
                                      ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                    const assetBorrow =
                                    (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                    const totalCollateral =
                                      userData?.Ok?.total_collateral || 0;
                                    const totalDebt =
                                      userData?.Ok?.total_debt || 0;

                                    handleModalOpen(
                                      "supply",
                                      item[0],
                                      (item[0] === "ckBTC" && ckBTC) ||
                                        (item[0] === "ckETH" && ckETH) ||
                                        (item[0] === "ckUSDC" && ckUSDC) ||
                                        (item[0] === "ICP" && icp),
                                      item[1]?.Ok.current_liquidity_rate,
                                      item[0] === "ckBTC"
                                        ? ckBTCBalance
                                        : item[0] === "ckETH"
                                        ? ckETHBalance
                                        : item[0] === "ckUSDC"
                                        ? ckUSDCBalance
                                        : item[0] === "ICP"
                                        ? ckICPBalance
                                        : null,
                                      item[1]?.Ok.configuration
                                        .liquidation_threshold,
                                      userData.Ok?.liquidation_threshold * 100,

                                      assetSupply,
                                      assetBorrow,
                                      totalCollateral,
                                      totalDebt
                                    );
                                  }}
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    handleDetailsClick(item[0], item[1])
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
          className={`${
            activeSection === "borrow" ? "block" : "hidden"
          } lg:block`}
        >
          <div
            className={`w-full overflow-scroll lgx:overflow-none hide-scrollbar  ${
              isborrowVisible ? "min-h-[200px]" : "min-h-[100px]"
            } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                Your borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0 button1"
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

            {/* mobile screen for borrow */}
            <div className="block xl:hidden">
              {isborrowVisible && (
                <>
                  {!userData?.Ok?.reserves ||
                  !userData?.Ok?.reserves[0] ||
                  userData?.Ok?.reserves[0].every(
                    (reserveGroup) => reserveGroup[1]?.asset_borrow === 0
                  ) ? (
                    noBorrowMessage
                  ) : (
                    <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                      <div className="relative mt-4 max-h-[280px] overflow-y-auto scrollbar-custom">
                        {/* Container for the content */}
                        <div className="w-full">
                          {userData?.Ok?.reserves[0]?.map(
                            (reserveGroup, index) => {
                              const asset = reserveGroup[1]?.reserve;
                              if (reserveGroup[1]?.asset_borrow <= 0)
                                return null;
                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const assetSupply =
                                 (reserveGroup[1]?.asset_supply || 0)/100000000;
                                 console.log("AssetSupply",assetSupply)
                              const assetBorrow =
                                (reserveGroup[1]?.asset_borrow || 0)/100000000;
                              const ckBalance =
                                asset === "ckBTC"
                                  ? ckBTCBalance
                                  : asset === "ckETH"
                                  ? ckETHBalance
                                  : asset === "ckUSDC"
                                  ? ckUSDCBalance
                                  : asset === "ICP"
                                  ? ckICPBalance
                                  : null;
                              const borrowRateApr =
                                item?.[1]?.Ok?.borrow_rate || 0;
                              const liquidationThreshold =
                                userData.Ok?.liquidation_threshold * 100 || 0;
                              const reserveliquidationThreshold =
                                item?.[1]?.Ok.configuration
                                  .liquidation_threshold;

                              return (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText"
                                >
                                  <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                    {asset === "ckBTC" && (
                                      <img
                                        src={ckBTC}
                                        alt="ckbtc logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckETH" && (
                                      <img
                                        src={ckETH}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckUSDC" && (
                                      <img
                                        src={ckUSDC}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ICP" && (
                                      <img
                                        src={icp}
                                        alt="ICP logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset}
                                  </div>
                                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-4">
                                      Debt
                                    </p>
                                    <div className="text-right text-[#2A1F9D] dark:text-darkText mt-4">
                                      {assetBorrow}
                                    </div>
                                  </div>

                                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-2">
                                      APY:
                                    </p>
                                    <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2">
                                      {borrowRateApr * 100 < 0.1
                                        ? "<0.1%"
                                        : `${(borrowRateApr * 100).toFixed(
                                            2
                                          )}%`}
                                    </p>
                                  </div>
                                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                      APY Type:
                                    </p>
                                    <p className="text-right text-white bg-[#79779a] px-4 border border-white rounded-lg p-2 dark:text-darkText">
                                      variable
                                    </p>
                                  </div>

                                  <div className="flex justify-center gap-2 mt-4">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                        const assetBorrow =
                                          (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;
                                        const Ltv = userData?.Ok?.ltv || 0;
                                        console.log("LTV1", Ltv);

                                        handleModalOpen(
                                          "borrow",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          borrowRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt,
                                          Ltv
                                        );
                                      }}
                                      disabled={isTableDisabled}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg font-inter"
                                    />
                                    <Button
                                      title={"Repay"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                        const assetBorrow =
                                        (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;

                                        handleModalOpen(
                                          "repay",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          borrowRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt
                                        );
                                      }}
                                      className={`w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter`}
                                    />
                                  </div>
                                  {index !== filteredItems.length - 1 && (
                                    <div className="border-t border-[#2A1F9D] my-4 opacity-50"></div>
                                  )}
                                </div>
                              );
                            }
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
                  {!userData?.Ok?.reserves ||
                  !userData?.Ok?.reserves[0] ||
                  userData?.Ok?.reserves[0].every(
                    (reserveGroup) => reserveGroup[1]?.asset_borrow === 0
                  ) ? (
                    noBorrowMessage
                  ) : (
                    <div className="w-full h-auto mt-6 relative max-h-[300px] overflow-hidden">
                      {/* Container for the fixed header */}
                      <div className="w-full sticky top-0 z-10">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-1 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-3  pl-4">Asset</div>
                          <div className="p-3 -ml-[4px]">Debt</div>
                          <div className="p-3">Apy</div>
                          <div className="p-3">Apy type</div>
                          <div className="p-3"></div>{" "}
                        </div>
                      </div>
                      {/* Scrollable table body */}
                      <div
                        className={`w-full h-auto max-h-[200px] overflow-y-auto scrollbar-custom ${
                          userData?.Ok?.reserves[0]?.filter(
                            (reserveGroup) => reserveGroup[1].asset_borrow > 0
                          ).length > 3
                            ? "h-[260px]"
                            : ""
                        }`}
                      >
                        <div className="w-full text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText mt-5">
                          {userData?.Ok?.reserves[0]?.map(
                            (reserveGroup, index) => {
                              const asset = reserveGroup[1]?.reserve;
                              if (reserveGroup[1]?.asset_borrow <= 0)
                                return null;
                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const assetSupply =
                                (reserveGroup[1]?.asset_supply || 0)/100000000;
                              const assetBorrow =
                                (reserveGroup[1]?.asset_borrow || 0)/100000000;
                              const ckBalance =
                                asset === "ckBTC"
                                  ? ckBTCBalance
                                  : asset === "ckETH"
                                  ? ckETHBalance
                                  : asset === "ckUSDC"
                                  ? ckUSDCBalance
                                  : asset === "ICP"
                                  ? ckICPBalance
                                  : null;
                              const borrowRateApr =
                                item?.[1]?.Ok?.borrow_rate || 0;
                              const liquidationThreshold =
                                userData.Ok?.liquidation_threshold * 100 || 0;
                              const reserveliquidationThreshold =
                                item?.[1]?.Ok.configuration
                                  .liquidation_threshold;
                              return (
                                <div
                                  key={index}
                                  className="grid grid-cols-[1.95fr_0.9fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs mt-2"
                                >
                                  <div className="p-3 pl-4 flex items-center gap-2">
                                    {asset === "ckBTC" && (
                                      <img
                                        src={ckBTC}
                                        alt="ckbtc logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckETH" && (
                                      <img
                                        src={ckETH}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ckUSDC" && (
                                      <img
                                        src={ckUSDC}
                                        alt="cketh logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset === "ICP" && (
                                      <img
                                        src={icp}
                                        alt="ICP logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset}
                                  </div>
                                  <div className="p-3">
                                    <div className="flex flex-col">
                                      {assetBorrow}
                                    </div>
                                  </div>
                                  <div className="p-3 ml-1">
                                    {borrowRateApr * 100 < 0.1
                                      ? "<0.1%"
                                      : `${(borrowRateApr * 100).toFixed(2)}%`}
                                  </div>

                                  <div className="p-3">
                                    <div className="w-full flex">variable</div>
                                  </div>
                                  <div className="p-3 flex gap-2">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          (reserveData?.[1]?.asset_supply || 0)/100000000;;
                                        const assetBorrow =
                                          (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;
                                        const Ltv = userData?.Ok?.ltv || 0;
                                        console.log("LTV1", Ltv);

                                        handleModalOpen(
                                          "borrow",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          borrowRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt,
                                          Ltv
                                        );
                                      }}
                                      disabled={isTableDisabled}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                    />
                                    <Button
                                      title={"Repay"}
                                      onClickHandler={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                        const assetBorrow =
                                          (reserveData?.[1]?.asset_borrow || 0)/100000000;
                                        const totalCollateral =
                                          userData?.Ok?.total_collateral || 0;
                                        const totalDebt =
                                          userData?.Ok?.total_debt || 0;

                                        handleModalOpen(
                                          "repay",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
                                          borrowRateApr,
                                          ckBalance,
                                          reserveliquidationThreshold,
                                          liquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt
                                        );
                                      }}
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                    />
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${
              isBorrowVisible ? "min-h-auto" : "min-h-[100px]"
            } p-6 bg-gradient-to-r from-[#4659CF]/40 to-[#FCBD78]/40 rounded-[30px]  dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText mb-3">
                Assets to borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0 button1"
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
              {isBorrowVisible && (
                <>
                  {filteredItems.length === 0 ? (
                    noAssetsToBorrowMessage
                  ) : (
                    <div className="relative mt-4 max-h-[290px] overflow-y-auto scrollbar-custom">
                      {/* Container for the content */}
                      <div className="w-full">
                        {filteredItems.slice(0, 8).map((item, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg dark:bg-darkSurface mb-4 dark:text-darkText ${
                              isTableDisabled
                                ? "opacity-50 pointer-events-none"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              {item[0] === "ckBTC" && (
                                <img
                                  src={ckBTC}
                                  alt="ckbtc logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ckETH" && (
                                <img
                                  src={ckETH}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ckUSDC" && (
                                <img
                                  src={ckUSDC}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              {item[0] === "ICP" && (
                                <img
                                  src={icp}
                                  alt="cketh logo"
                                  className="w-8 h-8 rounded-full"
                                />
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
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{ckBTCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckBTCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{ckETHBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckETHUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>{ckUSDCBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckUSDCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>{ckICPBalance}</p>
                                    <p className="font-light">
                                      ${formatNumber(ckICPUsdBalance)}
                                    </p>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-1">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                {item[1].Ok.borrow_rate * 100 < 0.1
                                  ? "<0.1%"
                                  : `${(item[1].Ok.borrow_rate * 100).toFixed(
                                      2
                                    )}%`}
                              </p>
                            </div>

                            <div className="flex justify-center gap-2 mt-2 mb-2">
                              <Button
                                title={"Borrow"}
                                onClickHandler={() => {
                                  const reserveData =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === item[0]
                                    );
                                  const assetSupply =
                                    ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                  const assetBorrow =
                                   ( reserveData?.[1]?.asset_borrow || 0)/100000000;
                                  const totalCollateral =
                                    userData?.Ok?.total_collateral || 0;
                                  const totalDebt =
                                    userData?.Ok?.total_debt || 0;
                                  const Ltv = userData?.Ok?.ltv || 0;
                                  console.log("LTV1", Ltv);
                                  handleModalOpen(
                                    "borrow",
                                    item[0],
                                    (item[0] === "ckBTC" && ckBTC) ||
                                      (item[0] === "ckETH" && ckETH) ||
                                      (item[0] === "ckUSDC" && ckUSDC) ||
                                      (item[0] === "ICP" && icp),
                                    item[1]?.Ok.borrow_rate,
                                    item[0] === "ckBTC"
                                      ? ckBTCBalance
                                      : item[0] === "ckETH"
                                      ? ckETHBalance
                                      : item[0] === "ckUSDC"
                                      ? ckUSDCBalance
                                      : null,

                                    userData.Ok?.liquidation_threshold * 100,
                                    item[1]?.Ok.configuration
                                      .liquidation_threshold,
                                    assetSupply,
                                    assetBorrow,
                                    totalCollateral,
                                    totalDebt,
                                    Ltv
                                  );
                                }}
                                disabled={isTableDisabled}
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg"
                              />
                              <Button
                                title={"Details"}
                                onClickHandler={() =>
                                  handleDetailsClick(item[0], item[1])
                                }
                                disabled={isTableDisabled}
                                className="w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent"
                              />
                            </div>
                            {index !== filteredItems.length - 1 && (
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

            {/* DESKTOP */}
            <div className="hidden xl:block">
              {isBorrowVisible && (
                <>
                  {(!userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    userData?.Ok?.reserves[0].every(
                      (reserveGroup) => reserveGroup[1]?.asset_supply === 0
                    )) && (
                    <div className="bg-[#6d6c89] opacity-80 mt-2 px-2 py-2 mb-2 rounded-lg flex items-center">
                      <span className="text-white dark:text-darkText ms-4 text-sm">
                        To borrow, you need to supply any asset to be used as
                        collateral.
                      </span>
                      <Info className="ml-4 text-[#5d151c]" />
                    </div>
                  )}

                  <div className="w-full max-h-[260px] overflow-y-auto overflow-x-hidden scrollbar-custom">
                    {/* Supply Section */}
                    {filteredItems.length === 0 ? (
                      noAssetsToBorrowMessage
                    ) : (
                      <table
                        className={`w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText mt-4 ${
                          isTableDisabled
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                      >
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 pb-5">
                            {MY_ASSET_TO_SUPPLY_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-2 pl-4 whitespace-nowrap">
                                <p className="mb-5">
                                  {index === 2 ? item.header1 : item.header}
                                </p>
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.slice(0, 8).map((item, index) => (
                            <tr
                              key={index}
                              className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                            >
                              <td className="p-3 pl-4 align-top">
                                <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap mt-2">
                                  {item[0] === "ckBTC" && (
                                    <img
                                      src={ckBTC}
                                      alt="ckbtc logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {item[0] === "ckETH" && (
                                    <img
                                      src={ckETH}
                                      alt="cketh logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {item[0] === "ckUSDC" && (
                                    <img
                                      src={ckUSDC}
                                      alt="cketh logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {item[0] === "ICP" && (
                                    <img
                                      src={icp}
                                      alt="cketh logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {item[0]}
                                </div>
                              </td>
                              <td className="p-3 pl-5 align-bottom">
                                <div className="flex flex-col">
                                  {item[0] === "ckBTC" && (
                                    <>
                                      <p>{ckBTCBalance}</p>
                                      <p className="font-light">
                                        ${formatNumber(ckBTCUsdBalance)}
                                      </p>
                                    </>
                                  )}
                                  {item[0] === "ckETH" && (
                                    <>
                                      <p>{ckETHBalance}</p>
                                      <p className="font-light">
                                        ${formatNumber(ckETHUsdBalance)}
                                      </p>
                                    </>
                                  )}
                                  {item[0] === "ckUSDC" && (
                                    <>
                                      <p>{ckUSDCBalance}</p>
                                      <p className="font-light">
                                        ${formatNumber(ckUSDCUsdBalance)}
                                      </p>
                                    </>
                                  )}
                                  {item[0] === "ICP" && (
                                    <>
                                      <p>{ckICPBalance}</p>
                                      <p className="font-light">
                                        ${formatNumber(ckICPUsdBalance)}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 pl-5 align-center">
                                <p className="mt-1.5">
                                  {item[1].Ok.borrow_rate * 100 < 0.1
                                    ? "<0.1%"
                                    : `${(item[1].Ok.borrow_rate * 100).toFixed(
                                        2
                                      )}%`}
                                </p>
                              </td>

                              <td className="p-3 align-center">
                                <div className="w-full flex gap-3 -mr-[3.8rem]">
                                  <Button
                                    title={"Borrow"}
                                    onClickHandler={() => {
                                      const reserveData =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0]
                                        );
                                      const assetSupply =
                                        ( reserveData?.[1]?.asset_supply || 0)/100000000;;
                                      const assetBorrow =
                                       ( reserveData?.[1]?.asset_borrow || 0)/100000000;
                                      const totalCollateral =
                                        userData?.Ok?.total_collateral || 0;
                                      const totalDebt =
                                        userData?.Ok?.total_debt || 0;
                                      const Ltv = userData?.Ok?.ltv || 0;
                                      console.log("LTV1", Ltv);

                                      handleModalOpen(
                                        "borrow",
                                        item[0],
                                        (item[0] === "ckBTC" && ckBTC) ||
                                          (item[0] === "ckETH" && ckETH) ||
                                          (item[0] === "ckUSDC" && ckUSDC) ||
                                          (item[0] === "ICP" && icp),
                                        item[1]?.Ok.borrow_rate,
                                        item[0] === "ckBTC"
                                          ? ckBTCBalance
                                          : item[0] === "ckETH"
                                          ? ckETHBalance
                                          : item[0] === "ckUSDC"
                                          ? ckUSDCBalance
                                          : item[0] === "ICP"
                                          ? ckICPBalance
                                          : null,

                                        userData.Ok?.liquidation_threshold *
                                          100,
                                        item[1]?.Ok.configuration
                                          .liquidation_threshold,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt,
                                        Ltv
                                      );
                                    }}
                                    disabled={isTableDisabled}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                  />
                                  <Button
                                    title={"Details"}
                                    onClickHandler={() =>
                                      handleDetailsClick(item[0], item[1])
                                    }
                                    disabled={isTableDisabled}
                                    className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
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
