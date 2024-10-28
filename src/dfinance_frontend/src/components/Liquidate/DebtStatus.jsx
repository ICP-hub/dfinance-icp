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
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";;
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber"

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

  const navigate = useNavigate();


  const {
    isAuthenticated,
    login,
    getAllUsers,
    principal
  } = useAuth();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch all users when the component mounts
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
        console.log("liquidation", usersData)
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };



    fetchUsers();
  }, [getAllUsers]);

  useEffect(() => {
    users.map((user, index) => {
      const userr = user[0].toString();
      console.log("user", userr)
    })
  }, [users])

  const handleDetailsClick = (item) => {
    setSelectedAsset(item); // Update selectedAsset with the clicked asset
    setShowUserInfoPopup(true); // Open the user info popup
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

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);


  // Filter users based on search query
  const filteredUsers = users
    .map((item) => {
      const mappedItem = {
        reserves: item[1].reserves,
        principal: item[0].toText(),
        healthFactor: Number(item[1]?.health_factor) / 100000000,
        item,
      };
      return mappedItem;
    })
    .filter((mappedItem) => {
      const isValid =
        mappedItem.reserves.length > 0 &&
        mappedItem.principal !== principal &&
        mappedItem.healthFactor > 1 &&
        (mappedItem.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mappedItem.item[1].total_debt.toString().includes(searchQuery));
      return isValid;
    });

  // Calculate total pages based on the filtered users
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Determine the items for the current page
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Function to handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Update search input and reset to page 1
  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const popupRef = useRef(null); // Ref for the popup content



  const handleOutsideClick = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      closePopup();
    }
  };
  const truncateText = (text, length) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };
  useEffect(() => {
    if (showPopup) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [showPopup]);


  const formatNumber = useFormatNumber();

  return (
    <div className="w-full">
      <div className="w-full md:h-[40px] flex items-center mt-8">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">Users List</h1>

      </div>

      <div className="w-full mt-6">
        {filteredUsers.length === 0 ? <div className=" flex flex-col justify-center align-center place-items-center my-[13rem] mb-[18rem]">
          <div className="w-20 h-15">
            <img src="/Transaction/empty file.gif" alt="empty" className="w-30" />
          </div>
          <p className="text-[#233D63] text-sm font-semibold dark:text-darkText">
            No users found!
          </p>
        </div> : <div className="w-full min-h-[390px] mt-6 p-0 mb-20 select-none">
          <div className="w-full overflow-auto content">
            <table className="w-full text-[#2A1F9D] font-[500] text-sm md:text-sm lg:text-sm dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                  {LIQUIDATION_USERLIST_COL.slice(0, 2).map((item, index) => (
                    <td key={index} className="p-3 pl-1 whitespace-nowrap py-4">
                      {item.header}
                    </td>
                  ))}
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[2]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[3]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{LIQUIDATION_USERLIST_COL[4]?.header}</td>

                </tr>
              </thead>
              <tbody>
                {currentItems.map((mappedItem, index) => (
                  <tr
                    key={index}
                    className={`w-full font-bold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg ${index !== users.length - 1 ? "gradient-line-bottom" : ""
                      }`}
                  >
                    <td className="p-2 align-top py-8 ">
                      <div className="flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mt-2">
                        <p>{truncateText(mappedItem.principal, 14)}</p>
                      </div>
                    </td>
                    <td className="p-2 align-top py-8 ">
                      <div className="flex flex-row ml-2 mt-2">
                        <div>
                          <p className="font-medium">${formatNumber(Number(mappedItem.item[1].total_debt) / 100000000)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top hidden md:table-cell py-8">
                      <div className="flex gap-2 items-center">
                        {mappedItem.reserves[0].map((item, index) => {
                          const assetName = item[1]?.reserve
                          const assetBorrow = (Number(item[1]?.asset_borrow) / 100000000);
                          console.log("mappedItems", mappedItem)
                          console.log("Asset Borrow:", assetBorrow);
                          if (assetBorrow > 0) {
                            return (
                              <img
                                key={index}
                                src={
                                  assetName === "ckBTC" ? ckBTC
                                    : assetName === "ckETH" ? ckETH
                                      : assetName === "ckUSDC" ? ckUSDC
                                        : assetName === "ICP" ? icp
                                          : assetName === "ckUSDT" ? ckUSDT // Added case for ckUSDT
                                            : undefined
                                }
                                alt={assetName}
                                className="rounded-[50%] w-7"
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>

                    <td className="p-5 align-top hidden md:table-cell py-8">
                      <div className="flex gap-2 items-center">
                        {mappedItem.reserves[0].map((item, index) => {
                          const assetName = item[1]?.reserve // Asset name (e.g., 'ckBTC', 'ckETH')
                          const assetSupply = item[1]?.asset_supply  // Asset borrow amount

                          console.log("itemss:", assetName);
                          console.log("Asset Supply:", assetSupply);

                          // Show the image if asset_borrow > 0
                          if (assetSupply > 0) {
                            return (
                              <img
                                key={index}
                                src={
                                  assetName === "ckBTC" ? ckBTC
                                    : assetName === "ckETH" ? ckETH
                                      : assetName === "ckUSDC" ? ckUSDC
                                        : assetName === "ICP" ? icp
                                          : assetName === "ckUSDT" ? ckUSDT // Added case for ckUSDT
                                            : undefined
                                }
                                alt={assetName}
                                className="rounded-[50%] w-7"
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td className="p-3 align-top hidden md:table-cell pt-5 py-8">
                      {mappedItem.item.borrow_apy}
                    </td>
                    <td className="p-3 align-top flex py-8">
                      <div className="w-full flex justify-end align-center">
                        <Button
                          title={
                            <>
                              <span className="hidden lg:inline">Liquidate</span>
                              <span className="inline lg:hidden">
                                <svg
                                  width="40"
                                  height="46"
                                  viewBox="0 0 42 42"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-6 h-6"
                                >
                                  <path
                                    d="M27.7247 24.967L27.6958 13.8482L16.577 13.8193C16.4611 13.8036 16.3433 13.813 16.2314 13.8468C16.1195 13.8807 16.0161 13.9381 15.9284 14.0154C15.8406 14.0926 15.7705 14.1878 15.7227 14.2945C15.675 14.4012 15.6507 14.5169 15.6515 14.6338C15.6523 14.7507 15.6783 14.866 15.7276 14.972C15.7769 15.078 15.8483 15.1722 15.9372 15.2481C16.026 15.3241 16.1302 15.3801 16.2425 15.4123C16.3549 15.4445 16.4729 15.4522 16.5885 15.4349L24.9204 15.4695L13.8824 26.5076C13.7293 26.6606 13.6434 26.8682 13.6434 27.0846C13.6434 27.301 13.7293 27.5086 13.8824 27.6616C14.0354 27.8146 14.2429 27.9006 14.4594 27.9006C14.6758 27.9006 14.8833 27.8146 15.0364 27.6616L26.0744 16.6235L26.109 24.9555C26.1098 25.172 26.1966 25.3794 26.3502 25.5319C26.5039 25.6845 26.7119 25.7698 26.9284 25.769C27.1449 25.7683 27.3523 25.6815 27.5049 25.5279C27.6574 25.3742 27.7427 25.1662 27.742 24.9497L27.7247 24.967Z"
                                    fill="white"
                                  />
                                </svg>
                              </span>
                            </>
                          }
                          className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-[5px] px-9 py-3 shadow-md shadow-[#00000040] font-semibold text-[12px] lg:px-5 lg:py-[5px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[4px]"
                          onClickHandler={() => handleDetailsClick(mappedItem)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>



            </table>

          </div>
          <div className="w-full flex justify-center mt-10">
            <div id="pagination" className="flex gap-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>}


      </div>
      {showUserInfoPopup && selectedAsset && (
        <UserInformationPopup
          onClose={() => setShowUserInfoPopup(false)}
          mappedItem={selectedAsset} // Pass the asset or other properties from the selected item
          principal={selectedAsset.principal} // Pass the user_principle from the selected item
        />
      )}


    </div >
  )
}

export default DebtStatus