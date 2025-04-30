import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../utils/useAuthClient";
import { MY_ASSET_TO_SUPPLY_TABLE_COL } from "../../utils/constants";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import CustomizedSwitches from "../Common/materialUISwitch";
import Button from "../Common/button";
import useAssetData from "../customHooks/useAssets";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import {
  setTotalUsdValueBorrow,
  setTotalUsdValueSupply,
} from "../../redux/reducers/borrowSupplyReducer";
import { toggleDashboardRefresh } from "../../redux/reducers/dashboardDataUpdateReducer";
import MySupplyModal from "./MySupplyModal";
import WithdrawPopup from "./DashboardPopup/WithdrawPopup";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
import PaymentDone from "./DashboardPopup/PaymentDone";
import Borrow from "./DashboardPopup/BorrowPopup";
import Repay from "./DashboardPopup/Repay";
import ColateralPopup from "./DashboardPopup/CollateralDisablePopup";
import { Check, Eye, EyeOff, Info } from "lucide-react";
import MiniLoader from "../Common/miniLoader";
import Lottie from "../Common/lottie";
import FreezeCanisterPopup from "./DashboardPopup/CanisterDrainPopup";

/**
 * DashboardComponent Component
 *
 * This component displays the user's supply, borrow, withdraw and repay information for various assets.
 * @returns {JSX.Element} - Returns the DashboardComponent component displaying assets, balances, and user actions.
 */

const DashboardComponent = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const theme = useSelector((state) => state.theme.theme);
  const { principal, fetchReserveData, createLedgerActor } = useAuth();

  const {
    userData,
    userAccountData,
    isFreezePopupVisible,
    setIsFreezePopupVisible,
  } = useUserData();

  const tooltipRef = useRef(null);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();

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

  const { isSwitchingWallet } = useSelector((state) => state.utility);
  const formatNumber = useFormatNumber();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [valueChanged, setValueChanged] = useState(false);
  const [availableBorrow, setAvailableBorrow] = useState([]);
  const [showAllAssets, setShowAllAssets] = useState(true);
  const [assetBalances, setAssetBalances] = useState([]);
  const [isBorrowPowerTooltipVis, setIsBorrowPowerTooltipVis] = useState(false);
  const [supplyDataLoading, setSupplyDataLoading] = useState(true);
  const [borrowDataLoading, setBorrowDataLoading] = useState(true);
  const [showZeroBalance, setShowZeroBalance] = useState(
    () => JSON.parse(localStorage.getItem("showZeroBalance")) || true
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
    balance: "",
  });

  // this variable for now set to false, we we might use usestate later in case of need
  const isButtonDisabled = false;

  const handleModalOpen = (
    type,
    asset,
    image,
    supplyRateAPR,
    balance,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    totalCollateral,
    totalDebt,
    currentCollateralStatus,
    Ltv,
    borrowableValue,
    borrowableAssetValue,
    total_supply,
    total_borrow
  ) => {
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
      supplyRateAPR: supplyRateAPR,
      balance: balance,
      liquidationThreshold: liquidationThreshold,
      reserveliquidationThreshold: reserveliquidationThreshold,
      assetSupply: assetSupply,
      assetBorrow: assetBorrow,
      totalCollateral: totalCollateral,
      totalDebt: totalDebt,
      currentCollateralStatus: currentCollateralStatus,
      Ltv: Ltv,
      borrowableValue: borrowableValue,
      borrowableAssetValue: borrowableAssetValue,
      total_supply: total_supply,
      total_borrow: total_borrow,
    });
  };

  const [activeSection, setActiveSection] = useState("supply");
  const [isVisible, setIsVisible] = useState(true);
  const [isBorrowVisible, setIsBorrowVisible] = useState(true);
  const [isborrowVisible, setIsborrowVisible] = useState(true);
  const [isSupplyVisible, setIsSupplyVisible] = useState(true);
  const [totalAssetBorrow, setTotalAssetBorrow] = useState(0);
  const toggleBorrowTooltip = () => setIsBorrowPowerTooltipVis((prev) => !prev);

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  // Memoize the principal object to avoid unnecessary re-renders
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                 Derived State, UI Variables, and Route-Based Flags
   * =================================================================================== */
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
  const visibleItems = filteredItems.filter((item) => {
    const balance =
      item[0] === "ckBTC"
        ? ckBTCBalance
        : item[0] === "ckETH"
        ? ckETHBalance
        : item[0] === "ckUSDC"
        ? ckUSDCBalance
        : item[0] === "ICP"
        ? ckICPBalance
        : item[0] === "ckUSDT"
        ? ckUSDTBalance
        : 0;
    return showZeroBalance || Number(balance) > 0;
  });

  const noBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
        <Lottie />
      </div>
      <p className="text-[#8490ff] text-[11px] dark:text-[#c2c2c2] -mt-2 ml-3">
        NOTHING BORROWED YET!
      </p>
    </div>
  );
  const noSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
        <Lottie />
      </div>
      <p className="text-[#8490ff] text-[11px] dark:text-[#c2c2c2] -mt-2 ml-3">
        NOTHING SUPPLIED YET!
      </p>
    </div>
  );
  const noAssetsToSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
        <Lottie />
      </div>
      <p className="text-[#8490ff] text-[11px] dark:text-[#c2c2c2] -mt-2 ml-3">
        NO ASSETS TO SUPPLY!
      </p>
    </div>
  );
  const noAssetsToBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
        <Lottie />
      </div>
      <p className="text-[#8490ff] text-[11px] dark:text-[#c2c2c2] -mt-2 ml-3">
        NO ASSETS TO BORROW!
      </p>
    </div>
  );

  let current_liquidity_rate = "0";
  let borrow_rate_apr = "0";
  let totalUsdValueSupply = 0;
  let totalUsdValueBorrow = 0;

  if (filteredItems && filteredItems.length > 0) {
    const item = filteredItems[0][1].Ok;
    current_liquidity_rate = item.current_liquidity_rate
      ? item.current_liquidity_rate[0]
      : "0";
    borrow_rate_apr = item.borrow_rate ? item.borrow_rate[0] : "0";
  }

  // Calculate total asset supply and borrow values
  const hasVisibleAssets = filteredItems.some((item) => {
    const assetData = item[1].Ok;
    const total_supply = Number(assetData.asset_supply || 0) / 100000000;
    const total_borrow = Number(assetData.asset_borrow || 0) / 100000000;
    const availableBorrowNumber = Number(availableBorrow || 0);
    return availableBorrowNumber > 0 && total_supply > total_borrow;
  });

  //condition for showing the borrow table
  const isTableDisabled =
    !userData?.Ok?.reserves ||
    !userData?.Ok?.reserves[0] ||
    availableBorrow == 0 ||
    userData?.Ok?.reserves[0].every(
      (reserveGroup) =>
        asset_supply === 0n || reserveGroup[1]?.is_collateral === false
    );

  const hasValidAssets = userData?.Ok?.reserves?.[0]?.some((reserveGroup) => {
    const asset = reserveGroup[0];
    const assetBalance = assetBalances.find(
      (balance) => balance.asset === asset
    )?.debtTokenBalance;
    return assetBalance > 0;
  });

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  /**
   * This function fetches the data for all assets that the user has, including reserve data and balance information.
   * It uses the `createLedgerActor` function to interact with the ledger and retrieve the asset balances.
   *
   * @returns {void}
   */
  const fetchAssetData = async () => {
    const balances = [];

    for (const asset of assets) {
      const reserveDataForAsset = await fetchReserveData(asset);
      const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
      const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];
      const assetBalance = {
        asset,
        dtokenBalance: null,
        debtTokenBalance: null,
      };

      if (dtokenId) {
        const dtokenActor = createLedgerActor(dtokenId, idlFactory);
        if (dtokenActor) {
          try {
            const account = { owner: principalObj, subaccount: [] };
            const balance = await dtokenActor.icrc1_balance_of(account);
            assetBalance.dtokenBalance = balance;
          } catch (error) {
            console.error(`Error fetching dtoken balance for ${asset}:`, error);
          }
        }
      }

      if (debtTokenId) {
        const debtTokenActor = createLedgerActor(debtTokenId, idlFactory1);

        if (debtTokenActor) {
          try {
            const account = { owner: principalObj, subaccount: [] };
            const balance = await debtTokenActor.icrc1_balance_of(account);
            assetBalance.debtTokenBalance = balance;
          } catch (error) {
            console.error(
              `Error fetching debt token balance for ${asset}:`,
              error
            );
          }
        }
      }
      balances.push(assetBalance);
    }
    setAssetBalances(balances);
  };

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

  const handleDetailsClick = (asset, assetData) => {
    navigate(`/dashboard/asset-details/${asset}`, { state: { assetData } });
  };

  /**
   * This function calculates the borrowable value and asset value based on the available borrow and asset rate.
   * It uses the provided asset supply rate and the available borrow to determine the borrowable amounts.
   *
   * @param {object} item - The item representing the asset.
   * @param {number} availableBorrow - The available borrow amount for the asset.
   * @param {number} remainingBorrowable - The remaining amount available for borrowing.
   * @returns {object} - Returns an object containing the calculated borrowable value and asset value.
   */
  const calculateBorrowableValues = (
    item,
    availableBorrow,
    remainingBorrowable
  ) => {
    let borrowableValue = "0.00000000";
    let borrowableAssetValue = "0.0000";

    if (Number(availableBorrow)) {
      const assetRates = {
        ckBTC: ckBTCUsdRate,
        ckETH: ckETHUsdRate,
        ckUSDC: ckUSDCUsdRate,
        ICP: ckICPUsdRate,
        ckUSDT: ckUSDTUsdRate,
      };

      const rate = assetRates[item[0]] / 1e8;

      if (rate) {
        borrowableValue =
          remainingBorrowable < Number(availableBorrow) / rate
            ? remainingBorrowable
            : Number(availableBorrow) / rate;

        borrowableAssetValue =
          remainingBorrowable < Number(availableBorrow) / rate
            ? remainingBorrowable * rate
            : Number(availableBorrow);
      }
    }

    return { borrowableValue, borrowableAssetValue };
  };

  // Function to calculate the asset value based on the asset supply and borrow rates
  const getAssetSupplyValue = (asset, principal) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]);
      return supplyValue;
    }
    return noSupplyMessage;
  };

  // Function to calculate the asset borrow value based on the asset borrow rates
  const getAssetBorrowValue = (asset, principal) => {
    if (asset_borrow[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]);
      return borrowValue;
    }
    return noBorrowMessage;
  };

  // Function to handle the switch toggle for showing zero balance
  const calculatedItems = visibleItems.map((item) => {
    const balanceMap = {
      ckBTC: ckBTCBalance,
      ckETH: ckETHBalance,
      ckUSDC: ckUSDCBalance,
      ICP: ckICPBalance,
      ckUSDT: ckUSDTBalance,
    };

    const balance = balanceMap[item[0]] || 0;
    const isZeroBalance = Number(balance) === 0;

    const assetRate = {
      ckBTC: { rate: ckBTCUsdRate },
      ckETH: { rate: ckETHUsdRate },
      ckUSDC: { rate: ckUSDCUsdRate },
      ICP: { rate: ckICPUsdRate },
      ckUSDT: { rate: ckUSDTUsdRate },
    }[item[0]];

    const usdRate = assetRate ? assetRate.rate / 1e8 : 0;
    const calculatedUsdValue = balance * usdRate;

    let displayedBalance;
    if (!isFinite(calculatedUsdValue) || calculatedUsdValue === 0) {
      displayedBalance = "0.00";
    } else if (calculatedUsdValue < 0.01) {
      displayedBalance = `<${(0.01 / usdRate).toLocaleString(undefined, {
        minimumFractionDigits: 7,
        maximumFractionDigits: 7,
      })}`;
    } else {
      displayedBalance =
        balance >= 1
          ? balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : balance.toLocaleString(undefined, {
              minimumFractionDigits: 7,
              maximumFractionDigits: 7,
            });
    }

    const liquidityRate = item[1]?.Ok.current_liquidity_rate;
    const apy = liquidityRate
      ? `${((Number(liquidityRate) * 100) / 100000000).toFixed(2)}%`
      : "<0.01%";

    return {
      item,
      isZeroBalance,
      displayedBalance,
      calculatedUsdValue,
      apy,
    };
  });
  const sortedItems = calculatedItems.sort((a, b) => {
    if (!a.isZeroBalance && b.isZeroBalance) return -1;
    if (a.isZeroBalance && !b.isZeroBalance) return 1;
    return 0;
  });

  //calculate the asset value
  const formatAssetValue = (asset, assetSupply) => {
    const usdRateMap = {
      ckBTC: ckBTCUsdRate / 1e8,
      ckETH: ckETHUsdRate / 1e8,
      ckUSDC: ckUSDCUsdRate / 1e8,
      ICP: ckICPUsdRate / 1e8,
      ckUSDT: ckUSDTUsdRate / 1e8,
    };

    const usdRate = usdRateMap[asset] || 0;
    const usdValue = assetSupply * usdRate;

    let formattedValue = "0.00";

    if (isFinite(usdValue) && usdValue !== 0) {
      if (usdValue < 0.01) {
        formattedValue = `<${(0.01 / usdRate).toLocaleString(undefined, {
          minimumFractionDigits: 7,
          maximumFractionDigits: 7,
        })}`;
      } else {
        formattedValue =
          assetSupply >= 1
            ? assetSupply.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : assetSupply >= 1e-7
            ? assetSupply.toLocaleString(undefined, {
                minimumFractionDigits: 7,
                maximumFractionDigits: 7,
              })
            : assetSupply.toLocaleString(undefined, {
                minimumFractionDigits: 8,
                maximumFractionDigits: 8,
              });
      }
    }

    return formattedValue;
  };

  // Function to format the asset value in USD
  const formatUsdValue = (asset, assetSupply) => {
    const usdRateMap = {
      ckBTC: ckBTCUsdRate / 1e8,
      ckETH: ckETHUsdRate / 1e8,
      ckUSDC: ckUSDCUsdRate / 1e8,
      ICP: ckICPUsdRate / 1e8,
      ckUSDT: ckUSDTUsdRate / 1e8,
    };

    const usdRate = usdRateMap[asset] || 0;
    const usdValue = assetSupply * usdRate;

    if (!isFinite(usdValue) || usdValue === 0) return "$0.00";
    if (usdValue < 0.01) return "<0.01$";

    return `$${usdValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // conditional rendering of jsx update model value for supply and borrow repay withdraw
  const handleAssetAction = (actionType, asset) => {
    const reserveData = userData?.Ok?.reserves[0]?.find(
      (reserveGroup) => reserveGroup[0] === asset
    );
    const currentLiquidity = userData?.Ok?.reserves[0]?.find(
      (reserveGroup) => reserveGroup[0] === asset
    )
      ? userData?.Ok?.reserves[0]?.find(
          (reserveGroup) => reserveGroup[0] === asset
        )[1]?.liquidity_index
      : 0;

    const assetBalance =
      assetBalances.find((balance) => balance.asset === asset)?.dtokenBalance ||
      0;

    const calculated_supply = Math.trunc(
      (Number(assetBalance) / Number(currentLiquidity)) * 1e8
    );
    const assetSupply =
      Math.trunc(
        (calculated_supply * Number(getAssetSupplyValue(asset))) / 1e8
      ) / 1e8;

    const DebtIndex = userData?.Ok?.reserves[0]?.find(
      (reserveGroup) => reserveGroup[0] === asset
    )
      ? userData?.Ok?.reserves[0]?.find(
          (reserveGroup) => reserveGroup[0] === asset
        )[1]?.variable_borrow_index
      : 0;

    const assetBorrowBalance =
      assetBalances.find((balance) => balance.asset === asset)
        ?.debtTokenBalance || 0;

    const assetBorrow =
      (Number(assetBorrowBalance) * Number(getAssetBorrowValue(asset))) /
      (Number(DebtIndex) * 1e8);

    const currentCollateralStatus = reserveData?.[1]?.is_collateral ?? true;

    const totalCollateral =
      parseFloat(Number(userAccountData?.Ok?.[0]) / 100000000) || 0;
    const totalDebt =
      parseFloat(Number(userAccountData?.Ok?.[1]) / 100000000) || 0;
    const item = filteredItems.find((item) => item[0] === asset);
    const liquidationThreshold =
      Number(userAccountData?.Ok?.[3]) / 100000000 || 0;
    const reserveliquidationThreshold =
      Number(item?.[1]?.Ok.configuration.liquidation_threshold) / 100000000;
    const supplyRateApr =
      (Number(item?.[1]?.Ok?.current_liquidity_rate) * 100) / 100000000 || 0;
    const ckBalance =
      asset === "ckBTC"
        ? ckBTCBalance
        : asset === "ckETH"
        ? ckETHBalance
        : asset === "ckUSDC"
        ? ckUSDCBalance
        : asset === "ICP"
        ? ckICPBalance
        : asset === "ckUSDT"
        ? ckUSDTBalance
        : null;
    const Ltv = Number(userData?.Ok?.ltv) / 100000000 || 0;
    const assetData = item[1].Ok;

    const total_supply = Number(assetData?.asset_supply || 0) / 100000000;
    const total_borrow = Number(assetData?.asset_borrow || 0) / 100000000;

    const { borrowableValue, borrowableAssetValue } = calculateBorrowableValues(
      item,
      availableBorrow,
      Number((total_supply * 0.85).toFixed(8)) - Number(total_borrow)
    );
    handleModalOpen(
      actionType,
      asset,
      AssetImages[assets.indexOf(asset)],
      supplyRateApr,
      ckBalance,
      liquidationThreshold,
      reserveliquidationThreshold,
      assetSupply,
      assetBorrow,
      totalCollateral,
      totalDebt,
      currentCollateralStatus,
      Ltv,
      borrowableValue,
      borrowableAssetValue
    );
  };

  const filteredReserves = userData?.Ok?.reserves[0]
    ?.filter((reserveGroup) => {
      const asset = reserveGroup[0];
      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.debtTokenBalance || 0;
      return getAssetBorrowValue(reserveGroup[0]) > 0n && assetBalance > 0;
    })
    .map((reserveGroup, index) => {
      const asset = reserveGroup[0];
      const item = filteredItems.find((item) => item[0] === asset);
      const DebtIndex = userData?.Ok?.reserves[0]?.find(
        (reserveGroup) => reserveGroup[0] === asset
      )?.[1]?.variable_borrow_index;

      const assetBorrowBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.debtTokenBalance || 0;

      const currentLiquidity = userData?.Ok?.reserves[0]?.find(
        (reserveGroup) => reserveGroup[0] === asset
      )?.[1]?.liquidity_index;

      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.dtokenBalance || 0;

      const calculated_supply = Math.trunc(
        (Number(assetBalance) / Number(currentLiquidity)) * 1e8
      );

      const assetSupply =
        Math.trunc(
          (calculated_supply * Number(getAssetSupplyValue(asset))) / 1e8
        ) / 1e8;

      const assetBorrow =
        (Number(assetBorrowBalance) * Number(getAssetBorrowValue(asset))) /
        (Number(DebtIndex) * 1e8);

      const assetData = item[1].Ok;
      const total_supply = Number(assetData?.asset_supply || 0) / 100000000;
      const total_borrow = Number(assetData?.asset_borrow || 0) / 100000000;

      const { borrowableValue } = calculateBorrowableValues(
        item,
        availableBorrow,
        Number((total_supply * 0.85).toFixed(8)) - Number(total_borrow)
      );

      const ckBalance =
        asset === "ckBTC"
          ? ckBTCBalance
          : asset === "ckETH"
          ? ckETHBalance
          : asset === "ckUSDC"
          ? ckUSDCBalance
          : asset === "ICP"
          ? ckICPBalance
          : asset === "ckUSDT"
          ? ckUSDTBalance
          : null;

      const borrowRateApr =
        (Number(item?.[1]?.Ok?.borrow_rate) * 100) / 100000000 || 0;

      const liquidationThreshold =
        Number(userAccountData?.Ok?.[3]) / 100000000 || 0;

      const reserveliquidationThreshold =
        Number(item?.[1]?.Ok.configuration.liquidation_threshold) / 100000000 ||
        0;

      return {
        asset,
        item,
        borrowableValue,
        ckBalance,
        borrowRateApr,
        liquidationThreshold,
        reserveliquidationThreshold,
        assetSupply,
        assetBorrow,
        DebtIndex,
      };
    });

  // Function to calculate the debt value based on the asset and debt amount
  const getDebtValue = (asset, debtAmount) => {
    let usdRate = 0;

    switch (asset) {
      case "ckBTC":
        usdRate = ckBTCUsdRate / 1e8;
        break;
      case "ckETH":
        usdRate = ckETHUsdRate / 1e8;
        break;
      case "ckUSDC":
        usdRate = ckUSDCUsdRate / 1e8;
        break;
      case "ICP":
        usdRate = ckICPUsdRate / 1e8;
        break;
      case "ckUSDT":
        usdRate = ckUSDTUsdRate / 1e8;
        break;
      default:
        return { debtFormatted: "0.00", usdFormatted: "$0.00" };
    }

    const usdValue = debtAmount * usdRate;

    let debtFormatted;
    let usdFormatted;

    if (usdValue < 0.01) {
      const minAssetToEqual001 = 0.01 / usdRate;
      debtFormatted = `<${minAssetToEqual001.toLocaleString(undefined, {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
      })}`;
      usdFormatted = "<$0.01";
    } else {
      debtFormatted =
        debtAmount >= 1
          ? debtAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : debtAmount >= 1e-7
          ? debtAmount.toLocaleString(undefined, {
              minimumFractionDigits: 7,
              maximumFractionDigits: 7,
            })
          : debtAmount.toLocaleString(undefined, {
              minimumFractionDigits: 7,
              maximumFractionDigits: 7,
            });

      usdFormatted =
        "$" +
        usdValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
    }

    return { debtFormatted, usdFormatted };
  };

  // Function to calculate the asset value based on the  total_supply and total_borrow
  const calculateAssetValue = (
    item,
    total_supply,
    total_borrow,
    availableBorrow
  ) => {
    const assetData = {
      ckBTC: { rate: ckBTCUsdRate },
      ckETH: { rate: ckETHUsdRate },
      ckUSDC: { rate: ckUSDCUsdRate },
      ICP: { rate: ckICPUsdRate },
      ckUSDT: { rate: ckUSDTUsdRate },
    }[item[0]];

    if (!assetData)
      return { displayedAsset: "0.00000000", usdFormatted: "$0.00" };

    const usdRate = assetData.rate / 1e8;
    const maxLendable = Number((Number(total_supply) * 0.85).toFixed(8));
    const formattedMaxBorrow =
      maxLendable < Number(total_borrow)
        ? 0
        : Math.min(
            maxLendable - Number(total_borrow),
            Number(availableBorrow) / usdRate
          );

    const usdValue = formattedMaxBorrow * usdRate;

    let displayedAsset;
    if (!isFinite(usdValue) || usdValue === 0) {
      displayedAsset = "0.00000000";
    } else if (usdValue < 0.01) {
      displayedAsset = `<${(0.01 / usdRate).toLocaleString(undefined, {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
      })}`;
    } else {
      displayedAsset = formattedMaxBorrow.toLocaleString(undefined, {
        minimumFractionDigits: formattedMaxBorrow > 1 ? 2 : 8,
        maximumFractionDigits: formattedMaxBorrow > 1 ? 2 : 8,
      });
    }

    const usdFormatted =
      usdValue === 0
        ? "$0.00"
        : usdValue < 0.01
        ? "<0.01$"
        : `$${usdValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;

    return { displayedAsset, usdFormatted };
  };

  //sorting the items
  const getFilteredAndSortedItems = () => {
    return filteredItems
      .filter((item) => {
        userData?.Ok?.reserves[0]?.find(
          (reserveGroup) => reserveGroup[0] === item[0]
        );

        const assetData = item[1].Ok;
        const total_supply = Number(assetData.asset_supply || 0) / 100000000;
        const total_borrow = Number(assetData.asset_borrow || 0) / 100000000;
        const availableBorrowNumber = Number(availableBorrow || 0);

        const isBorrowAvailable = availableBorrowNumber > 0.01;

        if (!showAllAssets) {
          const formattedTotalSupply = (total_supply * 0.85).toFixed(8);
          const formattedTotalBorrow = total_borrow.toFixed(8);

          return (
            formattedTotalSupply > formattedTotalBorrow && isBorrowAvailable
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (showAllAssets) {
          const assetDataA = a[1].Ok;
          const assetDataB = b[1].Ok;

          const total_supply_A =
            Number(assetDataA.asset_supply || 0) / 100000000;
          const total_borrow_A =
            Number(assetDataA.asset_borrow || 0) / 100000000;
          const total_supply_B =
            Number(assetDataB.asset_supply || 0) / 100000000;
          const total_borrow_B =
            Number(assetDataB.asset_borrow || 0) / 100000000;

          const isEligibleA =
            (total_supply_A * 0.85).toFixed(8) > total_borrow_A.toFixed(8);
          const isEligibleB =
            (total_supply_B * 0.85).toFixed(8) > total_borrow_B.toFixed(8);

          if (isEligibleA && !isEligibleB) return -1;
          if (!isEligibleA && isEligibleB) return 1;
          return 0;
        }
        return 0;
      });
  };

  const getFilteredSupplyReserves = () => {
    if (!userData?.Ok?.reserves?.[0]?.length) return [];

    return userData.Ok.reserves[0].filter((reserveGroup) => {
      const asset = reserveGroup[0];

      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.dtokenBalance || 0;

      const assetSupplyValue = getAssetSupplyValue(asset);

      return assetBalance > 0 && assetSupplyValue > 0n;
    });
  };
  const getFilteredBorrowReserves = () => {
    if (!userData?.Ok?.reserves?.[0]?.length) return [];

    return userData.Ok.reserves[0].filter((reserveGroup) => {
      const asset = reserveGroup[0];

      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.debtTokenBalance || 0;

      const assetBorrowValue = getAssetBorrowValue(asset);

      return assetBalance > 0 && assetBorrowValue > 0n;
    });
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    const reserves = userData?.Ok?.reserves?.[0] || [];
    let updatedAvailableBorrow = 0;

    reserves.map((reserveGroup) => {
      const asset = reserveGroup[0];
      const liquidityIndex = reserveGroup[1]?.liquidity_index || 0;
      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)
          ?.dtokenBalance || 0;
      const assetSupply =
        (Number(assetBalance) * Number(getAssetSupplyValue(asset))) /
        (Number(liquidityIndex) * 1e8);
      const isCollateral = reserveGroup[1]?.is_collateral || true;

      if (assetSupply > 0) {
        if (userAccountData?.Ok?.length > 5) {
          const borrowValue = Number(userAccountData.Ok[5]) / 1e8;
          updatedAvailableBorrow = isCollateral ? borrowValue : 0;
        } else {
          updatedAvailableBorrow = 0;
        }
      }
    });
    setAvailableBorrow(updatedAvailableBorrow);

    if (!updatedAvailableBorrow || updatedAvailableBorrow < 0.01) {
      setAvailableBorrow(0);
    } else {
      setAvailableBorrow(updatedAvailableBorrow);
    }
  }, [userAccountData, userData, dashboardRefreshTrigger, assetBalances]);

  useEffect(() => {
    const savedShowZeroBalance = JSON.parse(
      localStorage.getItem("showZeroBalance")
    );
    if (savedShowZeroBalance !== null) {
      setShowZeroBalance(savedShowZeroBalance);
    }
  }, []);
  useEffect(() => {
    if (isFreezePopupVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isFreezePopupVisible]);

  useEffect(() => {
    fetchAssetData();
  }, [assets, principalObj, dashboardRefreshTrigger]);

  useEffect(() => {
    const fetchSupplyData = async () => {
      if (assets.length === 0) return;
      setSupplyDataLoading(true);

      try {
        for (const asset of assets) {
          await fetchAssetSupply(asset);
        }
      } catch (error) {
        console.error("Error fetching supply data:", error);
      } finally {
        setTimeout(() => setSupplyDataLoading(false), 1500);
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
        console.error("Error fetching borrow data:", error);
      } finally {
        setTimeout(() => setBorrowDataLoading(false), 1500);
      }
    };

    fetchSupplyData();
    fetchBorrowData();
  }, [assets, dashboardRefreshTrigger]);

  useEffect(() => {
    if (!filteredDataLoading) {
      setHasLoaded(true);
    }
  }, [filteredDataLoading]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchBalance("ckUSDT"),
          fetchConversionRate(),
        ]);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate, dashboardRefreshTrigger]);

  useEffect(() => {
    setValueChanged(true);
  }, [availableBorrow, filteredItems]);

  useEffect(() => {
    if (valueChanged) {
      calculateBorrowableValues();
    }
  }, [valueChanged, availableBorrow, filteredItems]);

  useEffect(() => {
    if (userData?.Ok?.reserves[0]) {
      userData.Ok.reserves[0].map((reserveGroup) => {
        const totalCollateralValue =
          Number(reserveGroup[1]?.asset_supply || 0n) / 100000000;
        const totalBorrowedValue =
          Number(reserveGroup[1]?.asset_borrow || 0n) / 100000000;
        const liquidationThreshold =
          Number(userData?.liquidation_threshold) / 100000000 || 0.8;

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
      });
    }
  }, [userData, dashboardRefreshTrigger]);

  useEffect(() => {
    let totalSupply = 0;
    let totalBorrow = 0;
    userData?.Ok?.reserves[0]?.forEach((reserveGroup) => {
      const asset = reserveGroup[0];
      const assetSupply = getAssetSupplyValue(asset);
      const assetBorrow = getAssetBorrowValue(asset);
      totalSupply += assetSupply;
      totalBorrow += assetBorrow;
    });

    setTotalAssetBorrow(totalBorrow);
  }, [dashboardRefreshTrigger]);

  /* ===================================================================================
   *                                   Modal Rendering Functions
   * =================================================================================== */
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
                liquidationThreshold={isModalOpen.liquidationThreshold}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                currentCollateralStatus={isModalOpen.currentCollateralStatus}
                Ltv={isModalOpen.Ltv}
                borrowableValue={isModalOpen.borrowableValue}
                borrowableAssetValue={isModalOpen.borrowableAssetValue}
                total_supply={isModalOpen.total_supply}
                total_borrow={isModalOpen.total_borrow}
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
                supplyRateAPR={isModalOpen.supplyRateAPR}
                balance={isModalOpen.balance}
                liquidationThreshold={isModalOpen.liquidationThreshold}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                currentCollateralStatus={isModalOpen.currentCollateralStatus}
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
                liquidationThreshold={isModalOpen.liquidationThreshold}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                currentCollateralStatus={isModalOpen.currentCollateralStatus}
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
                liquidationThreshold={isModalOpen.liquidationThreshold}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );
      case "collateral":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            setIsModalOpen={setIsModalOpen}
            children={
              <ColateralPopup
                isModalOpen={isModalOpen.isOpen}
                handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                balance={isModalOpen.balance}
                liquidationThreshold={isModalOpen.liquidationThreshold}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                assetSupply={isModalOpen.assetSupply}
                assetBorrow={isModalOpen.assetBorrow}
                totalCollateral={isModalOpen.totalCollateral}
                totalDebt={isModalOpen.totalDebt}
                currentCollateralStatus={isModalOpen.currentCollateralStatus}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );
      default:
        return null;
    }
  };

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */
  return (
    <div className="w-full flex-col lg:flex-row flex gap-6 md:-mt-[3rem]">
      <div className="flex justify-center -mb-30 lg:hidden">
        <button
          className={`w-1/2 py-2 button1 ${
            activeSection === "supply"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary text-[17px]"
              : "text-[#2A1F9D] opacity-50  dark:text-darkTextSecondary1 text-[14px]"
          }`}
          onClick={() => setActiveSection("supply")}
        >
          &#8226; Supply
        </button>
        <button
          className={`w-1/2 py-2 button1 ${
            activeSection === "borrow"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary text-[17px]"
              : "text-[#2A1F9D] opacity-50 dark:text-darkTextSecondary text-[14px]"
          }`}
          onClick={() => setActiveSection("borrow")}
        >
          &#8226; Borrow
        </button>
      </div>

      <div className="w-full lg:w-6/12 lg:mt-20">
        <div
          className={`${
            activeSection === "supply" ? "block" : "hidden"
          } lg:block`}
        >
          <div
            id="your-supplies"
            className={`w-full  lgx:overflow-none   ${
              isSupplyVisible ? "min-h-auto" : "min-h-[100px]"
            } py-6 px-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            {}
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                <div className="flex">
                  <h1>Your supplies</h1>
                  <div className="ml-5">
                    {userData?.Ok?.reserves[0]?.map((reserveGroup, index) => {
                      const asset = reserveGroup[0];
                      const currentLiquidity = userData?.Ok?.reserves[0]?.find(
                        (reserveGroup) => reserveGroup[0] === asset
                      )?.[1]?.liquidity_index;
                      const assetBalance =
                        assetBalances.find((balance) => balance.asset === asset)
                          ?.dtokenBalance || 0;
                      const calculated_supply = Math.trunc(
                        (Number(assetBalance) / Number(currentLiquidity)) * 1e8
                      );
                      const assetSupply =
                        Math.trunc(
                          (calculated_supply *
                            Number(getAssetSupplyValue(asset))) /
                            1e8
                        ) / 1e8;
                      let usdValue = 0;

                      if (asset === "ckBTC") {
                        usdValue = assetSupply * (ckBTCUsdRate / 1e8);
                      } else if (asset === "ckETH") {
                        usdValue = assetSupply * (ckETHUsdRate / 1e8);
                      } else if (asset === "ckUSDC") {
                        usdValue = assetSupply * (ckUSDCUsdRate / 1e8);
                      } else if (asset === "ICP") {
                        usdValue = assetSupply * (ckICPUsdRate / 1e8);
                      } else if (asset === "ckUSDT") {
                        usdValue = assetSupply * (ckUSDTUsdRate / 1e8);
                      }

                      if (assetSupply >= 0) {
                        totalUsdValueSupply += usdValue;
                        dispatch(setTotalUsdValueSupply(totalUsdValueSupply));
                      }

                      return null;
                    })}

                    <div className="hidden md:block text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                      <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                        Total
                      </span>
                      ${formatNumber(totalUsdValueSupply)}
                    </div>
                  </div>
                </div>
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
            <div className="inline-block md:hidden ml-4 w-auto mt-2 text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
              <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                Total
              </span>{" "}
              ${formatNumber(totalUsdValueSupply)}
            </div>
            {}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isSupplyVisible && (
                <>
                  {supplyDataLoading ? (
                    <div className="h-[100px] flex justify-center items-center">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : getFilteredSupplyReserves().length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="relative mt-4 max-h-[2250px] scrollbar-none">
                      <div className="w-full">
                        {getFilteredSupplyReserves().map(
                          (reserveGroup, index, arr) => {
                            const asset = reserveGroup[0];
                            const item = filteredItems.find(
                              (i) => i[0] === asset
                            );
                            const currentLiquidity =
                              reserveGroup?.[1]?.liquidity_index;
                            const collateralStatus =
                              reserveGroup?.[1]?.is_collateral;
                            const assetBalance =
                              assetBalances.find((bal) => bal.asset === asset)
                                ?.dtokenBalance || 0;
                            const supplyRateApr =
                              (Number(item?.[1]?.Ok?.current_liquidity_rate) *
                                100) /
                                100000000 || 0;

                            const calculated_supply = Math.trunc(
                              (Number(assetBalance) /
                                Number(currentLiquidity)) *
                                1e8
                            );
                            const assetSupply =
                              Math.trunc(
                                (calculated_supply *
                                  Number(getAssetSupplyValue(asset))) /
                                  1e8
                              ) / 1e8;

                            const ckBalance =
                              asset === "ckBTC"
                                ? ckBTCBalance
                                : asset === "ckETH"
                                ? ckETHBalance
                                : asset === "ckUSDC"
                                ? ckUSDCBalance
                                : asset === "ICP"
                                ? ckICPBalance
                                : asset === "ckUSDT"
                                ? ckUSDTBalance
                                : null;

                            return (
                              <div
                                key={index}
                                className="p-3 rounded-lg dark:bg-darkSurface dark:text-darkText"
                              >
                                <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                  {assets.includes(asset) && (
                                    <img
                                      src={AssetImages[assets.indexOf(asset)]}
                                      alt={`${asset} logo`}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset}
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-4 mt-6">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Asset Supply:
                                  </p>
                                  <div className="text-right text-[#2A1F9D] dark:text-darkText">
                                    <p>
                                      {formatAssetValue(asset, assetSupply)}
                                    </p>
                                    <p className="font-light">
                                      {formatUsdValue(asset, assetSupply)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-between text-xs font-semibold">
                                  <div className="flex relative group">
                                    <p className="dark:text-darkText dark:opacity-50">
                                      APY:
                                    </p>
                                    <span className="relative cursor-pointer group inline-flex ml-1">
                                      <Info
                                        size={14}
                                        className="dark:text-darkText dark:opacity-50"
                                      />
                                      <div className="absolute left-[85px] bottom-full mb-2 w-[15rem] bg-[#fcfafa] dark:bg-darkOverlayBackground dark:text-darkText px-4 py-2 rounded-xl shadow-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        The supply rate APY may vary based on
                                        utilization levels and incentive
                                        structures.
                                      </div>
                                    </span>
                                  </div>
                                  <p className="text-right dark:text-darkText mb-4">
                                    {supplyRateApr < 0.01
                                      ? "<0.01%"
                                      : `${supplyRateApr.toFixed(2)}%`}
                                  </p>
                                </div>

                                <div className="flex justify-between text-xs font-semibold mt-3 mb-4">
                                  <p className="dark:text-darkText dark:opacity-50">
                                    Collateral
                                  </p>
                                  <div className="-mr-6 -mt-3">
                                    <CustomizedSwitches
                                      checked={collateralStatus}
                                      onChange={() =>
                                        handleAssetAction("collateral", item[0])
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-between gap-4">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() => {
                                      fetchAssetSupply(asset);
                                      if (ckBalance === 0) {
                                        toast.dismiss();
                                        toast.info(
                                          `You cannot supply because your balance is 0.`,
                                          {
                                            className: "custom-toast",
                                            position: "top-center",
                                            autoClose: 3000,
                                          }
                                        );
                                        return;
                                      }
                                      handleAssetAction("supply", asset);
                                    }}
                                    disabled={ckBalance === 0}
                                    className="bg-gradient-to-tr from-[#4659CF] via-[#D379AB] to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                  />

                                  <Button
                                    title={"Withdraw"}
                                    onClickHandler={() => {
                                      fetchAssetSupply(asset);
                                      handleAssetAction("withdraw", asset);
                                    }}
                                    className="box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                  />
                                </div>

                                {index !== arr.length - 1 && (
                                  <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
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

            <div className="hidden xl:block">
              {isSupplyVisible && (
                <>
                  {supplyDataLoading ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : getFilteredSupplyReserves().length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative">
                      <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-3 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500] mt-2">
                          <div className="p-3 pl-4 inline-flex">Asset</div>
                          <div className="p-3 inline-flex -ml-1">
                            Asset Supply
                          </div>
                          <div className="p-3 inline-flex relative gap-1 -ml-2">
                            <span>APY</span>
                            <span className="relative cursor-pointer">
                              <span className="group inline-flex">
                                <Info size={14} />
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs  w-[20vw] pointer-events-none">
                                  The supply rate APY may vary based on
                                  utilization levels and incentive structures.
                                </div>
                              </span>
                            </span>
                          </div>
                          <div className="p-3 inline-flex text-nowrap">
                            Is Collateral
                          </div>
                          <div className="p-3 inline-flex"></div>
                        </div>

                        {getFilteredSupplyReserves().map(
                          (reserveGroup, index) => {
                            const asset = reserveGroup[0];
                            const currentLiquidity =
                              userData?.Ok?.reserves[0]?.find(
                                (reserveGroup) => reserveGroup[0] === asset
                              )?.[1]?.liquidity_index;
                            const assetBalance =
                              assetBalances.find(
                                (balance) => balance.asset === asset
                              )?.dtokenBalance || 0;

                            const calculated_supply = Math.trunc(
                              (Number(assetBalance) /
                                Number(currentLiquidity)) *
                                1e8
                            );
                            const assetSupply =
                              Math.trunc(
                                (calculated_supply *
                                  Number(getAssetSupplyValue(asset))) /
                                  1e8
                              ) / 1e8;
                            const item = filteredItems.find(
                              (item) => item[0] === asset
                            );
                            const collateralStatus =
                              reserveGroup[1]?.is_collateral;
                            const supplyRateApr =
                              (Number(item?.[1]?.Ok?.current_liquidity_rate) *
                                100) /
                                100000000 || 0;
                            const ckBalance =
                              asset === "ckBTC"
                                ? ckBTCBalance
                                : asset === "ckETH"
                                ? ckETHBalance
                                : asset === "ckUSDC"
                                ? ckUSDCBalance
                                : asset === "ICP"
                                ? ckICPBalance
                                : asset === "ckUSDT"
                                ? ckUSDTBalance
                                : null;

                            return (
                              <div
                                key={index}
                                className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f]  rounded-lg text-xs"
                              >
                                <div className="p-3 pl-4 align-top flex items-center gap-2">
                                  {assets.includes(asset) && (
                                    <img
                                      src={AssetImages[assets.indexOf(asset)]}
                                      alt={`${asset} logo`}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {asset}
                                </div>

                                <div className="p-3 align-top flex flex-col">
                                  <p className="text-left min-w-[60px] text-[#2A1F9D] dark:text-darkText">
                                    {formatAssetValue(asset, assetSupply)}
                                  </p>
                                  <p className="text-left min-w-[60px] text-[#2A1F9D] dark:text-darkText font-light">
                                    {formatUsdValue(asset, assetSupply)}
                                  </p>
                                </div>

                                <div className="p-3 align-top text-left min-w-[60px]">
                                  {supplyRateApr < 0.01
                                    ? "<0.01%"
                                    : `${supplyRateApr.toFixed(2)}%`}
                                </div>

                                <div className="align-top flex items-center ml-0 mr-0 lg:ml-6 lg:-mr-7">
                                  <CustomizedSwitches
                                    checked={collateralStatus}
                                    onChange={() =>
                                      handleAssetAction("collateral", item[0])
                                    }
                                  />
                                </div>

                                <div className="p-3 align-top flex gap-2 pt-2">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() => {
                                      fetchAssetSupply(asset);
                                      if (ckBalance === 0) {
                                        toast.dismiss();
                                        toast.info(
                                          `You cannot supply because your balance is 0.`,
                                          {
                                            className: "custom-toast",
                                            position: "top-center",
                                            autoClose: 3000,
                                            hideProgressBar: false,
                                            closeOnClick: true,
                                            pauseOnHover: true,
                                            draggable: true,
                                            progress: undefined,
                                          }
                                        );
                                        return;
                                      }
                                      handleAssetAction("supply", asset);
                                    }}
                                    disabled={ckBalance === 0}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5 font-semibold text-xs"
                                  />

                                  <Button
                                    title={"Withdraw"}
                                    onClickHandler={() => {
                                      fetchAssetSupply(asset);
                                      handleAssetAction("withdraw", asset);
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
                  )}
                </>
              )}
            </div>
          </div>

          <div
            id="dashboard-assets-to-supply"
            className={`w-full mt-6  lgx:overflow-none  ${
              isVisible ? "min-h-auto" : "min-h-[100px]"
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
            {isVisible && (
              <div className="flex items-center mx-4 mt-6 select-none">
                {}
                <div
                  className={`w-3 h-3 border-2 border-transparent rounded-sm cursor-pointer 
                flex justify-center items-center relative 
                ${
                  showZeroBalance
                    ? "bg-gradient-to-r from-[#FCBD78]/40 to-[#FCBD78]/40 dark:bg-gradient-to-r dark:from-darkGradientStart dark:to-darkGradientEnd ring-2 ring-[#e0d2dd] dark:ring-darkBlue"
                    : "bg-gray-200 dark:bg-gray-700 ring-2 ring-transparent dark:ring-transparent"
                } 
                focus:outline-none focus:ring-2 focus:ring-[#e0d2dd] dark:focus:ring-darkBlue`}
                  onClick={() => setShowZeroBalance(!showZeroBalance)}
                >
                  {}
                  {showZeroBalance && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute stroke-black dark:stroke-white"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>

                {}
                <label
                  htmlFor="showZeroBalance"
                  className="text-[12px] text-gray-600 dark:text-gray-300 cursor-pointer ml-2"
                >
                  Show zero balance assets
                </label>
              </div>
            )}
            {}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isVisible && (
                <>
                  {filteredDataLoading && !isSwitchingWallet && !hasLoaded ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : visibleItems.length === 0 ? (
                    noAssetsToSupplyMessage
                  ) : (
                    <div className="relative mt-4 max-h-[2250px] scrollbar-none">
                      <div className="w-full">
                        {sortedItems.map(
                          (
                            {
                              item,
                              isZeroBalance,
                              displayedBalance,
                              calculatedUsdValue,
                              apy,
                            },
                            index
                          ) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText ${
                                isZeroBalance
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                {assets.includes(item[0]) && (
                                  <img
                                    src={AssetImages[assets.indexOf(item[0])]}
                                    alt={`${item[0]} logo`}
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                  {item[0]}
                                </span>
                              </div>

                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6">
                                <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Wallet Balance:
                                </p>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  {displayedBalance}
                                </p>
                              </div>

                              <div className="flex justify-end text-[#233D63] text-xs font-light mb-4">
                                <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText ">
                                  {calculatedUsdValue === 0
                                    ? "$0.00"
                                    : calculatedUsdValue < 0.01
                                    ? "<0.01$"
                                    : `$${calculatedUsdValue.toLocaleString(
                                        undefined,
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}`}
                                </p>
                              </div>

                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-4">
                                <div className="flex relative group">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    APY:
                                  </p>
                                  <span className="relative cursor-pointer">
                                    <span className="group inline-flex ml-1">
                                      <Info
                                        size={14}
                                        className="text-[#233D63] dark:text-darkText dark:opacity-50"
                                      />
                                      <div className="absolute left-[85px] transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                        The supply rate APY may vary based on
                                        utilization levels and incentive
                                        structures.
                                      </div>
                                    </span>
                                  </span>
                                </div>
                                <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                  {apy}
                                </p>
                              </div>

                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-4 mb-4">
                                <p className="text-nowrap text-[#233D63] dark:text-darkText dark:opacity-50">
                                  Can Be Collateral
                                </p>
                                <div className="w-full flex items-center justify-end dark:text-darkText mb-2">
                                  <Check color={checkColor} size={16} />
                                </div>
                              </div>

                              <div className="flex justify-between gap-4">
                                <Button
                                  title={"Supply"}
                                  onClickHandler={() => {
                                    fetchAssetSupply(item[0]);

                                    handleAssetAction("supply", item[0]);
                                  }}
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white shadow-md shadow-[#00000040] rounded-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    handleDetailsClick(item[0], item[1])
                                  }
                                  className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                />
                              </div>

                              {index !== sortedItems.length - 1 && (
                                <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
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

            <div className="hidden xl:block">
              {isVisible && (
                <>
                  {filteredDataLoading && !isSwitchingWallet && !hasLoaded ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : visibleItems.length === 0 ? (
                    noAssetsToSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4">
                      <div className="w-full z-10">
                        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          <div className="p-5 pl-4 inline-flex">Asset</div>
                          <div className="p-5 inline-flex -ml-2">
                            Wallet Balance
                          </div>
                          <div className="p-5 inline-flex gap-1 -ml-3">
                            <span>APY</span>
                            <span className="relative cursor-pointer">
                              <span className="group inline-flex ml-1">
                                <Info size={14} />
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[20vw] pointer-events-none">
                                  The supply rate APY may vary based on
                                  utilization levels and incentive structures.
                                </div>
                              </span>
                            </span>
                          </div>
                          <div className="p-5 inline-flex -ml-2">
                            Can be Collateral
                          </div>
                          <div className="p-5 inline-flex"></div>
                        </div>
                      </div>

                      <div className="w-full h-auto max-h-auto overflow-y-auto scrollbar-none">
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {sortedItems.map(
                            (
                              {
                                item,
                                isZeroBalance,
                                displayedBalance,
                                calculatedUsdValue,
                                apy,
                              },
                              index
                            ) => (
                              <div
                                key={index}
                                className={`grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs ${
                                  isZeroBalance
                                    ? "opacity-50 pointer-events-none"
                                    : ""
                                }`}
                              >
                                <div className="p-3 pl-4 align-top flex items-center gap-2">
                                  {assets.includes(item[0]) && (
                                    <img
                                      src={AssetImages[assets.indexOf(item[0])]}
                                      alt={`${item[0]} logo`}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  {item[0]}
                                </div>

                                <div className="p-3 text-left min-w-[60px] align-top flex flex-col">
                                  <p>{displayedBalance}</p>
                                  <p className="font-light text-left min-w-[60px]">
                                    {calculatedUsdValue === 0
                                      ? "$0.00"
                                      : calculatedUsdValue < 0.01
                                      ? "<0.01$"
                                      : `$${calculatedUsdValue.toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}`}
                                  </p>
                                </div>

                                <div className="align-top text-left min-w-[50px] ml-2">
                                  {apy}
                                </div>

                                <div className="p-3 -ml-5 align-top flex items-center justify-center dark:text-darkText">
                                  <Check color={checkColor} size={16} />
                                </div>

                                <div className="p-3 align-top flex gap-2 pt-2">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() => {
                                      fetchAssetSupply(item[0]);

                                      handleAssetAction("supply", item[0]);
                                    }}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5 font-semibold text-xs"
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
                            )
                          )}
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

      <div className="w-full lg:w-6/12 md:-mt-6 lg:mt-20">
        <div
          className={`${
            activeSection === "borrow" ? "block" : "hidden"
          } lg:block`}
        >
          <div
            id="your-borrow"
            className={`w-full  lgx:overflow-none  sxs3:-mt-6 md:-mt-0 ${
              isborrowVisible ? "min-h-auto" : "min-h-[100px]"
            } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-[30px] dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
                <div className="flex">
                  <h1>Your borrow</h1>
                  <div className="ml-5">
                    {userData?.Ok?.reserves[0]?.map((reserveGroup, index) => {
                      const asset = reserveGroup[0];

                      const DebtIndex = userData?.Ok?.reserves[0]?.find(
                        (reserveGroup) => reserveGroup[0] === asset
                      )?.[1]?.variable_borrow_index;

                      const assetBorrowBalance =
                        assetBalances.find((balance) => balance.asset === asset)
                          ?.debtTokenBalance || 0;

                      const assetBorrow =
                        (Number(assetBorrowBalance) *
                          Number(getAssetBorrowValue(asset))) /
                        (Number(DebtIndex) * 1e8);

                      let usdValue = 0;

                      if (asset === "ckBTC") {
                        usdValue = assetBorrow * (ckBTCUsdRate / 1e8);
                      } else if (asset === "ckETH") {
                        usdValue = assetBorrow * (ckETHUsdRate / 1e8);
                      } else if (asset === "ckUSDC") {
                        usdValue = assetBorrow * (ckUSDCUsdRate / 1e8);
                      } else if (asset === "ICP") {
                        usdValue = assetBorrow * (ckICPUsdRate / 1e8);
                      } else if (asset === "ckUSDT") {
                        usdValue = assetBorrow * (ckUSDTUsdRate / 1e8);
                      }

                      if (assetBorrow >= 0) {
                        totalUsdValueBorrow += usdValue;

                        dispatch(setTotalUsdValueBorrow(totalUsdValueBorrow));
                      }

                      return null;
                    })}

                    <div className="flex gap-2">
                      <div className="hidden dxl:block text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 place-content-center rounded-md">
                        <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                          Total
                        </span>{" "}
                        ${formatNumber(totalUsdValueBorrow)}
                      </div>

                      <div className="hidden dxl:block text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 place-content-center rounded-md">
                        <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                          Borrow power used
                        </span>
                        {(() => {
                          const ratio =
                            (totalUsdValueBorrow /
                              (availableBorrow + totalUsdValueBorrow)) *
                            100;
                          if (isNaN(ratio) || !isFinite(ratio)) {
                            return 0;
                          } else if (ratio < 1) {
                            return ratio.toFixed(6);
                          } else {
                            return ratio.toFixed(2);
                          }
                        })()}
                        %
                        <span
                          className="relative inline-block place-content-center ml-1"
                          onMouseEnter={() => setIsBorrowPowerTooltipVis(true)}
                          onMouseLeave={() => setIsBorrowPowerTooltipVis(false)}
                        >
                          <Info
                            size={15}
                            className="ml-1 align-middle cursor-pointer button1 -mb-[3px]"
                            onClick={toggleBorrowTooltip}
                          />

                          {isBorrowPowerTooltipVis && (
                            <div
                              ref={tooltipRef}
                              className="absolute w-[300px] bottom-full transform -translate-x-[39%] mb-4 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                            >
                              <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                                The % of your total borrowing power used. This
                                is based on the amount of your collateral
                                supplied and the total amount that you can
                                borrow.
                              </span>
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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

            <div>
              <div className="inline-block dxl:hidden ml-4 w-auto mt-2 text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                  Total
                </span>{" "}
                ${formatNumber(totalUsdValueBorrow)}
              </div>

              <div className="inline-block dxl:hidden ml-4 w-auto mt-2 text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                  Borrow power used
                </span>{" "}
                {(() => {
                  const ratio =
                    (totalUsdValueBorrow /
                      (availableBorrow + totalUsdValueBorrow)) *
                    100;
                  if (isNaN(ratio) || !isFinite(ratio)) {
                    return 0;
                  } else if (ratio < 1) {
                    return ratio.toFixed(6);
                  } else {
                    return ratio.toFixed(2);
                  }
                })()}
                %
                <span
                  className="relative inline-block place-content-center ml-1"
                  onMouseEnter={() => setIsBorrowPowerTooltipVis(true)}
                  onMouseLeave={() => setIsBorrowPowerTooltipVis(false)}
                >
                  <Info
                    size={15}
                    className="ml-1 align-middle cursor-pointer button1 -mb-[3px]"
                    onClick={toggleBorrowTooltip}
                  />

                  {isBorrowPowerTooltipVis && (
                    <div
                      ref={tooltipRef}
                      className="absolute w-[250px] bottom-full transform -translate-x-[75%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 "
                    >
                      <span className="text-gray-700  text-wrap font-medium text-[11px] dark:text-darkText">
                        The % of your total borrowing power used. This is based
                        on the amount of your collateral supplied and the total
                        amount that you can borrow.
                      </span>
                    </div>
                  )}
                </span>
              </div>
            </div>

            {}
            <div className="block xl:hidden">
              {isborrowVisible && (
                <>
                  {borrowDataLoading && !isSwitchingWallet ? (
                    <div className="h-[100px] flex justify-center items-center">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : !userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    getFilteredBorrowReserves().length === 0 ? (
                    <div className="text-center text-gray-500">
                      {noBorrowMessage}
                    </div>
                  ) : (
                    <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                      <div className="relative mt-4 max-h-[2250px] overflow-y-auto scrollbar-none">
                        <div className="w-full">
                          {getFilteredBorrowReserves().map(
                            (reserveGroup, index) => {
                              const asset = reserveGroup[0];

                              const DebtIndex = userData?.Ok?.reserves[0]?.find(
                                (reserveGroup) => reserveGroup[0] === asset
                              )?.[1]?.variable_borrow_index;

                              const assetBorrowBalance =
                                assetBalances.find(
                                  (balance) => balance.asset === asset
                                )?.debtTokenBalance || 0;
                              const assetBorrow =
                                (Number(assetBorrowBalance) *
                                  Number(getAssetBorrowValue(asset))) /
                                (Number(DebtIndex) * 1e8);

                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );

                              const assetData = item[1].Ok;

                              const total_supply =
                                Number(assetData?.asset_supply || 0) /
                                100000000;
                              const total_borrow =
                                Number(assetData?.asset_borrow || 0) /
                                100000000;

                              const { borrowableValue } =
                                calculateBorrowableValues(
                                  item,
                                  availableBorrow,
                                  Number((total_supply * 0.85).toFixed(8)) -
                                    Number(total_borrow)
                                );

                              const ckBalance =
                                asset === "ckBTC"
                                  ? ckBTCBalance
                                  : asset === "ckETH"
                                  ? ckETHBalance
                                  : asset === "ckUSDC"
                                  ? ckUSDCBalance
                                  : asset === "ICP"
                                  ? ckICPBalance
                                  : asset === "ckUSDT"
                                  ? ckUSDTBalance
                                  : null;

                              const borrowRateApr =
                                (Number(item?.[1]?.Ok?.borrow_rate) * 100) /
                                  100000000 || 0;

                              return (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg dark:bg-darkSurface dark:text-darkText"
                                >
                                  <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                    {assets.includes(asset) && (
                                      <img
                                        src={AssetImages[assets.indexOf(asset)]}
                                        alt={`${asset} logo`}
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset}
                                  </div>

                                  <div className="flex justify-between gap-4">
                                    <div className="text-[#233D63] text-xs font-semibold mt-3 mb-4 w-1/3">
                                      <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mb-1">
                                        Debt
                                      </p>
                                    </div>
                                    <div className="flex flex-col text-right text-[#2A1F9D] dark:text-darkText w-2/3 text-xs font-semibold mt-3">
                                      {(() => {
                                        const { debtFormatted, usdFormatted } =
                                          getDebtValue(item[0], assetBorrow);
                                        return (
                                          <>
                                            <p className="text-[#2A1F9D] dark:text-darkText">
                                              {debtFormatted}
                                            </p>
                                            <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                              {usdFormatted}
                                            </p>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                    <div className="flex items-center relative group">
                                      <p className="text-[#233D63] dark:text-darkText dark:opacity-50 relative">
                                        APY:
                                      </p>
                                      <span className="relative cursor-pointer">
                                        <span className="group inline-flex ml-1">
                                          <Info
                                            size={14}
                                            className="text-[#233D63] dark:text-darkText dark:opacity-50"
                                          />
                                          <div className="absolute left-[85px] transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                            The variable borrow interest rate
                                            may change over time, influenced by
                                            market trends and conditions.
                                          </div>
                                        </span>
                                      </span>
                                    </div>
                                    <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2">
                                      {borrowRateApr < 0.01
                                        ? "<0.01%"
                                        : `${borrowRateApr.toFixed(2)}%`}
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

                                  <div className="flex justify-between gap-4 mt-4">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() => {
                                        if (parseFloat(borrowableValue) <= 0) {
                                          toast.dismiss();
                                          toast.info(
                                            "Insufficient asset supply or balance to allow borrow request",
                                            {
                                              className: "custom-toast",
                                              position: "top-center",
                                              autoClose: 3000,
                                              hideProgressBar: false,
                                              closeOnClick: true,
                                              pauseOnHover: true,
                                              draggable: true,
                                              progress: undefined,
                                            }
                                          );
                                          return;
                                        }

                                        handleAssetAction("borrow", item[0]);
                                      }}
                                      disabled={
                                        isTableDisabled ||
                                        isButtonDisabled ||
                                        parseFloat(borrowableValue) <= 0
                                      }
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                    />

                                    <Button
                                      title={"Repay"}
                                      onClickHandler={() => {
                                        if (ckBalance === 0) {
                                          toast.dismiss();
                                          toast.info(
                                            "Insufficient wallet balance to allow repay request.",
                                            {
                                              className: "custom-toast",
                                              position: "top-center",
                                              autoClose: 3000,
                                              hideProgressBar: false,
                                              closeOnClick: true,
                                              pauseOnHover: true,
                                              draggable: true,
                                              progress: undefined,
                                            }
                                          );
                                          return;
                                        }

                                        handleAssetAction("repay", item[0]);
                                      }}
                                      disabled={
                                        isTableDisabled ||
                                        isButtonDisabled ||
                                        ckBalance === 0
                                      }
                                      className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                    />
                                  </div>

                                  {index !== filteredItems.length - 1 && (
                                    <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
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

            {}
            <div className="hidden xl:block">
              {isborrowVisible && (
                <>
                  {borrowDataLoading && !isSwitchingWallet ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : !userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    getFilteredBorrowReserves().length === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="w-full h-auto mt-6">
                      <div className="w-full z-10">
                        {hasValidAssets && (
                          <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-3 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                            <div className="p-3 pl-4">Asset</div>
                            <div className="p-3 -ml-[4px]">Debt</div>
                            <div className="p-3 inline-flex relative gap-1">
                              <span>APY</span>
                              <span className="relative cursor-pointer">
                                <span className="group inline-flex">
                                  <Info size={14} />
                                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[20vw] pointer-events-none">
                                    The variable borrow interest rate may change
                                    over time, influenced by market trends and
                                    conditions.
                                  </div>
                                </span>
                              </span>
                            </div>
                            <div className="p-3 -ml-1">APY type</div>
                            <div className="p-3"></div>
                          </div>
                        )}
                      </div>

                      <div
                        className={`w-full h-auto max-h-auto overflow-y-auto scrollbar-none ${
                          totalAssetBorrow > 0 ? "h-[260px]" : ""
                        }`}
                      >
                        <div className="w-full text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText mt-5">
                          {filteredReserves?.map((reserveData, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs mt-2"
                            >
                              <div className="p-3 pl-4 flex items-center gap-2">
                                {assets.includes(reserveData.asset) && (
                                  <img
                                    src={
                                      AssetImages[
                                        assets.indexOf(reserveData.asset)
                                      ]
                                    }
                                    alt={`${reserveData.asset} logo`}
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                {reserveData.asset}
                              </div>
                              <div className="p-3">
                                <div className="flex flex-col">
                                  <p className="text-left min-w-[60px]">
                                    {(() => {
                                      const { debtFormatted } = getDebtValue(
                                        reserveData.item[0],
                                        reserveData.assetBorrow
                                      );
                                      return debtFormatted;
                                    })()}
                                  </p>
                                  <p className="text-left min-w-[60px] font-light text-[#2A1F9D] dark:text-darkText">
                                    {(() => {
                                      const { usdFormatted } = getDebtValue(
                                        reserveData.item[0],
                                        reserveData.assetBorrow
                                      );
                                      return usdFormatted;
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div className="p-3 ml-1 text-left min-w-[50px]">
                                {reserveData.borrowRateApr < 0.1
                                  ? "<0.01%"
                                  : `${reserveData.borrowRateApr.toFixed(2)}%`}
                              </div>
                              <div className="p-3">
                                <div className="w-full flex">variable</div>
                              </div>
                              <div className="p-3 flex gap-2">
                                <Button
                                  title={"Borrow"}
                                  onClickHandler={() => {
                                    if (
                                      parseFloat(reserveData.borrowableValue) <=
                                      0
                                    ) {
                                      toast.info(
                                        "Insufficient asset supply or balance to allow borrow request",
                                        {
                                          className: "custom-toast",
                                          position: "top-center",
                                          autoClose: 3000,
                                          hideProgressBar: false,
                                          closeOnClick: true,
                                          pauseOnHover: true,
                                          draggable: true,
                                          progress: undefined,
                                        }
                                      );
                                      return;
                                    }

                                    handleAssetAction(
                                      "borrow",
                                      reserveData.item[0]
                                    );
                                  }}
                                  disabled={
                                    isTableDisabled ||
                                    isButtonDisabled ||
                                    parseFloat(reserveData.borrowableValue) <= 0
                                  }
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                />

                                <Button
                                  title={"Repay"}
                                  onClickHandler={() => {
                                    if (reserveData.ckBalance === 0) {
                                      toast.dismiss();
                                      toast.info(
                                        "Insufficient wallet balance to allow repay request.",
                                        {
                                          className: "custom-toast",
                                          position: "top-center",
                                          autoClose: 3000,
                                          hideProgressBar: false,
                                          closeOnClick: true,
                                          pauseOnHover: true,
                                          draggable: true,
                                          progress: undefined,
                                        }
                                      );
                                      return;
                                    }
                                    handleAssetAction(
                                      "repay",
                                      reserveData.item[0]
                                    );
                                  }}
                                  disabled={
                                    isTableDisabled ||
                                    isButtonDisabled ||
                                    reserveData.ckBalance === 0
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

          <div
            id="dashboard-assets-to-borrow"
            className={`w-full mt-6  lgx:overflow-none  ${
              isBorrowVisible ? "min-h-auto" : "min-h-[100px]"
            } p-6 bg-gradient-to-r from-[#4659CF]/40 to-[#FCBD78]/40 rounded-[30px]  dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-3 mx-4">
              <div className="relative group">
                <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText inline-flex items-center">
                  Assets to borrow
                </h1>
              </div>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4 button1"
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
            {isBorrowVisible && (
              <div className="flex items-center mx-4 mt-6 select-none">
                <div
                  className={`w-3 h-3 border-2 border-transparent rounded-sm cursor-pointer 
                flex justify-center items-center relative 
                ${
                  showAllAssets
                    ? "bg-gradient-to-r from-[#FCBD78]/40 to-[#FCBD78]/40 dark:bg-gradient-to-r dark:from-darkGradientStart dark:to-darkGradientEnd ring-2 ring-[#e0d2dd] dark:ring-darkBlue"
                    : "bg-gray-200 dark:bg-gray-700 ring-2 ring-transparent dark:ring-transparent"
                } 
                focus:outline-none focus:ring-2 focus:ring-[#e0d2dd] dark:focus:ring-darkBlue`}
                  onClick={() => setShowAllAssets(!showAllAssets)}
                >
                  {showAllAssets && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute stroke-black dark:stroke-white"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>

                <label
                  htmlFor="showZeroBalance"
                  className="text-[12px] text-gray-600 dark:text-gray-300 cursor-pointer ml-2"
                >
                  Show assets with no available borrow
                </label>
              </div>
            )}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isBorrowVisible && (
                <>
                  {filteredDataLoading && !isSwitchingWallet && !hasLoaded ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    noAssetsToBorrowMessage
                  ) : (
                    <div className="relative mt-4 max-h-[1250px] scrollbar-none">
                      <div className="w-full">
                        {getFilteredAndSortedItems().map((item, index) => {
                          const assetData = item[1].Ok;
                          const total_supply =
                            Number(assetData?.asset_supply || 0) / 100000000;
                          const total_borrow =
                            Number(assetData?.asset_borrow || 0) / 100000000;
                          const availableBorrowNumber = Number(
                            availableBorrow || 0
                          );

                          const { displayedAsset, usdFormatted } =
                            calculateAssetValue(
                              item,
                              total_supply,
                              total_borrow,
                              availableBorrow
                            );

                          const isEligible =
                            (total_supply * 0.85).toFixed(8) > total_borrow;

                          const itemClass =
                            (showAllAssets && !isEligible) ||
                            availableBorrowNumber === 0
                              ? "opacity-50 pointer-events-none"
                              : "";

                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText ${itemClass} ${
                                isTableDisabled
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                {assets.includes(item[0]) && (
                                  <img
                                    src={AssetImages[assets.indexOf(item[0])]}
                                    alt={`${item[0]} logo`}
                                    className="w-8 h-8 rounded-full"
                                  />
                                )}
                                <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                  {item[0]}
                                </span>
                              </div>

                              <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-4">
                                <div className="flex relative group">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Available:
                                  </p>
                                  <span className="relative cursor-pointer">
                                    <span className="group inline-flex ml-1">
                                      <Info
                                        size={14}
                                        className="text-[#233D63] dark:text-darkText dark:opacity-50"
                                      />
                                      <div className="absolute left-[95px] transform -translate-x-1/2 mb-2 bottom-full bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                        <div className="flex flex-col">
                                          <p>
                                            This is the total amount you can
                                            borrow, determined by your
                                            collateral and limited by the borrow
                                            cap.
                                          </p>
                                          <hr className="my-1" />
                                          <p className="mt-2">
                                            Clicking "Max" may leave a small
                                            balance due to:
                                          </p>
                                          <ul>
                                            <li>1. Borrow cap limit.</li>
                                            <li>2. Price fluctuations.</li>
                                          </ul>
                                        </div>
                                      </div>
                                    </span>
                                  </span>
                                </div>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                  <p>{displayedAsset}</p>
                                  <p className="font-light">{usdFormatted}</p>
                                </p>
                              </div>

                              <div className="flex justify-between text-[#233D63] dark:text-darkText text-xs font-semibold mt-4 mb-1">
                                <div className="flex relative group">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    APY:
                                  </p>
                                  <span className="relative cursor-pointer">
                                    <span className="group inline-flex ml-1">
                                      <Info
                                        size={14}
                                        className="dark:opacity-50"
                                      />
                                      <div className="absolute left-[85px] transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                        The variable borrow interest rate may
                                        change over time, influenced by market
                                        trends and conditions.
                                      </div>
                                    </span>
                                  </span>
                                </div>
                                <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                  {(Number(item[1].Ok.borrow_rate) * 100) /
                                    100000000 <
                                  0.01
                                    ? "<0.01%"
                                    : `${(
                                        (Number(item[1].Ok.borrow_rate) * 100) /
                                        100000000
                                      ).toFixed(2)}%`}
                                </p>
                              </div>

                              <div className="flex justify-between gap-4">
                                <Button
                                  title={"Borrow"}
                                  onClickHandler={() => {
                                    dispatch(toggleDashboardRefresh());
                                    handleAssetAction("borrow", item[0]);
                                  }}
                                  disabled={isTableDisabled || isButtonDisabled}
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-7 py-2 shadow-md shadow-[#00000040] font-semibold text-[14px] w-1/2 "
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    handleDetailsClick(item[0], item[1])
                                  }
                                  disabled={!isEligible}
                                  className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                />
                              </div>
                              {index !== filteredItems.length - 1 && (
                                <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="hidden xl:block mt-2">
              {isBorrowVisible && (
                <>
                  {(!userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    userData?.Ok?.reserves[0].every(
                      (reserveGroup) => reserveGroup[1]?.asset_supply === 0n
                    )) && (
                    <div className="bg-[#6d6c89] opacity-80 mt-4 px-2 py-2 mb-2 rounded-lg flex items-center">
                      <span className="text-white dark:text-darkText ms-4 text-sm">
                        To borrow, you need to supply any asset to be used as
                        collateral.
                      </span>
                      <Info className="ml-2 text-[#5d151c]" size={16} />
                    </div>
                  )}

                  <div className="w-full h-auto mt-6">
                    {filteredDataLoading && !isSwitchingWallet && !hasLoaded ? (
                      <div className="min-h-[100px] flex justify-center items-center ">
                        <MiniLoader isLoading={true} />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      noAssetsToBorrowMessage
                    ) : (
                      <div
                        className={`w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText mt-4 `}
                      >
                        <div>
                          {(showAllAssets || hasVisibleAssets) && (
                            <div className="grid grid-cols-4 items-center text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 pb-3 z-10 mt-4 gap-6">
                              {MY_ASSET_TO_SUPPLY_TABLE_COL.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="p-4 font-[500] flex items-center"
                                  >
                                    <div className="inline-flex relative gap-1">
                                      <p>
                                        {index === 2
                                          ? item.header1
                                          : item.header}
                                      </p>
                                      {index === 1 && (
                                        <span className="relative cursor-pointer">
                                          <span className="group inline-flex">
                                            <Info size={14} />
                                            <div className="absolute left-1/2 transform -translate-x-1/2 mb-2 bottom-full bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[25vw] pointer-events-none">
                                              <div className="flex flex-col">
                                                <p className="mb-1">
                                                  This is the total amount you
                                                  can borrow, determined by your
                                                  collateral and limited by the
                                                  borrow cap.
                                                </p>
                                                <hr className="my-1 mt-1" />
                                                <p className="mt-2">
                                                  Clicking "Max" may leave a
                                                  small balance due to:
                                                </p>
                                                <ul>
                                                  <li>1. Borrow cap limit.</li>
                                                  <li>
                                                    2. Price fluctuations.
                                                  </li>
                                                </ul>
                                              </div>
                                            </div>
                                          </span>
                                        </span>
                                      )}
                                      {index === 2 && (
                                        <span className="relative cursor-pointer">
                                          <span className="group inline-flex">
                                            <Info size={14} />
                                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[20vw] pointer-events-none font-base">
                                              The variable borrow interest rate
                                              may change over time, influenced
                                              by market trends and conditions.
                                            </div>
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-full h-auto max-h-auto overflow-y-auto scrollbar-none">
                          {getFilteredAndSortedItems().map((item, index) => {
                            const assetData = item[1].Ok;
                            const total_supply =
                              Number(assetData?.asset_supply || 0) / 100000000;
                            const total_borrow =
                              Number(assetData?.asset_borrow || 0) / 100000000;
                            const availableBorrowNumber = Number(
                              availableBorrow || 0
                            );
                            const { displayedAsset, usdFormatted } =
                              calculateAssetValue(
                                item,
                                total_supply,
                                total_borrow,
                                availableBorrow
                              );
                            const isEligible =
                              (total_supply * 0.85).toFixed(8) > total_borrow;
                            const itemClass =
                              (showAllAssets && !isEligible) ||
                              availableBorrowNumber === 0
                                ? "opacity-50 pointer-events-none"
                                : "";
                            return (
                              <div
                                key={index}
                                className={`grid grid-cols-4 items-center font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs p-4 gap-6 ${itemClass} ${
                                  isTableDisabled
                                    ? "opacity-50 pointer-events-none"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {assets.includes(item[0]) && (
                                    <img
                                      src={AssetImages[assets.indexOf(item[0])]}
                                      alt={`${item[0]} logo`}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <span className="font-medium">{item[0]}</span>
                                </div>
                                <div className="text-left">
                                  <p>{displayedAsset}</p>
                                  <p className="font-light text-left">
                                    {usdFormatted}
                                  </p>
                                </div>
                                <div className="text-left">
                                  <p className="mt-1.5">
                                    {(Number(item[1].Ok.borrow_rate) * 100) /
                                      100000000 <
                                    0.01
                                      ? "<0.01%"
                                      : `${(
                                          (Number(item[1].Ok.borrow_rate) *
                                            100) /
                                          100000000
                                        ).toFixed(2)}%`}
                                  </p>
                                </div>
                                <div className="flex gap-3 justify-end">
                                  <Button
                                    title={"Borrow"}
                                    onClickHandler={() => {
                                      dispatch(toggleDashboardRefresh());
                                      handleAssetAction("borrow", item[0]);
                                    }}
                                    disabled={!isEligible}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg px-4 py-2 shadow-md shadow-[#00000040] font-semibold text-xs"
                                  />
                                  <Button
                                    title={"Details"}
                                    onClickHandler={() =>
                                      handleDetailsClick(item[0], item[1])
                                    }
                                    disabled={!isEligible}
                                    className="bg-gradient-to-r from-[#4659CF] to-[#2A1F9D] text-white rounded-md px-4 py-2 shadow-md font-semibold text-xs"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {renderModalOpen(isModalOpen.type)}
      {isFreezePopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <FreezeCanisterPopup onClose={() => setIsFreezePopupVisible(false)} />
        </div>
      )}
    </div>
  );
};

export default DashboardComponent;
