import React, { useState } from "react";
import { useSelector } from "react-redux";
import Button from "../Common/Button";
import {
  FAUCET_ASSETS_TABLE_ROW,
  FAUCET_ASSETS_TABLE_COL,
} from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import FaucetPopup from "./FaucetPopup";
import Pagination from "../Common/pagination";
import useAssetData from "../Common/useAssets";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import cekTH from "../../../public/assests-icon/cekTH.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { useMemo, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../utils/useAuthClient";
import { useEffect } from "react";
import useFetchBalance from "../customHooks/useFetchBalance";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import Loading from "../Common/Loading";

const ITEMS_PER_PAGE = 8;

const FaucetDetails = () => {

  const { isAuthenticated, principal, backendActor, createLedgerActor } =
    useAuth();

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [balance, setBalance] = useState(null);
  const [usdBalance, setUsdBalance] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    fetchBalance
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
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(2);
      setCkUSDCUsdBalance(balanceInUsd);
    }

    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, ckBTCUsdRate, ckETHBalance, ckETHUsdRate, ckUSDCBalance, ckUSDCUsdRate, ckICPBalance, ckICPUsdRate]);

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
         // Assuming you fetch assets in one of the fetch functions
         const allAssets = await backendActor.getAllAssets();  // Fetch assets

         setAssets(allAssets);  // Set assets here after fetch is complete
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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (
      currentPage < Math.ceil(FAUCET_ASSETS_TABLE_ROW.length / ITEMS_PER_PAGE)
    ) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFaucetClick = (asset) => {
    let assetImage;
    switch (asset) {
      case "ckBTC":
        assetImage = ckBTC;
        break;
      case "ckETH":
        assetImage = cekTH;
        break;
      case "ckUSDC":
        assetImage = ckUSDC;
        break;
      case "ICP":
        assetImage = icp;
        break;
      default:
        assetImage = null;
    }
    setSelectedAsset({ asset, assetImage });
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const { filteredItems } = useAssetData();
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";
  const filteredReserveData = Object.fromEntries(filteredItems);
  const formatNumber = useFormatNumber();

  return (
    <div className="w-full">
      <div className="w-full flex items-center px-2">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">
          Test Assets
        </h1>
      </div>

      <div className="w-full mt-9 p-0 lg:px-1">
        {loading ? ( 
          <div className="flex justify-center items-center my-[14rem]">
            <Loading isLoading={true}/>
          </div>
        ) : !currentItems ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[14rem]">
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
          <>
            <div className="w-full overflow-auto content">
              <table className="w-full text-[#2A1F9D] font-[500] text-sm md:text-sm lg:text-base dark:text-darkText">
                <thead>
                  <tr className="placeholder:text-[#233D63] dark:text-darkTextSecondary text-sm">
                    {FAUCET_ASSETS_TABLE_COL.slice(0, 2).map((item, index) => (
                      <td
                        key={index}
                        className="p-1 pl-2 -pr-7 pb-3 whitespace-nowrap"
                      >
                        {item.header}
                      </td>
                    ))}
                    <td className="p-3 hidden md:table-cell">
                      {FAUCET_ASSETS_TABLE_COL[2]?.header}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr
                      key={index}
                      className={`w-full font-bold hover:bg-[#ddf5ff8f] text-sm rounded-lg ${index !== currentItems.length - 1
                          ? "gradient-line-bottom"
                          : ""
                        }`}
                    >
                      <td className="p-3 align-center py-7 px-2">
                        <div className="w-full flex items-center justify-start min-w-[120px] gap-1 whitespace-nowrap mr-1">
                          {item[0] === "ckBTC" && (
                            <img
                              src={ckBTC}
                              alt="ckbtc logo"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          {item[0] === "ckETH" && (
                            <img
                              src={cekTH}
                              alt="cketh logo"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          {item[0] === "ckUSDC" && (
                            <img
                              src={ckUSDC}
                              alt="cketh logo"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          {item[0] === "ICP" && (
                            <img
                              src={icp}
                              alt="cketh logo"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          {item[0]}
                        </div>
                      </td>
                      <td className="p-3 align-center">
                        <div className="flex flex-row ml-[30px]">
                          <div>
                            <center>
                              {item[0] === "ckBTC" && (
                                <>
                                  <p className="text-left">{ckBTCBalance}</p>
                                  <p className="font-light text-left text-[11px]">
                                    ${formatNumber(ckBTCUsdBalance)}
                                  </p>
                                </>
                              )}
                              {item[0] === "ckETH" && (
                                <>
                                  <p className="text-left">{ckETHBalance}</p>
                                  <p className="font-light text-left text-[11px]">
                                    ${formatNumber(ckETHUsdBalance)}
                                  </p>
                                </>
                              )}
                              {item[0] === "ckUSDC" && (
                                <>
                                  <p className="text-left">{ckUSDCBalance}</p>
                                  <p className="font-light text-left text-[11px]">
                                    ${formatNumber(ckUSDCUsdBalance)}
                                  </p>
                                </>
                              )}
                              {item[0] === "ICP" && (
                                <>
                                  <p className="text-left">{ckICPBalance}</p>
                                  <p className="font-light text-left text-[11px]">
                                    ${formatNumber(ckICPUsdBalance)}
                                  </p>
                                </>
                              )}
                            </center>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 align-center -pb-5">
                        <div className="w-full flex justify-end align-center">
                          <Button
                            title={
                              <>
                                <span className="hidden lg:inline">Faucet</span>
                                <span className="inline lg:hidden">
                                  <svg
                                    width="42"
                                    height="48"
                                    viewBox="0 0 42 42"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-10 h-10"
                                  >
                                    <path
                                      d="M27.7247 24.967L27.6958 13.8482L16.577 13.8193C16.4611 13.8036 16.3433 13.813 16.2314 13.8468C16.1195 13.8807 16.0161 13.9381 15.9284 14.0154C15.8406 14.0926 15.7705 14.1878 15.7227 14.2945C15.675 14.4012 15.6507 14.5169 15.6515 14.6338C15.6523 14.7507 15.6783 14.866 15.7276 14.972C15.7769 15.078 15.8483 15.1722 15.9372 15.2481C16.026 15.3241 16.1302 15.3801 16.2425 15.4123C16.3549 15.4445 16.4729 15.4522 16.5885 15.4349L24.9204 15.4695L13.8824 26.5076C13.7293 26.6606 13.6434 26.8682 13.6434 27.0846C13.6434 27.301 13.7293 27.5086 13.8824 27.6616C14.0354 27.8146 14.2429 27.9006 14.4594 27.9006C14.6758 27.9006 14.8833 27.8146 15.0364 27.6616L26.0744 16.6235L26.109 24.9555C26.1098 25.172 26.1966 25.3794 26.3502 25.5319C26.5039 25.6845 26.7119 25.7698 26.9284 25.769C27.1449 25.7683 27.3523 25.6815 27.5049 25.5279C27.6574 25.3742 27.7427 25.1662 27.742 24.9497L27.7247 24.967Z"
                                      fill="white"
                                    />
                                  </svg>
                                </span>
                              </>
                            }
                            className="bg-gradient-to-tr md:from-[#4659CF] md:from-20% md:via-[#D379AB] md:via-60% md:to-[#FCBD78] md:to-90% text-white rounded-[5px] md:px-3 md:py-1 shadow-md shadow-black/40 font-semibold text-[12px] sxs3:px-1 md:bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60"
                            onClickHandler={() =>
                              handleFaucetClick(item[0], item.image)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* <div className="w-full flex justify-center mt-10">
              <div id="pagination" className="flex gap-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(
                    FAUCET_ASSETS_TABLE_ROW.length / ITEMS_PER_PAGE
                  )}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div> */}
          </>
        )}

        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-gray-800 opacity-50" />
            <FaucetPopup
              isOpen={showPopup}
              onClose={closePopup}
              asset={selectedAsset?.asset}
              assetImage={selectedAsset?.assetImage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default FaucetDetails;
