import React from "react"
import CircleProgess from "../CircleProgess"
import LineGraph from "./LineGraph"

const BorrowInfo = () => {
  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col lg:flex-row items-start sxs3:flex-row sxs3:mb-7">
        <div className="w-full lg:w-2/12">
          <CircleProgess progessValue={75} />
        </div>
        <div className="w-full lg:w-9/12 flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs md:text-sm lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 sxs3:gap-4">
          {/* Total Borrowed */}
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Total Borrowed</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>3.19M of 5.70M</p>
            <p className="text-[11px]">$123.19M of $786.55M</p>
          </div>

          <hr
              className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
            />

          {/* APY, variable */}
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">APY, variable</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>1.50%</p>
          </div>

          <hr
              className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
            />

          {/* Borrow cap */}
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Borrow cap</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>1.50M</p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6 dark:text-darkText">
          <button className='cursor-pointer hover:text-[#7369df]'>Borrow APR, variable</button>
        </div>
        <LineGraph />

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Reserve factor</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>60%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
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
