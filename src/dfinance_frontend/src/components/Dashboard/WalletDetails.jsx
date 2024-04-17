import { Search, X } from "lucide-react"
import React from "react"
import {
  WALLET_ASSETS_TABLE_ROW,
  WALLET_ASSETS_TABLE_COL,
} from "../../utils/constants"
import Button from "../Button"

const WalletDetails = () => {
  const [isSearch, setIsSearch] = React.useState(false)
  return (
    <div className="w-full mt-10">
      <div className="w-full flex items-center justify-between">
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
      <div className="w-full min-h-[400px] mt-6">
        <div className="w-full">
          <table className="w-full text-[#2A1F9D] font-semibold">
            <thead>
              <tr className="text-left text-[#233D63]">
                {WALLET_ASSETS_TABLE_COL.map((item, index) => (
                  <td key={index}>
                    {item.header}
                  </td>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {WALLET_ASSETS_TABLE_ROW.map((item, index) => (
                <tr key={index}>
                  <td className="p-3">{item.asset}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <p>{item.total_supply_count}</p>
                      <p className="font-light">${item.total_supply}M</p>
                    </div>
                  </td>
                  <td className="p-3">{item.supply_apy}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <p>{item.total_borrow_count}</p>
                      <p className="font-light">${item.total_borrow}M</p>
                    </div>
                  </td>
                  <td className="p-3">{item.borrow_apy}</td>
                  <td className="p-3">
                    <Button title={"Details"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <div className="w-full h-full flex items-center justify-center">
          <h1 className='text-[#7EA0B0] text-lg'>No Assets Found</h1>
        </div> */}
      </div>
    </div>
  )
}

export default WalletDetails
