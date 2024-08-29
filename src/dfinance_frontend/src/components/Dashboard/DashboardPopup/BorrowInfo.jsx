import React from "react"
import CircleProgess from "../../Common/CircleProgess"
import LineGraph from "../../Common/LineGraph"

const BorrowInfo = ({filteredItems, formatNumber, usdBalance, borrowCapUsd, supplyPercentage}) => {
  console.log("filteredItems from borrow",filteredItems)
   // Initialize variables to store the extracted values
   let asset_name = "";
   let accrued_to_treasury = "0";
   let borrow_rate = "0";
   let supply_cap = "0";
   let borrow_cap = "0";
   let ltv = "0";
   let supply_rate_apr = "0";
   let total_supply = "0";
   let total_borrowed = "0";
   let current_liquidity_rate = "0";
   let liquidity_index = "0";
   let d_token_canister = "";
   let debt_token_canister = "";
 
   // Extract the required data from the filteredItems array
   if (filteredItems && filteredItems.length > 0) {
     const item = filteredItems[0][1].Ok;
 
     asset_name = item.asset_name ? item.asset_name[0] : "Unknown";
     accrued_to_treasury = item.accrued_to_treasury?.toString() || "0";
     borrow_rate = item.borrow_rate ? item.borrow_rate[0].toString() : "0";
     supply_cap = item.configuration.supply_cap?.toString() || "0";
     borrow_cap = formatNumber(item.configuration.borrow_cap?.toString()) || "0";
     ltv = item.configuration.ltv?.toString() || "0";
     supply_rate_apr = item.supply_rate_apr ? item.supply_rate_apr[0].toString() : "0";
     total_supply = item.total_supply ? formatNumber(item.total_supply) : "0";
     current_liquidity_rate = item.current_liquidity_rate?.toString() || "0";
     liquidity_index = item.liquidity_index?.toString() || "0";
     d_token_canister = item.d_token_canister ? item.d_token_canister[0] : "N/A";
     debt_token_canister = item.debt_token_canister ? item.debt_token_canister[0] : "N/A";
     total_borrowed = item.total_borrowed ? formatNumber(item.total_borrowed) : "0";
   }


  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex flex-col lg:flex-row items-start sxs3:flex-row sxs3:mb-7">
      <div className="w-full md:w-2/12">
              {supplyPercentage !== undefined ? (
                <CircleProgess progessValue={supplyPercentage} />
              ) : (
                <CircleProgess progessValue="..." />
              )}
            </div>
        <div className="w-full lg:w-9/12 flex gap-8 lg:px-3 overflow-auto whitespace-nowrap text-xs md:text-sm lg:text-base mt-3 lg:mt-0 sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden md:gap-10 sxs3:gap-4">
          {/* Total Borrowed */}
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Total Borrowed</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
             <p>  <span >{total_borrowed}</span> of <span>{borrow_cap}</span></p>
             <p className="text-[11px]">${formatNumber(usdBalance)} of ${formatNumber(borrowCapUsd)}</p>
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
            <p>{supply_rate_apr}%</p>
          </div>


          {/* Borrow cap */}
          {/* <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Borrow cap</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>1.50M</p>
          </div> */}
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
          {/* <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 basis-[190px] lg:grow-0 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Collector Contract
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <button>View Contract</button>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
