import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TAB_CARD_DATA } from "../../utils/constants";
import { useSelector } from "react-redux";
import RiskPopup from "./DashboardPopup/RiskDetails";
import { X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import { ChevronLeft } from "lucide-react";
import { EllipsisVertical } from "lucide-react";
import { Principal } from "@dfinity/principal";
import useAssetData from "../customHooks/useAssets";
import { idlFactory } from "../../../../declarations/dtoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/debttoken";
import { useCallback } from "react";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import { useParams } from "react-router-dom";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { Info } from "lucide-react";

const DashboardNav = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { assets, totalMarketSize, totalSupplySize, totalBorrowSize, asset_supply, asset_borrow, fetchAssetBorrow, fetchAssetSupply, reserveData } = useAssetData();
  const { ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate, fetchConversionRate} = useFetchConversionRate();
  const { userData, userAccountData } = useUserData();
  const dashboardRefreshTrigger = useSelector((state) => state.dashboardUpdate.refreshDashboardTrigger);
  const totalUsdValueBorrow = useSelector((state) => state.borrowSupply.totalUsdValueBorrow);
  const totalUsdValueSupply = useSelector((state) => state.borrowSupply.totalUsdValueSupply);
  const tooltipRef = useRef(null);
  const { isAuthenticated, principal, fetchReserveData, createLedgerActor} = useAuth();
  const { id } = useParams();
  const dropdownRef = useRef(null);
  const theme = useSelector((state) => state.theme.theme);
  const menuRef = useRef(null);
  const { state, pathname } = useLocation();
  const formatNumber = useFormatNumber();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [assetBalances, setAssetBalances] = useState([]);
  const [netWorth, setNetWorth] = useState();
  const [netApy, setNetApy] = useState(0);
  const [assetSupply, setAssetSupply] = useState(0);
  const [assetBorrow, setAssetBorrow] = useState(0);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const [walletDetailTab, setWalletDetailTab] = useState([
    {
      id: 0,
      title: "Net Worth",
      count: "-",
    },
    {
      id: 1,
      title: "Net APY",
      count: "-",
    },
    {
      id: 2,
      title: "Health Factor",
      count: "-",
    },
  ]);

  const [walletDetailTabs, setWalletDetailTabs] = useState([
    { id: 0, title: "Total Market Size", count: 0 },
    { id: 1, title: "Total Available", count: 0 },
    { id: 2, title: "Total Borrows", count: 0 },
  ]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const navigate = useNavigate();
  const [isDrop, setIsDrop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentValueIndex, setCurrentValueIndex] = useState(state?.id || 0);
  const [currentValueData, setCurrentValueData] = useState(state || TAB_CARD_DATA[0] );

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );


   /* ===================================================================================
   *                    Derived State, UI Variables, and Route-Based Flags
   * =================================================================================== */
   const shouldRenderRiskDetailsButton = !pathname.includes("/market") && !pathname.includes("/governance")
    && !pathname.includes("/dashboard/transaction-history") && !pathname.startsWith("/dashboard/asset-details/");

   const assetImages = { ckBTC: ckBTC, ckETH: ckETH, ckUSDC: ckUSDC, ICP: icp, ckUSDT: ckUSDT };
   const isAssetDetailsPage = location.pathname.startsWith("/dashboard/asset-details/") || location.pathname.startsWith("/market/asset-details/");
   const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";
   const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
   const assetImage = assetImages[id] || null;
   const isDashboardRoute = location.pathname === "/dashboard";
   const dashboardTitle = pathname.includes("/market") ? "Market" : "Dashboard";
   const isMarketRoute = location.pathname === "/market";
   const calculatedNetWorth = totalUsdValueSupply - totalUsdValueBorrow;

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const fetchAssetData = async () => {
    const balances = [];
    for (const asset of assets) {
      const reserveDataForAsset = await fetchReserveData(asset);
      const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
      const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];
      const assetBalance = { asset, dtokenBalance: null, debtTokenBalance: null };
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

  const getAssetSupplyValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]);
      return supplyValue;
    }
    return `noSupply`;
  };

  const getAssetBorrowValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]);
      return borrowValue;
    }
    return `noBorrow`;
  };

  const updateNetWorthAndHealthFactor = (data) => {
    if (!data || !data.Ok) return;
    const { net_worth, health_factor } = data.Ok;
    const updatedTab = walletDetailTab.map((item) => {
      if (item.id === 0) {
        return {
          ...item,
          count:
            calculatedNetWorth && calculatedNetWorth < 0.01 ? (
              "0"
            ) : calculatedNetWorth ? (
              <>
                <span style={{ fontWeight: "lighter" }}>$</span>
                {formatNumber(calculatedNetWorth)}
              </>
            ) : (
              "-"
            ),
        };
      } else if (item.id === 2) {
        const healthValue = !userAccountData?.Ok?.[4]
          ? "-"
          : Number(userAccountData?.Ok?.[4]) / 10000000000 > 100
          ? "♾️"
          : parseFloat(
              (Number(userAccountData?.Ok?.[4]) / 10000000000).toFixed(2)
            );
        return {
          ...item,
          count: healthValue,
        };
      }
      return item;
    });

    setWalletDetailTab(updatedTab);
  };

  const updateNetApy = () => {
    const updatedTab = walletDetailTab.map((item) => {
      if (item.id === 1) {
        return {
          ...item,
          count:
            netApy !== 0
              ? netApy < 0.01
                ? "<0.01%"
                : `${netApy.toFixed(4)}%`
              : "-",
        };
      }

      return item;
    });

    setWalletDetailTab(updatedTab);
  };

  const getConversionRate = (asset) => {
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
  };

  const toggleTooltip = () => {
    setIsTooltipVisible((prev) => !prev);
  };

  const calculateNetSupplyApy = useCallback(
    (reserves, reserveData) => {
      let totalSuppliedInUSD = 0;
      let weightedApySum = 0;
      let totalBorrowedInUSD = 0;
      let weightedDebtApySum = 0;
      let numerator = 0;
      let denominator = 0;

      reserves.forEach((reserve) => {
        const assetKey = reserve[0];
        if (!reserveData || !reserveData[assetKey] || !reserveData[assetKey].Ok)
          return;
        const conversionRate = getConversionRate(assetKey);
        const supplyApy = Number(reserveData[assetKey].Ok.current_liquidity_rate || 0n) / 100000000;
        const debtApy = Number(reserveData[assetKey].Ok.borrow_rate || 0n) / 100000000;
        const currentLiquidity = userData?.Ok?.reserves[0]?.find( (reserveGroup) => reserveGroup[0] === assetKey)?.[1]?.liquidity_index;
        const assetBalance = assetBalances?.find((balance) => balance.asset === assetKey) ?.dtokenBalance || 0;
        const assetSupply = (Number(assetBalance) * Number(getAssetSupplyValue(assetKey))) / Number(currentLiquidity) || 0;
        const DebtIndex = userData?.Ok?.reserves[0]?.find((reserveGroup) => reserveGroup[0] === assetKey )?.[1]?.variable_borrow_index;
        const assetBorrowBalance = assetBalances.find((balance) => balance.asset === assetKey) ?.debtTokenBalance || 0;
        const assetBorrowed = (Number(assetBorrowBalance) * Number(getAssetBorrowValue(assetKey))) /Number(DebtIndex) || 0;
        const assetBorrowedInUSD = assetBorrowed * conversionRate;
        totalBorrowedInUSD += assetBorrowedInUSD;
        weightedDebtApySum += assetBorrowedInUSD * debtApy;
        const assetSupplyInUSD = assetSupply * conversionRate;
        totalSuppliedInUSD += assetSupplyInUSD;
        weightedApySum += assetSupplyInUSD * supplyApy;
        numerator += weightedApySum - weightedDebtApySum;
        denominator += totalSuppliedInUSD;
      });

      return denominator > 0 ? numerator / denominator : 0;
    },
    [reserveData, assetBalances]
  );

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDrop(false);
    }
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  /*FUNCTION MIGHT BE USED LATER */
  // const toggleDropdown = () => {
  //   if (!isDrop) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   } else {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   }
  //   setIsDrop(!isDrop);
  // };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */
  useEffect(() => {
    const calculatedNetWorth = totalUsdValueSupply - totalUsdValueBorrow;
    setNetWorth(calculatedNetWorth);
  }, [totalUsdValueBorrow, totalUsdValueSupply, dashboardRefreshTrigger]);



  useEffect(() => {
    fetchAssetData();
  }, [assets, principalObj, dashboardRefreshTrigger]);



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


  useEffect(() => {
    if (userData && reserveData) {
      updateNetWorthAndHealthFactor(userData);
    }
  }, [ userData, reserveData, totalUsdValueSupply, totalUsdValueBorrow, userAccountData, dashboardRefreshTrigger, ]);


  useEffect(() => {
    if (netApy !== undefined) {
      updateNetApy();
    }
  }, [netApy, dashboardRefreshTrigger]);

  
  useEffect(() => {
    fetchConversionRate();
  }, [fetchConversionRate, dashboardRefreshTrigger]);


  useEffect(() => {
    if (userData && userData.Ok && userData.Ok.reserves[0] && reserveData) {
      const updateState = async () => {
        const reservesData = userData.Ok.reserves[0];
        const calculatedNetApy = calculateNetSupplyApy( reservesData, reserveData);
        setNetApy(calculatedNetApy);
        let totalBorrow = 0;

        reservesData.forEach((reserveGroup) => {
          const asset = reserveGroup[0];
          const reserve = reserveGroup[1];
          const currentLiquidity = userData?.Ok?.reserves[0]?.find((reserveGroup) => reserveGroup[0] === asset)?.[1]?.liquidity_index;
          const assetBalance = assetBalances?.find((balance) => balance.asset === asset)?.dtokenBalance || 0;
          const supply =(Number(assetBalance) * Number(getAssetSupplyValue(asset))) / Number(currentLiquidity) || 0;

          if (supply) {
            setAssetSupply(supply);
          }

          const DebtIndex = userData?.Ok?.reserves[0]?.find( (reserveGroup) => reserveGroup[0] === asset)?.[1]?.variable_borrow_index;
          const assetBorrowBalance = assetBalances.find((balance) => balance.asset === asset)?.debtTokenBalance || 0;
          const borrow = (Number(assetBorrowBalance) * Number(getAssetBorrowValue(asset))) / Number(DebtIndex) || 0;
          
          if (borrow > 0) {
            totalBorrow += borrow;
          }

        });

        if (totalBorrow > 0) {
          setAssetBorrow(totalBorrow);
        } else {
          setAssetBorrow(0);
        }
      };

      updateState();
    }
  }, [ userData, reserveData, calculateNetSupplyApy, assetBalances, dashboardRefreshTrigger, ]);


  useEffect(() => {
    if (userData && userData.Ok && userData.Ok.total_debt) {
      const borrow = Number(userData.Ok.total_debt) / 100000000;
      // setAssetBorrow(borrow);
    }
  }, [userData, dashboardRefreshTrigger]);


  useEffect(() => {
    const updateWalletDetailTabs = () => {
      const updatedTabs = walletDetailTabs.map((item) => {
        switch (item.id) {
          case 0:
            return {
              ...item,
              count: (
                <>
                  <span className="font-light">$</span>
                  {totalSupplySize}
                </>
              ),
            };
          case 1: {
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
            const result =  !isNaN(supply) && !isNaN(borrow) ? supply - borrow : 0;
            const formattedResult = formatNumber( result === "0.00" ? "0" : result );
            return {
              ...item,
              count: (
                <>
                  <span className="font-light">$</span>
                  {formattedResult}
                </>
              ),
            };
          }
          case 2:
            return {
              ...item,
              count: (
                <>
                  <span className="font-light">$</span>
                  {totalBorrowSize}
                </>
              ),
            };
          default:
            return item;
        }
      });

      setWalletDetailTabs(updatedTabs);
    };

    if (totalSupplySize !== null && totalBorrowSize !== null) {
      updateWalletDetailTabs();
    }
  }, [ assets, totalSupplySize, totalBorrowSize, userAccountData, dashboardRefreshTrigger, ]);


  useEffect(() => {
    const handleBodyOverflow = () => {
      if (isMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = ""; 
      }
    };

    handleBodyOverflow();
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = ""; 
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);



  useEffect(() => {
    const asset = TAB_CARD_DATA.find((item) => item.id === currentValueIndex);
    setCurrentValueData(asset);
  }, [currentValueIndex, dashboardRefreshTrigger]);


  
  useEffect(() => {
    if (state && state.id !== undefined) {
      setCurrentValueIndex(state.id);
    }
  }, [state, dashboardRefreshTrigger]);

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
          <div
            className=" text-[#2A1F9D] font-bold font-poppins text-[19px] md:text-2xl lg:text-2xl dark:text-darkText mt-5"
            onClick={() => navigate(-1)}
          >
            <div className="flex -mt-2">
              <ChevronLeft
                size={40}
                color={chevronColor}
                className="cursor-pointer"
              />

              {isAssetDetailsPage && (
                <h1 className="text-[#2A1F9D] font-bold font-poppins text-[19px] md:text-2xl lg:text-2xl dark:text-darkText mt-1 ml-3">
                  {isAssetDetailsPage && assetImage && (
                    <img
                      src={assetImage}
                      alt={id}
                      className="w-8 h-8 inline-block mr-2 rounded-[50%]"
                    />
                  )}
                  {id}
                </h1>
              )}
            </div>
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
                    ) 
                      .map((data, index) => {
                        console.log("assetBorrow", assetBorrow);
                        if (
                          data.title === "Health Factor" &&
                          assetBorrow === 0
                        ) {
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
                                          <br />A positive Net APY indicates a
                                          net gain, while a negative value
                                          suggests more is borrowed than
                                          supplied.
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
              ) // Filter out "Health Factor" with no borrow
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

            {/* Risk Details button rendered only if authenticated */}
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
