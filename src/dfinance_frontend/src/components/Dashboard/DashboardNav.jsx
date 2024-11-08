import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TAB_CARD_DATA,
  WALLET_DETAILS_TABS,
  WALLET_DETAIL_TAB,
} from "../../utils/constants";
import { useSelector } from "react-redux";
import RiskPopup from "./DashboardPopup/RiskDetails";
import { X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import { ChevronLeft } from "lucide-react";
import icplogo from "../../../public/wallet/icp.png";
import { EllipsisVertical } from "lucide-react";
import useAssetData from "../Common/useAssets";
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

  const { isAuthenticated, backendActor, principal, fetchReserveData } =
    useAuth();

    const [netWorth, setNetWorth] = useState()

    const totalUsdValueBorrow = useSelector(
      (state) => state.borrowSupply.totalUsdValueBorrow
    );
    const totalUsdValueSupply = useSelector(
      (state) => state.borrowSupply.totalUsdValueSupply
    );

    const calculatedNetWorth = totalUsdValueSupply - totalUsdValueBorrow;


    useEffect(() => {
      const calculatedNetWorth = totalUsdValueSupply - totalUsdValueBorrow;
      setNetWorth(calculatedNetWorth);
      console.log(`Updated Net Worth: $${calculatedNetWorth}`);
    }, [totalUsdValueBorrow, totalUsdValueSupply]); 

    console.log("totalUsdValueBorrow", totalUsdValueBorrow, totalUsdValueSupply);
    

  const { totalMarketSize, totalSupplySize, totalBorrowSize } = useAssetData();
  const [netSupplyApy, setNetSupplyApy] = useState(0);
  const [netDebtApy, setNetDebtApy] = useState(0);

  const [netApy, setNetApy] = useState(0);
  const [assetSupply, setAssetSupply] = useState(0);
  const [assetBorrow, setAssetBorrow] = useState(0);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const tooltipRef = useRef(null);

  const toggleTooltip = () => {
    setIsTooltipVisible((prev) => !prev);
  };

  // Effect to handle clicks outside the tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsTooltipVisible(false);
      }
    };

    // Attach event listener
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [walletDetailTab, setWalletDetailTab] = useState([
    {
      id: 0,
      title: "Net Worth",
      count: null, // Initial state is null
    },
    {
      id: 1,
      title: "Net APY",
      count: null, // Initial state is null
    },
    {
      id: 2,
      title: "Health Factor",
      count: null, // Initial state is null
    },
  ]);

  const [walletDetailTabs, setWalletDetailTabs] = useState([
    { id: 0, title: "Total Market Size", count: 0 }, // Initial count set to null
    { id: 1, title: "Total Supplies", count: 0 }, // Initial count set to null
    { id: 2, title: "Total Borrows", count: 0 }, // Initial count set to null
  ]);

  const { userData, healthFactorBackend, refetchUserData } = useUserData();
  const formatNumber = useFormatNumber();


  const updateWalletDetailTab = (data) => {
    if (!data || !data.Ok) return;
    const { net_worth, net_apy, health_factor } = data.Ok;
    // console.log("health factor", health_factor[0])
    const updatedTab = walletDetailTab.map((item) => {
      console.log("item", item);
      switch (item.id) {
        case 0:
          return {
            ...item,
            count: `$${formatNumber(calculatedNetWorth)}`,
          };
        case 1:
          return {
            ...item,
            count: `${
              (netApy / 100).toFixed(2) < 0.01
                ? "<0.01"
                : (netApy / 100).toFixed(2)
            }%`,
          };
        case 2:
          const healthValue =
            Number(health_factor[0]) / 10000000000 > 100
              ? "♾️"
              : parseFloat((Number(health_factor[0]) / 10000000000).toFixed(2));

          return {
            ...item,
            count: healthValue,
          };

        default:
          return item;
      }
    });

    setWalletDetailTab(updatedTab);
  };

  useEffect(() => {
    if (userData) {
      updateWalletDetailTab(userData);
    }
  }, [userData, totalUsdValueSupply, totalUsdValueBorrow]);

  const [error, setError] = useState(null);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
  } = useFetchConversionRate();

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
        return ckUSDTUsdRate; // Added ckUSDT case
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchConversionRate();
  }, [fetchConversionRate]);

  const calculateNetSupplyApy = (reserves) => {
    let totalSuppliedInUSD = 0;
    let weightedApySum = 0;

    reserves.forEach((reserve) => {
      const conversionRate = getConversionRate(reserve[0]);
      const assetSupply = Number(reserve[1]?.asset_supply || 0n) / 100000000;

      const supplyApy = Number(reserve[1]?.supply_rate || 0n) / 100000000;
      console.log("reserves", reserves);
      console.log(
        `Reserve: ${reserve[0]}, Asset Supply: ${assetSupply}, Conversion Rate: ${conversionRate}, Supply APY: ${supplyApy}`
      );

      const assetSupplyInUSD = assetSupply * conversionRate;
      totalSuppliedInUSD += assetSupplyInUSD;
      weightedApySum += assetSupplyInUSD * supplyApy;

      console.log(
        `Asset Supply in USD: ${assetSupplyInUSD}, Weighted APY Sum: ${weightedApySum}`
      );
    });

    const netApy =
      totalSuppliedInUSD > 0 ? weightedApySum / totalSuppliedInUSD : 0;

    console.log(
      `Total Supplied in USD: ${totalSuppliedInUSD}, Calculated Net Supply APY: ${
        netApy * 100
      }`
    );
    return netApy * 100;
  };

  const calculateNetDebtApy = (reserves) => {
    let totalBorrowedInUSD = 0;
    let weightedDebtApySum = 0;

    reserves.forEach((reserve) => {
      const assetBorrowed = Number(reserve[1]?.asset_borrow || 0n) / 100000000;
      const debtApy = Number(reserve[1]?.borrow_rate || 0n) / 100000000;
      const assetPriceWhenBorrowed =
        Number(reserve[1]?.asset_price_when_borrowed || 0n) / 100000000 || 1;

      console.log(
        `Asset Borrowed: ${assetBorrowed}, Borrow Rate (APY): ${debtApy}, Price When Borrowed: ${assetPriceWhenBorrowed}`
      );

      const assetBorrowedInUSD = assetBorrowed * assetPriceWhenBorrowed;
      totalBorrowedInUSD += assetBorrowedInUSD;
      weightedDebtApySum += assetBorrowedInUSD * debtApy;

      console.log(
        `Asset Borrowed in USD: ${assetBorrowedInUSD}, Weighted Debt APY Sum: ${weightedDebtApySum}`
      );
    });

    const netDebtApy =
      totalBorrowedInUSD > 0 ? weightedDebtApySum / totalBorrowedInUSD : 0;

    console.log(
      `Total Borrowed in USD: ${totalBorrowedInUSD}, Calculated Net Debt APY: ${
        netDebtApy * 100
      }`
    );
    return netDebtApy * 100;
  };

  const calculateNetApy = (reserves) => {
    const supplyApy = calculateNetSupplyApy(reserves);
    console.log(`Calculated Supply APY: ${supplyApy}`);

    const debtApy = calculateNetDebtApy(reserves);
    console.log(`Calculated Debt APY: ${debtApy}`);

    const netApy = supplyApy - debtApy;
    console.log(`Net APY (Supply APY - Debt APY): ${netApy}`);

    return netApy;
  };

  useEffect(() => {
    if (userData && userData?.Ok?.reserves[0]) {
      const reservesData = userData?.Ok?.reserves[0];
      console.log("reserveData in dashboard nav", reservesData);
      console.log("UserData Reserves in Dashboard:", reservesData);

      const calculatedNetApy = calculateNetApy(reservesData);
      console.log("Calculated Net APY:", calculatedNetApy);

      setNetApy(calculatedNetApy);
      const reserve = reservesData[0]; // Adjust this index as needed based on your data structure
      let Borrows = 0;
      // Accessing asset_supply from the second element of the reserve
      console.log("reservein dashboard", reserve[1]);
      const supply = Number(reserve[1]?.asset_supply || 0n) / 100000000; // Make sure reserve[1] exists
      setAssetSupply(supply);
      console.log("userData", userData);
      const borrow = Number(userData?.Ok?.total_debt || 0n) / 100000000;
      console.log("Borrow:", borrow);
      setAssetBorrow(borrow);
    }
  }, [userData]);

  const updateWalletDetailTabs = () => {
    const updatedTabs = walletDetailTabs.map((item) => {
      switch (item.id) {
        case 0:
          return { ...item, count: `${totalMarketSize}` };
        case 1:
          return { ...item, count: `${totalSupplySize}` };
        case 2:
          return { ...item, count: `${totalBorrowSize}` };
        default:
          return item;
      }
    });

    setWalletDetailTabs(updatedTabs);
  };

  useEffect(() => {
    updateWalletDetailTabs();
  }, [totalMarketSize]);

  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { isWalletConnected } = useSelector((state) => state.utility);
  const [isDrop, setIsDrop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentValueIndex, setCurrentValueIndex] = useState(state?.id || 0);
  const [currentValueData, setCurrentValueData] = useState(
    state || TAB_CARD_DATA[0]
  );
  const dropdownRef = useRef(null);
  const theme = useSelector((state) => state.theme.theme);
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDrop(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  };
  const menuRef = useRef(null);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  const toggleDropdown = () => {
    if (!isDrop) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsDrop(!isDrop);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const asset = TAB_CARD_DATA.find((item) => item.id === currentValueIndex);
    setCurrentValueData(asset);
  }, [currentValueIndex]);

  useEffect(() => {
    if (state && state.id !== undefined) {
      setCurrentValueIndex(state.id);
    }
  }, [state]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const isDashboardSupplyOrMain = pathname === "/dashboard";

  const handleAssetSelect = (index) => {
    setCurrentValueIndex(index);
    setIsDrop(false);
  };

  const dashboardTitle = pathname.includes("/market") ? "Market" : "Dashboard";

  const shouldRenderRiskDetailsButton =
    !pathname.includes("/market") &&
    !pathname.includes("/governance") &&
    !pathname.includes("/dashboard/transaction-history") &&
    !pathname.startsWith("/dashboard/asset-details/");

  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";
  const isAssetDetailsPage =
    location.pathname.startsWith("/dashboard/asset-details/") ||
    location.pathname.startsWith("/market/asset-details/");

  const { id } = useParams();

  const assetImages = {
    ckBTC: ckBTC,
    ckETH: ckETH,
    ckUSDC: ckUSDC,
    ICP: icp,
    ckUSDT: ckUSDT, // Added ckUSDT
  };

  const assetImage = assetImages[id] || null;

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
              <ChevronLeft size={40} color={chevronColor} />

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
          <button onClick={toggleMenu} className="rounded-md button1 z-10">
            <EllipsisVertical color={checkColor} size={30} />
          </button>
        </div>
      </div>

      <div className="w-full flex flex-wrap justify-start items-center gap-2 sxs3:mb-2 md:mb-9 lg:mb-2">
        <div className="flex">
          {/* Menu button for small screens */}
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
                    {(isDashboardSupplyOrMain
                      ? walletDetailTab
                      : walletDetailTabs
                    ).map((data, index) => {
                      // Skip rendering the "Health Factor" block if assetBorrow is 0
                      if (data.title === "Health Factor" && assetBorrow === 0) {
                        return null; // Do not render the Health Factor block
                      }

                      return (
                        <div
                          key={index}
                          className="relative group text-[#2A1F9D] p-3 font-light dark:text-darkTextSecondary rounded-lg shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out"
                          style={{ minWidth: "220px", flex: "1 0 220px" }}
                        >
                          <button className="relative font-light text-[13px] text-left min-w-[80px] button1">
                            {/* Title and Info Icon */}
                            <div className="flex items-center">
                              {data.title}
                              {data.title === "Net APY" && (
                                 <span className="relative inline-block ml-1">
                                 {/* Info icon aligned with title */}
                                 <Info
                                   size={15}
                                   className="ml-1 align-middle "
                                   onClick={toggleTooltip}
                                 />
                                  {/* Tooltip with full-screen blur */}
                                  {isTooltipVisible && (
                                    <>
                                      {/* Fullscreen backdrop with blur effect */}
                                      {/* <div className="fixed inset-0 backdrop-blur-md bg-black bg-opacity-40 z-40"></div> */}

                                      {/* Tooltip content */}
                                      <div
                                        ref={tooltipRef}
                                        className="absolute bottom-full left-[30vw] transform -translate-x-[40%] mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 w-[70vw]"
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

                                        {/* Tooltip arrow */}
                                        {/* <span
                                          className={`tooltip-arrow ${
                                            theme === "dark"
                                              ? "tooltip-arrow-dark"
                                              : ""
                                          }`}
                                        ></span> */}
                                      </div>
                                    </>
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
                                    ? "text-orange-500"
                                    : data.count <= 2
                                    ? "text-orange-300"
                                    : "text-orange-600"
                                  : data.title === "Total Borrows"
                                  ? "text-[#2A1F9D] dark:text-darkBlue"
                                  : "text-[#2A1F9D] dark:text-darkBlue"
                              }`}
                            >
                              {data.count !== null ? data.count : ""}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                 
                  {assetBorrow !== 0 && (
                    <div className="flex justify-end mt-10 md:mt-0">
                      <button
                        className="w-full py-3 px-3 bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100% text-white text-xl rounded-md dark:bg-[#BA5858] dark:text-darkText"
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

          {isAuthenticated && (
            <div className="hidden md:flex items-center flex-wrap text-[#4659CF] font-semibold gap-8 dark:text-darkText lg:mb-0 mb-8 mt-8">
              {pathname !== "/dashboard/transaction-history" &&
                (isDashboardSupplyOrMain
                  ? walletDetailTab
                  : walletDetailTabs
                ).map((data, index) => {
                  // Skip rendering the "Health Factor" block if assetBorrow is 0
                  if (data.title === "Health Factor" && assetBorrow === 0) {
                    return null; // Do not render the Health Factor block
                  }

                  return (
                    <div key={index} className="relative group">
                      <button className="relative font-light text-[13px] text-left min-w-[80px] button1">
                        {/* Title and Info Icon */}
                        <div className="flex items-center">
                          {data.title}
                          {data.title === "Net APY" && (
                           <span
                           className="relative inline-block ml-1"
                           onMouseEnter={() => setIsTooltipVisible(true)}
                           onMouseLeave={() => setIsTooltipVisible(false)}
                         >
                           {/* Info icon with hover-triggered tooltip */}
                           <Info size={15} className="ml-1 align-middle cursor-pointer"  onClick={toggleTooltip}/>
             

                              {/* Tooltip with full-screen blur */}
                              {isTooltipVisible && (
                                <>
                                  {/* Fullscreen backdrop */}
                                  {/* <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-40 z-40" /> */}

                                  {/* Tooltip content */}
                                  <div
                                    ref={tooltipRef}
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-[#fcfafa] rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 p-6 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 w-[390px]"
                                  >
                                    <span className="text-gray-700 dark:text-darkText">
                                      Net APY represents the overall annualized
                                      yield, calculated as the difference
                                      between your supply APY and debt APY.
                                      <br />A positive Net APY indicates a net
                                      gain, while a negative value suggests more
                                      is borrowed than supplied.
                                    </span>

                                    {/* Tooltip arrow */}
                                    <span
                                      className={`tooltip-arrow ${
                                        theme === "dark"
                                          ? "tooltip-arrow-dark"
                                          : ""
                                      }`}
                                    ></span>
                                  </div>
                                </>
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
                                ? "text-orange-500"
                                : data.count <= 2
                                ? "text-orange-300"
                                : "text-orange-600"
                              : data.title === "Total Borrows"
                              ? "text-[#2A1F9D] dark:text-darkBlue"
                              : "text-[#2A1F9D] dark:text-darkBlue"
                          }`}
                        >
                          {data.count !== null ? data.count : ""}
                        </span>
                      </button>
                    </div>
                  );
                })}

              {isAuthenticated &&
                shouldRenderRiskDetailsButton &&
                assetBorrow !== 0 && (
                  <button
                    className="-mt-2 py-1 px-2 border dark:border-white border-blue-500 text-[#2A1F9D] text-[11px] rounded-md dark:text-darkTextSecondary button1"
                    onClick={handleOpenPopup}
                  >
                    Risk Details
                  </button>
                )}
            </div>
          )}
          {isPopupOpen && (
            <RiskPopup onClose={handleClosePopup} userData={userData} />
          )}
        </div>
        {/* <div className="ml-auto hidden lg:flex">
          {isAuthenticated && shouldRenderTransactionHistoryButton && (
            <a href="/dashboard/transaction-history" className="block">
              <button className=" text-nowrap px-2 py-2 md:px-4 md:py-2 border border-[#2A1F9D] text-[#2A1F9D] bg-[#ffff] rounded-md shadow-md hover:shadow-[#00000040] font-medium text-sm cursor-pointer relative dark:bg-darkOverlayBackground dark:text-darkText dark:border-none sxs3:mt-4 sxs3:ml-0 md:ml-4 md:mt-0">
                Transaction History
              </button>
            </a>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default DashboardNav;
