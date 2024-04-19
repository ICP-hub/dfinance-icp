import React from 'react'
import CircleProgess from '../CircleProgess'
import LineGraph from './LineGraph'

const InterestRateModel = () => {
  return (
    <div className="w-full lg:w-10/12 ">
      <div className="w-full flex md:px-4 lg:px-8 text-xs md:text-sm lg:text-base">
        <div className="relative text-[#5B62FE]">
          <h1 className="text-[#2A1F9D] font-medium">
            Utilization Rate
          </h1>
          <hr
            className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
          />
          <p>43.24%</p>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6 text-xs md:text-sm lg:text-base">
          <button className='cursor-pointer hover:text-[#7369df]'>Borrow APR, variable</button>
          <button className='cursor-pointer hover:text-[#7369df]'>Utilization Rate</button>
        </div>
        <LineGraph />
      </div>
    </div>
  )
}

export default InterestRateModel