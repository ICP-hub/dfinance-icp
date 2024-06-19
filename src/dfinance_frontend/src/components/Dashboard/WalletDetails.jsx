import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import React, { useState } from "react"
import {
  WALLET_ASSETS_TABLE_ROW,
  WALLET_ASSETS_TABLE_COL,
} from "../../utils/constants"
import Button from "../Button"
import { useNavigate } from "react-router-dom"

const WalletDetails = () => {

  const [Showsearch, setShowSearch] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
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
  return (
    <div className="w-full mt-10">


      <div className="w-full md:h-[40px] flex items-center px-6 mt-8 md:px-16 ">
        <h1 className="text-[#2A1F9D] font-semibold text-lg">ICP Assets</h1>
        <div className="ml-auto   ">
        {Showsearch && (


  <input
    type="text"
    name="search"
    id="search"
    placeholder="Search for proposals"
    style={{ fontSize: '0.75rem' }}
    className={`placeholder-gray-500 w-[300px] md:block hidden z-20 rounded-full p-1 px-4 focus:outline-none box-border gradient-borderr  ${Showsearch
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
          className={`placeholder-gray-500 w-full block md:hidden z-20 mt-4 bg-[#b4b4bf]  px-4 rounded-lg focus:outline-none box-border gradient-borderr ${Showsearch
            ? "animate-fade-left flex"
            : "animate-fade-right hidden"
            }`}
        />
      }

      <div className="w-full min-h-[400px] mt-10 p-0 lg:px-12">
        <div className="w-full">
          <div className="w-full overflow-auto">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
              <thead>
                <tr className="text-left text-[#233D63]">
                  {WALLET_ASSETS_TABLE_COL.map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {item.header}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg ${index !== currentItems.length - 1 ? "gradient-line-bottom" : ""
                      }`}
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[120px] gap-1 whitespace-nowrap mr-1">
                        <img src={item.image} alt={item.asset} className="w-8 h-8 rounded-full" />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col ml-2">
                        <p>{item.total_supply_count}</p>
                        <p className="font-light">${item.total_supply}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">{item.supply_apy}</td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
                        <p>{item.total_borrow_count}</p>
                        <p className="font-light">${item.total_borrow}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">{item.borrow_apy}</td>
                    <td className="p-3 align-top">
                    <div className="w-full flex justify-end">
                        <Button
                          title={"Details"}
                          onClickHandler={() => handleDetailsClick(item.asset)}
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


        </div>
        {/* <div className="w-full h-full flex items-center justify-center">
          <h1 className='text-[#7EA0B0] text-lg'>No Assets Found</h1>
        </div> */}
      </div>
    </div >
  )
}

export default WalletDetails
