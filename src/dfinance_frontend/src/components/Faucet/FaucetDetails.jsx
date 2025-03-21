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
import useAssetData from "../customHooks/useAssets";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import cekTH from "../../../public/assests-icon/cekTH.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { useMemo, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../utils/useAuthClient";
import { useEffect } from "react";
import useFetchBalance from "../customHooks/useFetchBalance";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import Loading from "../Common/Loading";
import MiniLoader from "../Common/MiniLoader";
import WalletModal from "../../components/Dashboard/WalletModal";
import Lottie from "../Common/Lottie";
const ITEMS_PER_PAGE = 8;

/**
 * FaucetDetails Component
 *
 * This component displays the details of faucet assets available for users to claim.
 * It allows users to view various assets like `ckBTC`, `ckETH`, `ckUSDC`, `ICP`, and `ckUSDT`,
 * @returns {JSX.Element} - Returns the FaucetDetails component, including the faucet assets table and pagination controls.
 */
const FaucetDetails = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const { filteredItems, loading } = useAssetData();
  const { isAuthenticated, backendActor } = useAuth();
  const { ckBTCUsdRate, ckETHUsdRate, ckUSDCUsdRate, ckICPUsdRate, ckUSDTUsdRate, fetchConversionRate, ckBTCBalance, ckETHBalance, ckUSDCBalance, ckICPBalance, ckUSDTBalance, fetchBalance,
  } = useFetchConversionRate();
  
  const navigate = useNavigate();

  /* ===================================================================================
   *                                  STATE-MANAGEMENT
   * =================================================================================== */

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const refreshTrigger = useSelector(
    (state) => state.faucetUpdate.refreshTrigger
  );
  const { isSwitchingWallet } = useSelector((state) => state.utility);

  /* ===================================================================================
   *                                  FUNCTION
   * =================================================================================== */

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
      case "ckUSDT":
        assetImage = ckUSDT;
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
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

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
    refreshTrigger,
  ]);

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
        const allAssets = await backendActor.getAllAssets();
        setAssets(allAssets);
      } catch (error) {
        setError(error);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    refreshTrigger,
  ]);
  useEffect(() => {
    if (!loading) {
      setHasLoaded(true);
    }
  }, [loading]);

  /* ===================================================================================
   *                                  RENDER-COMPONENTS
   * =================================================================================== */

  return (
    <div className="w-full">
      <div className="w-full flex items-center px-1">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">
          Test Assets
        </h1>
      </div>

      <div className="w-full mt-9 p-0 lg:px-1">
        {loading && !isSwitchingWallet && !hasLoaded ? (
          <div className="w-full mt-[180px] mb-[300px] flex justify-center items-center ">
            <MiniLoader isLoading={true} />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col justify-center align-center place-items-center my-[14rem]">
            <div className="mb-3 -ml-3 -mt-5">
              <Lottie />
            </div>
            <p className="text-[#8490ff] text-sm dark:text-[#c2c2c2] opacity-90">
              NO ASSETS FOUND!
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
                        className={`whitespace-nowrap pl-2 pb-3 font-semibold ${
                          index === 1 ? "text-center" : ""
                        }`}
                      >
                        {item.header}
                      </td>
                    ))}
                    <td className="hidden md:table-cell pr-[6.6rem]">
                      {FAUCET_ASSETS_TABLE_COL[2]?.header}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr
                      key={index}
                      className={`w-full font-bold hover:bg-[#ddf5ff8f]  text-sm  rounded-lg ${
                        index !== currentItems.length - 1
                          ? "gradient-line-bottom"
                          : ""
                      }`}
                    >
                      <td className="py-[1.5rem]">
                        <div className="w-full flex items-center justify-start whitespace-nowrap pl-3">
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
                          {item[0] === "ckUSDT" && (
                            <img
                              src={ckUSDT}
                              alt="ckusdt logo"
                              className="w-8 h-8 rounded-full mr-2"
                            />
                          )}
                          {item[0]}
                        </div>
                      </td>
                      <td>
                        <div className="p-3">
                          <div>
                            <center>
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
                                }[item[0]];

                                if (!assetData) return null;
                                const { balance, usdBalance, rate } = assetData;
                                const usdRate = rate / 1e8;
                                const calculatedUsdValue = balance * usdRate;
                                let displayedBalance;
                                if (
                                  !isFinite(calculatedUsdValue) ||
                                  calculatedUsdValue === 0
                                ) {
                                  displayedBalance = "0.00";
                                } else if (calculatedUsdValue < 0.01) {
                                  displayedBalance = `<${(
                                    0.01 / usdRate
                                  ).toLocaleString(undefined, {
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
                                return (
                                  <>
                                    <p>{displayedBalance}</p>
                                    <p className="font-light text-[11px]">
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
                            </center>
                          </div>
                        </div>
                      </td>
                      <td className="pr-3">
                        <div className="w-full flex justify-end align-center">
                          <Button
                            title={
                              <>
                                <span
                                  className="hidden lg:inline"
                                  id="faucet-button"
                                >
                                  Faucet
                                </span>
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
            {}
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
        {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
      </div>
    </div>
  );
};
export default FaucetDetails;
