import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import React, { useEffect, useState } from "react"
import {
  LIQUIDATION_USERLIST_ROW,
  LIQUIDATION_USERLIST_COL,
} from "../../utils/constants"
import Button from "../../components/Common/Button"
import { useNavigate } from "react-router-dom"
import { Modal } from "@mui/material"
import { useDispatch, useSelector } from 'react-redux'
import {
  setIsWalletConnected,
  setWalletModalOpen
} from '../../redux/reducers/utilityReducer'
import { useAuth } from "../../utils/useAuthClient"
import { useRef } from "react"

import icplogo from '../../../public/wallet/icp.png'
import plug from "../../../public/wallet/plug.png"
import bifinity from "../../../public/wallet/bifinity.png"
import nfid from "../../../public/wallet/nfid.png"
import Pagination from "../../components/Common/pagination";
import UserInformationPopup from "./userInformation"

const ITEMS_PER_PAGE = 8;
const DebtStatus = () => {

  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  }
  const [currentPage, setCurrentPage] = useState(1);
  const [activeChevron, setActiveChevron] = useState(null);
  const itemsPerPage = 8; // Number of items per page
  const navigate = useNavigate();
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const {
    isAuthenticated,
    login,
  } = useAuth();



  const handleDetailsClick = (asset) => {
    setSelectedAsset(asset); // Update selectedAsset with the clicked asset
    setShowUserInfoPopup(true); // Optional: Log selected asset for debugging
     
  };


  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === 'dark' ? '#ffffff' : '#3739b4';

  const handleChevronClick = () => {
    // setSelectedAsset(asset);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const dispatch = useDispatch()
  const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility)

  const handleWalletConnect = () => {
    console.log("connected");
    dispatch(setWalletModalOpen(!isWalletModalOpen))
  }

  const handleWallet = () => {
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    dispatch(setIsWalletConnected(true))
    navigate('/dashboard/my-supply')
  }

  useEffect(() => {
    if (isWalletCreated) {
      navigate('/dashboard/wallet-details')
    }
  }, [isWalletCreated]);

  const loginHandler = async (val) => {
    await login(val);
  };

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(LIQUIDATION_USERLIST_ROW.length / ITEMS_PER_PAGE);
  const filteredItems = LIQUIDATION_USERLIST_ROW.filter(item =>
    item.user_principle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.debt_amount.toString().includes(searchQuery)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);


  const popupRef = useRef(null); // Ref for the popup content



  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      closePopup();
    }
  };

  useEffect(() => {
    if (showPopup) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [showPopup]);

  return (
    <div className="w-full">
      <div className="w-full md:h-[40px] flex items-center px-2 mt-8 md:px-12 ">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">Users List</h1>
        <div className="ml-auto   ">
          {Showsearch && (
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search assets"
              style={{ fontSize: '0.75rem' }}
              className={`placeholder-gray-500 w-[400px] md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent text-black dark:text-white ${Showsearch
                ? "animate-fade-left flex"
                : "animate-fade-right hidden"
                }`}
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          )}
        </div>
        <svg onClick={showSearchBar} className="cursor-pointer" width="55" height="25" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z" stroke="url(#paint0_linear_293_865)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M11.2613 11.5531L13.4638 13.75" stroke="url(#paint1_linear_293_865)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <defs>
            <linearGradient id="paint0_linear_293_865" x1="3.5" y1="3.5" x2="13.5" y2="14" gradientUnits="userSpaceOnUse">
              <stop stop-color="#2E28A5" />
              <stop offset="1" stop-color="#FAAA98" />
            </linearGradient>
            <linearGradient id="paint1_linear_293_865" x1="12.3625" y1="11.5531" x2="12.3625" y2="13.75" gradientUnits="userSpaceOnUse">
              <stop stop-color="#C88A9B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {Showsearch &&
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search assets"
          className={`placeholder-gray-500 w-[300px] block md:hidden z-20 px-4 py-[2px] mt-2 focus:outline-none box bg-transparent text-black dark:text-white ${Showsearch
            ? "animate-fade-left flex"
            : "animate-fade-right hidden"
            }`}
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
      }

      <div className="w-full min-h-[400px] mt-6 lg:px-10 ">
        {currentItems.length === 0 ? <div className="mt-[120px] flex flex-col justify-center align-center place-items-center ">
          <div className="w-20 h-15">
            <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
          </div>
          <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
            No assets found!
          </p>
        </div> : <div className="w-full">
          <div className="w-full overflow-auto content">
            <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                  {LIQUIDATION_USERLIST_COL.slice(0, 2).map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap py-4">
                      {item.header}
                    </td>
                  ))}
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[2]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[3]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[4]?.header}</td>
                  {/* <td className="p-3">{LIQUIDATION_USERLIST_COL[5]?.header}</td> */}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`w-full font-bold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg ${index !== currentItems.length - 1 ? "gradient-line-bottom" : ""}`}
                  >
                    <td className="p-2 align-top py-8 ">
                      <div className="flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mt-2">
                        <p>{item.user_principle}</p>
                      </div>
                    </td>
                    <td className="p-2 align-top py-8 ">
                      <div className="flex flex-row ml-2 mt-2">
                        <div>
                          <p className="font-medium">${item.debt_amount}M</p>
                        </div>
                        <div className="md:hidden justify-center align-center mt-2 ml-5" onClick={() => handleChevronClick(item)}>
                          <ChevronRight size={22} color={chevronColor} />
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top hidden md:table-cell  py-8">
                      <div className="flex gap-2 items-center">
                        <img src={item.debt_assets[0].image} alt="Asset 1" className="rounded-[50%] w-7" />
                        <img src={item.debt_assets[1].image} alt="Asset 1" className="rounded-[50%] w-7" />
                      </div>
                    </td>
                    <td className="p-5 align-top hidden md:table-cell py-8">
                      <div className="flex gap-2 items-center">
                        <img src={item.collateral_assets[0].image} alt="Asset 1" className="rounded-[50%] w-7" />
                        <img src={item.collateral_assets[1].image} alt="Asset 1" className="rounded-[50%] w-7" />
                        <img src={item.collateral_assets[2].image} alt="Asset 1" className="rounded-[50%] w-7" />
                      </div>
                    </td>
                    <td className="p-3 align-top hidden md:table-cell pt-5 py-8">{item.borrow_apy}</td>
                    <td className="p-3 align-top flex py-8">
                      <div className="w-full flex justify-end align-center">
                        <Button title={"Liquidate"} className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-sm
                               lg:px-5 lg:py-[3px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[9px]     font-inter" onClickHandler={() => handleDetailsClick(item.asset)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>}

      </div>
      {showUserInfoPopup && (
        <UserInformationPopup
          onClose={() => setShowUserInfoPopup(false)} 
          asset={selectedAsset}
        />
      )}

    </div >
  )
}

export default DebtStatus
