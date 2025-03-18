import { ChevronRight, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { WALLET_ASSETS_TABLE_COL } from "../../utils/constants";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useRef } from "react";
import { trackEvent } from "../../utils/googleAnalytics";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import cekTH from "../../../public/assests-icon/cekTH.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useAssetData from "../../components/customHooks/useAssets";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import WalletModal from "../../components/Dashboard/WalletModal";
import MiniLoader from "../../components/Common/MiniLoader";
import Lottie from "../../components/Common/Lottie";
import useUserData from "../../components/customHooks/useUserData";
import FreezeCanisterPopup from "../../components/Dashboard/DashboardPopup/CanisterDrainPopup";

const ITEMS_PER_PAGE = 8;

/**
 *
 * This component displays asset details in the user's wallet, including available balances,
 * conversion rates, and overall market statistics. Users can also search and view details for individual assets.
 *
 * @returns {JSX.Element} - Returns the component.
 */
const WalletDetails = () => {
  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedAssetData, setSelectedAssetData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";
  const { filteredItems, loading } = useAssetData(searchQuery);
  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
  } = useFetchConversionRate();

  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );

  const navigate = useNavigate();
  const { isWalletCreated, isSwitchingWallet } = useSelector(
    (state) => state.utility
  );

  const { isAuthenticated, principal } = useAuth();
  const {
    userData,
    userAccountData,
    isFreezePopupVisible,
    setIsFreezePopupVisible,
  } = useUserData();
  const {
    totalMarketSize,
    totalSupplySize,
    totalBorrowSize,
    totalReserveFactor,
    interestAccure,
  } = useAssetData();

  /* ===================================================================================
   *                 Derived State, UI Variables, and Route-Based Flags
   * =================================================================================== */

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const filteredReserveData = Object.fromEntries(filteredItems);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  const convertToNumber = (value) => {
    if (typeof value === "string") {
      const numberValue = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (value.includes("K")) {
        return numberValue * 1e3;
      }
      if (value.includes("M")) {
        return numberValue * 1e6;
      }
      return numberValue;
    }
    return 0;
  };

  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };

  const handleDetailsClick = (asset, assetData) => {
    setSelectedAsset(asset);
    navigate(`/market/asset-details/${asset}`, { state: { assetData } });
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleChevronClick = (assetName) => {
    const selectedAssetData = currentItems.find(
      (item) => item[0] === assetName
    );
    if (selectedAssetData) {
      setSelectedAssetData(selectedAssetData);
    }
    setShowPopup(true);
  };

  const popupRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      closePopup();
    }
  };

  const formatValue = (num) => {
    if (num < 1) return num.toFixed(7);

    if (num >= 1e12)
      return num % 1e12 === 0
        ? num / 1e12 + "T"
        : (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)
      return num % 1e9 === 0 ? num / 1e9 + "B" : (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6)
      return num % 1e6 === 0 ? num / 1e6 + "M" : (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3)
      return num % 1e3 === 0 ? num / 1e3 + "K" : (num / 1e3).toFixed(2) + "K";

    return num.toFixed(2);
  };

  function getUsdRate(assetType) {
    switch (assetType) {
      case "ckBTC":
        return ckBTCUsdRate / 1e8;
      case "ckETH":
        return ckETHUsdRate / 1e8;
      case "ckUSDC":
        return ckUSDCUsdRate / 1e8;
      case "ICP":
        return ckICPUsdRate / 1e8;
      case "ckUSDT":
        return ckUSDTUsdRate / 1e8;
      default:
        return 0;
    }
  }

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    const supply = convertToNumber(totalSupplySize);
    const borrow = convertToNumber(totalBorrowSize);
    const totalAvailable =
      !isNaN(supply) && !isNaN(borrow) ? supply - borrow : 0;
    const totalMarket = totalSupplySize;

    trackEvent(
      "Total Market," + totalMarket + "," + principal?.toString(),
      "Assets",
      "Total Market," + totalMarket + "," + principal?.toString(),
      "Assets"
    );

    trackEvent(
      "Total Available," + totalAvailable + "," + principal?.toString(),
      "Assets",
      "Total Available," + totalAvailable + "," + principal?.toString(),
      "Assets"
    );

    trackEvent(
      "Total Borrow Size," + borrow + "," + principal?.toString(),
      "Assets",
      "Total Borrow Size," + borrow + "," + principal?.toString(),
      "Assets"
    );

    trackEvent(
      " Reserve Factor," + totalReserveFactor + "," + principal?.toString(),
      "Assets",
      " Reserve Factor," + totalReserveFactor + "," + principal?.toString(),
      "Assets"
    );

    trackEvent(
      "interestAccures," + interestAccure + "," + principal?.toString(),
      "Assets",
      "interestAccures," + interestAccure + "," + principal?.toString(),
      "Assets"
    );
  }, [
    totalMarketSize,
    totalSupplySize,
    totalBorrowSize,
    totalReserveFactor,
    interestAccure,
    principal,
    dashboardRefreshTrigger,
  ]);

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  useEffect(() => {
    if (showPopup) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }
  }, [showPopup]);

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);

  useEffect(() => {
    if (!loading) {
      setHasLoaded(true);
    }
  }, [loading]);
  useEffect(() => {
    if (isFreezePopupVisible) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling when popup closes
    }

    return () => {
      document.body.style.overflow = "auto"; // Cleanup function to reset scrolling
    };
  }, [isFreezePopupVisible]);
  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div id="market-page1" className="w-full" key={dashboardRefreshTrigger}>
      <div className="w-full md:h-[40px] flex items-center px-3 mt-4 md:-mt-8 lg:mt-8">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText -ml-3">
          ICP Assets
        </h1>
        <div className="ml-auto -pr-5">
          {Showsearch && (
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search assets"
              style={{ fontSize: "0.75rem" }}
              className={`placeholder-gray-500 w-[400px] mr-4 md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent text-black dark:text-white ${
                Showsearch
                  ? "animate-fade-left flex"
                  : "animate-fade-right hidden"
              }`}
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          )}
        </div>
        <svg
          onClick={showSearchBar}
          className="cursor-pointer button"
          width="25"
          height="25"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z"
            stroke="url(#paint0_linear_293_865)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M11.2613 11.5531L13.4638 13.75"
            stroke="url(#paint1_linear_293_865)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <defs>
            <linearGradient
              id="paint0_linear_293_865"
              x1="3.5"
              y1="3.5"
              x2="13.5"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#2E28A5" />
              <stop offset="1" stop-color="#FAAA98" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_293_865"
              x1="12.3625"
              y1="11.5531"
              x2="12.3625"
              y2="13.75"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#C88A9B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {Showsearch && (
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search assets"
          className={`placeholder-gray-500 ml-[5px] w-[95%] block md:hidden z-20 px-6 py-[7px] mt-5 mb-1  focus:outline-none box bg-transparent text-black dark:text-white ${
            Showsearch ? "animate-fade-left flex" : "animate-fade-right hidden"
          }`}
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
      )}

      <div className="w-full mt-6">
        {loading && isAuthenticated && !isSwitchingWallet && !hasLoaded ? (
          <div className="w-full mt-[200px] mb-[300px] flex justify-center items-center ">
            <MiniLoader isLoading={true} />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[10rem] mb-[14rem]">
            <div className="mb-7 -ml-3 -mt-5">
              <Lottie />
            </div>
            <p className="text-[#8490ff] text-sm font-medium dark:text-[#c2c2c2]">
              NO ASSETS FOUND!
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full overflow-auto content">
              <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText">
                <thead>
                  <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                    {WALLET_ASSETS_TABLE_COL.slice(0, 2).map((item, index) => (
                      <td key={index} className=" whitespace-nowrap">
                        <div
                          className={`flex ${
                            index === 0
                              ? "justify-start sxs3:pl-2 md:pl-2"
                              : "justify-center"
                          }`}
                        >
                          {item.header}
                        </div>
                      </td>
                    ))}
                    <td className="p-3 hidden lg:table-cell text-nowrap">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[2]?.header}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex justify-center text-nowrap">
                        {WALLET_ASSETS_TABLE_COL[3]?.header}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-nowrap">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[4]?.header}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-nowrap ">
                      <div className="flex justify-center  ">
                        {WALLET_ASSETS_TABLE_COL[5]?.header}
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr
                      key={index}
                      className={`w-full font-bold hover:bg-[#ddf5ff8f]  rounded-lg  ${
                        index !== currentItems.length - 1
                          ? "gradient-line-bottom"
                          : ""
                      }`}
                    >
                      <td className=" align-center py-6 sxs3:pl-2dxs:px-2 dxs:py-[2px] ss4:pl-1  md:pl-2 ">
                        <div className="flex items-center  min-w-[120px] gap-3 whitespace-nowrap">
                          {item[0] === "ckBTC" && (
                            <img
                              src={ckBTC}
                              alt="ckbtc logo"
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          {item[0] === "ckETH" && (
                            <img
                              src={cekTH}
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
                          {item[0] === "ckUSDT" && (
                            <img
                              src={ckUSDT}
                              alt="ckusdt logo"
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          {item[0]}
                        </div>
                      </td>
                      <td className="p-2 align-center py-6">
                        <div className="flex justify-center items-center flex-row">
                          <div className="flex-grow text-center">
                            {/* Asset values */}
                            <p className="min-w-[70px] text-center">
                              {(() => {
                                const assetSupply =
                                  Number(item[1].Ok.asset_supply) / 100000000;
                                let usdRate = 0;

                                switch (item[0]) {
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
                                    return "0.00";
                                }

                                const usdValue = assetSupply * usdRate;

                                if (!isFinite(usdValue) || usdValue === 0) {
                                  return "0.00";
                                } else if (usdValue < 0.01) {
                                  return `<${formatValue(0.01 / usdRate)}`;
                                } else {
                                  return formatValue(assetSupply);
                                }
                              })()}
                            </p>

                            {/* Asset USD Conversions */}
                            <p className="font-light text-[12px] text-center">
                              {(() => {
                                const assetSupply =
                                  Number(item[1].Ok.asset_supply) / 100000000;
                                let usdRate = 0;

                                switch (item[0]) {
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
                                    return "$0.00";
                                }

                                const usdValue = assetSupply * usdRate;

                                if (!isFinite(usdValue) || usdValue === 0) {
                                  return "$0.00";
                                } else if (usdValue < 0.01) {
                                  return "<0.01$";
                                } else {
                                  return `$${formatValue(usdValue)}`;
                                }
                              })()}
                            </p>

                            {}
                          </div>
                          <div
                            className="lg:hidden justify-center ml-6"
                            onClick={() => handleChevronClick(item[0])}
                          >
                            <ChevronRight
                              size={22}
                              color={chevronColor}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-center hidden lg:table-cell">
                        <div className="flex justify-center">
                          {(Number(item?.[1]?.Ok?.current_liquidity_rate) *
                            100) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                (Number(item?.[1]?.Ok?.current_liquidity_rate) *
                                  100) /
                                100000000
                              ).toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="p-2 align-center hidden lg:table-cell">
                        <div className="flex justify-center flex-row">
                          <div>
                            {/* Asset values */}
                            <p className="min-w-[150px] text-center">
                              {(() => {
                                const assetBorrow =
                                  Number(item[1].Ok.asset_borrow) / 100000000;
                                let usdRate = 0;

                                switch (item[0]) {
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
                                    return "0.00";
                                }

                                const usdValue = assetBorrow * usdRate;

                                if (!isFinite(usdValue) || usdValue === 0) {
                                  return "0.00";
                                } else if (usdValue < 0.01) {
                                  return `<${formatValue(0.01 / usdRate)}`;
                                } else {
                                  return formatValue(assetBorrow);
                                }
                              })()}
                            </p>

                            {/* USD Conversion Rates */}
                            <p className="font-light text-[12px] text-center">
                              {(() => {
                                const assetBorrow =
                                  Number(item[1].Ok.asset_borrow) / 100000000;
                                let usdRate = 0;

                                switch (item[0]) {
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
                                    return "$0.00";
                                }

                                const usdValue = assetBorrow * usdRate;

                                if (!isFinite(usdValue) || usdValue === 0) {
                                  return "$0.00";
                                } else if (usdValue < 0.01) {
                                  return "<0.01$";
                                } else {
                                  return `$${formatValue(usdValue)}`;
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-center hidden lg:table-cell">
                        <div className="flex justify-center">
                          {" "}
                          {(Number(item?.[1]?.Ok?.borrow_rate) * 100) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                (Number(item?.[1]?.Ok?.borrow_rate) * 100) /
                                100000000
                              ).toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="p-3 align-center">
                        <div className="w-full flex justify-end align-center">
                          <Button
                            title={"Details"}
                            className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-[5px] px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-[12px]
                               lg:px-4 lg:py-[3px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[4px] dxs:px-2 dxs:py-[2px] ss4:px-1 ss4:py-[1px] "
                            onClickHandler={() =>
                              handleDetailsClick(item[0], item[1])
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {}

            {showPopup && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div
                  ref={popupRef}
                  className="bg-white dark:bg-darkOverlayBackground p-6 rounded-2xl shadow-lg w-80 relative"
                >
                  <button
                    className="absolute top-5 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-600"
                    onClick={closePopup}
                  >
                    <X size={30} />
                  </button>
                  <div>
                    <div className="flex gap-2 justify-start items-center ">
                      {selectedAssetData[0] === "ckBTC" && (
                        <img
                          src={ckBTC}
                          alt="ckBTC logo"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {selectedAssetData[0] === "ckETH" && (
                        <img
                          src={cekTH}
                          alt="ckETH logo"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {selectedAssetData[0] === "ckUSDC" && (
                        <img
                          src={ckUSDC}
                          alt="ckUSDC logo"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {selectedAssetData[0] === "ckUSDT" && (
                        <img
                          src={ckUSDT}
                          alt="ckUSDT logo"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      {selectedAssetData[0] === "ICP" && (
                        <img
                          src={icp}
                          alt="ICP logo"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <p className="text-lg flex-1 font-bold text-[#2A1F9D] dark:text-darkText">
                        {selectedAssetData[0]}
                      </p>
                    </div>

                    <div className="flex flex-col gap-5 mt-8">
                      <div className="flex justify-between">
                        <p className="text-sm dark:text-darkTextSecondary">
                          Total Supplied:
                        </p>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                            {formatValue(
                              Number(selectedAssetData[1].Ok.asset_supply) /
                                100000000
                            )}
                          </p>

                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            $
                            {formatValue(
                              (Number(selectedAssetData[1].Ok.asset_supply) /
                                100000000) *
                                getUsdRate(selectedAssetData[0])
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm dark:text-darkTextSecondary">
                          Supply APY:
                        </p>
                        <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                          {" "}
                          {(Number(
                            selectedAssetData[1].Ok.current_liquidity_rate
                          ) *
                            100) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                (Number(
                                  selectedAssetData[1].Ok.current_liquidity_rate
                                ) *
                                  100) /
                                100000000
                              ).toFixed(2)}%`}
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm  dark:text-darkTextSecondary">
                          Total Borrowing:
                        </p>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                            {formatValue(
                              Number(selectedAssetData[1].Ok.asset_borrow) /
                                100000000
                            )}
                          </p>

                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            $
                            {formatValue(
                              (Number(selectedAssetData[1].Ok.asset_borrow) /
                                100000000) *
                                getUsdRate(selectedAssetData[0])
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between mb-4">
                        <p className="text-sm dark:text-darkTextSecondary">
                          Borrow APY:
                        </p>
                        <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                          {(Number(selectedAssetData[1].Ok.borrow_rate) * 100) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                (Number(selectedAssetData[1].Ok.borrow_rate) *
                                  100) /
                                100000000
                              ).toFixed(2)}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full justify-center">
                    <button
                      className="mt-6 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg px-6 py-1 font-semibold w-[100%] text-lg border-b-[1px] shadow-xl"
                      onClick={() =>
                        handleDetailsClick(
                          selectedAssetData[0],
                          selectedAssetData[1]
                        )
                      }
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isFreezePopupVisible && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
                <FreezeCanisterPopup
                  onClose={() => setIsFreezePopupVisible(false)}
                />
              </div>
            )}
            {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDetails;
