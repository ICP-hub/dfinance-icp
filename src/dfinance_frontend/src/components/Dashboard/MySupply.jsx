import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../utils/useAuthClient";
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_BORROW_ASSET_TABLE_ROWS,
} from "../../utils/constants";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import CustomizedSwitches from "../Common/MaterialUISwitch";
import Button from "../Common/Button";
import useAssetData from "../Common/useAssets";
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
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import Loading from "../Common/Loading";
import MiniLoader from "../Common/MiniLoader";
import Lottie from "../Common/Lottie";

const MySupply = () => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  console.log("dashboardRefreshTrigger", dashboardRefreshTrigger);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state, pathname } = useLocation();

  const { principal, fetchReserveData, createLedgerActor, user, backendActor } =
    useAuth();
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [valueChanged, setValueChanged] = useState(false);
  const [availableBorrow, setAvailableBorrow] = useState([]);
  const [borrowableBTC, setBorrowableBTC] = useState(0);
  const [borrowableETH, setBorrowableETH] = useState(0);
  const [borrowableUSDC, setBorrowableUSDC] = useState(0);
  const [borrowableICP, setBorrowableICP] = useState(0);
  const [borrowableUSDT, setBorrowableUSDT] = useState(0);
  const [currentLiquidityIndex, setCurrentLiquidityIndex] = useState(0);
  const [showAllAssets, setShowAllAssets] = useState(true);
  const [hideZeroBorrowAssets, setHideZeroBorrowAssets] = useState(false);
  const [assetBalances, setAssetBalances] = useState([]);
  // Handle toggle of showAllAssets
  const handleToggleShowAllAssets = () => {
    setShowAllAssets(!showAllAssets);
  };
  const { userData, userAccountData, refetchUserData, fetchUserAccountData } =
    useUserData();
  useEffect(() => {
    if (userData && userAccountData) {
      setLoading(false);
    }
  }, [userData, userAccountData, dashboardRefreshTrigger]);
  useEffect(() => {
    // Check if userData has reserves
    const reserves = userData?.Ok?.reserves?.[0] || [];
    console.log("Reserves:", reserves);
  
    let updatedAvailableBorrow = 0; // Initialize updatedAvailableBorrow
  
    // Iterate over each asset in the reserves
    reserves.map((reserveGroup) => {
      const asset = reserveGroup[0]; // Extract asset (e.g., "ckBTC", "ckETH")
      const liquidityIndex = reserveGroup[1]?.liquidity_index || 0;
      console.log("Liquidity Index:", liquidityIndex);
  
      // Get the corresponding asset balance
      const assetBalance =
        assetBalances.find((balance) => balance.asset === asset)?.dtokenBalance || 0;
      console.log("Asset Balance for", asset, ":", assetBalance);
  
      // Calculate asset supply
      const assetSupply = (Number(assetBalance) * Number(getAssetSupplyValue(asset))) / (Number(liquidityIndex) * 1e8);
      console.log("Asset Supply for", asset, ":", assetSupply);
  
      // Check if the user has collateral for this asset
      const isCollateral = reserveGroup[1]?.is_collateral || true;
      console.log("Is Collateral for", asset, ":", isCollateral);
  
      // If assetSupply is greater than 0, update availableBorrow to borrowValue
      if (assetSupply > 0) {
        console.log("Asset Supply is greater than 0. Updating Available Borrow.");
        if (userAccountData?.Ok?.length > 5) {
          const borrowValue = Number(userAccountData.Ok[5]) / 1e8;
          console.log("Setting Available Borrow to borrowValue:", borrowValue);
          updatedAvailableBorrow = isCollateral ? borrowValue : 0; // Update availableBorrow if any assetSupply > 0
        } else {
          console.log("User account data length is insufficient. Setting Available Borrow to 0.");
          updatedAvailableBorrow = 0; // Ensure availableBorrow is 0 when insufficient account data
        }
      }
    });
  
    // After checking all reserves, update the availableBorrow state
    setAvailableBorrow(updatedAvailableBorrow);
  
    // If no asset supply > 0, set availableBorrow to 0
    if (updatedAvailableBorrow === 0) {
      console.log("No asset supply > 0. Setting Available Borrow to 0.");
      setAvailableBorrow(0);
    }
  
  }, [userAccountData, userData, dashboardRefreshTrigger ,assetBalances]);
  
  
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );
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
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);
  const [supplyDataLoading, setSupplyDataLoading] = useState(true);
  const [borrowDataLoading, setBorrowDataLoading] = useState(true);

  const [showZeroBalance, setShowZeroBalance] = useState(
    () => JSON.parse(localStorage.getItem("showZeroBalance")) || true
  );
  const handleCheckboxChange = () => {
    setShowZeroBalance((prev) => {
      const newValue = !prev;
      localStorage.setItem("showZeroBalance", JSON.stringify(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    const savedShowZeroBalance = JSON.parse(
      localStorage.getItem("showZeroBalance")
    );
    if (savedShowZeroBalance !== null) {
      setShowZeroBalance(savedShowZeroBalance);
    }
  }, []);

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
            const formattedBalance = Number(balance) / 100000000;
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
            const formattedBalance = Number(balance) / 100000000;
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

  useEffect(() => {
    fetchAssetData();
  }, [assets, principalObj, dashboardRefreshTrigger]);

  const [loadingUserData, setUserDataLoading] = useState(true);
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
  }, [assets, dashboardRefreshTrigger]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // If loading is finished, mark as loaded
    if (!filteredDataLoading) {
      setHasLoaded(true);
    }
  }, [filteredDataLoading]);
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

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (
        parseFloat(ckBTCBalance) *
        (ckBTCUsdRate / 1e8)
      ).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }

    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (
        parseFloat(ckETHBalance) *
        (ckETHUsdRate / 1e8)
      ).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }

    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (
        parseFloat(ckUSDCBalance) *
        (ckUSDCUsdRate / 1e8)
      ).toFixed(2);
      setCkUSDCUsdBalance(balanceInUsd);
    }

    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (
        parseFloat(ckICPBalance) *
        (ckICPUsdRate / 1e8)
      ).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }

    if (ckUSDTBalance && ckUSDTUsdRate) {
      const balanceInUsd = (
        parseFloat(ckUSDTBalance) *
        (ckUSDTUsdRate / 1e8)
      ).toFixed(2);
      setCkUSDTUsdBalance(balanceInUsd);
    }

    if (ckBTCUsdRate) {
      const btcAmount = availableBorrow / (ckBTCUsdRate / 1e8);
      setBorrowableBTC(btcAmount);
    }

    if (ckETHUsdRate) {
      const ethAmount = availableBorrow / (ckETHUsdRate / 1e8);
      setBorrowableETH(ethAmount);
    }

    if (ckUSDCUsdRate) {
      const usdcAmount = availableBorrow / (ckUSDCUsdRate / 1e8);
      setBorrowableUSDC(usdcAmount);
    }

    if (ckUSDTUsdRate) {
      const usdtAmount = availableBorrow / (ckUSDTUsdRate / 1e8);
      setBorrowableUSDT(usdtAmount);
    }

    if (ckICPUsdRate) {
      const icpAmount = availableBorrow / (ckICPUsdRate / 1e8);
      setBorrowableICP(icpAmount);
    }
  }, [
    ckBTCBalance,
    ckBTCUsdRate,
    ckETHBalance,
    ckETHUsdRate,
    ckUSDCBalance,
    ckUSDCUsdRate,
    ckUSDTBalance,
    ckUSDTUsdRate,
    ckICPBalance,
    ckICPUsdRate,
    dashboardRefreshTrigger,
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
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
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate, dashboardRefreshTrigger]);

  const filteredReserveData = Object.fromEntries(filteredItems);

  const [Collateral, setCollateral] = useState(true);

  const formatNumber = useFormatNumber();

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";

  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
    balance: "",
  });
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
  const theme = useSelector((state) => state.theme.theme);
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
  const [activeSection, setActiveSection] = useState("supply");
  const [isVisible, setIsVisible] = useState(true);
  const [isBorrowVisible, setIsBorrowVisible] = useState(true);
  const [isborrowVisible, setIsborrowVisible] = useState(true);
  const [isSupplyVisible, setIsSupplyVisible] = useState(true);
  const [toggled, set] = useState(true);
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
    navigate(`/dashboard/asset-details/${asset}`, { state: { assetData } });
  };

  const handleToggleChange = (newStatus) => {
    dispatch(set(newStatus));
  };
  const formatConditional = (value) => {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      return "0";
    }

    if (numericValue === 0) {
      return "0";
    } else if (numericValue >= 1) {
      return numericValue.toFixed(2);
    } else {
      return numericValue.toFixed(7);
    }
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
  useEffect(() => {
    setValueChanged(true);
  }, [availableBorrow, filteredItems]);
  useEffect(() => {
    if (valueChanged) {
      calculateBorrowableValues();
    }
  }, [valueChanged, availableBorrow, filteredItems]);
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
  const noBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
      <Lottie /> 
      </div>
      <p className="text-[#8490ff] text-[11px] font-semibold dark:text-[#c2c2c2] -mt-2 ml-3">
        NOTHING BORROWED YET !
      </p>
    </div>
  );
  const noSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
      <Lottie /> 
      </div>
      <p className="text-[#8490ff] text-[11px] font-semibold dark:text-[#c2c2c2] -mt-2 ml-3">
      NOTHING SUPPLIED YET !
      </p>
    </div>
  );
  const noAssetsToSupplyMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
     <div className="w-[55px] md:w-[65px]">
      <Lottie /> 
      </div>
      <p className="text-[#8490ff] text-[11px] font-semibold dark:text-[#c2c2c2] -mt-2 ml-3">
        NO ASSETS TO SUPPLY !
      </p>
    </div>
  );
  const noAssetsToBorrowMessage = (
    <div className="mt-2 flex flex-col justify-center align-center place-items-center dark:opacity-70">
      <div className="w-[55px] md:w-[65px]">
      <Lottie /> 
      </div>
      <p className="text-[#8490ff] text-[11px] font-semibold dark:text-[#c2c2c2] -mt-2 ml-3">
      NO ASSETS TO BORROW !
      </p>
    </div>
  );

  const getAssetSupplyValue = (asset, principal) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]);
      return supplyValue;
    }
    return noSupplyMessage;
  };
  const getAssetBorrowValue = (asset, principal) => {
    if (asset_borrow[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]);
      return borrowValue;
    }
    return noBorrowMessage;
  };
  const isTableDisabled =
    !userData?.Ok?.reserves ||
    !userData?.Ok?.reserves[0] ||
    availableBorrow == 0 ||
    userData?.Ok?.reserves[0].every(
      (reserveGroup) =>
        asset_supply === 0n || reserveGroup[1]?.is_collateral === false
    );

  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      const item = filteredItems[0][1].Ok;
      setCollateral(item.can_be_collateral);
    }
  }, [filteredItems, dashboardRefreshTrigger]);

  let current_liquidity_rate = "0";
  let borrow_rate_apr = "0";

  if (filteredItems && filteredItems.length > 0) {
    const item = filteredItems[0][1].Ok;

    const total_supply = item.total_supply;
    const total_borrow = item.total_borrow;

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
        }
      );

      setCalculatedReserves(reservesWithCalculations);
    }
  }, [userData, dashboardRefreshTrigger]);

  let totalUsdValueSupply = 0;
  let totalUsdValueBorrow = 0;
  const [totalAssetSupply, setTotalAssetSupply] = useState(0);
  const [totalAssetBorrow, setTotalAssetBorrow] = useState(0);
  const hasVisibleAssets = filteredItems.some((item) => {
    const assetData = item[1].Ok;
    const total_supply = Number(assetData.asset_supply || 0) / 100000000;
    const total_borrow = Number(assetData.asset_borrow || 0) / 100000000;
    const availableBorrowNumber = Number(availableBorrow || 0);

    // Check if the asset is visible (eligible) based on availableBorrow > 0 and total_supply > total_borrow
    return availableBorrowNumber > 0 && total_supply > total_borrow;
  });
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

    setTotalAssetSupply(totalSupply);
    setTotalAssetBorrow(totalBorrow);
  }, [dashboardRefreshTrigger]);
  const hasValidAssets = userData?.Ok?.reserves?.[0]?.some((reserveGroup) => {
    const asset = reserveGroup[0];
    const assetBalance = assetBalances.find(
      (balance) => balance.asset === asset
    )?.debtTokenBalance;
    return assetBalance > 0; // Check if any asset has a debtTokenBalance > 0
  });
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
                        (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                      )?.[1]?.liquidity_index;

                      const assetBalance =
                        assetBalances.find((balance) => balance.asset === asset)
                          ?.dtokenBalance || 0;

                      const assetSupply =
                        (Number(assetBalance) *
                          Number(getAssetSupplyValue(asset))) /
                        (Number(currentLiquidity) * 1e8);
                      let usdValue = 0;

                      // Determine USD value based on asset type
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

                      // Accumulate total USD value supply
                      if (assetSupply >= 0) {
                        totalUsdValueSupply += usdValue;
                        dispatch(setTotalUsdValueSupply(totalUsdValueSupply));
                      }

                      return null; // Return nothing here since we're doing the calculation and accumulation
                    })}

                    {/* Display total USD value of supply */}
                    <div className="hidden md:block text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                      <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                        Total
                      </span>{" "}
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
                  ) : !userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    userData?.Ok?.reserves[0].filter((reserveGroup) => {
                      const asset = reserveGroup[0];
                      const assetBalance = assetBalances.find(
                        (balance) => balance.asset === asset
                      )?.dtokenBalance;
                      return (
                        (assetBalance > 0 || assetBalance === undefined) &&
                        getAssetSupplyValue(reserveGroup[0]) > 0n
                      ); // Check both conditions
                    }).length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="relative mt-4 max-h-[2250px] scrollbar-none">
                      <div className="w-full">
                        {}
                        {userData?.Ok?.reserves[0]?.length === 0
                          ? noSupplyMessage
                          : userData?.Ok?.reserves[0]
                              ?.filter((reserveGroup) => {
                                const asset = reserveGroup[0];
                                const assetBalance =
                                  assetBalances.find(
                                    (balance) => balance.asset === asset
                                  )?.dtokenBalance || 0;
                                return (
                                  assetBalance > 0 &&
                                  getAssetSupplyValue(reserveGroup[0]) > 0n
                                );
                              })
                              .map((reserveGroup, index, filteredReserves) => {
                                const asset = reserveGroup[0];
                                const currentLiquidity =
                                  userData?.Ok?.reserves[0]?.find(
                                    (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                                  )?.[1]?.liquidity_index;
                                const assetBalance =
                                  assetBalances.find(
                                    (balance) => balance.asset === asset
                                  )?.dtokenBalance || 0;
                                console.log("dtoken balance", assetBalance);
                                console.log("normalize_supply", getAssetSupplyValue(asset));
                                console.log("current liq = ",currentLiquidity);
                                const assetSupply =
                                  (Number(assetBalance) *
                                    Number(getAssetSupplyValue(asset))) /
                                  (Number(currentLiquidity) * 1e8); // Dividing by 1e8 to adjust the value
                                console.log("asset supply", assetSupply);
                                const modiassetSupply = (Number(getAssetSupplyValue(asset))/Number(currentLiquidity))*Number(assetBalance);
                                console.log("modified asset", modiassetSupply);
                                const item = filteredItems.find(
                                  (item) => item[0] === asset
                                );

                                const collateralStatus =
                                  reserveGroup[1]?.is_collateral;

                                const supplyRateApr =
                                  Number(
                                    item?.[1]?.Ok?.current_liquidity_rate
                                  ) / 100000000 || 0;
                                const liquidationThreshold =
                                  Number(userAccountData?.Ok?.[3]) /
                                    100000000 || 0;
                                const reserveliquidationThreshold =
                                  Number(
                                    item?.[1]?.Ok.configuration
                                      .liquidation_threshold
                                  ) / 100000000;

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
                                    {}
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
                                      {asset === "ckUSDT" && (
                                        <img
                                          src={ckUSDT}
                                          alt="ckUSDT logo"
                                          className="w-8 h-8 rounded-full"
                                        />
                                      )}
                                      {asset}
                                    </div>

                                    {}
                                    <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-4 mt-6">
                                      <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                        Asset Supply:
                                      </p>
                                      <div className=" text-right text-[#2A1F9D] dark:text-darkText">
                                        <p className=" text-[#2A1F9D] dark:text-darkText">
                                          {assetSupply <= 0 ||
                                          assetSupply === undefined
                                            ? "No Supply"
                                            : assetSupply >= 1e-8 &&
                                              assetSupply < 1e-7
                                            ? Number(
                                                assetSupply
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 8,
                                                maximumFractionDigits: 8,
                                              })
                                            : assetSupply >= 1e-7 &&
                                              assetSupply < 1e-6
                                            ? Number(
                                                assetSupply
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })
                                            : assetSupply >= 1
                                            ? Number(
                                                assetSupply
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                assetSupply
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                          $
                                          {asset === "ckBTC" &&
                                            formatNumber(
                                              assetSupply * (ckBTCUsdRate / 1e8)
                                            )}
                                          {asset === "ckETH" &&
                                            formatNumber(
                                              assetSupply * (ckETHUsdRate / 1e8)
                                            )}
                                          {asset === "ckUSDC" &&
                                            formatNumber(
                                              assetSupply *
                                                (ckUSDCUsdRate / 1e8)
                                            )}
                                          {asset === "ICP" &&
                                            formatNumber(
                                              assetSupply * (ckICPUsdRate / 1e8)
                                            )}
                                          {asset === "ckUSDT" &&
                                            formatNumber(
                                              assetSupply *
                                                (ckUSDTUsdRate / 1e8)
                                            )}
                                        </p>
                                      </div>
                                    </div>

                                    {}
                                    <div className="flex justify-between text-xs text-[#233D63] font-semibold">
                                      <div className="flex relative group">
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
                                              The supply rate APY may vary based
                                              on utilization levels and
                                              incentive structures.
                                            </div>
                                          </span>
                                        </span>
                                      </div>
                                      <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                        {supplyRateApr < 0.01
                                          ? "<0.01%"
                                          : `${supplyRateApr.toFixed(2)}%`}
                                      </p>
                                    </div>

                                    {}
                                    <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-3 mb-4">
                                      <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                        Collateral
                                      </p>
                                      <div className="-mr-6 -mt-3">
                                        <CustomizedSwitches
                                          checked={collateralStatus}
                                          onChange={() => {
                                            const reserveData =
                                              userData?.Ok?.reserves[0]?.find(
                                                (reserveGroup) =>
                                                  reserveGroup[0] === item[0]
                                              );
                                            const currentLiquidity =
                                              userData?.Ok?.reserves[0]?.find(
                                                (reserveGroup) =>
                                                  reserveGroup[0] === item[0] // Check if the asset matches
                                              )?.[1]?.liquidity_index;
                                            const assetBalance =
                                              assetBalances.find(
                                                (balance) =>
                                                  balance.asset === item[0]
                                              )?.dtokenBalance || 0;

                                            const assetSupply =
                                              (Number(assetBalance) *
                                                Number(
                                                  getAssetSupplyValue(asset)
                                                )) /
                                              (Number(currentLiquidity) * 1e8); // Dividing by 1e8 to adjust the value

                                            const DebtIndex =
                                              userData?.Ok?.reserves[0]?.find(
                                                (reserveGroup) =>
                                                  reserveGroup[0] === item[0] // Check if the asset matches
                                              )?.[1]?.variable_borrow_index;

                                            const assetBorrowBalance =
                                              assetBalances.find(
                                                (balance) =>
                                                  balance.asset === item[0]
                                              )?.debtTokenBalance || 0;

                                            const assetBorrow =
                                              (Number(assetBorrowBalance) *
                                                Number(
                                                  getAssetBorrowValue(item[0])
                                                )) /
                                              (Number(DebtIndex) * 1e8);

                                            const currentCollateralStatus =
                                              reserveData?.[1]?.is_collateral;

                                            const totalCollateral =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[0]
                                                ) / 100000000
                                              ) || 0;
                                            const totalDebt =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[1]
                                                ) / 100000000
                                              ) || 0;
                                            handleModalOpen(
                                              "collateral",
                                              asset,
                                              (asset === "ckBTC" && ckBTC) ||
                                                (asset === "ckETH" && ckETH) ||
                                                (asset === "ckUSDC" &&
                                                  ckUSDC) ||
                                                (asset === "ICP" && icp) ||
                                                (asset === "ckUSDT" && ckUSDT),
                                              supplyRateApr,
                                              ckBalance,
                                              liquidationThreshold,
                                              reserveliquidationThreshold,
                                              assetSupply,
                                              assetBorrow,
                                              totalCollateral,
                                              totalDebt,
                                              currentCollateralStatus
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {}
                                    <div className="flex justify-between gap-4">
                                      <Button
                                        title={"Supply"}
                                        onClickHandler={() => {
                                          fetchAssetSupply(asset);
                                          if (ckBalance === 0) {
                                            toast.info(
                                              "You cannot supply because your balance is 0."
                                            );
                                            return;
                                          }
                                          const reserveData =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0]
                                            );
                                          const currentLiquidity =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0] // Check if the asset matches
                                            )?.[1]?.liquidity_index;
                                          const assetBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === item[0]
                                            )?.dtokenBalance || 0;

                                          const assetSupply =
                                            (Number(assetBalance) *
                                              Number(
                                                getAssetSupplyValue(asset)
                                              )) /
                                            (Number(currentLiquidity) * 1e8); // Dividing by 1e8 to adjust the value

                                          const DebtIndex =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0] // Check if the asset matches
                                            )?.[1]?.variable_borrow_index;

                                          const assetBorrowBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === item[0]
                                            )?.debtTokenBalance || 0;

                                          const assetBorrow =
                                            (Number(assetBorrowBalance) *
                                              Number(
                                                getAssetBorrowValue(item[0])
                                              )) /
                                            (Number(DebtIndex) * 1e8);

                                          const currentCollateralStatus =
                                            reserveData?.[1]?.is_collateral ??
                                            true;

                                          const totalCollateral =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[0]) /
                                                100000000
                                            ) || 0;
                                          const totalDebt =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[1]) /
                                                100000000
                                            ) || 0;
                                          handleModalOpen(
                                            "supply",
                                            asset,
                                            (asset === "ckBTC" && ckBTC) ||
                                              (asset === "ckETH" && ckETH) ||
                                              (asset === "ckUSDC" && ckUSDC) ||
                                              (asset === "ICP" && icp) ||
                                              (asset === "ckUSDT" && ckUSDT),
                                            supplyRateApr,
                                            ckBalance,
                                            liquidationThreshold,
                                            reserveliquidationThreshold,
                                            assetSupply,
                                            assetBorrow,
                                            totalCollateral,
                                            totalDebt,
                                            currentCollateralStatus
                                          );
                                        }}
                                        disabled={ckBalance === 0}
                                        className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                      />
                                      <Button
                                        title={"Withdraw"}
                                        onClickHandler={() => {
                                          fetchAssetSupply(asset);
                                          const reserveData =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0]
                                            );
                                          const currentLiquidity =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0] // Check if the asset matches
                                            )?.[1]?.liquidity_index;
                                          const assetBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === item[0]
                                            )?.dtokenBalance || 0;

                                          const assetSupply =
                                            (Number(assetBalance) *
                                              Number(
                                                getAssetSupplyValue(asset)
                                              )) /
                                            (Number(currentLiquidity) * 1e8); // Dividing by 1e8 to adjust the value

                                          const DebtIndex =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0] // Check if the asset matches
                                            )?.[1]?.variable_borrow_index;

                                          const assetBorrowBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === item[0]
                                            )?.debtTokenBalance || 0;

                                          const assetBorrow =
                                            (Number(assetBorrowBalance) *
                                              Number(
                                                getAssetBorrowValue(item[0])
                                              )) /
                                            (Number(DebtIndex) * 1e8);

                                          const currentCollateralStatus =
                                            reserveData?.[1]?.is_collateral ??
                                            true;
                                          const totalCollateral =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[0]) /
                                                100000000
                                            ) || 0;
                                          const totalDebt =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[1]) /
                                                100000000
                                            ) || 0;
                                          handleModalOpen(
                                            "withdraw",
                                            asset,
                                            (asset === "ckBTC" && ckBTC) ||
                                              (asset === "ckETH" && ckETH) ||
                                              (asset === "ckUSDC" && ckUSDC) ||
                                              (asset === "ICP" && icp) ||
                                              (asset === "ckUSDT" && ckUSDT),
                                            supplyRateApr,
                                            ckBalance,
                                            liquidationThreshold,
                                            reserveliquidationThreshold,
                                            assetSupply,
                                            assetBorrow,
                                            totalCollateral,
                                            totalDebt,
                                            currentCollateralStatus
                                          );
                                        }}
                                        className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                      />
                                    </div>

                                    {index !== filteredReserves.length - 1 && (
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

            {}
            <div className="hidden xl:block">
              {isSupplyVisible && (
                <>
                  {supplyDataLoading ? (
                    <div className="min-h-[100px] flex justify-center items-center ">
                      <MiniLoader isLoading={true} />
                    </div>
                  ) : !userData?.Ok?.reserves ||
                    !userData?.Ok?.reserves[0] ||
                    userData?.Ok?.reserves[0].filter((reserveGroup) => {
                      const asset = reserveGroup[0];
                      const assetBalance = assetBalances.find(
                        (balance) => balance.asset === asset
                      )?.dtokenBalance;
                      return (
                        (assetBalance > 0 || assetBalance === undefined) &&
                        getAssetSupplyValue(reserveGroup[0]) > 0n
                      ); // Check both conditions
                    }).length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="w-full h-auto mt-4 relative">
                      {}
                      <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                        {}
                        {userData?.Ok?.reserves[0]?.some((reserveGroup) => {
                          const asset = reserveGroup[0];
                          const assetBalance =
                            assetBalances.find(
                              (balance) => balance.asset === asset
                            )?.dtokenBalance || 0;
                          return (
                            assetBalance > 0 &&
                            getAssetSupplyValue(reserveGroup[0]) > 0n
                          );
                        }) && (
                          <div className="grid grid-cols-[2fr_1.14fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                            <div className="p-5 pl-4 inline-flex">Asset</div>
                            <div className="p-5 inline-flex items-center">
                              Asset Supply
                            </div>
                            <div className="p-5 inline-flex relative gap-1">
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
                            <div className="p-5 inline-flex">Is Collateral</div>
                            <div className="p-5 inline-flex"></div>
                          </div>
                        )}

                        {}
                        {userData?.Ok?.reserves[0]?.length === 0
                          ? noSupplyMessage
                          : userData?.Ok?.reserves[0]
                              ?.filter((reserveGroup) => {
                                const asset = reserveGroup[0];
                                const assetBalance =
                                  assetBalances.find(
                                    (balance) => balance.asset === asset
                                  )?.dtokenBalance || 0;
                                return (
                                  assetBalance > 0 &&
                                  getAssetSupplyValue(reserveGroup[0]) > 0n
                                );
                              })
                              .map((reserveGroup, index, filteredReserves) => {
                                const asset = reserveGroup[0];
                                const currentLiquidity =
                                  userData?.Ok?.reserves[0]?.find(
                                    (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                                  )?.[1]?.liquidity_index;
                                const assetBalance =
                                  assetBalances.find(
                                    (balance) => balance.asset === asset
                                  )?.dtokenBalance || 0;

                                const assetSupply =
                                  (Number(assetBalance) *
                                    Number(getAssetSupplyValue(asset))) /
                                  (Number(currentLiquidity) * 1e8); // Dividing by 1e8 to adjust the value

                                const item = filteredItems.find(
                                  (item) => item[0] === asset
                                );

                                const collateralStatus =
                                  reserveGroup[1]?.is_collateral;
                                const supplyRateApr =
                                  Number(
                                    item?.[1]?.Ok?.current_liquidity_rate
                                  ) / 100000000 || 0;
                                const liquidationThreshold =
                                  Number(userAccountData?.Ok?.[3]) /
                                    100000000 || 0;
                                const reserveliquidationThreshold =
                                  Number(
                                    item?.[1]?.Ok.configuration
                                      .liquidation_threshold
                                  ) / 100000000 || 0;

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
                                    className="grid grid-cols-[2.2fr_1.13fr_0.9fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f]  rounded-lg text-xs"
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
                                      {asset === "ckUSDT" && (
                                        <img
                                          src={ckUSDT}
                                          alt="ckUSDT logo"
                                          className="w-8 h-8 rounded-full"
                                        />
                                      )}
                                      {asset}
                                    </div>

                                    <div className="p-3 align-top flex flex-col">
                                      <p className=" text-[#2A1F9D] dark:text-darkText">
                                        {assetSupply === 0
                                          ? "0"
                                          : assetSupply >= 1e-8 &&
                                            assetSupply < 1e-7
                                          ? Number(assetSupply).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 8,
                                                maximumFractionDigits: 8,
                                              }
                                            )
                                          : assetSupply >= 1e-7 &&
                                            assetSupply < 1e-6
                                          ? Number(assetSupply).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              }
                                            )
                                          : assetSupply >= 1
                                          ? Number(assetSupply).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }
                                            )
                                          : Number(assetSupply).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              }
                                            )}
                                      </p>
                                      <p className=" text-[#2A1F9D] dark:text-darkText font-light">
                                        $
                                        {asset === "ckBTC" &&
                                          formatNumber(
                                            assetSupply * (ckBTCUsdRate / 1e8)
                                          )}
                                        {asset === "ckETH" &&
                                          formatNumber(
                                            assetSupply * (ckETHUsdRate / 1e8)
                                          )}
                                        {asset === "ckUSDC" &&
                                          formatNumber(
                                            assetSupply * (ckUSDCUsdRate / 1e8)
                                          )}
                                        {asset === "ICP" &&
                                          formatNumber(
                                            assetSupply * (ckICPUsdRate / 1e8)
                                          )}
                                        {asset === "ckUSDT" &&
                                          formatNumber(
                                            assetSupply * (ckUSDTUsdRate / 1e8)
                                          )}
                                      </p>
                                    </div>
                                    <div className=" p-3  align-top flex items-center ">
                                      {supplyRateApr < 0.01
                                        ? "<0.01%"
                                        : `${supplyRateApr.toFixed(2)}%`}
                                    </div>

                                    <div className="align-top flex items-center ml-0 mr-0 lg:ml-6 lg:-mr-7">
                                      <CustomizedSwitches
                                        checked={collateralStatus}
                                        onChange={() => {
                                          const reserveData =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0]
                                            );
                                          const currentLiquidity =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.liquidity_index;
                                          const assetBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.dtokenBalance || 0;

                                          const assetSupply =
                                            (Number(assetBalance) *
                                              Number(
                                                getAssetSupplyValue(asset)
                                              )) /
                                            (Number(currentLiquidity) * 1e8);
                                          const DebtIndex =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.variable_borrow_index;

                                          const assetBorrowBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.debtTokenBalance || 0;

                                          const assetBorrow =
                                            (Number(assetBorrowBalance) *
                                              Number(
                                                getAssetBorrowValue(asset)
                                              )) /
                                            (Number(DebtIndex) * 1e8);
                                          const currentCollateralStatus =
                                            reserveData?.[1]?.is_collateral;
                                          const totalCollateral =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[0]) /
                                                100000000
                                            ) || 0;
                                          const totalDebt =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[1]) /
                                                100000000
                                            ) || 0;

                                          handleModalOpen(
                                            "collateral",
                                            asset,
                                            (asset === "ckBTC" && ckBTC) ||
                                              (asset === "ckETH" && ckETH) ||
                                              (asset === "ckUSDC" && ckUSDC) ||
                                              (asset === "ICP" && icp) ||
                                              (asset === "ckUSDT" && ckUSDT),
                                            supplyRateApr,
                                            ckBalance,
                                            liquidationThreshold,
                                            reserveliquidationThreshold,
                                            assetSupply,
                                            assetBorrow,
                                            totalCollateral,
                                            totalDebt,
                                            currentCollateralStatus
                                          );
                                        }}
                                      />
                                    </div>

                                    <div className="p-3 align-top flex gap-2 pt-2">
                                      <Button
                                        title={"Supply"}
                                        onClickHandler={() => {
                                          fetchAssetSupply(asset);
                                          if (ckBalance === 0) {
                                            toast.info(
                                              "You cannot supply because your balance is 0."
                                            );
                                            return;
                                          }

                                          const reserveData =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0]
                                            );
                                          const currentLiquidity =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.liquidity_index;
                                          const assetBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.dtokenBalance || 0;

                                          const assetSupply =
                                            (Number(assetBalance) *
                                              Number(
                                                getAssetSupplyValue(asset)
                                              )) /
                                            (Number(currentLiquidity) * 1e8);
                                          const DebtIndex =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.variable_borrow_index;

                                          const assetBorrowBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.debtTokenBalance || 0;

                                          const assetBorrow =
                                            (Number(assetBorrowBalance) *
                                              Number(
                                                getAssetBorrowValue(asset)
                                              )) /
                                            (Number(DebtIndex) * 1e8);
                                          const totalCollateral =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[0]) /
                                                100000000
                                            ) || 0;
                                          const totalDebt =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[1]) /
                                                100000000
                                            ) || 0;
                                          const currentCollateralStatus =
                                            reserveData?.[1]?.is_collateral ??
                                            true;

                                          handleModalOpen(
                                            "supply",
                                            asset,
                                            (asset === "ckBTC" && ckBTC) ||
                                              (asset === "ckETH" && ckETH) ||
                                              (asset === "ckUSDC" && ckUSDC) ||
                                              (asset === "ICP" && icp) ||
                                              (asset === "ckUSDT" && ckUSDT),
                                            supplyRateApr,
                                            ckBalance,
                                            liquidationThreshold,
                                            reserveliquidationThreshold,
                                            assetSupply,
                                            assetBorrow,
                                            totalCollateral,
                                            totalDebt,
                                            currentCollateralStatus
                                          );
                                        }}
                                        disabled={ckBalance === 0}
                                        className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5 font-semibold text-xs"
                                      />
                                      <Button
                                        title={"Withdraw"}
                                        onClickHandler={() => {
                                          fetchAssetSupply(asset);
                                          const reserveData =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === item[0]
                                            );
                                          const currentLiquidity =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.liquidity_index;
                                          const assetBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.dtokenBalance || 0;

                                          const assetSupply =
                                            (Number(assetBalance) *
                                              Number(
                                                getAssetSupplyValue(asset)
                                              )) /
                                            (Number(currentLiquidity) * 1e8);
                                          const DebtIndex =
                                            userData?.Ok?.reserves[0]?.find(
                                              (reserveGroup) =>
                                                reserveGroup[0] === asset // Check if the asset matches
                                            )?.[1]?.variable_borrow_index;

                                          const assetBorrowBalance =
                                            assetBalances.find(
                                              (balance) =>
                                                balance.asset === asset
                                            )?.debtTokenBalance || 0;

                                          const assetBorrow =
                                            (Number(assetBorrowBalance) *
                                              Number(
                                                getAssetBorrowValue(asset)
                                              )) /
                                            (Number(DebtIndex) * 1e8);
                                          const currentCollateralStatus =
                                            reserveData?.[1]?.is_collateral ??
                                            true;
                                          const totalCollateral =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[0]) /
                                                100000000
                                            ) || 0;
                                          const totalDebt =
                                            parseFloat(
                                              Number(userAccountData?.Ok?.[1]) /
                                                100000000
                                            ) || 0;

                                          handleModalOpen(
                                            "withdraw",
                                            asset,
                                            (asset === "ckBTC" && ckBTC) ||
                                              (asset === "ckETH" && ckETH) ||
                                              (asset === "ckUSDC" && ckUSDC) ||
                                              (asset === "ICP" && icp) ||
                                              (asset === "ckUSDT" && ckUSDT),
                                            supplyRateApr,
                                            ckBalance,
                                            liquidationThreshold,
                                            reserveliquidationThreshold,
                                            assetSupply,
                                            assetBorrow,
                                            totalCollateral,
                                            totalDebt,
                                            currentCollateralStatus
                                          );
                                        }}
                                        className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D] rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
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
                      {}
                      <div className="w-full">
                        {visibleItems
                          .map((item) => {
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

                            const isZeroBalance = Number(balance) === 0;
                            return { item, isZeroBalance, balance };
                          })
                          .sort((a, b) => {
                            if (!a.isZeroBalance && b.isZeroBalance) return -1;
                            if (a.isZeroBalance && !b.isZeroBalance) return 1;
                            return 0;
                          })
                          .map(({ item, isZeroBalance, balance }, index) => {
                            const itemClass = isZeroBalance
                              ? "opacity-50 pointer-events-none"
                              : "";
                            return (
                              <div
                                key={index}
                                className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText ${itemClass}`}
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
                                  {item[0] === "ckUSDT" && (
                                    <img
                                      src={ckUSDT}
                                      alt="ckUSDT logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                    {item[0]}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-4 mt-6">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Wallet Balance:
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                    {item[0] === "ckBTC" && (
                                      <>
                                        <p>
                                          {ckBTCBalance === 0
                                            ? "0"
                                            : ckBTCBalance >= 1
                                            ? Number(
                                                ckBTCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckBTCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(
                                                ckBTCBalance *
                                                  (ckBTCUsdRate / 1e8)
                                              )}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckETH" && (
                                      <>
                                        <p>
                                          {ckETHBalance === 0
                                            ? "0"
                                            : ckETHBalance >= 1
                                            ? Number(
                                                ckETHBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckETHBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(
                                                ckETHBalance *
                                                  (ckETHUsdRate / 1e8)
                                              )}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckUSDC" && (
                                      <>
                                        <p>
                                          {ckUSDCBalance === 0
                                            ? "0"
                                            : ckUSDCBalance >= 1
                                            ? Number(
                                                ckUSDCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckUSDCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(
                                                ckUSDCBalance *
                                                  (ckUSDCUsdRate / 1e8)
                                              )}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ICP" && (
                                      <>
                                        <p>
                                          {ckICPBalance === 0
                                            ? "0"
                                            : ckICPBalance >= 1
                                            ? Number(
                                                ckICPBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckICPBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(
                                                ckICPBalance *
                                                  (ckICPUsdRate / 1e8)
                                              )}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckUSDT" && (
                                      <>
                                        <p>
                                          {ckUSDTBalance === 0
                                            ? "0"
                                            : ckUSDTBalance >= 1
                                            ? Number(
                                                ckUSDTBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckUSDTBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(
                                                ckUSDTBalance *
                                                  (ckUSDTUsdRate / 1e8)
                                              )}
                                        </p>
                                      </>
                                    )}
                                  </p>
                                </div>

                                <div className="flex justify-between text-[#233D63]  text-xs font-semibold mb-4">
                                  <div className="flex relative group">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                      APY:
                                    </p>
                                    {}
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
                                    {Number(item[1].Ok.current_liquidity_rate) /
                                      100000000 <
                                    0.01
                                      ? "<0.01%"
                                      : `${(
                                          Number(
                                            item[1].Ok.current_liquidity_rate
                                          ) / 100000000
                                        ).toFixed(2)}%`}
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
                                      const reserveData =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0]
                                        );
                                      const currentLiquidity =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0] // Check if the asset matches
                                        )?.[1]?.liquidity_index;
                                      const assetBalance =
                                        assetBalances.find(
                                          (balance) => balance.asset === item[0]
                                        )?.dtokenBalance || 0;
                                      const assetSupply =
                                        (Number(assetBalance) *
                                          Number(
                                            getAssetSupplyValue(item[0])
                                          )) /
                                        (Number(currentLiquidity) * 1e8);

                                      const DebtIndex =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0] // Check if the asset matches
                                        )?.[1]?.variable_borrow_index;

                                      const assetBorrowBalance =
                                        assetBalances.find(
                                          (balance) => balance.asset === item[0]
                                        )?.debtTokenBalance || 0;

                                      const assetBorrow =
                                        (Number(assetBorrowBalance) *
                                          Number(
                                            getAssetBorrowValue(item[0])
                                          )) /
                                        (Number(DebtIndex) * 1e8);
                                      const currentCollateralStatus =
                                        reserveData?.[1]?.is_collateral ?? true;
                                      const totalCollateral =
                                        parseFloat(
                                          Number(userAccountData?.Ok?.[0]) /
                                            100000000
                                        ) || 0;
                                      const totalDebt =
                                        parseFloat(
                                          Number(userAccountData?.Ok?.[1]) /
                                            100000000
                                        ) || 0;
                                      handleModalOpen(
                                        "supply",
                                        item[0],
                                        (item[0] === "ckBTC" && ckBTC) ||
                                          (item[0] === "ckETH" && ckETH) ||
                                          (item[0] === "ckUSDC" && ckUSDC) ||
                                          (item[0] === "ICP" && icp) ||
                                          (item[0] === "ckUSDT" && ckUSDT),
                                        Number(
                                          item[1]?.Ok.current_liquidity_rate
                                        ) / 100000000,
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
                                          : null,

                                        Number(userAccountData?.Ok?.[3]) /
                                          100000000 || 0,
                                        Number(
                                          item[1]?.Ok.configuration
                                            .liquidation_threshold
                                        ) / 100000000,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt,
                                        currentCollateralStatus
                                      );
                                    }}
                                    disabled={isZeroBalance}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                  />
                                  <Button
                                    title={"Details"}
                                    onClickHandler={() =>
                                      handleDetailsClick(item[0], item[1])
                                    }
                                    className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                  />
                                </div>

                                {index !== visibleItems.length - 1 && (
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

            {}
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
                      {}
                      <div className="w-full z-10">
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-2 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
                          {}
                          <div className="p-5 pl-4 inline-flex">Asset</div>

                          {}
                          <div className="p-5 inline-flex">Wallet Balance</div>

                          {}
                          <div className="p-5 inline-flex gap-1 ">
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

                          {}
                          <div className="p-5 inline-flex">
                            Can be Collateral
                          </div>

                          {}
                          <div className="p-5 inline-flex"></div>
                        </div>
                      </div>

                      {}
                      <div className="w-full h-auto max-h-auto overflow-y-auto scrollbar-none">
                        <div className="grid gap-2 text-[#2A1F9D] text-xs md:text-sm lg:text-base dark:text-darkText">
                          {visibleItems
                            .map((item) => {
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

                              const isZeroBalance = Number(balance) === 0;
                              return { item, isZeroBalance, balance };
                            })
                            .sort((a, b) => {
                              if (!a.isZeroBalance && b.isZeroBalance)
                                return -1;
                              if (a.isZeroBalance && !b.isZeroBalance) return 1;
                              return 0;
                            })
                            .map(({ item, isZeroBalance, balance }, index) => {
                              const itemClass = isZeroBalance
                                ? "opacity-50 pointer-events-none"
                                : "";

                              return (
                                <div
                                  key={index}
                                  className={`grid grid-cols-[2.15fr_1.2fr_0.9fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f]  rounded-lg text-xs ${itemClass}`}
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
                                    {item[0] === "ckUSDT" && (
                                      <img
                                        src={ckUSDT}
                                        alt="ckUSDT logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {item[0]}
                                  </div>

                                  <div className="p-3 align-top flex flex-col">
                                    {item[0] === "ckBTC" && (
                                      <>
                                        <p>
                                          {ckBTCBalance === 0
                                            ? "0"
                                            : ckBTCBalance >= 1
                                            ? Number(
                                                ckBTCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckBTCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(ckBTCUsdBalance)}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckETH" && (
                                      <>
                                        <p>
                                          {ckETHBalance === 0
                                            ? "0"
                                            : ckETHBalance >= 1
                                            ? Number(
                                                ckETHBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckETHBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(ckETHUsdBalance)}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckUSDC" && (
                                      <>
                                        <p>
                                          {ckUSDCBalance === 0
                                            ? "0"
                                            : ckUSDCBalance >= 1
                                            ? Number(
                                                ckUSDCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckUSDCBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(ckUSDCUsdBalance)}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ICP" && (
                                      <>
                                        <p>
                                          {ckICPBalance === 0
                                            ? "0"
                                            : ckICPBalance >= 1
                                            ? Number(
                                                ckICPBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckICPBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(ckICPUsdBalance)}
                                        </p>
                                      </>
                                    )}
                                    {item[0] === "ckUSDT" && (
                                      <>
                                        <p>
                                          {ckUSDTBalance === 0
                                            ? "0"
                                            : ckUSDTBalance >= 1
                                            ? Number(
                                                ckUSDTBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                ckUSDTBalance
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {isZeroBalance
                                            ? "0"
                                            : formatNumber(ckUSDTUsdBalance)}
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  <div className="align-top">
                                    {Number(item[1].Ok.current_liquidity_rate) /
                                      100000000 <
                                    0.01
                                      ? "<0.01%"
                                      : `${(
                                          Number(
                                            item[1].Ok.current_liquidity_rate
                                          ) / 100000000
                                        ).toFixed(2)}%`}
                                  </div>

                                  <div className="p-3 -ml-3 align-top flex items-center justify-center dark:text-darkText">
                                    <Check color={checkColor} size={16} />
                                  </div>

                                  <div className="p-3 align-top flex gap-2 pt-2">
                                    <Button
                                      title={"Supply"}
                                      onClickHandler={() => {
                                        fetchAssetSupply(item[0]);
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );

                                        const currentLiquidity =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0] // Check if the asset matches
                                          )?.[1]?.liquidity_index;
                                        const assetBalance =
                                          assetBalances.find(
                                            (balance) =>
                                              balance.asset === item[0]
                                          )?.dtokenBalance || 0;

                                        const assetSupply =
                                          (Number(assetBalance) *
                                            Number(
                                              getAssetSupplyValue(item[0])
                                            )) /
                                          Number(currentLiquidity);

                                        const DebtIndex =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0] // Check if the asset matches
                                          )?.[1]?.variable_borrow_index;

                                        const assetBorrowBalance =
                                          assetBalances.find(
                                            (balance) =>
                                              balance.asset === item[0]
                                          )?.debtTokenBalance || 0;

                                        const assetBorrow =
                                          (Number(assetBorrowBalance) *
                                            Number(
                                              getAssetBorrowValue(item[0])
                                            )) /
                                          (Number(DebtIndex) * 1e8);
                                        const currentCollateralStatus =
                                          reserveData?.[1]?.is_collateral ??
                                          true;
                                        const totalCollateral =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[0]) /
                                              100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[1]) /
                                              100000000
                                          ) || 0;
                                        handleModalOpen(
                                          "supply",
                                          item[0],
                                          (item[0] === "ckBTC" && ckBTC) ||
                                            (item[0] === "ckETH" && ckETH) ||
                                            (item[0] === "ckUSDC" && ckUSDC) ||
                                            (item[0] === "ICP" && icp) ||
                                            (item[0] === "ckUSDT" && ckUSDT),
                                          Number(
                                            item[1]?.Ok.current_liquidity_rate
                                          ) / 100000000,
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
                                            : null,
                                          Number(userAccountData?.Ok?.[3]) /
                                            100000000 || 0,
                                          Number(
                                            item[1]?.Ok.configuration
                                              .liquidation_threshold
                                          ) / 100000000,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt,
                                          currentCollateralStatus
                                        );
                                      }}
                                      disabled={isZeroBalance}
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
                              );
                            })}
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

      {}
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
                        (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                      )?.[1]?.variable_borrow_index;

                      const assetBorrowBalance =
                        assetBalances.find((balance) => balance.asset === asset)
                          ?.debtTokenBalance || 0;

                      const assetBorrow =
                        (Number(assetBorrowBalance) *
                          Number(getAssetBorrowValue(asset))) /
                        (Number(DebtIndex) * 1e8);

                      let usdValue = 0;

                      // Determine USD value based on asset type
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

                      // Accumulate total USD value supply
                      if (assetBorrow >= 0) {
                        totalUsdValueBorrow += usdValue;

                        dispatch(setTotalUsdValueBorrow(totalUsdValueBorrow));
                      }

                      return null; // Return nothing here since we're doing the calculation and accumulation
                    })}

                    {/* Display total USD value of supply */}
                    <div className="hidden md:block text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
                      <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                        Total
                      </span>{" "}
                      ${formatNumber(totalUsdValueBorrow)}
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

            <div className="inline-block md:hidden ml-4 w-auto mt-2 text-center font-semibold text-[#2A1F9D] text-[12px] dark:text-darkText border border-[#2A1F9D]/50 dark:border-darkText/80 p-1 px-2 rounded-md">
              <span className="font-normal text-[#2A1F9D] dark:text-darkText/80">
                Total
              </span>{" "}
              ${formatNumber(totalUsdValueBorrow)}
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
                    userData?.Ok?.reserves[0].filter((reserveGroup) => {
                      const asset = reserveGroup[0];
                      const assetBalance = assetBalances.find(
                        (balance) => balance.asset === asset
                      )?.debtTokenBalance;
                      return (
                        (assetBalance > 0 || assetBalance === undefined) &&
                        getAssetBorrowValue(reserveGroup[0]) > 0n
                      ); // Check both conditions
                    }).length === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                      <div className="relative mt-4 max-h-[2250px] overflow-y-auto scrollbar-none">
                        <div className="w-full">
                          {}

                          {userData?.Ok?.reserves[0]?.length === 0
                            ? noBorrowMessage
                            : userData?.Ok?.reserves[0]
                                ?.filter((reserveGroup) => {
                                  const asset = reserveGroup[0];
                                  const assetBalance =
                                    assetBalances.find(
                                      (balance) => balance.asset === asset
                                    )?.debtTokenBalance || 0;
                                  return (
                                    getAssetBorrowValue(reserveGroup[0]) > 0n &&
                                    assetBalance > 0
                                  ); // Check both conditions
                                })
                                .map((reserveGroup, index) => {
                                  const asset = reserveGroup[0];
                                  const DebtIndex =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === asset // Check if the asset matches
                                    )?.[1]?.variable_borrow_index;

                                  const assetBorrowBalance =
                                    assetBalances.find(
                                      (balance) => balance.asset === asset
                                    )?.debtTokenBalance || 0;

                                  const currentLiquidity =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === asset // Check if the asset matches
                                    )?.[1]?.liquidity_index;
                                  const assetBalance =
                                    assetBalances.find(
                                      (balance) => balance.asset === asset
                                    )?.dtokenBalance || 0;

                                  const assetSupply =
                                    (Number(assetBalance) *
                                      Number(getAssetSupplyValue(asset))) /
                                    (Number(currentLiquidity) * 1e8);

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
                                    Number(item?.[1]?.Ok?.borrow_rate) /
                                      100000000 || 0;
                                  const liquidationThreshold =
                                    Number(userAccountData?.Ok?.[3]) /
                                      100000000 || 0;
                                  const reserveliquidationThreshold =
                                    Number(
                                      item?.[1]?.Ok.configuration
                                        .liquidation_threshold
                                    ) / 100000000 || 0;

                                  return (
                                    <div
                                      key={index}
                                      className="p-3 rounded-lg dark:bg-darkSurface dark:text-darkText"
                                    >
                                      <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                                        {}
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
                                        {asset === "ckUSDT" && (
                                          <img
                                            src={ckUSDT}
                                            alt="ckUSDT logo"
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
                                          {}
                                          {assetBorrow === 0n
                                            ? "0n"
                                            : assetBorrow >= 1e-8 &&
                                              assetBorrow < 1e-7
                                            ? Number(
                                                assetBorrow
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 8,
                                                maximumFractionDigits: 8,
                                              })
                                            : assetBorrow >= 1e-7 &&
                                              assetBorrow < 1e-6
                                            ? Number(
                                                assetBorrow
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })
                                            : assetBorrow >= 1
                                            ? Number(
                                                assetBorrow
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })
                                            : Number(
                                                assetBorrow
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 7,
                                                maximumFractionDigits: 7,
                                              })}
                                          <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                            $
                                            {asset === "ckBTC" &&
                                              formatNumber(
                                                assetBorrow *
                                                  (ckBTCUsdRate / 1e8)
                                              )}
                                            {asset === "ckETH" &&
                                              formatNumber(
                                                assetBorrow *
                                                  (ckETHUsdRate / 1e8)
                                              )}
                                            {asset === "ckUSDC" &&
                                              formatNumber(
                                                assetBorrow *
                                                  (ckUSDCUsdRate / 1e8)
                                              )}
                                            {asset === "ICP" &&
                                              formatNumber(
                                                assetBorrow *
                                                  (ckICPUsdRate / 1e8)
                                              )}
                                            {asset === "ckUSDT" &&
                                              formatNumber(
                                                assetBorrow *
                                                  (ckUSDTUsdRate / 1e8)
                                              )}
                                          </p>
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
                                                The variable borrow interest
                                                rate may change over time,
                                                influenced by market trends and
                                                conditions.
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
                                            
                                        
                                            fetchAssetBorrow(asset);
                                            const reserveData =
                                              userData?.Ok?.reserves[0]?.find(
                                                (reserveGroup) =>
                                                  reserveGroup[0] === item[0]
                                              );

                                            const currentCollateralStatus =
                                              reserveData?.[1]?.is_collateral ??
                                              true;
                                            const totalCollateral =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[0]
                                                ) / 100000000
                                              ) || 0;
                                            const totalDebt =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[1]
                                                ) / 100000000
                                              ) || 0;
                                            const Ltv =
                                              Number(userData?.Ok?.ltv) /
                                                100000000 || 0;
                                            const remainingBorrowable =
                                              Number(total_supply) -
                                              Number(total_borrow);
                                            let borrowableValue = "0.00000000";
                                            let borrowableAssetValue = "0.0000";

                                            if (Number(availableBorrow)) {
                                              if (item[0] === "ckBTC") {
                                                borrowableValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckBTCUsdRate / 1e8)
                                                    ? remainingBorrowable
                                                    : Number(availableBorrow) /
                                                      (ckBTCUsdRate / 1e8)
                                                  : "0.00000000";

                                                borrowableAssetValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckBTCUsdRate / 1e8)
                                                    ? remainingBorrowable *
                                                      (ckBTCUsdRate / 1e8)
                                                    : Number(availableBorrow)
                                                  : "0.0000";
                                              } else if (item[0] === "ckETH") {
                                                borrowableValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckETHUsdRate / 1e8)
                                                    ? remainingBorrowable
                                                    : Number(availableBorrow) /
                                                      (ckETHUsdRate / 1e8)
                                                  : "0.00000000";

                                                borrowableAssetValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckETHUsdRate / 1e8)
                                                    ? remainingBorrowable *
                                                      (ckETHUsdRate / 1e8)
                                                    : Number(availableBorrow)
                                                  : "0.0000";
                                              } else if (item[0] === "ckUSDC") {
                                                borrowableValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckUSDCUsdRate / 1e8)
                                                    ? remainingBorrowable
                                                    : Number(availableBorrow) /
                                                      (ckUSDCUsdRate / 1e8)
                                                  : "0.00000000";

                                                borrowableAssetValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckUSDCUsdRate / 1e8)
                                                    ? remainingBorrowable *
                                                      (ckUSDCUsdRate / 1e8)
                                                    : Number(availableBorrow)
                                                  : "0.0000";
                                              } else if (item[0] === "ICP") {
                                                borrowableValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckICPUsdRate / 1e8)
                                                    ? remainingBorrowable
                                                    : Number(availableBorrow) /
                                                      (ckICPUsdRate / 1e8)
                                                  : "0.00000000";

                                                borrowableAssetValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckICPUsdRate / 1e8)
                                                    ? remainingBorrowable *
                                                      (ckICPUsdRate / 1e8)
                                                    : Number(availableBorrow)
                                                  : "0.0000";
                                              } else if (item[0] === "ckUSDT") {
                                                borrowableValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckUSDTUsdRate / 1e8)
                                                    ? remainingBorrowable
                                                    : Number(availableBorrow) /
                                                      (ckUSDTUsdRate / 1e8)
                                                  : "0.00000000";

                                                borrowableAssetValue = Number(
                                                  availableBorrow
                                                )
                                                  ? remainingBorrowable <
                                                    Number(availableBorrow) /
                                                      (ckUSDTUsdRate / 1e8)
                                                    ? remainingBorrowable *
                                                      (ckUSDTUsdRate / 1e8)
                                                    : Number(availableBorrow)
                                                  : "0.0000";
                                              }
                                            }
                                            if (borrowableValue === "0.00000000" || borrowableValue === "0.0000") {
                                              // Show toast notification
                                              toast.info("Insufficeint asset supply to allow borrow request");
                                              
                                              // Disable the button
                                              setIsButtonDisabled(true);
                                              return;  // Exit the function if borrowable value is 0
                                            }
                                            handleModalOpen(
                                              "borrow",
                                              asset,
                                              (asset === "ckBTC" && ckBTC) ||
                                                (asset === "ckETH" && ckETH) ||
                                                (asset === "ckUSDC" &&
                                                  ckUSDC) ||
                                                (asset === "ICP" && icp) ||
                                                (asset === "ckUSDT" && ckUSDT),
                                              borrowRateApr,
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
                                          }}
                                          disabled={isTableDisabled}
                                          className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                                        />
                                        <Button
                                          title={"Repay"}
                                          onClickHandler={() => {
                                            fetchAssetBorrow(asset);
                                            const reserveData =
                                              userData?.Ok?.reserves[0]?.find(
                                                (reserveGroup) =>
                                                  reserveGroup[0] === item[0]
                                              );

                                            const totalCollateral =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[0]
                                                ) / 100000000
                                              ) || 0;
                                            const totalDebt =
                                              parseFloat(
                                                Number(
                                                  userAccountData?.Ok?.[1]
                                                ) / 100000000
                                              ) || 0;
                                            handleModalOpen(
                                              "repay",
                                              asset,
                                              (asset === "ckBTC" && ckBTC) ||
                                                (asset === "ckETH" && ckETH) ||
                                                (asset === "ckUSDC" &&
                                                  ckUSDC) ||
                                                (asset === "ICP" && icp) ||
                                                (asset === "ckUSDT" && ckUSDT),
                                              borrowRateApr,
                                              ckBalance,
                                              liquidationThreshold,
                                              reserveliquidationThreshold,
                                              assetSupply,
                                              assetBorrow,
                                              totalCollateral,
                                              totalDebt
                                            );
                                          }}
                                          className={`md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold`}
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
                    userData?.Ok?.reserves[0].filter((reserveGroup) => {
                      const asset = reserveGroup[0];
                      const assetBalance = assetBalances.find(
                        (balance) => balance.asset === asset
                      )?.debtTokenBalance;
                      return (
                        (assetBalance > 0 || assetBalance === undefined) &&
                        getAssetBorrowValue(reserveGroup[0]) > 0n
                      ); // Check both conditions
                    }).length === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="w-full h-auto mt-6">
                      <div className="w-full z-10">
                        {hasValidAssets && (
                          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-1 text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 font-[500]">
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
                            <div className="p-3">Apy type</div>
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
                          {userData?.Ok?.reserves[0]
                            ?.filter((reserveGroup) => {
                              const asset = reserveGroup[0];
                              const assetBalance =
                                assetBalances.find(
                                  (balance) => balance.asset === asset
                                )?.debtTokenBalance || 0;
                              return (
                                getAssetBorrowValue(reserveGroup[0]) > 0n &&
                                assetBalance > 0
                              ); // Check both conditions
                            })
                            .map((reserveGroup, index) => {
                              const asset = reserveGroup[0];
                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const DebtIndex = userData?.Ok?.reserves[0]?.find(
                                (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                              )?.[1]?.variable_borrow_index;

                              const assetBorrowBalance =
                                assetBalances.find(
                                  (balance) => balance.asset === asset
                                )?.debtTokenBalance || 0;

                              const currentLiquidity =
                                userData?.Ok?.reserves[0]?.find(
                                  (reserveGroup) => reserveGroup[0] === asset // Check if the asset matches
                                )?.[1]?.liquidity_index;
                              const assetBalance =
                                assetBalances.find(
                                  (balance) => balance.asset === asset
                                )?.dtokenBalance || 0;

                              const assetSupply =
                                (Number(assetBalance) *
                                  Number(getAssetSupplyValue(asset))) /
                                (Number(currentLiquidity) * 1e8);

                              const assetBorrow =
                                (Number(assetBorrowBalance) *
                                  Number(getAssetBorrowValue(asset))) /
                                (Number(DebtIndex) * 1e8);
                              const assetData = item[1].Ok;
                              const total_supply =
                                Number(assetData?.asset_supply || 0) /
                                100000000;
                              const total_borrow =
                                Number(assetData?.asset_borrow || 0) /
                                100000000;
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
                                Number(item?.[1]?.Ok?.borrow_rate) /
                                  100000000 || 0;
                              const liquidationThreshold =
                                Number(userAccountData?.Ok?.[3]) / 100000000 ||
                                0;
                              const reserveliquidationThreshold =
                                Number(
                                  item?.[1]?.Ok.configuration
                                    .liquidation_threshold
                                ) / 100000000 || 0;

                              return (
                                <div
                                  key={index}
                                  className="grid grid-cols-[1.95fr_0.9fr_1fr_1fr_2fr] gap-2 items-center font-semibold hover:bg-[#ddf5ff8f]  rounded-lg text-xs mt-2"
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
                                    {asset === "ckUSDT" && (
                                      <img
                                        src={ckUSDT}
                                        alt="ckUSDT logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    {asset}
                                  </div>
                                  <div className="p-3">
                                    <div className="flex flex-col">
                                      {assetBorrow === 0
                                        ? "0"
                                        : assetBorrow >= 1e-8 &&
                                          assetBorrow < 1e-7
                                        ? Number(assetBorrow).toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 8,
                                              maximumFractionDigits: 8,
                                            }
                                          )
                                        : assetBorrow >= 1e-7 &&
                                          assetBorrow < 1e-6
                                        ? Number(assetBorrow).toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 7,
                                              maximumFractionDigits: 7,
                                            }
                                          )
                                        : assetBorrow >= 1
                                        ? Number(assetBorrow).toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )
                                        : Number(assetBorrow).toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 7,
                                              maximumFractionDigits: 7,
                                            }
                                          )}
                                      <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                        $
                                        {asset === "ckBTC" &&
                                          formatNumber(
                                            assetBorrow * (ckBTCUsdRate / 1e8)
                                          )}
                                        {asset === "ckETH" &&
                                          formatNumber(
                                            assetBorrow * (ckETHUsdRate / 1e8)
                                          )}
                                        {asset === "ckUSDC" &&
                                          formatNumber(
                                            assetBorrow * (ckUSDCUsdRate / 1e8)
                                          )}
                                        {asset === "ICP" &&
                                          formatNumber(
                                            assetBorrow * (ckICPUsdRate / 1e8)
                                          )}
                                        {asset === "ckUSDT" &&
                                          formatNumber(
                                            assetBorrow * (ckUSDTUsdRate / 1e8)
                                          )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="p-3 ml-1">
                                    {borrowRateApr < 0.1
                                      ? "<0.01%"
                                      : `${borrowRateApr.toFixed(2)}%`}
                                  </div>
                                  <div className="p-3">
                                    <div className="w-full flex">variable</div>
                                  </div>
                                  <div className="p-3 flex gap-2">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() => {
                                        fetchAssetBorrow(asset);
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );

                                        const currentCollateralStatus =
                                          reserveData?.[1]?.is_collateral;
                                        const totalCollateral =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[0]) /
                                              100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[1]) /
                                              100000000
                                          ) || 0;
                                        const Ltv =
                                          Number(userData?.Ok?.ltv) /
                                            100000000 || 0;
                                        const remainingBorrowable =
                                          Number(total_supply) -
                                          Number(total_borrow);
                                        let borrowableValue = "0.00000000";
                                        let borrowableAssetValue = "0.0000";

                                        if (Number(availableBorrow)) {
                                          if (item[0] === "ckBTC") {
                                            borrowableValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckBTCUsdRate / 1e8)
                                                ? remainingBorrowable
                                                : Number(availableBorrow) /
                                                  (ckBTCUsdRate / 1e8)
                                              : "0.00000000";

                                            borrowableAssetValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckBTCUsdRate / 1e8)
                                                ? remainingBorrowable *
                                                  (ckBTCUsdRate / 1e8)
                                                : Number(availableBorrow)
                                              : "0.0000";
                                          } else if (item[0] === "ckETH") {
                                            borrowableValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckETHUsdRate / 1e8)
                                                ? remainingBorrowable
                                                : Number(availableBorrow) /
                                                  (ckETHUsdRate / 1e8)
                                              : "0.00000000";

                                            borrowableAssetValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckETHUsdRate / 1e8)
                                                ? remainingBorrowable *
                                                  (ckETHUsdRate / 1e8)
                                                : Number(availableBorrow)
                                              : "0.0000";
                                          } else if (item[0] === "ckUSDC") {
                                            borrowableValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckUSDCUsdRate / 1e8)
                                                ? remainingBorrowable
                                                : Number(availableBorrow) /
                                                  (ckUSDCUsdRate / 1e8)
                                              : "0.00000000";

                                            borrowableAssetValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckUSDCUsdRate / 1e8)
                                                ? remainingBorrowable *
                                                  (ckUSDCUsdRate / 1e8)
                                                : Number(availableBorrow)
                                              : "0.0000";
                                          } else if (item[0] === "ICP") {
                                            borrowableValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckICPUsdRate / 1e8)
                                                ? remainingBorrowable
                                                : Number(availableBorrow) /
                                                  (ckICPUsdRate / 1e8)
                                              : "0.00000000";

                                            borrowableAssetValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckICPUsdRate / 1e8)
                                                ? remainingBorrowable *
                                                  (ckICPUsdRate / 1e8)
                                                : Number(availableBorrow)
                                              : "0.0000";
                                          } else if (item[0] === "ckUSDT") {
                                            borrowableValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckUSDTUsdRate / 1e8)
                                                ? remainingBorrowable
                                                : Number(availableBorrow) /
                                                  (ckUSDTUsdRate / 1e8)
                                              : "0.00000000";

                                            borrowableAssetValue = Number(
                                              availableBorrow
                                            )
                                              ? remainingBorrowable <
                                                Number(availableBorrow) /
                                                  (ckUSDTUsdRate / 1e8)
                                                ? remainingBorrowable *
                                                  (ckUSDTUsdRate / 1e8)
                                                : Number(availableBorrow)
                                              : "0.0000";
                                          }
                                        }
                                        if (borrowableValue === "0.00000000" || borrowableValue === "0.0000") {
                                          // Show toast notification
                                          toast.info("Insufficeint asset supply to allow borrow request");
                                          
                                          // Disable the button
                                          setIsButtonDisabled(true);
                                          return;  // Exit the function if borrowable value is 0
                                        }
                                        handleModalOpen(
                                          "borrow",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp) ||
                                            (asset === "ckUSDT" && ckUSDT),
                                          borrowRateApr,
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
                                      }}
                                      disabled={isTableDisabled}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                    />
                                    <Button
                                      title={"Repay"}
                                      onClickHandler={() => {
                                        fetchAssetBorrow(asset);
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );

                                        const totalCollateral =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[0]) /
                                              100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[1]) /
                                              100000000
                                          ) || 0;
                                        handleModalOpen(
                                          "repay",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp) ||
                                            (asset === "ckUSDT" && ckUSDT),
                                          borrowRateApr,
                                          ckBalance,
                                          liquidationThreshold,
                                          reserveliquidationThreshold,
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
                            })}
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
            className={`w-full mt-6 scrollbar-none lgx:overflow-none hide-scrollbar ${
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
            {isBorrowVisible && (
              <div className="flex items-center mx-4 mt-6 select-none">
                {}
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
                  {}
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

                {}
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
                    <div className="relative mt-4 max-h-[1250px] overflow-y-auto scrollbar-none">
                      {}
                      <div className="w-full">
                        {filteredItems
                          .filter((item) => {
                            const reserveData = userData?.Ok?.reserves[0]?.find(
                              (reserveGroup) => reserveGroup[0] === item[0]
                            );

                            const assetData = item[1].Ok;
                            const total_supply =
                              Number(assetData.asset_supply || 0) / 100000000;
                            const total_borrow =
                              Number(assetData.asset_borrow || 0) / 100000000;
                            const availableBorrowNumber = Number(
                              availableBorrow || 0
                            );

                            // Condition to hide assets with availableBorrow == 0
                            const isBorrowAvailable = availableBorrowNumber > 0;

                            // Only filter assets that should be shown based on showAllAssets and borrow availability
                            if (!showAllAssets) {
                              return (
                                total_supply > total_borrow && isBorrowAvailable
                              );
                            }

                            return true; // Show all assets if showAllAssets is true
                          })
                          .sort((a, b) => {
                            if (showAllAssets) {
                              const assetDataA = a[1].Ok;
                              const assetDataB = b[1].Ok;

                              const total_supply_A =
                                Number(assetDataA.asset_supply || 0) /
                                100000000;
                              const total_borrow_A =
                                Number(assetDataA.asset_borrow || 0) /
                                100000000;
                              const total_supply_B =
                                Number(assetDataB.asset_supply || 0) /
                                100000000;
                              const total_borrow_B =
                                Number(assetDataB.asset_borrow || 0) /
                                100000000;

                              const isEligibleA =
                                total_supply_A > total_borrow_A;
                              const isEligibleB =
                                total_supply_B > total_borrow_B;

                              if (isEligibleA && !isEligibleB) return -1;
                              if (!isEligibleA && isEligibleB) return 1;
                              return 0;
                            }
                            return 0;
                          })
                          .map((item, index) => {
                            const reserveData = userData?.Ok?.reserves[0]?.find(
                              (reserveGroup) => reserveGroup[0] === item[0]
                            );

                            const assetData = item[1].Ok;

                            const total_supply =
                              Number(assetData?.asset_supply || 0) / 100000000;
                            const total_borrow =
                              Number(assetData?.asset_borrow || 0) / 100000000;
                            const availableBorrowNumber = Number(
                              availableBorrow || 0
                            );

                            const isEligible = total_supply > total_borrow;

                            // Apply opacity if available borrow is 0
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
                                  {item[0] === "ckUSDT" && (
                                    <img
                                      src={ckUSDT}
                                      alt="ckUSDT logo"
                                      className="w-8 h-8 rounded-full"
                                    />
                                  )}
                                  <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                    {item[0]}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 mt-6 relative ">
                                  <p className="text-[#233D63] dark:text-darkText flex ">
                                    <span className="dark:opacity-50">
                                      Available:
                                    </span>
                                    <span className="relative cursor-pointer">
                                      <span className="group inline-flex ml-1">
                                        <Info
                                          size={14}
                                          className="dark:opacity-50"
                                        />
                                        <div className="absolute left-[85px] transform -translate-x-1/2 -mb-4 bottom-full bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                                          This is the total amount you can
                                          borrow, determined by your collateral
                                          and limited by the borrow cap.
                                        </div>
                                      </span>
                                    </span>
                                  </p>

                                  <p
                                    className={`text-right text-[#2A1F9D] dark:text-darkText `}
                                  >
                                    {item[0] === "ckBTC" && (
                                      <>
                                        <p>
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckBTCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  )
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckBTCUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckBTCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  ) *
                                                    (ckBTCUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckETH" && (
                                      <>
                                        <p>
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckETHUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  )
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckETHUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckETHUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  ) *
                                                    (ckETHUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckUSDC" && (
                                      <>
                                        <p>
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckUSDCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  )
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckUSDCUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckUSDCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  ) *
                                                    (ckUSDCUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ICP" && (
                                      <>
                                        <p>
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckICPUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  )
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckICPUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckICPUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  ) *
                                                    (ckICPUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckUSDT" && (
                                      <>
                                        <p>
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckUSDTUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  )
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckUSDTUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(availableBorrow)
                                            ? Math.max(
                                                Number(total_supply) -
                                                  Number(total_borrow),
                                                0
                                              ) <
                                              Number(availableBorrow) /
                                                (ckUSDTUsdRate / 1e8)
                                              ? formatConditional(
                                                  Math.max(
                                                    Number(total_supply) -
                                                      Number(total_borrow),
                                                    0
                                                  ) *
                                                    (ckUSDTUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}
                                  </p>
                                </div>

                                <div className="flex justify-between text-[#233D63] dark:text-darkText text-xs font-semibold mt-4 mb-1">
                                  <div className="flex  relative group">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                      APY:
                                    </p>
                                    {}
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
                                    {Number(item[1].Ok.borrow_rate) /
                                      100000000 <
                                    0.01
                                      ? "<0.01%"
                                      : `${(
                                          Number(item[1].Ok.borrow_rate) /
                                          100000000
                                        ).toFixed(2)}%`}
                                  </p>
                                </div>

                                <div className="flex justify-between gap-4">
                                  <Button
                                    title={"Borrow"}
                                    onClickHandler={() => {
                                      dispatch(toggleDashboardRefresh());
                                      fetchAssetBorrow(item[0]);
                                      const currentCollateralStatus =
                                        reserveData?.[1]?.is_collateral;

                                      const currentLiquidity =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0] // Check if the asset matches
                                        )?.[1]?.liquidity_index;
                                      const assetBalance =
                                        assetBalances.find(
                                          (balance) => balance.asset === item[0]
                                        )?.dtokenBalance || 0;

                                      const assetSupply =
                                        (Number(assetBalance) *
                                          Number(
                                            getAssetSupplyValue(item[0])
                                          )) /
                                        (Number(currentLiquidity) * 1e8);

                                      const DebtIndex =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0] // Check if the asset matches
                                        )?.[1]?.variable_borrow_index;

                                      const assetBorrowBalance =
                                        assetBalances.find(
                                          (balance) => balance.asset === item[0]
                                        )?.debtTokenBalance || 0;

                                      const assetBorrow =
                                        (Number(assetBorrowBalance) *
                                          Number(
                                            getAssetBorrowValue(item[0])
                                          )) /
                                        (Number(DebtIndex) * 1e8);

                                      const totalCollateral =
                                        parseFloat(
                                          Number(userAccountData?.Ok?.[0]) /
                                            100000000
                                        ) || 0;
                                      const totalDebt =
                                        parseFloat(
                                          Number(userAccountData?.Ok?.[1]) /
                                            100000000
                                        ) || 0;
                                      const Ltv =
                                        Number(userData?.Ok?.ltv) / 100000000 ||
                                        0;
                                      const remainingBorrowable =
                                        Number(total_supply) -
                                        Number(total_borrow);

                                      const {
                                        borrowableValue,
                                        borrowableAssetValue,
                                      } = calculateBorrowableValues(
                                        item,
                                        availableBorrow,
                                        Number(total_supply) -
                                          Number(total_borrow)
                                      );
                                      console.log(
                                        "borrowableValue",
                                        borrowableValue,
                                        borrowableAssetValue
                                      );
                                      handleModalOpen(
                                        "borrow",
                                        item[0],
                                        (item[0] === "ckBTC" && ckBTC) ||
                                          (item[0] === "ckETH" && ckETH) ||
                                          (item[0] === "ckUSDC" && ckUSDC) ||
                                          (item[0] === "ICP" && icp) ||
                                          (item[0] === "ckUSDT" && ckUSDT),
                                        Number(item[1].Ok.borrow_rate) /
                                          100000000,
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
                                          : null,
                                        Number(userAccountData?.Ok?.[3]) /
                                          100000000 || 0,
                                        Number(
                                          item?.[1]?.Ok?.configuration
                                            .liquidation_threshold
                                        ) / 100000000,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt,
                                        Ltv,
                                        currentCollateralStatus,
                                        borrowableValue,
                                        borrowableAssetValue,
                                        total_supply,
                                        total_borrow
                                      );
                                    }}
                                    disabled={!isEligible}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
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

            {}
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
                        {}

                        <div>
                          {/* Conditionally render the table based on showAllAssets */}
                          {(showAllAssets || hasVisibleAssets) && (
                            <div className="grid grid-cols-[3fr_2fr_3fr_1fr_2fr] text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 pb-3 z-10 mt-4">
                              {MY_ASSET_TO_SUPPLY_TABLE_COL.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="p-2 lgx:pl-4 font-[500]"
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
                                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[20vw] pointer-events-none">
                                              This is the total amount you can
                                              borrow, determined by your
                                              collateral and limited by the
                                              borrow cap.
                                            </div>
                                          </span>
                                        </span>
                                      )}

                                      {index === 2 && (
                                        <span className="relative cursor-pointer">
                                          <span className="group inline-flex">
                                            <Info size={14} />
                                            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[20vw] pointer-events-none">
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

                        {}
                        <div className="w-full h-auto max-h-auto overflow-y-auto scrollbar-none">
                          {}

                          {}

                          {filteredItems
                            .filter((item) => {
                              const reserveData =
                                userData?.Ok?.reserves[0]?.find(
                                  (reserveGroup) => reserveGroup[0] === item[0]
                                );

                              const assetData = item[1].Ok;
                              const total_supply =
                                Number(assetData.asset_supply || 0) / 100000000;
                              const total_borrow =
                                Number(assetData.asset_borrow || 0) / 100000000;
                              const availableBorrowNumber = Number(
                                availableBorrow || 0
                              );

                              // Condition to hide assets with availableBorrow == 0
                              const isBorrowAvailable =
                                availableBorrowNumber > 0;

                              // Only filter assets that should be shown based on showAllAssets and borrow availability
                              if (!showAllAssets) {
                                return (
                                  total_supply > total_borrow &&
                                  isBorrowAvailable
                                );
                              }

                              return true; // Show all assets if showAllAssets is true
                            })
                            .sort((a, b) => {
                              if (showAllAssets) {
                                const assetDataA = a[1].Ok;
                                const assetDataB = b[1].Ok;

                                const total_supply_A =
                                  Number(assetDataA.asset_supply || 0) /
                                  100000000;
                                const total_borrow_A =
                                  Number(assetDataA.asset_borrow || 0) /
                                  100000000;
                                const total_supply_B =
                                  Number(assetDataB.asset_supply || 0) /
                                  100000000;
                                const total_borrow_B =
                                  Number(assetDataB.asset_borrow || 0) /
                                  100000000;

                                const isEligibleA =
                                  total_supply_A > total_borrow_A;
                                const isEligibleB =
                                  total_supply_B > total_borrow_B;

                                if (isEligibleA && !isEligibleB) return -1;
                                if (!isEligibleA && isEligibleB) return 1;
                                return 0;
                              }
                              return 0;
                            })
                            .map((item, index) => {
                              const reserveData =
                                userData?.Ok?.reserves[0]?.find(
                                  (reserveGroup) => reserveGroup[0] === item[0]
                                );

                              const assetData = item[1].Ok;

                              const total_supply =
                                Number(assetData?.asset_supply || 0) /
                                100000000;
                              const total_borrow =
                                Number(assetData?.asset_borrow || 0) /
                                100000000;
                              const availableBorrowNumber = Number(
                                availableBorrow || 0
                              );

                              const isEligible = total_supply > total_borrow;

                              // Apply opacity if available borrow is 0
                              const itemClass =
                                (showAllAssets && !isEligible) ||
                                availableBorrowNumber === 0
                                  ? "opacity-50 pointer-events-none"
                                  : "";

                              return (
                                <div
                                  key={index}
                                  className={`grid grid-cols-[3fr_2fr_2fr_1fr_2fr] items-center font-semibold hover:bg-[#ddf5ff8f]  rounded-lg text-xs ${itemClass} ${
                                    isTableDisabled
                                      ? "opacity-50 pointer-events-none"
                                      : ""
                                  }`}
                                >
                                  {}
                                  <div className="p-3 lgx:pl-4 align-top flex items-center min-w-[80px] gap-2 whitespace-nowrap mt-2">
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
                                    {item[0] === "ckUSDT" && (
                                      <img
                                        src={ckUSDT}
                                        alt="ckUSDT logo"
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    <span>{item[0]}</span>
                                  </div>

                                  {}
                                  <div
                                    className={`p-3 lgx:pl-4 align-top flex flex-col `}
                                  >
                                    {item[0] === "ckBTC" && (
                                      <>
                                        <p>
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.00000000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckBTCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Number(total_supply) -
                                                    Number(total_borrow)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckBTCUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.0000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckBTCUsdRate / 1e8)
                                              ? formatConditional(
                                                  (Number(total_supply) -
                                                    Number(total_borrow)) *
                                                    (ckBTCUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckETH" && (
                                      <>
                                        <p>
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.00000000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckETHUsdRate / 1e8)
                                              ? formatConditional(
                                                  Number(total_supply) -
                                                    Number(total_borrow)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckETHUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.0000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckETHUsdRate / 1e8)
                                              ? formatConditional(
                                                  (Number(total_supply) -
                                                    Number(total_borrow)) *
                                                    (ckETHUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckUSDC" && (
                                      <>
                                        <p>
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.00000000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckUSDCUsdRate / 1e8)
                                              ? formatConditional(
                                                  Number(total_supply) -
                                                    Number(total_borrow)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckUSDCUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.0000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckUSDCUsdRate / 1e8)
                                              ? formatConditional(
                                                  (Number(total_supply) -
                                                    Number(total_borrow)) *
                                                    (ckUSDCUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ICP" && (
                                      <>
                                        <p>
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.00000000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckICPUsdRate / 1e8)
                                              ? formatConditional(
                                                  Number(total_supply) -
                                                    Number(total_borrow)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckICPUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.0000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckICPUsdRate / 1e8)
                                              ? formatConditional(
                                                  (Number(total_supply) -
                                                    Number(total_borrow)) *
                                                    (ckICPUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}

                                    {item[0] === "ckUSDT" && (
                                      <>
                                        <p>
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.00000000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckUSDTUsdRate / 1e8)
                                              ? formatConditional(
                                                  Number(total_supply) -
                                                    Number(total_borrow)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow) /
                                                    (ckUSDTUsdRate / 1e8)
                                                )
                                            : "0.00000000"}
                                        </p>
                                        <p className="font-light">
                                          $
                                          {Number(total_supply) <
                                          Number(total_borrow)
                                            ? "0.0000"
                                            : Number(availableBorrow)
                                            ? Number(total_supply) -
                                                Number(total_borrow) <
                                              Number(availableBorrow) /
                                                (ckUSDTUsdRate / 1e8)
                                              ? formatConditional(
                                                  (Number(total_supply) -
                                                    Number(total_borrow)) *
                                                    (ckUSDTUsdRate / 1e8)
                                                )
                                              : formatConditional(
                                                  Number(availableBorrow)
                                                )
                                            : "0.0000"}
                                        </p>
                                      </>
                                    )}
                                  </div>

                                  <div className="p-3 lgx:pl-4 align-center flex items-center">
                                    <p className="mt-1.5">
                                      {Number(item[1].Ok.borrow_rate) /
                                        100000000 <
                                      0.01
                                        ? "<0.01%"
                                        : `${(
                                            Number(item[1].Ok.borrow_rate) /
                                            100000000
                                          ).toFixed(2)}%`}
                                    </p>
                                  </div>

                                  {}
                                  <div className="p-3 text-center"></div>

                                  {}
                                  <div className="p-3 flex gap-3 justify-end">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={async () => {
                                        dispatch(toggleDashboardRefresh());
                                        fetchAssetBorrow(item[0]);
                                        const currentCollateralStatus =
                                          reserveData?.[1]?.is_collateral;

                                        const currentLiquidity =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0] // Check if the asset matches
                                          )?.[1]?.liquidity_index;
                                        const assetBalance =
                                          assetBalances.find(
                                            (balance) =>
                                              balance.asset === item[0]
                                          )?.dtokenBalance || 0;

                                        const assetSupply =
                                          (Number(assetBalance) *
                                            Number(
                                              getAssetSupplyValue(item[0])
                                            )) /
                                          (Number(currentLiquidity) * 1e8);

                                        const DebtIndex =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0] // Check if the asset matches
                                          )?.[1]?.variable_borrow_index;

                                        const assetBorrowBalance =
                                          assetBalances.find(
                                            (balance) =>
                                              balance.asset === item[0]
                                          )?.debtTokenBalance || 0;

                                        const assetBorrow =
                                          (Number(assetBorrowBalance) *
                                            Number(
                                              getAssetBorrowValue(item[0])
                                            )) /
                                          (Number(DebtIndex) * 1e8);

                                        const totalCollateral =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[0]) /
                                              100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userAccountData?.Ok?.[1]) /
                                              100000000
                                          ) || 0;
                                        const Ltv =
                                          Number(userData?.Ok?.ltv) /
                                            100000000 || 0;

                                        const remainingBorrowable =
                                          Number(total_supply) -
                                          Number(total_borrow);

                                        const {
                                          borrowableValue,
                                          borrowableAssetValue,
                                        } = calculateBorrowableValues(
                                          item,
                                          availableBorrow,
                                          Number(total_supply) -
                                            Number(total_borrow)
                                        );
                                        console.log(
                                          "borrowableValue",
                                          borrowableValue,
                                          borrowableAssetValue
                                        );
                                        handleModalOpen(
                                          "borrow",
                                          item[0],
                                          (item[0] === "ckBTC" && ckBTC) ||
                                            (item[0] === "ckETH" && ckETH) ||
                                            (item[0] === "ckUSDC" && ckUSDC) ||
                                            (item[0] === "ICP" && icp) ||
                                            (item[0] === "ckUSDT" && ckUSDT),
                                          Number(item[1].Ok.borrow_rate) /
                                            100000000,
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
                                            : null,
                                          Number(userAccountData?.Ok?.[3]) /
                                            100000000 || 0,
                                          Number(
                                            item?.[1]?.Ok?.configuration
                                              .liquidation_threshold
                                          ) / 100000000 || 0,
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
                                        );
                                      }}
                                      disabled={!isEligible}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                    />
                                    <Button
                                      title={"Details"}
                                      onClickHandler={() =>
                                        handleDetailsClick(item[0], item[1])
                                      }
                                      disabled={!isEligible}
                                      className="bg-gradient-to-r from-[#4659CF] to-[#2A1F9D] text-white rounded-md px-3 py-1.5 shadow-md font-semibold text-xs"
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
    </div>
  );
};

export default MySupply;
