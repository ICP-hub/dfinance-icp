import React from 'react'
import LineGraph from './LineGraph'
import { Zap } from 'lucide-react'

const EModeInfo = () => {
  return (
    <div className="w-full lg:w-10/12 text-[#5B62FE]">
      <div className="w-full flex px-2 lg:px-8">
        <h1 className='flex gap-2 items-center'>E-Mode Category  <Zap/>   AVAX correlated</h1>
      </div>
      <div className="w-full flex gap-8 mt-6 flex-wrap whitespace-nowrap">
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
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6 text-justify">
        <p>E-Mode increases your LTV for a selected category of assets, meaning that when E-mode is enabled, you will have higher borrowing power over assets of the same E-mode category which are defined by DFinance Governance. You can enter E-Mode from your Dashboard. To learn more about E-Mode and applied restrictions in FAQ or DFinance V3 Technical Paper.</p>
      </div>
    </div>
  )
}

export default EModeInfo