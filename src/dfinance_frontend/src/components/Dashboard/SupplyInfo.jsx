import React from "react"
import CircleProgess from "../CircleProgess"
import LineGraph from "./LineGraph"

const SupplyInfo = () => {
  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col md:flex-row items-start">
        <div className="w-full md:w-3/12">
          <CircleProgess progessValue={58} />
        </div>
        <div className="w-full md:w-9/12 flex gap-8 lg:px-3 overflow-auto text-xs md:text-sm lg:text-base whitespace-nowrap">
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-medium">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>3.19M of 5.70M</p>
            <p>$123.19M of $786.55M</p>
          </div>
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-medium">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>3.19M of 5.70M</p>
            <p>$123.19M of $786.55M</p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6">
          <button className='cursor-pointer hover:text-[#7369df]'>Supply APR</button>
        </div>
        <LineGraph />

        <p className="mt-8 text-[#5B62FE]">
          Collateral usage Can be collateral
        </p>

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-medium">Max LTV</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-medium">
              Liquidation threshold
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-medium">Liquidation penalty</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplyInfo
