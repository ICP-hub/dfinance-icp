import { useDispatch, useSelector } from "react-redux";
import React from "react";
import Button from "../Common/Button";
import { useAuth } from "../../utils/useAuthClient";
import { SlidersHorizontal, SlidersVertical } from "lucide-react";
import { ASSET_DETAILS } from "../../utils/constants";
import { setAssetDetailFilter } from "../../redux/reducers/utilityReducer";
import SupplyInfo from "./DashboardPopup/SupplyInfo";
import BorrowInfo from "./DashboardPopup/BorrowInfo";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import { WalletMinimal } from "lucide-react";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import { toast } from "react-toastify";
import { toggleDashboardRefresh } from "../../redux/reducers/dashboardDataUpdateReducer";
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../customHooks/useAssets";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import MySupplyModal from "./MySupplyModal";
import SupplyPopup from "./DashboardPopup/SupplyPopup";
import ckbtc from "../../../public/assests-icon/ckBTC.png";
import cketh from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import WalletModal from "./WalletModal";
import Borrow from "./DashboardPopup/BorrowPopup";

/**
 * AssetDetails Component
 *
 * This component displays details of a selected asset, including supply and borrow information.
 * @returns {JSX.Element} - Returns the AssetDetails component.
 */
const AssetDetails = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const navigate = useNavigate();
  const formatNumber = useFormatNumber();
  const dispatch = useDispatch();
  const { userData, userAccountData } = useUserData();
  const dashboardRefreshTrigger = useSelector( (state) => state.dashboardUpdate.refreshDashboardTrigger);
  const { assets, reserveData, filteredItems, asset_supply, asset_borrow, fetchAssetSupply, fetchAssetBorrow, loading: filteredDataLoading } = useAssetData();
  const { isAuthenticated, principal, backendActor, fetchReserveData, createLedgerActor } = useAuth();
  const location = useLocation();
  const { assetData } = location.state || {};
  const { isWalletCreated, isWalletModalOpen, isSwitchingWallet } = useSelector((state) => state.utility);
  const { id } = useParams();
  const { ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate, fetchConversionRate, ckBTCBalance, ckETHBalance, ckUSDCBalance, ckICPBalance, ckUSDTBalance, fetchBalance,
  } = useFetchConversionRate();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [borrowRateAPR, setBorrowRateAPR] = useState(null);
  const [reserveFactor, setReserveFactor] = useState(null);
  const [supplyRateAPR, setSupplyRateAPR] = useState(null);
  const [totalBorrowed, setTotalBorrowed] = useState(null);
  const [totalSupplied, setTotalSupplied] = useState(null);
  const [assetBalances, setAssetBalances] = useState([]);
  const [borrowCap, setBorrowCap] = useState(null);
  const [supplyCap, setSupplyCap] = useState(null);
  const [ltv, setLtv] = useState(null);
  const [liquidationBonus, setLiquidationBonus] = useState(null);
  const [liquidationThreshold, setLiquidationThreshold] = useState(null);
  const [canBeCollateral, setCanBeCollateral] = useState(null);
  const [isFilter, setIsFilter] = React.useState(false);
  const { assetDetailFilter } = useSelector((state) => state.utility);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSupply, setTotalSupply] = useState(0);
  const [totalBorrow, setTotalBorrow] = useState(0);
  const [supply_rate, setSupplyRate] = useState(0);
  const [borrow_rate, setBorrowRate] = useState(0);
  const [maxLtv, setmaxLtv] = useState(0);
  const [liquidation_bonus, setLiquidationbonus] = useState(0);
  const [liquidation_threshold, setLiquidationthreshold] = useState(0);
  const [borrowableValue, setBorrowableValue] = useState("0.00000000");
  const [borrowableAssetValue, setBorrowableAssetValue] = useState("0.0000");
  const [availableBorrow, setAvailableBorrow] = useState([]);
  const [assetPrincipal, setAssetPrincipal] = useState({});
  const [isModalOpen, setIsModalOpen] = useState({ isOpen: false, type: "", asset: "", image: "", });

  const handleModalOpen = ( type, asset, image, supplyRateAPR, ckBalance, liquidationThreshold, reserveliquidationThreshold, assetSupply, assetBorrow, totalCollateral, totalDebt, currentCollateralStatus, Ltv, borrowableValue, borrowableAssetValue, total_supply, total_borrow
  ) => {
    setIsModalOpen({ isOpen: true, type: type, asset: asset, image: image, supplyRateAPR: supplyRateAPR, ckBalance: ckBalance, liquidationThreshold: liquidationThreshold, reserveliquidationThreshold: reserveliquidationThreshold, 
      assetSupply: assetSupply, assetBorrow: assetBorrow, totalCollateral: totalCollateral, totalDebt: totalDebt, currentCollateralStatus: currentCollateralStatus, Ltv: Ltv, borrowableValue: borrowableValue, borrowableAssetValue: borrowableAssetValue, total_supply: total_supply, total_borrow: total_borrow,
    });
  };

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  // Fetches asset data including supply and borrow balances
  const fetchAssetData = async () => {
    const balances = [];
    for (const asset of assets) {
      const reserveDataForAsset = await fetchReserveData(asset);
      const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
      const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];
      const assetBalance = { asset, dtokenBalance: null, debtTokenBalance: null};

      if (dtokenId) {
        const dtokenActor = createLedgerActor(dtokenId, idlFactory);
        if (dtokenActor) {
          try {
            const account = { owner: principalObj, subaccount: [] };
            const balance = await dtokenActor.icrc1_balance_of(account);
            const formattedBalance = Number(balance) / 100000000;
            assetBalance.dtokenBalance = formattedBalance;
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
            assetBalance.debtTokenBalance = formattedBalance;
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

  // Calculates borrowable value based on available assets
  const calculateBorrowableValues = ( asset, availableBorrow, remainingBorrowable ) => {
    let borrowableValue = null;
    let borrowableAssetValue = null;
    const assetRates = { ckBTC: ckBTCUsdRate, ckETH: ckETHUsdRate, ckUSDC: ckUSDCUsdRate, ICP: ckICPUsdRate, ckUSDT: ckUSDTUsdRate };
    const rate = assetRates[id] / 1e8;
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

    return { borrowableValue, borrowableAssetValue };
  };

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const getAssetSupplyValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]) / 1e8;
      return supplyValue;
    }
    return `noSupply`;
  };

  const getAssetBorrowValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]) / 1e8;
      return borrowValue;
    }
    return `noBorrow`;
  };

  const handleFilter = (value) => {
    setIsFilter(false);
    dispatch(setAssetDetailFilter(value));
  };

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
        case "ckUSDT":
          result = await backendActor.get_asset_principal("ckUSDT");
          break;

        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      return result.Ok.toText();
    } catch (error) {
      throw error;
    }
  };

  const ckBalance =
    id === "ckBTC"
      ? ckBTCBalance
      : id === "ckETH"
      ? ckETHBalance
      : id === "ckUSDC"
      ? ckUSDCBalance
      : id === "ICP"
      ? ckICPBalance
      : id === "ckUSDT"
      ? ckUSDTBalance
      : null;

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
    if (userData && userAccountData) {
      setLoading(false);
    }
  }, [userData, userAccountData, dashboardRefreshTrigger]);

  useEffect(() => {
    fetchAssetData();
  }, [assets, principalObj, dashboardRefreshTrigger]);

  useEffect(() => {
    if (userData && userAccountData) {
      setLoading(false);
    }
  }, [userData, userAccountData, dashboardRefreshTrigger]);

  useEffect(() => {
    if (assetData?.Ok) {
      setBorrowRateAPR(Number(assetData.Ok.borrow_rate) / 100000000);
      setReserveFactor(
        Number(assetData.Ok.configuration.reserve_factor) / 100000000
      );
      setSupplyRateAPR(Number(assetData.Ok.current_liquidity_rate) / 100000000);
      setTotalBorrowed(Number(assetData.Ok.asset_borrow) / 100000000);
      setTotalSupplied(Number(assetData.Ok.asset_supply) / 100000000);
      setBorrowCap(Number(assetData.Ok.configuration?.borrow_cap) / 100000000);
      setSupplyCap(Number(assetData.Ok.configuration?.supply_cap) / 100000000);
      setLtv(Number(assetData.Ok.configuration?.ltv) / 100000000);
      setLiquidationBonus(
        Number(assetData.Ok.configuration?.liquidation_bonus) / 100000000
      );
      setLiquidationThreshold(
        Number(assetData.Ok.configuration?.liquidation_threshold) / 100000000
      );
      setCanBeCollateral(Number(assetData.Ok.can_be_collateral?.[0])) /
        100000000;
    }
  }, [assetData, dashboardRefreshTrigger, totalBorrowed, totalSupplied]);

  useEffect(() => {
    const updateValues = async () => {
      setLoading(true);
      try {
        const item = filteredItems.find((item) => item[0] === id);
        if (item && item[1]?.Ok) {
          const assetData = item[1].Ok;
          const total_supply = Number(assetData?.asset_supply) / 100000000;
          const total_borrow = Number(assetData?.asset_borrow) / 100000000;
          const borrow_rate = Number(assetData?.borrow_rate) / 100000000;
          const supply_rate =
            Number(assetData?.current_liquidity_rate) / 100000000;
          const maxLtv = Number(assetData?.configuration?.ltv) / 100000000;
          const liquidation_bonus =
            Number(assetData?.configuration?.liquidation_bonus) / 100000000;
          const liquidation_threshold =
            Number(assetData?.configuration?.liquidation_threshold) / 100000000;
          setmaxLtv(maxLtv);
          setLiquidationbonus(liquidation_bonus);
          setLiquidationthreshold(liquidation_threshold);
          setBorrowRate(borrow_rate);
          setSupplyRate(supply_rate);
          setTotalSupply(total_supply);
          setTotalBorrow(total_borrow);
          const remainingBorrowable = total_supply * 0.85 - total_borrow;
          const assetRates = {
            ckBTC: ckBTCUsdRate,
            ckETH: ckETHUsdRate,
            ckUSDC: ckUSDCUsdRate,
            ICP: ckICPUsdRate,
            ckUSDT: ckUSDTUsdRate,
          };
          const rate = assetRates[id] / 1e8;
          if (rate) {
            setBorrowableValue(
              Math.min(remainingBorrowable, Number(availableBorrow) / rate)
            );

            setBorrowableAssetValue(
              Math.min(remainingBorrowable * rate, Number(availableBorrow))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    updateValues();
  }, [
    id,
    filteredItems,
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    availableBorrow,
  ]);

  useEffect(() => {
    if (userAccountData?.Ok?.length > 5) {
      const borrowValue = Number(userAccountData.Ok[5]) / 100000000;
      if (totalSupply - totalBorrow < 0) {
        setAvailableBorrow(0);
        console.warn(
          "Total supply is less than total borrow. Available borrow set to 0."
        );
      } else {
        setAvailableBorrow(borrowValue);
      }
    } else {
      setAvailableBorrow(0);
    }
  }, [userAccountData, userData, dashboardRefreshTrigger]);

  useEffect(() => {
    const fetchData = async () => {
      for (const asset of assets) {
        fetchAssetSupply(asset);
        fetchAssetBorrow(asset);
      }
    };

    fetchData();
  }, [assets, dashboardRefreshTrigger]);

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {}
      } else {
      }
    };

    fetchAssetPrinciple();
  }, [principal, backendActor, dashboardRefreshTrigger]);

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckBTCBalance) * ckBTCUsdRate) /
        1e8
      ).toFixed(7);
      setCkBTCUsdBalance(balanceInUsd);
    }

    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (
        parseFloat(ckETHBalance) *
        (ckETHUsdRate / 1e8)
      ).toFixed(7);
      setCkETHUsdBalance(balanceInUsd);
    }

    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckUSDCBalance) * ckUSDCUsdRate) /
        1e8
      ).toFixed(7);
      setCkUSDCUsdBalance(balanceInUsd);
    }

    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (
        (parseFloat(ckICPBalance) * ckICPUsdRate) /
        1e8
      ).toFixed(7);
      setCkICPUsdBalance(balanceInUsd);
    }

    if (ckUSDTBalance && ckUSDTUsdRate) {
      const balanceInUsd = (
        parseFloat(ckUSDTBalance) *
        (ckUSDTUsdRate / 1e8)
      ).toFixed(7);
      setCkUSDTUsdBalance(balanceInUsd);
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
    ckUSDTBalance,
    ckUSDTUsdRate,
    dashboardRefreshTrigger,
    totalSupply,
    totalBorrow,
  ]);

  useEffect(() => {
    if (id) {
      fetchBalance(id);
    } 
  }, [id, fetchBalance, dashboardRefreshTrigger]);

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
  }, [
    fetchBalance,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckUSDTBalance,
    dashboardRefreshTrigger,
    totalSupply,
    totalBorrow,
  ]);

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  /* ===================================================================================
   *                                   Modal Rendering Functions
   * =================================================================================== */
  const renderModalOpen = (type) => {
    switch (type) {
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
                balance={isModalOpen.ckBalance}
                supplyRateAPR={isModalOpen.supplyRateAPR}
                reserveliquidationThreshold={
                  isModalOpen.reserveliquidationThreshold
                }
                liquidationThreshold={isModalOpen.liquidationThreshold}
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

      default:
        return null;
    }
  };

  /* ===================================================================================
   *                                   Asset Detail Filter Components
   * =================================================================================== */
  const renderFilterComponent = () => {
    switch (assetDetailFilter) {
      case "Supply Info":
        return (
          <SupplyInfo
            formatNumber={formatNumber}
            supplyCap={supplyCap}
            totalSupplied={totalSupply}
            supplyRateAPR={supply_rate}
            ltv={maxLtv}
            canBeCollateral={canBeCollateral}
            liquidationBonus={liquidation_bonus}
            liquidationThreshold={liquidation_threshold}
          />
        );
      case "Borrow Info":
        return (
          <BorrowInfo
            formatNumber={formatNumber}
            borrowCap={borrowCap}
            totalBorrowed={totalBorrow}
            borrowRateAPR={borrow_rate}
            reserveFactor={reserveFactor}
          />
        );
      default:
        return <SupplyInfo filteredItems={filteredItems} />;
    }
  };
  
 /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */
  return (
    <div className="w-full flex flex-col lg1:flex-row mt-7 md:-mt-7 lg:mt-10 my-6 gap-6 mb-[5rem]">
      <div className="w-full lg1:w-9/12  p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
        <h1 className="text-[#2A1F9D] font-bold my-2 dark:text-darkText">
          Reserve status & configuration
        </h1>
        <div className="w-full mt-8  lg:flex">
          <div className="mb-6 text-auto md:block xl:hidden">
            <div className="flex items-center justify-start gap-3 sxs3:justify-start sxs3:px-3 cursor-pointer text-[#2A1F9D] relative sxs3:w-[40%] dark:text-darkText">
              <span className="font-medium text-nowrap dark:text-darkText">
                {assetDetailFilter}
              </span>
              <span onClick={() => setIsFilter(!isFilter)}>
                {!isFilter ? (
                  <SlidersHorizontal size={16} className="text-[#695fd4]" />
                ) : (
                  <SlidersVertical size={16} className="text-[#695fd4]" />
                )}
              </span>
              {isFilter && (
                <div className="w-fit absolute top-full left-1/2 z-30 bg-[#0C5974] text-white rounded-xl overflow-hidden animate-fade-down">
                  {ASSET_DETAILS.map((item, index) => (
                    <button
                      type="button"
                      key={index}
                      className="w-full whitespace-nowrap text-left text-sm p-3 hover:bg-[#2b6980]"
                      onClick={() => handleFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-2/12 hidden xl:block">
            <div className="flex items-center justify-around gap-3 cursor-pointer text-[#2A1F9D] relative">
              <span className="font-medium text-[16px] dark:text-darkText">
                {assetDetailFilter}
              </span>
              <span onClick={() => setIsFilter(!isFilter)}>
                {!isFilter ? (
                  <SlidersHorizontal size={16} className="text-[#695fd4]" />
                ) : (
                  <SlidersVertical size={16} className="text-[#695fd4]" />
                )}
              </span>
              {isFilter && (
                <div className="w-fit absolute top-full left-1/2 z-30 bg-[#0C5974] text-white rounded-xl overflow-hidden animate-fade-down">
                  {ASSET_DETAILS.map((item, index) => (
                    <button
                      type="button"
                      key={index}
                      className="w-full whitespace-nowrap text-left text-sm p-3 hover:bg-[#2b6980]"
                      onClick={() => handleFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {renderFilterComponent()}
        </div>
      </div>
      {!isAuthenticated && (
        <div className="w-full lg:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
            <h1 className="font-semibold">Total Supplied</h1>
            <p className="text-gray-300 text-[12px] my-1">
              Please connect a wallet to view your personal information here.
            </p>
            <div className="w-full mt-4">
              <Button
                title={"Connect Wallet"}
                onClickHandler={handleWalletConnect}
                className={
                  "my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"
                }
              />
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="w-full lg1:w-3/12" key={dashboardRefreshTrigger}>
          <div className="w-full bg-[#233D63] p-4 rounded-[20px] text-white">
            <h1 className="font-semibold mb-5">Your Info</h1>
            <div className="flex">
              <div className="bg-[#59588D] flex items-center px-3 rounded-xl mr-3">
                {" "}
                <WalletMinimal />
              </div>
              <div>
                {" "}
                <p className="text-gray-300 text-[12px] my-1">Wallet Balance</p>
                <p className="text  font-semibold text-[#eeeef0] dark:text-darkText">
                  {id === "ckBTC" && (
                    <>
                      <p>
                        {formatValue(ckBTCBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckETH" && (
                    <>
                      <p>
                        {formatValue(ckETHBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckUSDC" && (
                    <>
                      <p>
                        {formatValue(ckUSDCBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ICP" && (
                    <>
                      <p>
                        {formatValue(ckICPBalance)} {id}
                      </p>
                    </>
                  )}
                  {id === "ckUSDT" && (
                    <>
                      <p>
                        {formatValue(ckUSDTBalance)} {id}
                      </p>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div>
              <div className="border mt-6 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className=" text-[12px] my-1 text-darkTextSecondary1">
                    Available to Supply
                  </p>
                </div>
                <div className="flex">
                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 ">
                    <div className="text-sm text-[#eeeef0] dark:text-darkText flex flex-col justify-center">
                      {(() => {
                        const assetData = {
                          ckBTC: {
                            balance: ckBTCBalance,
                            usdBalance: ckBTCUsdBalance,
                            rate: ckBTCUsdRate,
                          },
                          ckETH: {
                            balance: ckETHBalance,
                            usdBalance: ckETHUsdBalance,
                            rate: ckETHUsdRate,
                          },
                          ckUSDC: {
                            balance: ckUSDCBalance,
                            usdBalance: ckUSDCUsdBalance,
                            rate: ckUSDCUsdRate,
                          },
                          ICP: {
                            balance: ckICPBalance,
                            usdBalance: ckICPUsdBalance,
                            rate: ckICPUsdRate,
                          },
                          ckUSDT: {
                            balance: ckUSDTBalance,
                            usdBalance: ckUSDTUsdBalance,
                            rate: ckUSDTUsdRate,
                          },
                        }[id];

                        if (!assetData) return null;

                        const { balance, usdBalance, rate } = assetData;
                        const usdRate = rate / 1e8;
                        const calculatedUsdValue = balance * usdRate;

                        // Determine how to display the balance
                        let displayedBalance;
                        if (
                          !isFinite(calculatedUsdValue) ||
                          calculatedUsdValue === 0
                        ) {
                          displayedBalance = "0.00"; // Show "0.00" if USD value is exactly 0
                        } else if (calculatedUsdValue < 0.01) {
                          displayedBalance = `<${(
                            0.01 / usdRate
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 7,
                            maximumFractionDigits: 7,
                          })}`; // Show "<" sign for small asset values
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

                        return (
                          <>
                            <p>{displayedBalance}</p>
                            <p className="font-light">
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button
                      title={"Supply"}
                      onClickHandler={() => {
                        const reserveData = userData?.Ok?.reserves[0]?.find(
                          (reserveGroup) => reserveGroup[0] === id
                        );

                        const currentLiquidity =
                          userData?.Ok?.reserves[0]?.find(
                            (reserveGroup) => reserveGroup[0] === id // Check if the asset matches
                          )?.[1]?.liquidity_index;
                        const assetBalance =
                          assetBalances.find((balance) => balance.asset === id)
                            ?.dtokenBalance || 0;

                        const assetSupply =
                          (Number(assetBalance) *
                            Number(getAssetSupplyValue(id))) /
                          Number(currentLiquidity);

                        const DebtIndex = userData?.Ok?.reserves[0]?.find(
                          (reserveGroup) => reserveGroup[0] === id // Check if the asset matches
                        )?.[1]?.variable_borrow_index;

                        const assetBorrowBalance =
                          assetBalances.find((balance) => balance.asset === id)
                            ?.debtTokenBalance || 0;

                        const assetBorrow =
                          (Number(assetBorrowBalance) *
                            Number(getAssetBorrowValue(id))) /
                          Number(DebtIndex);

                        const currentCollateralStatus =
                          reserveData?.[1]?.is_collateral || true;

                        const totalCollateral =
                          parseFloat(
                            Number(userAccountData?.Ok?.[0]) / 100000000
                          ) || 0;
                        const totalDebt =
                          parseFloat(
                            Number(userAccountData?.Ok?.[1]) / 100000000
                          ) || 0;

                        const filteredData = filteredItems?.find((item) => {
                          return item[1]?.Ok;
                        });

                        const supplyRateAPR =
                          Number(filteredData[1]?.Ok.current_liquidity_rate) /
                            100000000 || 0;

                        const liquidationThreshold =
                          Number(userAccountData?.Ok?.[3]) / 100000000 || 0;
                        const reserveliquidationThreshold =
                          Number(
                            filteredData[1]?.Ok.configuration
                              .liquidation_threshold
                          ) / 100000000 || 0;

                        const ckBalance =
                          id === "ckBTC"
                            ? ckBTCBalance
                            : id === "ckETH"
                            ? ckETHBalance
                            : id === "ckUSDC"
                            ? ckUSDCBalance
                            : id === "ICP"
                            ? ckICPBalance
                            : id === "ckUSDT"
                            ? ckUSDTBalance
                            : null;
                        if (ckBalance === 0) {
                          toast.info(
                            "You cannot supply because your balance is 0."
                          );
                          return;
                        }
                        handleModalOpen(
                          "supply",
                          id,
                          (id === "ckBTC" && ckbtc) ||
                            (id === "ckETH" && cketh) ||
                            (id === "ckUSDC" && ckUSDC) ||
                            (id === "ICP" && icp) ||
                            (id === "ckUSDT" && ckUSDT),
                          supplyRateAPR,
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
                      className={
                        "my-2 text-white bg-gradient-to-r from-[#CBA534] to-[#639AB5] rounded-xl p-2 px-8 shadow-lg font-semibold text-sm'"
                      }
                    />
                  </div>
                </div>
              </div>

              {ckBalance === "0" && (
                <div className="bg-[#59588D] mt-5 rounded-lg px-2 py-1">
                  <p className=" text-[10px] my-1">
                    Your wallet is empty. Please add assets to your wallet
                    before supplying.
                  </p>
                </div>
              )}
            </div>
            <div>
              {console.log("borrowableValue", borrowableValue)}
              <div className="border mt-6 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <p className=" text-[12px] my-1 text-darkTextSecondary1">
                    Available to Borrow
                  </p>
                </div>
                <div className="flex">
                  <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-1 ">
                    <div className="text-sm text-[#eeeef0] dark:text-darkText flex flex-col justify-center">
                      {(() => {
                        let balance = 0;
                        let usdBalance = 0;
                        let usdRate = 0;

                        // Assign borrowable values based on asset ID
                        switch (id) {
                          case "ckBTC":
                            balance = borrowableValue;
                            usdBalance = borrowableAssetValue;
                            usdRate = ckBTCUsdRate / 1e8;
                            break;
                          case "ckETH":
                            balance = borrowableValue;
                            usdBalance = borrowableAssetValue;
                            usdRate = ckETHUsdRate / 1e8;
                            break;
                          case "ckUSDC":
                            balance = borrowableValue;
                            usdBalance = borrowableAssetValue;
                            usdRate = ckUSDCUsdRate / 1e8;
                            break;
                          case "ICP":
                            balance = borrowableValue;
                            usdBalance = borrowableAssetValue;
                            usdRate = ckICPUsdRate / 1e8;
                            break;
                          case "ckUSDT":
                            balance = borrowableValue;
                            usdBalance = borrowableAssetValue;
                            usdRate = ckUSDTUsdRate / 1e8;
                            break;
                          default:
                            balance = 0;
                            usdBalance = 0;
                            usdRate = 0;
                            break;
                        }

                        const calculatedUsdValue = balance * usdRate;

                        // Determine how to display the borrowable balance
                        let displayedBalance;
                        if (
                          !isFinite(calculatedUsdValue) ||
                          calculatedUsdValue === 0
                        ) {
                          displayedBalance = "0.00"; // Show "0.00" if USD value is exactly 0
                        } else if (calculatedUsdValue < 0.01) {
                          displayedBalance = `<${(
                            0.01 / usdRate
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 7,
                            maximumFractionDigits: 7,
                          })}`; // Show "<" sign for small asset values
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

                        return (
                          <>
                            <p>{displayedBalance}</p>
                            <p className="font-light">
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
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button
                      title={"Borrow"}
                      onClickHandler={async () => {
                        dispatch(toggleDashboardRefresh());
                        fetchAssetBorrow(id);
                        const currentCollateralStatus =
                          reserveData?.[1]?.is_collateral;

                        const currentLiquidity =
                          userData?.Ok?.reserves[0]?.find(
                            (reserveGroup) => reserveGroup[0] === id // Check if the asset matches
                          )?.[1]?.liquidity_index;
                        const assetBalance =
                          assetBalances.find((balance) => balance.asset === id)
                            ?.dtokenBalance || 0;

                        const assetSupply =
                          (Number(assetBalance) *
                            Number(getAssetSupplyValue(id))) /
                          (Number(currentLiquidity) * 1e8);

                        const DebtIndex = userData?.Ok?.reserves[0]?.find(
                          (reserveGroup) => reserveGroup[0] === id // Check if the asset matches
                        )?.[1]?.variable_borrow_index;

                        const assetBorrowBalance =
                          assetBalances.find((balance) => balance.asset === id)
                            ?.debtTokenBalance || 0;

                        const assetBorrow =
                          (Number(assetBorrowBalance) *
                            Number(getAssetBorrowValue(id))) /
                          (Number(DebtIndex) * 1e8);

                        const totalCollateral =
                          parseFloat(
                            Number(userAccountData?.Ok?.[0]) / 100000000
                          ) || 0;
                        const totalDebt =
                          parseFloat(
                            Number(userAccountData?.Ok?.[1]) / 100000000
                          ) || 0;
                        const LiquidationThreshold =
                          Number(userAccountData?.Ok?.[3]) / 100000000 || 0;
                        console.log(
                          "LiquidationThreshold",
                          LiquidationThreshold
                        );
                        const Ltv = Number(userData?.Ok?.ltv) / 100000000 || 0;
                        const total_supply =
                          Number(assetData?.Ok?.asset_supply || 0) / 100000000;
                        const total_borrow =
                          Number(assetData?.Ok?.asset_borrow || 0) / 100000000;
                        const remainingBorrowable =
                          Number(total_supply) - Number(total_borrow);

                        const { borrowableValue, borrowableAssetValue } =
                          calculateBorrowableValues(
                            assetData,
                            availableBorrow,
                            Number(total_supply) - Number(total_borrow)
                          );

                        // Check if borrowable value is zero and show toast notification
                        if (parseFloat(borrowableValue) <= 0) {
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
                          return; // Exit the function if borrowable value or ckBalance is 0
                        }
                        console.log(
                          "borrowableValue",
                          borrowableValue,
                          borrowableAssetValue
                        );
                        handleModalOpen(
                          "borrow",
                          id,
                          (id === "ckBTC" && ckbtc) ||
                            (id === "ckETH" && cketh) ||
                            (id === "ckUSDC" && ckUSDC) ||
                            (id === "ICP" && icp) ||
                            (id === "ckUSDT" && ckUSDT),
                          Number(assetData?.Ok.borrow_rate) / 100000000,
                          id === "ckBTC"
                            ? ckBTCBalance
                            : id === "ckETH"
                            ? ckETHBalance
                            : id === "ckUSDC"
                            ? ckUSDCBalance
                            : id === "ICP"
                            ? ckICPBalance
                            : id === "ckUSDT"
                            ? ckUSDTBalance
                            : null,
                          LiquidationThreshold,
                          Number(
                            assetData?.Ok?.configuration.liquidation_threshold
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
                      disabled={parseFloat(borrowableValue) <= 0}
                      className="my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-2 px-8 shadow-lg font-semibold text-sm'"
                    />
                  </div>
                </div>
              </div>

              {/* {borrowableValue <= "0" && (
                <div className="bg-[#59588D] mt-5 rounded-lg px-2 py-1">
                  <p className=" text-[10px] my-1">
                    Your wallet is empty. Please add assets to your wallet
                    before supplying.
                  </p>
                </div>
              )} */}
            </div>
          </div>
        </div>
      )}

      {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
      {renderModalOpen(isModalOpen.type)}
    </div>
  );
};

export default AssetDetails;
