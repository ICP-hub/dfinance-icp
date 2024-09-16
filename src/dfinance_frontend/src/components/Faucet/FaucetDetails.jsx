import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import Button from "../Common/Button";
import { FAUCET_ASSETS_TABLE_ROW, FAUCET_ASSETS_TABLE_COL } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import FaucetPopup from "./FaucetPopup"; // Import your FaucetPopup component here
import Pagination from "../Common/pagination";
import useAssetData from "../Common/useAssets";
import ckBTC from '../../../public/assests-icon/ckBTC.png';
import cekTH from '../../../public/assests-icon/cekTH.png';
import { useMemo, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../utils/useAuthClient";
import { useEffect } from "react";
import {idlFactory as ledgerIdlFactoryckETH} from "../../../../declarations/cketh_ledger";
import {idlFactory as ledgerIdlFactoryckBTC} from "../../../../declarations/ckbtc_ledger";

const ITEMS_PER_PAGE = 8; // Number of items per page

const FaucetDetails = () => {
  const {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
  } = useAuth()

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(FAUCET_ASSETS_TABLE_ROW.length / ITEMS_PER_PAGE)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFaucetClick = (asset, image) => {
    setSelectedAsset(asset);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const {filteredItems} = useAssetData();

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  
  const [balance, setBalance] = useState(null);
  const [usdBalance, setUsdBalance] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);

  const ledgerActorckBTC = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER, ledgerIdlFactoryckBTC), [createLedgerActor]);

  const ledgerActorckETH = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKETH_LEDGER, ledgerIdlFactoryckETH), [createLedgerActor]);

  const fetchBalance = useCallback(async () => {
    if (isAuthenticated && ledgerActorckBTC && principalObj) {
      try {
        const account = { owner: principalObj, subaccount: [] };
        const balance = await ledgerActorckBTC.icrc1_balance_of(account);
        setBalance(balance.toString());
        console.log("Fetched Balance:", balance.toString());
      } catch (error) {
        console.error("Error fetching balance:", error);
        setError(error);
      }
    }
  }, [isAuthenticated, ledgerActorckBTC, principalObj]);

  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setConversionRate(data['internet-computer'].usd);
      console.log("Fetched Conversion Rate:", data['internet-computer'].usd);
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      setError(error);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBalance(), fetchConversionRate()]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  useEffect(() => {
    if (balance && conversionRate) {
      const balanceInUsd = (parseFloat(balance) * conversionRate).toFixed(2);
      setUsdBalance(balanceInUsd);
    }
  }, [balance, conversionRate]);

  const filteredReserveData = Object.fromEntries(filteredItems);
  console.log(filteredReserveData)



  function formatNumber(num) {
    if (num === null || num === undefined) {
      return '0';
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }


  return (
    <div className="w-full">
      <div className="w-full md:h-[40px] flex items-center px-6 mt-4 md:px-12">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">Test Assets</h1>
      </div>

      <div className="w-full min-h-[390px] mt-6 p-0 lg:px-12 mb-20">
        <div className="w-full overflow-auto content">
          <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
            <thead>
              <tr className="text-left text-[#233D63] dark:text-darkTextSecondary text-[12px]">
                {FAUCET_ASSETS_TABLE_COL.slice(0, 2).map((item, index) => (
                  <td key={index} className="p-1 whitespace-nowrap">{item.header}</td>
                ))}
                <td className="p-3 hidden md:table-cell">{FAUCET_ASSETS_TABLE_COL[2]?.header}</td>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr
                  key={index}
                  className={`w-full font-bold hover:bg-[#ddf5ff8f] rounded-lg text-sm ${
                    index !== currentItems.length - 1 ? "gradient-line-bottom" : ""
                  }`}
                >
                  <td className="p-3 align-top">
                    <div className="w-full flex items-center justify-start min-w-[120px] gap-1 whitespace-nowrap mr-1">
                    {item[0] === "ckBTC" && (
                          <img src={ckBTC} alt="ckbtc logo" className="w-8 h-8 rounded-full mr-2"/>
                        )}
                        {item[0] === "ckETH" && (
                          <img src={cekTH} alt="cketh logo" className="w-8 h-8 rounded-full mr-2"/>
                        )}
                        {item[0]}
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-row ml-5">
                      <div>
                     
                        <center>
                        <p>{balance}</p>
                          <p className="font-light"> ${formatNumber(usdBalance)}</p>
                        </center>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top flex">
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
                        className="mb-7 bg-gradient-to-tr md:from-[#4659CF] md:from-20% md:via-[#D379AB] md:via-60% md:to-[#FCBD78] md:to-90% text-white rounded-lg md:px-3 md:py-1 shadow-md shadow-black/40 font-semibold text-sm sxs3:px-1 font-inter md:bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60"
                        onClickHandler={() => handleFaucetClick(item.asset, item.image)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-full flex justify-center mt-6">
          <div id="pagination" className="flex gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(FAUCET_ASSETS_TABLE_ROW.length / ITEMS_PER_PAGE)}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50" />
          <FaucetPopup
            asset={selectedAsset}
            image={currentItems.find((item) => item.asset === selectedAsset)?.image}
            balance={currentItems.find((item) => item.asset === selectedAsset)?.WalletBalance}
            onClose={closePopup}
          />
        </div>
      )}
    </div>
  );
};

export default FaucetDetails;
