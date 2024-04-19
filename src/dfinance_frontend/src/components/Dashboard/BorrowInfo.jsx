import React from "react"
import CircleProgess from "../CircleProgess"
import LineGraph from "./LineGraph"

const BorrowInfo = () => {
  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col lg:flex-row items-start">
        <div className="w-full lg:w-3/12">
          <CircleProgess progessValue={58} />
        </div>
        <div className="w-full lg:w-9/12 flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs md:text-sm lg:text-base mt-3 lg:mt-0">
          {/* Total Borrowed */}
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-medium">Total Borrowed</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>3.19M of 5.70M</p>
            <p>$123.19M of $786.55M</p>
          </div>

          {/* APY, variable */}
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-medium">APY, variable</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>1.50%</p>
          </div>

          {/* Borrow cap */}
          <div className="relative text-[#5B62FE]">
            <h1 className="text-[#2A1F9D] font-medium">Borrow cap</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>1.50M</p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6">
          <button className='cursor-pointer hover:text-[#7369df]'>Borrow APR, variable</button>
        </div>
        <LineGraph />

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl">
            <h1 className="text-[#2A1F9D] font-medium">Reserve factor</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl">
            <h1 className="text-[#2A1F9D] font-medium">
              Collector Contract
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <button>View Contract</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
