import {  ChevronRight, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {  WALLET_ASSETS_TABLE_COL,} from "../../utils/constants";
import Button from "../../components/Common/Button";
import { useNavigate } from "react-router-dom";
import { Modal } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import { useRef } from "react";
import { trackEvent } from "../../utils/googleAnalytics";
import icplogo from "../../../public/wallet/icp.png";
import nfid from "../../../public/wallet/nfid.png";
import Pagination from "../../components/Common/pagination";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import cekTH from "../../../public/assests-icon/cekTH.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useAssetData from "../../components/Common/useAssets";
import { setUserData } from "../../redux/reducers/userReducer";
import {
  setIsWalletConnected,
  setWalletModalOpen,
  setConnectedWallet,
} from "../../redux/reducers/utilityReducer";
import { Principal } from "@dfinity/principal";
import useFormatNumber from "../../components/customHooks/useFormatNumber";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import WalletModal from "../../components/Dashboard/WalletModal";

const ITEMS_PER_PAGE = 8;
const WalletDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);
  const { isAuthenticated, login, logout, principal, createLedgerActor } =
    useAuth();
  const {
    totalMarketSize,
    totalSupplySize,
    totalBorrowSize,
    totalReserveFactor,
    interestAccure,
  } = useAssetData();

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
  ]);
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

  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const principalObj = Principal.fromText(principal);

  const handleDetailsClick = (asset, assetData) => {
    setSelectedAsset(asset);
    navigate(`/market/asset-details/${asset}`, { state: { assetData } });
  };

  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  const closePopup = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }
  }, [isWalletCreated]);

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const { assets, reserveData, filteredItems, error } =
    useAssetData(searchQuery);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const filteredReserveData = Object.fromEntries(filteredItems);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const [selectedAssetData, setSelectedAssetData] = useState(null);

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

  const formatNumber = useFormatNumber();
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
  return (
    <div className="w-full">
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
        {currentItems.length === 0 ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[10rem] mb-[14rem]">
            <div className="w-20 h-15">
              <img
                src="/Transaction/empty file.gif"
                alt="empty"
                className="w-30"
              />
            </div>
            <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
              No assets found!
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
                              ? "justify-start sxs3:pl-2 md:pl-0"
                              : "justify-center"
                          }`}
                        >
                          {item.header}
                        </div>
                      </td>
                    ))}
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[2]?.header}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[3]?.header}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[4]?.header}
                      </div>
                    </td>
                    <td className="p-3 ">
                      <div className="flex justify-center">
                        {WALLET_ASSETS_TABLE_COL[5]?.header}
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr
                      key={index}
                      className={`w-full font-bold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg  ${
                        index !== currentItems.length - 1
                          ? "gradient-line-bottom"
                          : ""
                      }`}
                    >
                      <td className=" align-center py-6 sxs3:pl-2 md:pl-0">
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
                            {}
                            <p className="min-w-[70px] text-center">
                              {item[0] === "ckBTC" &&
                              
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckETH" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000
                                    )
                                  : "0.00")}
                              {item[0] === "ICP" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDT" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 
                                    )
                                  : "0.00")}
                            </p>

                            {}
                            <p className="font-light text-[12px] text-center">
                              {item[0] === "ckBTC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 *
                                    (ckBTCUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 *
                                        (ckBTCUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckETH" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 *
                                    (ckETHUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 *
                                        (ckETHUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 *
                                    (ckUSDCUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 *
                                        (ckUSDCUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ICP" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 *
                                    (ckICPUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 *
                                        (ckICPUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDT" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_supply) /
                                    100000000 *
                                    (ckUSDTUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_supply) /
                                        100000000 *
                                        (ckUSDTUsdRate / 1e8)
                                    )
                                  : "0.00")}
                            </p>

                            {}
                          </div>
                          <div
                            className="md:hidden justify-center ml-6"
                            onClick={() => handleChevronClick(item[0])}
                          >
                            <ChevronRight size={22} color={chevronColor} />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-center hidden md:table-cell">
                        <div className="flex justify-center">
                          {Number(item?.[1]?.Ok?.current_liquidity_rate) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                Number(item?.[1]?.Ok?.current_liquidity_rate) /
                                100000000
                              ).toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="p-2 align-center hidden md:table-cell">
                        <div className="flex justify-center flex-row">
                          <div>
                          <p className="min-w-[150px] text-center">
                              {item[0] === "ckBTC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckETH" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000
                                    )
                                  : "0.00")}
                              {item[0] === "ICP" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDT" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 
                                    )
                                  : "0.00")}
                            </p>

                            {}
                            <p className="font-light text-[12px] text-center">
                              {item[0] === "ckBTC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 *
                                    (ckBTCUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 *
                                        (ckBTCUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckETH" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 *
                                    (ckETHUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 *
                                        (ckETHUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDC" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 *
                                    (ckUSDCUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 *
                                        (ckUSDCUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ICP" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 *
                                    (ckICPUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 *
                                        (ckICPUsdRate / 1e8)
                                    )
                                  : "0.00")}
                              {item[0] === "ckUSDT" &&
                                (isFinite(
                                  Number(item[1].Ok.asset_borrow) /
                                    100000000 *
                                    (ckUSDTUsdRate / 1e8)
                                )
                                  ? formatValue(
                                      Number(item[1].Ok.asset_borrow) /
                                        100000000 *
                                        (ckUSDTUsdRate / 1e8)
                                    )
                                  : "0.00")}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-center hidden md:table-cell">
                        <div className="flex justify-center">
                          {" "}
                          {Number(item?.[1]?.Ok?.borrow_rate) / 100000000 < 0.01
                            ? "<0.01%"
                            : `${(
                                Number(item?.[1]?.Ok?.borrow_rate) / 100000000
                              ).toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="p-3 align-center">
                        <div className="w-full flex justify-end align-center">
                          <Button
                            title={"Details"}
                            className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-[5px] px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-[12px]
                               lg:px-4 lg:py-[3px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[4px]"
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
                      <p className="text-lg flex-1 font-bold text-[#2A1F9D] dark:text-darkText">
                        {selectedAssetData[0]}
                      </p>
                    </div>

                    <div className="flex flex-col gap-5 mt-8">
                      <div className="flex justify-between">
                        <p className="text-sm dark:text-darkTextSecondary">
                          Total Supply:
                        </p>
                        <div className="flex flex-col">
                          {}
                          <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                            $
                            {formatNumber(
                              Number(selectedAssetData[1].Ok.total_supply) /
                                100000000
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
                          {Number(
                            selectedAssetData[1].Ok.current_liquidity_rate
                          ) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                Number(
                                  selectedAssetData[1].Ok.current_liquidity_rate
                                ) / 100000000
                              ).toFixed(2)}%`}
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <p className="text-sm  dark:text-darkTextSecondary">
                          Total Borrow:
                        </p>
                        <div className="flex flex-col">
                          {}
                          <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                            $
                            {formatNumber(
                              Number(selectedAssetData[1].Ok.total_borrowed) /
                                100000000
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between mb-4">
                        <p className="text-sm dark:text-darkTextSecondary">
                          Borrow APY:
                        </p>
                        <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                          {Number(selectedAssetData[1].Ok.borrow_rate) /
                            100000000 <
                          0.01
                            ? "<0.01%"
                            : `${(
                                Number(selectedAssetData[1].Ok.borrow_rate) /
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

            {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDetails;
