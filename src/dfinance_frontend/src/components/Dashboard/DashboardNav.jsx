import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import RiskPopup from "./DashboardPopup/RiskDetails";
import { Infinity, X } from "lucide-react";
import { useAuths } from "../../utils/useAuthClient";
import { ChevronLeft } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import { Principal } from "@dfinity/principal";
import useAssetData from "../CustomHooks/useAssets";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import useFormatNumber from "../CustomHooks/useFormatNumber";
import useFetchConversionRate from "../CustomHooks/useFetchConversionRate";
import useUserData from "../CustomHooks/useUserData";
import { Info } from "lucide-react";
import { useReserveData } from "../../context/ReserveDataContext";
import { SCALING_FACTOR } from "../../utils/constants";

/**
 * DashboardNav Component
 *
 * This component serves as the navigation header, displaying key financial metrics.
 *
 * Features:
 * - Displays market statistics (total market size, available liquidity, total borrows)
 * - Shows metrics like (net worth, net APY, health factor)
 * - Provides risk assessment information with Risk Details popup
 *
 * @returns {JSX.Element} - Returns the DashboardNav component with relevant financial metrics and navigation options.
 */
const DashboardNav = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const {
    assets,
    AssetImages,
    totalSupplySize,
    totalBorrowSize,
    asset_supply,
    asset_borrow,
    fetchAssetBorrow,
    fetchAssetSupply,
    reserveData,
  } = useAssetData();

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
  } = useFetchConversionRate();

  const { userData, userAccountData, healthFactorBackend } = useUserData();
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const totalUsdValueBorrow = useSelector(
    (state) => state.borrowSupply.totalUsdValueBorrow
  );
  const totalUsdValueSupply = useSelector(
    (state) => state.borrowSupply.totalUsdValueSupply
  );
  const tooltipRef = useRef(null);
  const { isAuthenticated, principal, createLedgerActor } = useAuths();

  const theme = useSelector((state) => state.theme.theme);
  const menuRef = useRef(null);
  const { pathname } = useLocation();
  const formatNumber = useFormatNumber();
  const { batchFetchReserveData } = useReserveData();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [assetBalances, setAssetBalances] = useState([]);
  const [assetSupply, setAssetSupply] = useState(0);
  const [assetBorrow, setAssetBorrow] = useState(0);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [healthFactor, setHealthFactor] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [netApy, setNetApy] = useState("-");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */
  const principalObj = useMemo(
    () => (principal ? Principal.fromText(principal) : null),
    [principal]
  );

  // Function to format Net APY - memoized to prevent unnecessary re-renders
  const formatNetApy = useCallback((apy) => {
    const num = parseFloat(apy);
    if (isNaN(num) || num === 0) return "-";
    if (num < 0.01) return "<0.01%";
    return `${num.toFixed(2)}%`;
  }, []);

  // Memoize wallet detail tab to prevent unnecessary re-renders
  const walletDetailTab = useMemo(
    () => [
      {
        id: 0,
        title: "Net Worth",
        count:
          netWorth === 0 || netWorth === "-" ? (
            "-"
          ) : netWorth ? (
            <>
              <span style={{ fontWeight: "lighter" }}>$</span>
              {formatNumber(netWorth)}
            </>
          ) : (
            "-"
          ),
      },
      {
        id: 1,
        title: "Net APY",
        count:
          netApy !== null && netApy !== undefined
            ? netApy === "<0.01%"
              ? "<0.01%"
              : !isNaN(parseFloat(netApy))
              ? `${formatNetApy(netApy)}`
              : "-"
            : "-",
      },
      {
        id: 2,
        title: "Health Factor",
        count: healthFactor ? healthFactor : "-",
      },
    ],
    [netWorth, netApy, healthFactor, formatNumber, formatNetApy]
  );

  const walletDetailTabs = useMemo(
    () => [
      {
        id: 0,
        title: "Total Market Size",
        count: totalSupplySize ? (
          <>
            <span className="font-light">$</span>
            {totalSupplySize}
          </>
        ) : (
          0
        ),
      },
      {
        id: 1,
        title: "Total Available",
        count: (() => {
          const convertToNumber = (value) => {
            if (typeof value === "string") {
              const numberValue = parseFloat(value.replace(/[^0-9.]/g, ""));
              if (value.includes("K")) return numberValue * 1e3;
              if (value.includes("M")) return numberValue * 1e6;
              return numberValue;
            }
            return 0;
          };

          const supply = convertToNumber(totalSupplySize);
          const borrow = convertToNumber(totalBorrowSize);
          const result = !isNaN(supply) && !isNaN(borrow) ? supply - borrow : 0;
          const formattedResult = formatNumber(
            result === "0.00" ? "0" : result
          );
          return (
            <>
              <span className="font-light">$</span>
              {formattedResult}
            </>
          );
        })(),
      },
      {
        id: 2,
        title: "Total Borrows",
        count: totalBorrowSize ? (
          <>
            <span className="font-light">$</span>
            {totalBorrowSize}
          </>
        ) : (
          0
        ),
      },
    ],
    [totalSupplySize, totalBorrowSize, formatNumber]
  );

  /* ===================================================================================
   *                    Derived State, UI Variables, and Route-Based Flags
   * =================================================================================== */
  const shouldRenderRiskDetailsButton =
    !pathname.includes("/market") &&
    !pathname.includes("/governance") &&
    !pathname.includes("/dashboard/transaction-history") &&
    !pathname.startsWith("/dashboard/asset-details/");

  const isAssetDetailsPage =
    location.pathname.startsWith("/dashboard/asset-details/") ||
    location.pathname.startsWith("/market/asset-details/");

  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
  const isDashboardRoute = location.pathname === "/dashboard";
  const dashboardTitle = pathname.includes("/market") ? "Market" : "Dashboard";
  const isMarketRoute = location.pathname === "/market";

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  // Function to fetch asset data - memoized to prevent unnecessary re-renders
  const fetchAssetData = useCallback(async () => {
    if (!assets || assets.length === 0 || !principalObj) return;

    try {
      const batchedReserveData = await batchFetchReserveData(assets);
      const balances = [];

      for (const asset of assets) {
        const reserveDataForAsset = batchedReserveData[asset];
        const dtokenId = reserveDataForAsset?.Ok[0]?.d_token_canister?.[0];
        const debtTokenId =
          reserveDataForAsset?.Ok[0]?.debt_token_canister?.[0];
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
              console.error(
                `Error fetching dtoken balance for ${asset}:`,
                error
              );
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
    } catch (error) {
      console.error("Error fetching asset data:", error);
    }
  }, [assets, principalObj, batchFetchReserveData, createLedgerActor]);

  // Function to get asset supply value
  const getAssetSupplyValue = useCallback(
    (asset) => {
      if (asset_supply[asset] !== undefined) {
        const supplyValue = Number(asset_supply[asset][0]);
        return supplyValue;
      }
      console.warn(`No supply value found for ${asset}`);
      return 0;
    },
    [asset_supply]
  );

  // Function to get asset borrow value
  const getAssetBorrowValue = useCallback(
    (asset) => {
      if (asset_supply[asset] !== undefined) {
        const borrowValue = Number(asset_borrow[asset][0]);
        return borrowValue;
      }
      console.warn(`No supply value found for ${asset}`);
      return 0;
    },
    [asset_supply]
  );

  // Function to get conversion rate for assets
  const getConversionRate = useCallback(
    (asset) => {
      switch (asset) {
        case "ckBTC":
          return ckBTCUsdRate;
        case "ckETH":
          return ckETHUsdRate;
        case "ckUSDC":
          return ckUSDCUsdRate;
        case "ICP":
          return ckICPUsdRate;
        case "ckUSDT":
          return ckUSDTUsdRate;
        default:
          return null;
      }
    },
    [ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate]
  );

  const toggleTooltip = useCallback(() => {
    setIsTooltipVisible((prev) => !prev);
  }, []);

  // Function to calculate net supply APY - optimized with proper dependencies
  const calculateNetSupplyApy = useCallback(
    (reserves, reserveData) => {
      if (
        !reserves ||
        !reserveData ||
        !assetBalances ||
        assetBalances.length === 0
      ) {
        console.warn("Missing reserves, reserveData, or assetBalances");
        return NaN;
      }

      let totalSuppliedInUSD = 0;
      let weightedApySum = 0;
      let totalBorrowedInUSD = 0;
      let weightedDebtApySum = 0;
      let numerator = 0;
      let denominator = 0;

      reserves?.forEach((reserve) => {
        const assetKey = reserve[0];

        if (
          !reserveData ||
          !reserveData[assetKey] ||
          !reserveData[assetKey].Ok[0]
        )
          return;

        const conversionRate = getConversionRate(assetKey) || 0;

        const supplyApy =
          (Number(reserveData[assetKey].Ok[0].current_liquidity_rate) || 0) /
          SCALING_FACTOR;
        const debtApy =
          (Number(reserveData[assetKey].Ok[0].borrow_rate) || 0) /
          SCALING_FACTOR;

        const currentLiquidity =
          userData?.Ok?.[0].reserves[0]?.find(
            (reserveGroup) => reserveGroup[0] === assetKey
          )?.[1]?.liquidity_index || 1;

        const assetBalance =
          assetBalances?.find((balance) => balance.asset === assetKey)
            ?.dtokenBalance || 0;

        const safeAssetBalance =
          typeof assetBalance === "bigint"
            ? Number(assetBalance)
            : assetBalance;

        const safeCurrentLiquidity =
          typeof currentLiquidity === "bigint"
            ? Number(currentLiquidity)
            : currentLiquidity;

        const supplyValue = getAssetSupplyValue(assetKey);
        const safeSupplyValue =
          typeof supplyValue === "bigint" ? Number(supplyValue) : supplyValue;

        const calculated_supply = Math.trunc(
          (safeAssetBalance / safeCurrentLiquidity) * SCALING_FACTOR
        );

        const assetSupply = Math.trunc(
          (calculated_supply * safeSupplyValue) / SCALING_FACTOR
        );

        const assetSupplyInUSD = assetSupply * conversionRate;

        const DebtIndex =
          userData?.Ok?.[0].reserves[0]?.find(
            (reserveGroup) => reserveGroup[0] === assetKey
          )?.[1]?.variable_borrow_index || 1;

        const assetBorrowBalance =
          assetBalances.find((balance) => balance.asset === assetKey)
            ?.debtTokenBalance || 0;

        const safeBorrowBalance = Number(assetBorrowBalance);
        const assetBorrowValue = Number(getAssetBorrowValue(assetKey) || 0);

        const assetBorrowed =
          (safeBorrowBalance * assetBorrowValue) / Number(DebtIndex) || 0;

        const assetBorrowedInUSD = assetBorrowed * conversionRate;

        totalBorrowedInUSD += assetBorrowedInUSD;
        weightedDebtApySum += assetBorrowedInUSD * debtApy;

        totalSuppliedInUSD += assetSupplyInUSD;
        weightedApySum += assetSupplyInUSD * supplyApy;

        numerator += weightedApySum - weightedDebtApySum;
        denominator += totalSuppliedInUSD;
      });

      if (denominator === 0) {
        console.warn("Total supplied in USD is 0, cannot calculate APY");
        return NaN;
      }

      const netApy = numerator / denominator;

      return netApy < 0.0001 ? 0.0001 : netApy;
    },
    [
      reserveData,
      assetBalances,
      userData,
      getAssetSupplyValue,
      getAssetBorrowValue,
      getConversionRate,
    ]
  );

  const truncateToDecimals = useCallback((num, decimals) => {
    const factor = Math.pow(10, decimals);
    return (Math.floor(num * factor) / factor).toFixed(decimals);
  }, []);

  const handleOpenPopup = useCallback(() => {
    setIsPopupOpen(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => {
      if (!prev) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
      return !prev;
    });
  }, [handleClickOutside]);

  const currentAsset = useMemo(() => {
    if (isAssetDetailsPage) {
      const pathParts = location.pathname.split("/");
      return pathParts[pathParts.length - 1];
    }
    return null;
  }, [isAssetDetailsPage, location.pathname]);

  const assetImageIndex = useMemo(() => {
    if (!currentAsset || !assets || assets.length === 0) return -1;
    return assets.indexOf(currentAsset);
  }, [currentAsset, assets]);

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  // Effect for calculating net worth
  useEffect(() => {
    if (
      typeof totalUsdValueSupply === "number" &&
      typeof totalUsdValueBorrow === "number" &&
      principal
    ) {
      const calculatedNetWorth = totalUsdValueSupply - totalUsdValueBorrow;
      setNetWorth(calculatedNetWorth === 0 ? "-" : calculatedNetWorth);
    }
  }, [totalUsdValueSupply, totalUsdValueBorrow, principal]);

  // Effect for calculating health factor
  useEffect(() => {
    if (healthFactorBackend !== undefined && principal) {
      const truncatedValue = truncateToDecimals(Number(healthFactorBackend), 2);
      const calculatedHealthFactor =
        Number(healthFactorBackend) > 100 ? (
          <Infinity className="dark:text-darkText text-[#2A1F9D]" />
        ) : (
          parseFloat(Number(truncatedValue))
        );

      setHealthFactor(calculatedHealthFactor);
      sessionStorage.setItem(
        `healthFactor_${principal}`,
        JSON.stringify(calculatedHealthFactor)
      );
    }
  }, [healthFactorBackend, principal, truncateToDecimals]);

  // Effect for fetching asset data
  useEffect(() => {
    if (assets?.length > 0 && principalObj) {
      fetchAssetData();
    }
  }, [assets, principalObj, dashboardRefreshTrigger, fetchAssetData]);

  // Effect for fetching asset supply and borrow
  useEffect(() => {
    const fetchData = async () => {
      if (!assets || assets.length === 0) return;

      const promises = [];
      for (const asset of assets) {
        promises.push(fetchAssetSupply(asset));
        promises.push(fetchAssetBorrow(asset));
      }
      await Promise.all(promises);
    };

    fetchData();
  }, [assets, dashboardRefreshTrigger, fetchAssetSupply, fetchAssetBorrow]);

  // Effect for handling tooltip clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsTooltipVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effect for fetching conversion rates
  useEffect(() => {
    fetchConversionRate();
  }, [fetchConversionRate, dashboardRefreshTrigger]);

  // Effect for calculating Net APY
  useEffect(() => {
    if (
      userData?.Ok?.[0]?.reserves?.[0] &&
      reserveData &&
      assetBalances.length > 0
    ) {
      const reservesData = userData.Ok[0].reserves[0];
      const calculatedNetApy = calculateNetSupplyApy(reservesData, reserveData);
      if (!calculatedNetApy || isNaN(calculatedNetApy)) {
        setNetApy("-");
        return;
      }

      const formattedApy = calculatedNetApy * 100;
      let displayValue;

      if (formattedApy <= 0.01) {
        displayValue = "<0.01%";
      } else {
        displayValue = formattedApy.toFixed(2) + "%";
      }

      setNetApy(displayValue);

      // Calculate asset supply and borrows in the same effect to avoid race conditions
      let totalSupply = 0;
      let totalBorrow = 0;

      reservesData.forEach((reserveGroup) => {
        const asset = reserveGroup[0];
        const currentLiquidity =
          userData?.Ok?.[0].reserves[0]?.find(
            (reserveGroup) => reserveGroup[0] === asset
          )?.[1]?.liquidity_index || 1;

        const assetBalance =
          assetBalances?.find((balance) => balance.asset === asset)
            ?.dtokenBalance || 0;

        const supplyValue = getAssetSupplyValue(asset);
        const supply =
          (Number(assetBalance) * Number(supplyValue)) /
            Number(currentLiquidity) || 0;

        if (supply) {
          totalSupply += supply;
        }

        const DebtIndex =
          userData?.Ok?.[0].reserves[0]?.find(
            (reserveGroup) => reserveGroup[0] === asset
          )?.[1]?.variable_borrow_index || 1;

        const assetBorrowBalance =
          assetBalances.find((balance) => balance.asset === asset)
            ?.debtTokenBalance || 0;

        const borrowValue = getAssetBorrowValue(asset);
        const borrow =
          (Number(assetBorrowBalance) * Number(borrowValue)) /
            Number(DebtIndex) || 0;

        if (borrow > 0) {
          totalBorrow += borrow;
        }
      });

      setAssetSupply(totalSupply > 0 ? totalSupply : 0);
      setAssetBorrow(totalBorrow > 0 ? totalBorrow : 0);
    }
  }, [
    userData,
    reserveData,
    assetBalances,
    dashboardRefreshTrigger,
    calculateNetSupplyApy,
    getAssetSupplyValue,
    getAssetBorrowValue,
  ]);

  // Effect for managing body overflow when menu is open
  useEffect(() => {
    const handleBodyOverflow = () => {
      document.body.style.overflow = isMenuOpen ? "hidden" : "";
    };

    handleBodyOverflow();

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, handleClickOutside]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */
  return (
    <div className="w-full ">
      {["/dashboard", "/market", "/governance"].includes(pathname) && (
        <h1 className="text-[#2A1F9D] font-bold font-poppins text-[19px] md:text-2xl lg:text-2xl dark:text-darkText my-4">
          {dashboardTitle}
        </h1>
      )}

      <div className="flex gap-5 -ml-3">
        {!["/dashboard", "/market", "/governance"].includes(pathname) && (
          <div className="flex items-center justify-between w-full mt-3">
            <div
              className="text-[#2A1F9D] font-bold font-poppins text-[19px] md:text-2xl lg:text-2xl dark:text-darkText flex items-center cursor-pointer mr-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={40} color={chevronColor} />
            </div>

            {isAssetDetailsPage && currentAsset && (
              <div className="flex items-center flex-grow">
                {assetImageIndex !== -1 &&
                  AssetImages &&
                  AssetImages[assetImageIndex] && (
                    <img
                      src={AssetImages[assetImageIndex]}
                      alt={`${currentAsset} logo`}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  )}
                <span className="text-[#2A1F9D] font-semibold dark:text-darkText text-[19px]">
                  {currentAsset}
                </span>
              </div>
            )}

            {/* Empty div to balance the layout */}
            <div className="w-10"></div>
          </div>
        )}

        <div
          className={`md:hidden flex ml-auto ${
            isAssetDetailsPage ? "mt-1" : "-mt-[3.95rem]"
          }`}
        >
          {(isMarketRoute || (isDashboardRoute && isAuthenticated)) && (
            <button onClick={toggleMenu} className="rounded-md button1 z-10">
              <EllipsisVertical color={checkColor} size={30} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex flex-wrap justify-start items-center gap-2 sxs3:mb-2 md:mb-9 lg:mb-2">
        <div id="dashboard-nav-details" className="flex market-nav-details">
          <div className="relative">
            <div
              className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${
                isMenuOpen ? "block" : "hidden"
              } md:hidden`}
            >
              <div className="flex justify-center items-center min-h-screen">
                <div
                  className="relative text-[#2A1F9D] mt-5 font-bold border shadow-sm border-gray-400 dark:border-none dark:bg-darkOverlayBackground mx-2 my-1 bg-white px-3 py-7 rounded-lg w-11/12 max-w-md dark:text-darkText"
                  ref={menuRef}
                >
                  <div
                    className="absolute top-2 right-2  text-gray-500 hover:text-gray-700 w-6 h-6"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="text-black dark:text-darkText w-6 h-6" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {(isDashboardRoute
                      ? isAuthenticated
                        ? walletDetailTab
                        : []
                      : walletDetailTabs
                    ).map((data, index) => {
                      if (data.title === "Health Factor" && assetBorrow === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={index}
                          className="relative group text-[#2A1F9D] p-3 font-light dark:text-darkTextSecondary rounded-lg shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out"
                          style={{ minWidth: "220px", flex: "1 0 220px" }}
                        >
                          <button className="relative font-light text-[13px] text-left min-w-[80px] button1">
                            <div className="flex items-center">
                              {data.title}

                              {data.title === "Net APY" && (
                                <span className="relative inline-block ml-1">
                                  <Info
                                    size={15}
                                    className="ml-1 align-middle"
                                    onClick={toggleTooltip}
                                  />

                                  {isTooltipVisible && (
                                    <div
                                      ref={tooltipRef}
                                      className="absolute bottom-full left-[30vw] transform -translate-x-[40%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 w-[60vw] mt-1 "
                                    >
                                      <span className="text-gray-700 dark:text-darkText">
                                        Net APY represents the overall
                                        annualized yield, calculated as the
                                        difference between your supply APY and
                                        debt APY.
                                        <br />A positive Net APY indicates a net
                                        gain, while a negative value suggests
                                        more is borrowed than supplied.
                                      </span>
                                    </div>
                                  )}
                                </span>
                              )}
                            </div>

                            <hr className="ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />
                            <span
                              className={`font-bold text-[20px] ${
                                data.title === "Health Factor"
                                  ? data.count === 0
                                    ? "text-red-500"
                                    : data.count > 3
                                    ? "text-green-500"
                                    : data.count <= 1
                                    ? "text-red-500"
                                    : data.count <= 1.5
                                    ? "text-orange-600"
                                    : data.count <= 2
                                    ? "text-orange-400"
                                    : "text-orange-300"
                                  : data.title === "Total Borrows"
                                  ? "text-[#2A1F9D] dark:text-darkBlue"
                                  : "text-[#2A1F9D] dark:text-darkBlue"
                              }`}
                            >
                              {data.count !== null ? data.count : "\u00A0"}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {assetBorrow !== 0 && isAuthenticated && (
                    <div className="flex justify-end mt-10 md:mt-0">
                      <button
                        className="w-full py-1 px-3 bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100% text-white text-xl rounded-md dark:bg-[#BA5858] dark:text-darkText"
                        onClick={handleOpenPopup}
                        style={{
                          minWidth: "220px",
                          transition: " 400ms ease !important",
                        }}
                      >
                        Risk Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-wrap text-[#4659CF] font-semibold gap-8 dark:text-darkText lg:mb-0 mb-8 mt-8">
            {(isDashboardRoute
              ? isAuthenticated
                ? walletDetailTab
                : []
              : walletDetailTabs
            )
              .filter(
                (data) => !(data.title === "Health Factor" && assetBorrow === 0)
              )
              .map((data, index) => (
                <div key={index} className="relative group">
                  <button className="relative font-light text-[13px] text-left min-w-[80px] button1">
                    <div className="flex items-center">
                      {data.title}
                      {data.title === "Net APY" && (
                        <span
                          className="relative inline-block ml-1"
                          onMouseEnter={() => setIsTooltipVisible(true)}
                          onMouseLeave={() => setIsTooltipVisible(false)}
                        >
                          <Info
                            size={15}
                            className="ml-1 align-middle cursor-pointer"
                            onClick={toggleTooltip}
                          />

                          {isTooltipVisible && (
                            <div
                              ref={tooltipRef}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 w-[390px]"
                            >
                              <span className="text-gray-700 dark:text-darkText">
                                Net APY represents the overall annualized yield,
                                calculated as the difference between your supply
                                APY and debt APY.
                                <br />A positive Net APY indicates a net gain,
                                while a negative value suggests more is borrowed
                                than supplied.
                              </span>
                            </div>
                          )}
                        </span>
                      )}
                    </div>

                    <hr className="ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />

                    <span
                      className={`font-bold text-[20px] ${
                        data.title === "Health Factor"
                          ? data.count === 0 && assetSupply === 0
                            ? "text-[#2A1F9D] dark:text-darkBlue"
                            : data.count > 3
                            ? "text-green-500"
                            : data.count <= 1
                            ? "text-red-500"
                            : data.count <= 1.5
                            ? "text-orange-600"
                            : data.count <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                          : "text-[#2A1F9D] dark:text-darkBlue"
                      }`}
                    >
                      {data.count !== null ? data.count : "\u00A0"}
                    </span>
                  </button>
                </div>
              ))}

            {isAuthenticated &&
              shouldRenderRiskDetailsButton &&
              assetBorrow !== 0 && (
                <button
                  id="risk-details"
                  className="-mt-2 py-1 px-2 border dark:border-white border-blue-500 text-[#2A1F9D] text-[11px] rounded-md dark:text-darkTextSecondary button1"
                  onClick={handleOpenPopup}
                >
                  Risk Details
                </button>
              )}
          </div>

          {isPopupOpen && (
            <RiskPopup
              onClose={handleClosePopup}
              userData={userData}
              userAccountData={userAccountData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardNav;
