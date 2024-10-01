import React from "react"
import LineGraph from "../../Common/LineGraph"
import CircularProgress from "../../Common/CircularProgressbar"

const BorrowInfo = ({ formatNumber, borrowCap, totalBorrowed, borrowRateAPR }) => {

  const borrowCapNumber = borrowCap ? Number(borrowCap) : 0;
  const totalBorrowPercentage = borrowCapNumber && totalBorrowed 
    ? (totalBorrowed / borrowCapNumber) * 100 
    : 0; 

  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col lg:flex-row items-start sxs3:flex-row sxs3:mb-7 lg:gap-0 md:gap-3">
        <div className="w-full lg:w-[20%] md:w-[10%] flex justify-center align-items-center lg:mt-0 md:mt-2 md:mx-4 lg:mx-0">
          <CircularProgress progessValue={totalBorrowPercentage} />
        </div>
        <div className="w-full lg:w-9/12 md:w-[55%] flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs  lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 md:justify-center lg:justify-start sxs3:gap-4">
          {/* Total Borrowed */}
          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Total Borrowed</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
             <p> <span >${formatNumber(totalBorrowed)}</span> of <span>${borrowCap ? formatNumber(borrowCap.toString()) : 'N/A'}</span></p>
          </div>

          <hr
            className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
          />

          {/* APY, variable */}
          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">APY, variable</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{(borrowRateAPR * 100) < 0.1 ? '<0.1%' : `${(borrowRateAPR * 100).toFixed(2)}%`}</p>
          </div>

        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        {/* <div className="w-full flex gap-5 text-[#2A1F9D] mb-6 dark:text-darkText">
          <button className='cursor-pointer hover:text-[#7369df]'>Borrow APR, variable</button>
        </div> */}
        {/* <LineGraph /> */}

        <div className="w-full flex flex-wrap gap-8 mt-4 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Reserve factor</h1>
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

export default BorrowInfo
