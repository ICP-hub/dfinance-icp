import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { useMemo } from "react";
import useAssetData from "../Common/useAssets";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import ColateralPopup from "./DashboardPopup/CollateralDisablePopup";
// import {setToggle} from "../../redux/reducers/toggleReducer"

const MySupply = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state, pathname } = useLocation();

  const { principal, backendActor } = useAuth();

  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [availableBorrow, setAvailableBorrow] = useState([]);
  const [borrowableBTC, setBorrowableBTC] = useState(0);
  const [borrowableETH, setBorrowableETH] = useState(0);
  const [borrowableUSDC, setBorrowableUSDC] = useState(0);
  const [borrowableICP, setBorrowableICP] = useState(0);

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  useEffect(() => {
    if (userData?.Ok?.available_borrow) {
      // dispatch(setToggled(user))
      setAvailableBorrow(Number(userData.Ok.available_borrow) / 100000000);
    }
  }, [userData]);

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    fetchBalance,
  } = useFetchConversionRate();

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }

    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }

    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
    }

    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }

    if (ckBTCUsdRate) {
      const btcAmount = (availableBorrow / ckBTCUsdRate); 
      setBorrowableBTC(btcAmount);
    }

    if (ckETHUsdRate) {
      const ethAmount = (availableBorrow / ckETHUsdRate);
      setBorrowableETH(ethAmount);
    }

    if (ckUSDCUsdRate) {
      const usdcAmount = (availableBorrow / ckUSDCUsdRate);
      setBorrowableUSDC(usdcAmount);
    }

    if (ckICPUsdRate) {
      const icpAmount = (availableBorrow / ckICPUsdRate);
      setBorrowableICP(icpAmount);
    }
  }, [
    ckBTCBalance,
    ckBTCUsdRate,
    ckETHBalance,
    ckETHUsdRate,
    ckUSDCBalance,
    ckUSDCUsdRate,
    ckICPBalance,
    ckICPUsdRate,
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
          fetchConversionRate(),
        ]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  const { assets, reserveData, filteredItems } = useAssetData();

  const filteredReserveData = Object.fromEntries(filteredItems);

  const [Collateral, setCollateral] = useState(true);

  const formatNumber = useFormatNumber();

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";
  const toggles = useSelector((state) => state.toggle.toggles); // Generic state for toggle

  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
    balance: "",
  });
  console.log("toggle", toggles);
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
    currentCollateralStatus ,
    Ltv,
    availableBorrow,
    borrowableAsset,
    
  ) => {
    console.log("handle toggle : ", Collateral);
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
      currentCollateralStatus :currentCollateralStatus,
      Ltv: Ltv,
      availableBorrow: availableBorrow,
      borrowableAsset: borrowableAsset
      
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
    console.log("assetdetailsinMarket", assetData);
    navigate(`/dashboard/asset-details/${asset}`, { state: { assetData } });
  };

  const handleToggleChange = (newStatus) => {
    dispatch(set(newStatus)); // Update the state based on the modal success
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
                Ltv={isModalOpen.Ltv}
                availableBorrow={isModalOpen.availableBorrow}
                borrowableAsset={isModalOpen.borrowableAsset}
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
        console.log("Opening collateral modal with data:", {
          asset: isModalOpen.asset,
          image: isModalOpen.image,
          supplyRateAPR: isModalOpen.supplyRateAPR,
          balance: isModalOpen.balance,
          liquidationThreshold: isModalOpen.liquidationThreshold,
          reserveliquidationThreshold: isModalOpen.reserveliquidationThreshold,
          assetSupply: isModalOpen.assetSupply,
          assetBorrow: isModalOpen.assetBorrow,
          totalCollateral: isModalOpen.totalCollateral,
          totalDebt: isModalOpen.totalDebt,
          currentCollateralStatus : isModalOpen.currentCollateralStatus ,
        });
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
                currentCollateralStatus ={isModalOpen.currentCollateralStatus }
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
        );
      default:
        return null;
    }
  };
  // console.log("toggle in popup",)
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
  }, [userData]);

  return (
    <div className="w-full flex-col lg:flex-row flex gap-6 md:-mt-[3rem]">
      <div className="flex justify-center -mb-30 lg:hidden">
        <button
          className={`w-1/2 py-2 button1 ${activeSection === "supply"
            ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary text-[17px]"
            : "text-[#2A1F9D] opacity-50  dark:text-darkTextSecondary1 text-[14px]"
            }`}
          onClick={() => setActiveSection("supply")}
        >
          &#8226; Supply
        </button>
        <button
          className={`w-1/2 py-2 button1 ${activeSection === "borrow"
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
                      className={`relative mt-4 overflow-y-auto overflow-x-hidden scrollbar-custom ${filteredItems.length > 1
                        ? "max-h-[1250px]"
                        : "max-h-auto"
                        }`}
                    >
                      <div
                        className={`w-full ${filteredItems.length > 1 ? "h-full" : ""
                          }`}
                      >
                        {userData?.Ok?.reserves[0]?.map(
                          (reserveGroup, index) => {
                            console.log("userData", userData?.Ok?.reserves);
                            const asset = reserveGroup[1]?.reserve;
                            const assetSupply =
                              Number(reserveGroup[1]?.asset_supply || 0n) /
                              100000000;

                            const assetBorrow =
                              Number(reserveGroup[1]?.asset_borrow || 0n) /
                              100000000;
                            {
                              console.log(
                                reserveGroup[1]?.is_collateral,
                                "clt"
                              );
                            }
                            // dispatch(set(reserveGroup[1]?.is_collateral))
                            const collateralStatus = reserveGroup[1]?.is_collateral;

                            // You can now store or use the isCollateral value as needed
                            console.log(
                              collateralStatus,
                              "is_collateral for asset:",
                              asset
                            );

                            if (assetSupply <= 0) return null;

                            const item = filteredItems.find(
                              (item) => item[0] === asset
                            );
                            const supplyRateApr =
                              Number(item?.[1]?.Ok?.current_liquidity_rate) /
                              100000000;

                            const liquidationThreshold =
                              Number(userData.Ok?.liquidation_threshold) /
                              100000000;
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
                                  <div className=" text-right text-[#2A1F9D] dark:text-darkText">
                                    <p className=" text-[#2A1F9D] dark:text-darkText">
                                      {assetSupply
                                        ? assetSupply >= 1e-8 &&
                                          assetSupply < 1e-7
                                          ? Number(assetSupply).toFixed(8)
                                          : assetSupply >= 1e-7 &&
                                            assetSupply < 1e-6
                                            ? Number(assetSupply).toFixed(7)
                                            : assetSupply
                                        : "0"}
                                    </p>
                                    <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                      $
                                      {asset === "ckBTC" &&
                                        formatNumber(
                                          assetSupply * ckBTCUsdRate
                                        )}
                                      {asset === "ckETH" &&
                                        formatNumber(
                                          assetSupply * ckETHUsdRate
                                        )}
                                      {asset === "ckUSDC" &&
                                        formatNumber(
                                          assetSupply * ckUSDCUsdRate
                                        )}
                                      {asset === "ICP" &&
                                        formatNumber(
                                          assetSupply * ckICPUsdRate
                                        )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-4 mb-1">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    APY:
                                  </p>
                                  <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                    {supplyRateApr < 0.1
                                      ? "<0.1%"
                                      : `${supplyRateApr.toFixed(2)}%`}
                                  </p>
                                </div>

                                <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-3 mb-4">
                                  <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                    Collateral
                                  </p>
                                  <div className="-mr-6 -mt-3">
                                    <CustomizedSwitches
                                      checked={collateralStatus} // This checks whether the switch is toggled on or off
                                      onChange={() => {
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                          const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                          console.log("currentCollateralStatus in on change", currentCollateralStatus); 
                                        const totalCollateral =
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                              100000000
                                          ) || 0;
                                        
                                        // Open the modal and pass the necessary data
                                        handleModalOpen(
                                          "collateral",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
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

                                <div className="flex justify-between gap-4">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() => {
                                      const reserveData =
                                        userData?.Ok?.reserves[0]?.find(
                                          (reserveGroup) =>
                                            reserveGroup[0] === item[0]
                                        );
                                      const assetSupply =
                                        Number(
                                          reserveData?.[1]?.asset_supply || 0n
                                        ) / 100000000;
                                      const assetBorrow =
                                        Number(
                                          reserveData?.[1]?.asset_borrow || 0n
                                        ) / 100000000;
                                      const totalCollateral =
                                        parseFloat(
                                          Number(
                                            userData?.Ok?.total_collateral
                                          ) / 100000000
                                        ) || 0;

                                      const totalDebt =
                                        parseFloat(
                                          Number(userData?.Ok?.total_debt) /
                                          100000000
                                        ) || 0;

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
                                        liquidationThreshold,
                                        reserveliquidationThreshold,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt
                                      );
                                    }}
                                    className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
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
                                        parseFloat(
                                          Number(
                                            userData?.Ok?.total_collateral
                                          ) / 100000000
                                        ) || 0;
                                      const totalDebt =
                                        parseFloat(
                                          Number(userData?.Ok?.total_debt) /
                                          100000000
                                        ) || 0;

                                      const assetSupply =
                                        Number(
                                          reserveData?.[1]?.asset_supply || 0n
                                        ) / 100000000;
                                      const assetBorrow =
                                        Number(
                                          reserveData?.[1]?.asset_borrow || 0n
                                        ) / 100000000;
                                      handleModalOpen(
                                        "withdraw",
                                        asset,
                                        (asset === "ckBTC" && ckBTC) ||
                                        (asset === "ckETH" && ckETH) ||
                                        (asset === "ckUSDC" && ckUSDC) ||
                                        (asset === "ICP" && icp),
                                        supplyRateApr,
                                        ckBalance,
                                        liquidationThreshold,
                                        reserveliquidationThreshold,
                                        assetSupply,
                                        assetBorrow,
                                        totalCollateral,
                                        totalDebt
                                      );
                                    }}
                                    className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                                  />
                                </div>

                                {index !==
                                  userData.Ok.reserves[0].length - 1 && (
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
                    // className="w-full h-auto mt-4 relative max-h-[300px] overflow-hidden"
                    <div className="w-full h-auto mt-4 relative  overflow-hidden">
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
                        className={`w-full h-auto max-h-[300px] overflow-y-auto scrollbar-custom ${userData?.Ok?.reserves[0]?.filter(
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
                                Number(reserveGroup[1]?.asset_supply || 0n) /
                                100000000;

                              const assetBorrow =
                                Number(reserveGroup[1]?.asset_borrow || 0n) /
                                100000000;
                              const collateralStatus =
                                reserveGroup[1]?.is_collateral;

                              // You can now store or use the Collateral value as needed
                              console.log(
                                collateralStatus,
                                "is_collateral for asset:",
                                asset
                              );
                              if (assetSupply <= 0) return null;

                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const supplyRateApr =
                                Number(item?.[1]?.Ok?.current_liquidity_rate) /
                                100000000 || 0;
                              const liquidationThreshold =
                                Number(userData.Ok?.liquidation_threshold) /
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
                                    <p className=" text-[#2A1F9D] dark:text-darkText">
                                      {assetSupply
                                        ? assetSupply >= 1e-8 &&
                                          assetSupply < 1e-7
                                          ? Number(assetSupply).toFixed(8)
                                          : assetSupply >= 1e-7 &&
                                            assetSupply < 1e-6
                                            ? Number(assetSupply).toFixed(7)
                                            : assetSupply
                                        : "0"}
                                    </p>
                                    <p className=" text-[#2A1F9D] dark:text-darkText font-light">
                                      $
                                      {asset === "ckBTC" &&
                                        formatNumber(
                                          assetSupply * ckBTCUsdRate
                                        )}
                                      {asset === "ckETH" &&
                                        formatNumber(
                                          assetSupply * ckETHUsdRate
                                        )}
                                      {asset === "ckUSDC" &&
                                        formatNumber(
                                          assetSupply * ckUSDCUsdRate
                                        )}
                                      {asset === "ICP" &&
                                        formatNumber(
                                          assetSupply * ckICPUsdRate
                                        )}
                                    </p>
                                  </div>
                                  <div className=" p-3  align-top flex items-center ">
                                    {supplyRateApr < 0.1
                                      ? "<0.1%"
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
                                          const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                          console.log("currentCollateralStatus in on change desktop", currentCollateralStatus);
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;

                                        const totalCollateral =
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                              100000000
                                          ) || 0;

                                        // Open the modal and pass the necessary data
                                        handleModalOpen(
                                          "collateral",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                            (asset === "ckETH" && ckETH) ||
                                            (asset === "ckUSDC" && ckUSDC) ||
                                            (asset === "ICP" && icp),
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
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;

                                        const totalCollateral =
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                            100000000
                                          ) || 0;

                                        handleModalOpen(
                                          "supply",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
                                          supplyRateApr,
                                          ckBalance,
                                          liquidationThreshold,
                                          reserveliquidationThreshold,
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
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                            100000000
                                          ) || 0;
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                        handleModalOpen(
                                          "withdraw",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
                                          supplyRateApr,
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
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${isVisible ? "min-h-[200px]" : "min-h-[100px]"
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
                    <div className="relative mt-4 max-h-[1250px] overflow-y-auto scrollbar-custom">
                      {/* Container for the content */}
                      <div className="w-full">
                        {filteredItems.slice(0, 8).map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg dark:bg-darkSurface dark:text-darkText"
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
                                    <p>
                                      {Number(ckBTCBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckBTCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>
                                      {Number(ckETHBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckETHUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>
                                      {Number(ckUSDCBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckUSDCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>
                                      {Number(ckICPBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckICPUsdBalance)}
                                    </p>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-4 mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                {Number(item[1].Ok.current_liquidity_rate) /
                                  100000000 <
                                  0.1
                                  ? "<0.1%"
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
                                  const reserveData =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === item[0]
                                    );
                                  const assetSupply =
                                    Number(
                                      reserveData?.[1]?.asset_supply || 0n
                                    ) / 100000000;
                                  const assetBorrow =
                                    Number(
                                      reserveData?.[1]?.asset_borrow || 0n
                                    ) / 100000000;
                                  const totalCollateral =
                                    Number(
                                      userData?.Ok?.total_collateral || 0n
                                    ) / 100000000;
                                  const totalDebt =
                                    Number(userData?.Ok?.total_debt || 0n) /
                                    100000000;

                                  handleModalOpen(
                                    "supply",
                                    item[0],
                                    (item[0] === "ckBTC" && ckBTC) ||
                                    (item[0] === "ckETH" && ckETH) ||
                                    (item[0] === "ckUSDC" && ckUSDC) ||
                                    (item[0] === "ICP" && icp),
                                    Number(item[1]?.Ok.current_liquidity_rate) /
                                    100000000,
                                    item[0] === "ckBTC"
                                      ? ckBTCBalance
                                      : item[0] === "ckETH"
                                        ? ckETHBalance
                                        : item[0] === "ckUSDC"
                                          ? ckUSDCBalance
                                          : item[0] === "ICP"
                                            ? ckICPBalance
                                            : null,
                                    Number(
                                      userData?.Ok?.liquidation_threshold
                                    ) / 100000000,
                                    Number(
                                      item[1].Ok.configuration
                                        .liquidation_threshold
                                    ) / 100000000,

                                    assetSupply,
                                    assetBorrow,
                                    totalCollateral,
                                    totalDebt
                                  );
                                }}
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
                            {index !== filteredItems.length - 1 && (
                              <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
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
                    // <div className="w-full h-auto mt-4 relative max-h-[300px] overflow-hidden">
                    <div className="w-full h-auto mt-4 ">
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

                      {/* className="w-full h-auto max-h-[200px] overflow-y-auto scrollbar-custom" */}
                      {/* Scrollable Content Area */}
                      <div className="w-full h-auto max-h-[300px] overflow-y-auto scrollbar-custom">
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
                                    <p>
                                      {Number(ckBTCBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckBTCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>
                                      {Number(ckETHBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckETHUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>
                                      {Number(ckUSDCBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckUSDCUsdBalance)}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>
                                      {Number(ckICPBalance).toLocaleString()}
                                    </p>
                                    <p className="font-light">
                                      ${formatNumber(ckICPUsdBalance)}
                                    </p>
                                  </>
                                )}
                              </div>

                              <div className="ml-2 align-top">
                                {Number(item[1].Ok.current_liquidity_rate) /
                                  100000000 <
                                  0.1
                                  ? "<0.1%"
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
                                    const reserveData =
                                      userData?.Ok?.reserves[0]?.find(
                                        (reserveGroup) =>
                                          reserveGroup[0] === item[0]
                                      );
                                    const assetSupply =
                                      Number(
                                        reserveData?.[1]?.asset_supply || 0n
                                      ) / 100000000;
                                    const assetBorrow =
                                      Number(
                                        reserveData?.[1]?.asset_supply || 0n
                                      ) / 100000000;
                                    const totalCollateral =
                                      parseFloat(
                                        Number(userData?.Ok?.total_collateral) /
                                        100000000
                                      ) || 0;
                                    const totalDebt =
                                      parseFloat(
                                        Number(userData?.Ok?.total_debt) /
                                        100000000
                                      ) || 0;

                                    handleModalOpen(
                                      "supply",
                                      item[0],
                                      (item[0] === "ckBTC" && ckBTC) ||
                                      (item[0] === "ckETH" && ckETH) ||
                                      (item[0] === "ckUSDC" && ckUSDC) ||
                                      (item[0] === "ICP" && icp),
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
                                              : null,
                                      Number(
                                        userData.Ok?.liquidation_threshold
                                      ) / 100000000,
                                      Number(
                                        item[1]?.Ok.configuration
                                          .liquidation_threshold
                                      ) / 100000000,
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
      <div className="w-full lg:w-6/12 md:-mt-6 lg:mt-20">
        <div
          className={`${activeSection === "borrow" ? "block" : "hidden"
            } lg:block`}
        >
          <div
            className={`w-full overflow-scroll lgx:overflow-none hide-scrollbar sxs3:-mt-6 md:-mt-0 ${isborrowVisible ? "min-h-[200px]" : "min-h-[100px]"
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
                      (reserveGroup) => reserveGroup[1]?.asset_borrow === 0n
                    ) ? (
                    noBorrowMessage
                  ) : (
                    <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                      <div className="relative mt-4 max-h-[1250px] overflow-y-auto scrollbar-custom">
                        {/* Container for the content */}
                        <div className="w-full">
                          {console.log(
                            "user data in my borrow",
                            userData?.Ok?.reserves[0]
                          )}
                          {userData?.Ok?.reserves[0]?.map(
                            (reserveGroup, index) => {
                              const asset = reserveGroup[1]?.reserve;
                              console.log("Reserve group", reserveGroup[1]);
                              if (reserveGroup[1]?.asset_borrow <= 0)
                                return null;
                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const assetSupply =
                                Number(reserveGroup[1]?.asset_supply || 0n) /
                                100000000;
                              console.log("AssetSupply", assetSupply);
                              const assetBorrow =
                                Number(reserveGroup[1]?.asset_borrow || 0n) /
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
                                        : null;
                              const borrowRateApr =
                                Number(item?.[1]?.Ok?.borrow_rate) /
                                100000000 || 0;
                              const liquidationThreshold =
                                Number(userData.Ok?.liquidation_threshold) /
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
                                      {assetBorrow
                                        ? assetBorrow >= 1e-8 &&
                                          assetBorrow < 1e-7
                                          ? Number(assetBorrow).toFixed(8)
                                          : assetBorrow >= 1e-7 &&
                                            assetBorrow < 1e-6
                                            ? Number(assetBorrow).toFixed(7)
                                            : assetBorrow
                                        : "0"}
                                      <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                        $
                                        {asset === "ckBTC" &&
                                          formatNumber(
                                            assetBorrow * ckBTCUsdRate
                                          )}
                                        {asset === "ckETH" &&
                                          formatNumber(
                                            assetBorrow * ckETHUsdRate
                                          )}
                                        {asset === "ckUSDC" &&
                                          formatNumber(
                                            assetBorrow * ckUSDCUsdRate
                                          )}
                                        {asset === "ICP" &&
                                          formatNumber(
                                            assetBorrow * ckICPUsdRate
                                          )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                                    <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-2">
                                      APY:
                                    </p>
                                    <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2">
                                      {borrowRateApr < 0.1
                                        ? "<0.1%"
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
                                        const reserveData =
                                          userData?.Ok?.reserves[0]?.find(
                                            (reserveGroup) =>
                                              reserveGroup[0] === item[0]
                                          );
                                          const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                          console.log("currentCollateralStatus in on change", currentCollateralStatus);
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                        const totalCollateral = parseFloat(
                                          Number(
                                            userData?.Ok?.total_collateral
                                          ) / 100000000
                                        );
                                        const totalDebt = parseFloat(
                                          Number(userData?.Ok?.total_debt) /
                                          100000000
                                        );

                                        const Ltv =
                                          Number(userData?.Ok?.ltv) /
                                          100000000 || 0;

                                        const borrowableAsset =
                                          item[0] === "ckBTC"
                                            ? borrowableBTC
                                            : item[0] === "ckETH"
                                              ? borrowableETH
                                              : item[0] === "ckUSDC"
                                                ? borrowableUSDC
                                                : item[0] === "ICP"
                                                  ? borrowableICP
                                                  : 0;
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
                                          liquidationThreshold,
                                          reserveliquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt,
                                          Ltv,
                                          currentCollateralStatus,
                                          availableBorrow,
                                          borrowableAsset
                                        );
                                      }}
                                      disabled={isTableDisabled}
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
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
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                        const totalCollateral = parseFloat(
                                          Number(
                                            userData?.Ok?.total_collateral
                                          ) / 100000000
                                        );
                                        const totalDebt = parseFloat(
                                          Number(userData?.Ok?.total_debt) /
                                          100000000
                                        );

                                        handleModalOpen(
                                          "repay",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
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
                      (reserveGroup) => reserveGroup[1]?.asset_borrow === 0n
                    ) ? (
                    noBorrowMessage
                  ) : (
                    // className="w-full h-auto mt-6 relative max-h-[300px] overflow-hidden"
                    <div className="w-full h-auto mt-6 relative  overflow-hidden">
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
                        className={`w-full h-auto max-h-[300px] overflow-y-auto scrollbar-custom ${userData?.Ok?.reserves[0]?.filter(
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
                              if (
                                Number(reserveGroup[1]?.asset_borrow || 0n) /
                                100000000 <=
                                0
                              )
                                return null;
                              const item = filteredItems.find(
                                (item) => item[0] === asset
                              );
                              const assetSupply =
                                Number(reserveGroup[1]?.asset_supply || 0n) /
                                100000000;
                              const assetBorrow =
                                Number(reserveGroup[1]?.asset_borrow || 0n) /
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
                                        : null;
                              const borrowRateApr =
                                Number(item?.[1]?.Ok?.borrow_rate) /
                                100000000 || 0;
                              const liquidationThreshold =
                                Number(userData.Ok?.liquidation_threshold) /
                                100000000 || 0;
                              const reserveliquidationThreshold =
                                Number(
                                  item?.[1]?.Ok.configuration
                                    .liquidation_threshold
                                ) / 100000000 || 0;
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
                                      {assetBorrow
                                        ? assetBorrow >= 1e-8 &&
                                          assetBorrow < 1e-7
                                          ? Number(assetBorrow).toFixed(8)
                                          : assetBorrow >= 1e-7 &&
                                            assetBorrow < 1e-6
                                            ? Number(assetBorrow).toFixed(7)
                                            : assetBorrow
                                        : "0"}
                                      <p className="font-light text-[#2A1F9D] dark:text-darkText">
                                        $
                                        {asset === "ckBTC" &&
                                          formatNumber(
                                            assetBorrow * ckBTCUsdRate
                                          )}
                                        {asset === "ckETH" &&
                                          formatNumber(
                                            assetBorrow * ckETHUsdRate
                                          )}
                                        {asset === "ckUSDC" &&
                                          formatNumber(
                                            assetBorrow * ckUSDCUsdRate
                                          )}
                                        {asset === "ICP" &&
                                          formatNumber(
                                            assetBorrow * ckICPUsdRate
                                          )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="p-3 ml-1">
                                    {borrowRateApr < 0.1
                                      ? "<0.1%"
                                      : `${borrowRateApr.toFixed(2)}%`}
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
                                          const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                          console.log("currentCollateralStatus in on change", currentCollateralStatus);
                                        const assetSupply =
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                        const totalCollateral =
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                            100000000
                                          ) || 0;
                                        const Ltv =
                                          Number(userData?.Ok?.ltv) /
                                          100000000 || 0;

                                        const borrowableAsset =
                                          item[0] === "ckBTC"
                                            ? borrowableBTC
                                            : item[0] === "ckETH"
                                              ? borrowableETH
                                              : item[0] === "ckUSDC"
                                                ? borrowableUSDC
                                                : item[0] === "ICP"
                                                  ? borrowableICP
                                                  : 0;

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
                                          liquidationThreshold,
                                          reserveliquidationThreshold,
                                          assetSupply,
                                          assetBorrow,
                                          totalCollateral,
                                          totalDebt,
                                          Ltv,
                                          currentCollateralStatus,
                                          availableBorrow,
                                          borrowableAsset
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
                                          Number(
                                            reserveData?.[1]?.asset_supply || 0n
                                          ) / 100000000;
                                        const assetBorrow =
                                          Number(
                                            reserveData?.[1]?.asset_borrow || 0n
                                          ) / 100000000;
                                        const totalCollateral =
                                          parseFloat(
                                            Number(
                                              userData?.Ok?.total_collateral
                                            ) / 100000000
                                          ) || 0;
                                        const totalDebt =
                                          parseFloat(
                                            Number(userData?.Ok?.total_debt) /
                                            100000000
                                          ) || 0;

                                        handleModalOpen(
                                          "repay",
                                          asset,
                                          (asset === "ckBTC" && ckBTC) ||
                                          (asset === "ckETH" && ckETH) ||
                                          (asset === "ckUSDC" && ckUSDC) ||
                                          (asset === "ICP" && icp),
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
            className={`w-full mt-6 overflow-scroll lgx:overflow-none hide-scrollbar ${isBorrowVisible ? "min-h-auto" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40 to-[#FCBD78]/40 rounded-[30px]  dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-2 mx-4">
              <h1 className="text-[#2A1F9D] font-semibold dark:text-darkText">
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
                    <div className="relative mt-4 max-h-[880px] overflow-y-auto scrollbar-custom">
                      {/* Container for the content */}
                      <div className="w-full">
                        {filteredItems.slice(0, 8).map((item, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText ${isTableDisabled
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
                                Available:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{borrowableBTC.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{borrowableETH.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>{borrowableUSDC.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>{borrowableICP.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-4 mb-1">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mb-4">
                                {Number(item[1].Ok.borrow_rate) / 100000000 <
                                  0.1
                                  ? "<0.1%"
                                  : `${(
                                    Number(item[1].Ok.borrow_rate) / 100000000
                                  ).toFixed(2)}%`}
                              </p>
                            </div>

                            <div className="flex justify-between gap-4">
                              <Button
                                title={"Borrow"}
                                onClickHandler={() => {
                                  const reserveData =
                                    userData?.Ok?.reserves[0]?.find(
                                      (reserveGroup) =>
                                        reserveGroup[0] === item[0]
                                    );
                                  const assetSupply =
                                    Number(
                                      reserveData?.[1]?.asset_supply || 0n
                                    ) / 100000000;

                                    const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                    console.log("currentCollateralStatus in on change", currentCollateralStatus);
                                  const assetBorrow =
                                    Number(
                                      reserveData?.[1]?.asset_borrow || 0n
                                    ) / 100000000;
                                  const totalCollateral =
                                    parseFloat(
                                      Number(userData?.Ok?.total_collateral) /
                                      100000000
                                    ) || 0;
                                  const totalDebt = parseFloat(
                                    Number(userData?.Ok?.total_debt) / 100000000
                                  );
                                  const Ltv =
                                    Number(userData?.Ok?.ltv) / 100000000 || 0;
                                  console.log("LTV1", Ltv);
                                  const borrowableAsset =
                                    item[0] === "ckBTC"
                                      ? borrowableBTC
                                      : item[0] === "ckETH"
                                        ? borrowableETH
                                        : item[0] === "ckUSDC"
                                          ? borrowableUSDC
                                          : item[0] === "ICP"
                                            ? borrowableICP
                                            : 0;
                                  handleModalOpen(
                                    "borrow",
                                    item[0],
                                    (item[0] === "ckBTC" && ckBTC) ||
                                    (item[0] === "ckETH" && ckETH) ||
                                    (item[0] === "ckUSDC" && ckUSDC) ||
                                    (item[0] === "ICP" && icp),
                                    Number(item[1].Ok.borrow_rate) / 100000000,
                                    item[0] === "ckBTC"
                                      ? ckBTCBalance
                                      : item[0] === "ckETH"
                                        ? ckETHBalance
                                        : item[0] === "ckUSDC"
                                          ? ckUSDCBalance
                                          : null,

                                    Number(userData.Ok?.liquidation_threshold) /
                                    100000000,
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
                                    availableBorrow,
                                    borrowableAsset
                                  );
                                }}
                                disabled={isTableDisabled}
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] text-white rounded-lg shadow-md px-7 py-2 text-[14px] w-1/2 font-semibold"
                              />
                              <Button
                                title={"Details"}
                                onClickHandler={() =>
                                  handleDetailsClick(item[0], item[1])
                                }
                                disabled={isTableDisabled}
                               className="md:block lgx:block xl:hidden focus:outline-none box bg-transparent px-7 py-2 text-[14px] w-1/2 font-semibold"
                              />
                            </div>
                            {index !== filteredItems.length - 1 && (
                              <div className="border-t border-[#2A1F9D] my-6 -mb-0 opacity-80"></div>
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

                  <div className="w-full max-h-[300px] ">
                    {/* Supply Section */}
                    {filteredItems.length === 0 ? (
                      noAssetsToBorrowMessage
                    ) : (
                      <div
                        className={`w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText mt-4 ${isTableDisabled
                          ? "opacity-50 pointer-events-none"
                          : ""
                          }`}
                      >
                        {/* Header */}
                        <div className="grid grid-cols-[3fr_2fr_3fr_1fr_2fr] text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 pb-3 sticky top-0  z-10">
                          {MY_ASSET_TO_SUPPLY_TABLE_COL.map((item, index) => (
                            <div
                              key={index}
                              className="p-2 lgx:pl-4  font-[500] whitespace-nowrap"
                            >
                              <p>{index === 2 ? item.header1 : item.header}</p>
                            </div>
                          ))}
                        </div>
                        {/* className="w-full max-h-[200px] overflow-y-auto overflow-x-hidden scrollbar-custom" */}
                        <div className="w-full max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-custom">
                          {/* Body */}
                          {filteredItems.slice(0, 8).map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[3fr_2fr_2fr_1fr_2fr] items-center font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                            >
                              {/* Asset Column */}
                              <div className="p-3 lgx:pl-4  align-top flex items-center min-w-[80px] gap-2 whitespace-nowrap mt-2">
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
                                <span>{item[0]}</span>
                              </div>

                              {/* Balance Column */}
                              <div className="p-3 lgx:pl-6  align-top flex flex-col">
                                {item[0] === "ckBTC" && (
                                  <>
                                    <p>{borrowableBTC.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckETH" && (
                                  <>
                                    <p>{borrowableETH.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ckUSDC" && (
                                  <>
                                    <p>{borrowableUSDC.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                                {item[0] === "ICP" && (
                                  <>
                                    <p>{borrowableICP.toFixed(4)}</p>
                                    <p className="font-light">
                                      $
                                      {Number(availableBorrow)
                                        ? formatNumber(
                                            Number(availableBorrow).toFixed(4)
                                          )
                                        : "0.0000"}
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* Borrow Rate Column */}
                              <div className="p-3 lgx:pl-6 align-center flex items-center">
                                <p className="mt-1.5">
                                  {Number(item[1].Ok.borrow_rate) / 100000000 <
                                    0.1
                                    ? "<0.1%"
                                    : `${(
                                      Number(item[1].Ok.borrow_rate) /
                                      100000000
                                    ).toFixed(2)}%`}
                                </p>
                              </div>

                              {/* Empty Spacer Column */}
                              <div className="p-3 text-center"></div>

                              {/* Actions Column */}
                              <div className="p-3 flex gap-3 justify-end">
                                <Button
                                  title={"Borrow"}
                                  onClickHandler={() => {
                                    const reserveData =
                                      userData?.Ok?.reserves[0]?.find(
                                        (reserveGroup) =>
                                          reserveGroup[0] === item[0]
                                      );
                                      const currentCollateralStatus = reserveData?.[1]?.is_collateral;

                                      console.log("currentCollateralStatus in on change", currentCollateralStatus);
                                    const assetSupply =
                                      Number(
                                        reserveData?.[1]?.asset_supply || 0n
                                      ) / 100000000;
                                    const assetBorrow =
                                      Number(
                                        reserveData?.[1]?.asset_borrow || 0n
                                      ) / 100000000;
                                    const totalCollateral =
                                      parseFloat(
                                        Number(userData?.Ok?.total_collateral) /
                                        100000000
                                      ) || 0;
                                    const totalDebt = parseFloat(
                                      Number(userData?.Ok?.total_debt) /
                                      100000000
                                    );
                                    const Ltv =
                                      Number(userData?.Ok?.ltv) / 100000000 ||
                                      0;

                                    const borrowableAsset =
                                      item[0] === "ckBTC"
                                        ? borrowableBTC
                                        : item[0] === "ckETH"
                                          ? borrowableETH
                                          : item[0] === "ckUSDC"
                                            ? borrowableUSDC
                                            : item[0] === "ICP"
                                              ? borrowableICP
                                              : 0;

                                    handleModalOpen(
                                      "borrow",
                                      item[0],
                                      item[0] === "ckBTC"
                                        ? ckBTC
                                        : item[0] === "ckETH"
                                          ? ckETH
                                          : item[0] === "ckUSDC"
                                            ? ckUSDC
                                            : icp,
                                      Number(item[1].Ok.borrow_rate) /
                                      100000000,
                                      item[0] === "ckBTC"
                                        ? ckBTCBalance
                                        : item[0] === "ckETH"
                                          ? ckETHBalance
                                          : item[0] === "ckUSDC"
                                            ? ckUSDCBalance
                                            : ckICPBalance,
                                      Number(
                                        userData.Ok?.liquidation_threshold
                                      ) / 100000000,
                                      Number(
                                        item?.[1]?.Ok?.configuration
                                          .liquidation_threshold
                                      ) / 100000000 || 0,
                                      assetSupply,
                                      assetBorrow,
                                      totalCollateral,
                                      totalDebt,
                                      Ltv,
                                      currentCollateralStatus,
                                      availableBorrow,
                                      borrowableAsset
                                    );
                                  }}
                                  disabled={isTableDisabled}
                                  className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                />
                                <Button
                                  title={"Details"}
                                  onClickHandler={() =>
                                    handleDetailsClick(item[0], item[1])
                                  }
                                  disabled={isTableDisabled}
                                  className="bg-gradient-to-r from-[#4659CF] to-[#2A1F9D] text-white rounded-md px-3 py-1.5 shadow-md font-semibold text-xs"
                                />
                              </div>
                            </div>
                          ))}
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
