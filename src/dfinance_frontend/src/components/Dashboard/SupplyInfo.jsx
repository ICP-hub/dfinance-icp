import React from "react"
import CircleProgess from "../CircleProgess"
import LineGraph from "./LineGraph"
import { Check } from 'lucide-react';

const SupplyInfo = () => {
  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col md:flex-row items-start sxs3:flex-row sxs3:mb-7">
        <div className="w-full md:w-2/12">
          <CircleProgess progessValue={75} />
        </div>
        <div className="w-full md:w-9/12 flex gap-14 lg:px-3 overflow-auto text-xs md:text-sm lg:text-base whitespace-nowrap sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden sxs3:gap-4 md:gap-14">
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-bold mb-[1px]">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5 mb-[1px]`}
            />
            <p>3.19M of 5.70M</p>
            <p className="text-[11px]">$123.19M of $786.55M</p>
          </div>
          <hr
              className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
            />
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-bold  mb-[1px]">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5  mb-[1px]`}
            />
            <p>3.19M of 5.70M</p>
            <p className="text-[11px]">$123.19M of $786.55M</p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6">
          <button className='cursor-pointer hover:text-[#7369df]'>Supply APR</button>
        </div>
        <LineGraph />

        <p className="mt-8 text-[#5B62FE] flex items-center gap-2">
          Collateral usage <Check /> Can be collateral
        </p>

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-bold">Max LTV</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-bold">
              Liquidation threshold
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl">
            <h1 className="text-[#2A1F9D] font-bold">Liquidation penalty</h1>
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
