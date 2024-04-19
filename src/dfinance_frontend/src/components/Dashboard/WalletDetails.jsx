import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import React from "react"
import {
  WALLET_ASSETS_TABLE_ROW,
  WALLET_ASSETS_TABLE_COL,
} from "../../utils/constants"
import Button from "../Button"
import { useNavigate } from "react-router-dom"

const WalletDetails = () => {
  const navigate = useNavigate()
  const [isSearch, setIsSearch] = React.useState(false)
  return (
    <div className="w-full mt-10">
      <div className="w-full flex flex-wrap items-center justify-between">
        <h1 className="text-[#2A1F9D] font-semibold text-lg">ICP Assets</h1>
        <form className="flex relative w-[480px] justify-end">
          {
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search for products"
              className={`w-full z-20 absolute bg-[#cdeefc] p-2 px-4 rounded-lg focus:outline-none box-border ${
                isSearch
                  ? "animate-fade-left flex"
                  : "animate-fade-right hidden"
              }`}
            />
          }

          <button
            type="button"
            onClick={() => setIsSearch(!isSearch)}
            className={`text-[#7EA0B0] p-2 ${isSearch ? "z-30" : "z-10"}`}
          >
            {isSearch ? <X /> : <Search />}
          </button>
        </form>
      </div>
      <div className="w-full min-h-[400px] mt-6 p-0 lg:px-12">
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
                {WALLET_ASSETS_TABLE_ROW.slice(0, 8).map((item, index) => (
                  <tr
                    key={index}
                    className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg"
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[120px] gap-1 whitespace-nowrap">
                        <img
                          src={item.image}
                          alt={item.asset}
                          className="w-8 h-8 rounded-full"
                        />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
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
                          onClickHandler={() =>
                            navigate("/dashboard/asset-details")
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-full flex justify-end mt-6">
            <div id="pagination" className="flex gap-2">
              <button
                type="button"
                className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"
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
    </div>
  )
}

export default WalletDetails
