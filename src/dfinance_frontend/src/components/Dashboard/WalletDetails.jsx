import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import React, { useEffect, useState } from "react"
import {
  WALLET_ASSETS_TABLE_ROW,
  WALLET_ASSETS_TABLE_COL,
} from "../../utils/constants"
import Button from "../Button"
import { useNavigate } from "react-router-dom"
import { Modal } from "@mui/material"
import { useDispatch, useSelector } from 'react-redux'
import {
  setIsWalletConnected,
  setWalletModalOpen
} from '../../redux/reducers/utilityReducer'
import { useAuth } from "../../utils/useAuthClient"

const WalletDetails = () => {

  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const showSearchBar = () => {
    setShowSearch(!Showsearch);
  }
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of items per page
  const navigate = useNavigate();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const {
    isAuthenticated,
    login,
  } = useAuth();

  const handleNextPage = () => {
    if (currentPage < Math.ceil(WALLET_ASSETS_TABLE_ROW.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handleDetailsClick = (asset) => {
    setSelectedAsset(asset); // Update selectedAsset with the clicked asset
    console.log("Selected Asset:", asset); // Optional: Log selected asset for debugging
    navigate(`/dashboard/asset-details/${asset}`); // Navigate to asset details page
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = WALLET_ASSETS_TABLE_ROW.slice(indexOfFirstItem, indexOfLastItem);
  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === 'dark' ? '#ffffff' : '#3739b4';

  const handleChevronClick = (asset) => {
    setSelectedAsset(asset);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const dispatch = useDispatch()
  const { isWalletCreated, isWalletModalOpen } = useSelector(state => state.utility)



  const handleWalletConnect = () => {
    console.log("connrcterd");
    dispatch(setWalletModalOpen(!isWalletModalOpen))
    // dispatch(setIsWalletCreated(true))
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
    // navigate("/");

    // await existingUserHandler();
  };

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };



  return (
    <div className="w-full mt-10">


      <div className="w-full md:h-[40px] flex items-center px-2 mt-8 md:px-12 ">
        <h1 className="text-[#2A1F9D] font-bold text-lg dark:text-darkText">ICP Assets</h1>
        <div className="ml-auto   ">
          {Showsearch && (
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search for proposals"
              style={{ fontSize: '0.75rem' }}
              className={`placeholder-gray-500 w-[400px] md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent ${Showsearch
                ? "animate-fade-left flex"
                : "animate-fade-right hidden"
                }`}
            />

          )}
        </div>
        <svg onClick={showSearchBar} className="cursor-pointer" width="55" height="25" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z" stroke="url(#paint0_linear_293_865)" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M11.2613 11.5531L13.4638 13.75" stroke="url(#paint1_linear_293_865)" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
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
          placeholder="Search for products"
          className={`placeholder-gray-500 w-[300px] block  md:hidden z-20 px-4 py-[2px] mt-2 focus:outline-none box bg-transparent ${Showsearch
            ? "animate-fade-left flex"
            : "animate-fade-right hidden"
            }`}
        />
      }

      <div className="w-full min-h-[400px] mt-6 lg:px-10 mb-20">
        <div className="w-full">
          <div className="w-full overflow-auto content">
            <table className="w-full text-[#2A1F9D] font-[500] text-sm dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                  {WALLET_ASSETS_TABLE_COL.slice(0, 2).map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {item.header}
                    </td>
                  ))}
                  <td className="p-3 hidden md:table-cell">{WALLET_ASSETS_TABLE_COL[2]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{WALLET_ASSETS_TABLE_COL[3]?.header}</td>
                  <td className="p-3 hidden md:table-cell">{WALLET_ASSETS_TABLE_COL[4]?.header}</td>
                  <td className="p-3">{WALLET_ASSETS_TABLE_COL[5]?.header}</td>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`w-full font-bold hover:bg-[#ddf5ff8f] rounded-lg ${index !== currentItems.length - 1 ? "gradient-line-bottom" : ""}`}
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[120px] gap-3 whitespace-nowrap mr-1 mt-2">
                        <img src={item.image} alt={item.asset} className="w-8 h-8 rounded-full" />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-row ml-2 mt-2">
                        <div>
                          <p>{item.total_supply_count}</p>
                          <p className="font-light">${item.total_supply}M</p>
                        </div>
                        <div className="md:hidden justify-center align-center mt-2 ml-5" onClick={() => handleChevronClick(item)}>
                          <ChevronRight size={22} color={chevronColor} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-top hidden md:table-cell pt-5">{item.supply_apy}</td>
                    <td className="p-3 align-top hidden md:table-cell">
                      <div className="flex flex-col mt-2">
                        <p>{item.total_borrow_count}</p>
                        <p className="font-light">${item.total_borrow}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top hidden md:table-cell pt-5">{item.borrow_apy}</td>
                    <td className="p-3 align-top flex">
                      <div className="w-full flex justify-end align-center">
                        <Button title={"Details"} className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-sm
                               lg:px-5 lg:py-[3px] sxs3:px-3 sxs3:py-[3px] sxs3:mt-[9px]     font-inter" onClickHandler={() => handleDetailsClick(item.asset)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-full flex justify-center mt-6">
            <div id="pagination" className="flex gap-2">
              <button
                type="button"
                className="border rounded-full p-1 border-[#c8ced5] bg-[#c8ced5] text-white hover:bg-[#b0b5bb] hover:border-[#b0b5bb] hover:text-white"
                onClick={handlePreviousPage}
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className="border rounded-full p-1 border-[#c8ced5] hover:border-[#c8ced5] hover:text-[#b0b5bb] text-[#c8ced5]"
                onClick={handleNextPage}
              >
                <ChevronRight />
              </button>
            </div>
          </div>


          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white dark:bg-darkOverlayBackground p-6 rounded-2xl shadow-lg w-80 relative">
                <button
                  className="absolute top-5 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-600"
                  onClick={closePopup}
                >
                  <X size={45} />
                </button>
                <div >
                  <div className="flex gap-2 justify-start items-center w-10 h-10">
                    <img src={selectedAsset.image} alt={selectedAsset.asset} className="rounded-[50%]" />
                    <p className="text-lg font-bold text-[#2A1F9D] dark:text-darkText">{selectedAsset.asset}</p>
                  </div>

                  <div className="flex flex-col gap-5 mt-8">
                    <div className="flex justify-between">
                      <p className="text-sm dark:text-darkTextSecondary">Total Supply:</p>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-[#2A1F9D] dark:text-darkText ml-auto">{selectedAsset.total_supply_count}M</p>
                        <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">${selectedAsset.total_supply}M</p>
                      </div>
                    </div>
                    <div className="flex justify-between mb-4">
                      <p className="text-sm dark:text-darkTextSecondary">Supply APY:</p>
                      <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">{selectedAsset.supply_apy}</p>
                    </div>


                    <div className="flex justify-between">
                      <p className="text-sm  dark:text-darkTextSecondary">Total Borrow:</p>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-[#2A1F9D] dark:text-darkText ml-auto">{selectedAsset.total_borrow_count}M</p>
                        <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">
                          ${selectedAsset.total_borrow}M
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between mb-4">
                      <p className="text-sm dark:text-darkTextSecondary">Borrow APY:</p>
                      <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText">{selectedAsset.borrow_apy}</p>
                    </div>
                  </div>


                </div>
                <div className="flex w-full justify-center">
                  <button
                    className="mt-6 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg px-6 py-3 font-semibold w-[100%] text-lg"
                    onClick={() => handleDetailsClick(selectedAsset.asset)}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          )}


         {!isAuthenticated && <Modal open={isWalletModalOpen} onClose={handleWalletConnect}>
            <div className='w-[300px] absolute bg-gray-100  shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-white dark:bg-darkOverlayBackground font-poppins'>
              <h1 className='font-bold text-[#2A1F9D] dark:text-darkText'>Connect a wallet</h1>
              <div className='flex flex-col gap-2 mt-3 text-sm'>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#8782d8] dark:text-darkText" onClick={() => loginHandler("ii")}>
                  Internet Identity
                  <div className='w-8 h-8'>
                    <img src={"https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                  Plug
                  <div className='w-8 h-8'>
                    <img src={"/plug.png.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText">
                  Bifinity
                  <div className='w-8 h-8'>
                    <img src={"/bifinity.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between bg-[#c8c8c8] bg-opacity-20 hover:bg-[#b7b4b4] cursor-pointer p-2 rounded-md text-[#2A1F9D] dark:bg-darkBackground/30 dark:hover:bg-[#b7b4b4] dark:text-darkText" onClick={() => loginHandler("nfid")}>
                  NFID
                  <div className='w-8 h-8'>
                    <img src={"/nfid.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                  </div>
                </div>
              </div>
              <p className='w-full  text-xs my-3 text-gray-600 dark:text-[#CDB5AC]'>Track wallet balance in read-only mode</p>

              <div className="w-full">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-[#233D63] focus:outline-none focus:border-blue-500 placeholder:text-[#233D63] dark:border-darkTextSecondary1 dark:placeholder:text-darkTextSecondary1 text-gray-600 dark:text-darkTextSecondary1 text-xs rounded-md dark:bg-transparent"
                  placeholder="Enter ethereum address or username"
                />
              </div>

              {inputValue && (
                <div className="w-full flex mt-3">
                  <Button
                    title="Connect"
                    onClickHandler={handleWallet}
                    className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 px-20 shadow-lg font-semibold text-sm"
                  />
                </div>
              )}

            </div>
          </Modal>}


        </div>
        {/* <div className="w-full h-full flex items-center justify-center">
          <h1 className='text-[#7EA0B0] text-lg'>No Assets Found</h1>
        </div> */}
      </div>
    </div >
  )
}

export default WalletDetails
