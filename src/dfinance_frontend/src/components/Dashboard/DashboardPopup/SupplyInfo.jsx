import React from "react"
import LineGraph from "../../Common/LineGraph"
import { Check } from 'lucide-react';
import { useState } from "react";
import { useEffect } from "react";
import { X } from 'lucide-react';
import CircularProgress from "../../Common/CircularProgressbar";

const SupplyInfo = ({formatNumber, supplyCap, totalSupplied, supplyRateAPR, ltv, canBeCollateral, liquidationBonus, liquidationThreshold}) => {

  const supplyCapNumber = supplyCap ? Number(supplyCap) : 0;
  const totalSupplyPercentage = supplyCapNumber && totalSupplied 
    ? (totalSupplied / supplyCapNumber) * 100 
    : 0; 


  return (
    <div className="w-full lg:w-10/12 ">

      <div className="w-full flex flex-col md:flex-row items-start sxs3:flex-row sxs3:mb-7 lg:gap-0 md:gap-3">
        <div className="w-full lg:w-[20%] md:w-[10%] flex justify-center align-items-center lg:mt-0 md:mt-2 md:mx-4 lg:mx-0">
          <CircularProgress progessValue={totalSupplyPercentage} />
        </div>
        <div className="w-full lg:w-9/12 md:w-[55%] flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs  lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 md:justify-center lg:justify-start sxs3:gap-4">

          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5 mb-[1px]`}
            />
            <p>  <span >${formatNumber(totalSupplied)}</span> of <span>${supplyCap ? formatNumber(supplyCap.toString()) : 'N/A'}</span></p>
          </div>


          <hr
            className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
          />

          <div className="relative text-[#5B62FE] dark:text-darkText flex flex-col gap-2">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">APY, variable</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{(supplyRateAPR * 100) < 0.1 ? '<0.1%' : `${(supplyRateAPR * 100).toFixed(2)}%`}</p>
          </div>

        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        {/* <div className="w-full flex gap-5 text-[#2A1F9D] mb-6 dark:text-darkText">
          <button className='cursor-pointer hover:text-[#7369df]'>Supply APR</button>
        </div> */}
        {/* <LineGraph /> */}

        <p className="mt-4 text-[#5B62FE] flex items-center gap-2 dark:text-darkText">
          Collateral usage {canBeCollateral ? <Check /> : <X />} {canBeCollateral ? "Can be collateral" : "Cannot be collateral"}
        </p>

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Max LTV</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{ltv}%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Liquidation threshold
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{liquidationThreshold}%</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Liquidation Penalty</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{liquidationBonus}%</p>
          </div>
        </div>
      </div>

    </div>


  )

}

export default SupplyInfo
