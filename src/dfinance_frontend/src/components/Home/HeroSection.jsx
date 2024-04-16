import React, { useState } from 'react'
import { useEffect } from 'react'
import { TEMP_HERO_COUNTER_NUMBER } from '../../utils/constants'

const HeroSection = () => {
    const [liquidityCounter, setLiquidityCounter] = useState(TEMP_HERO_COUNTER_NUMBER)

    useEffect(() => {
        const interval = setInterval(() => {
            setLiquidityCounter(prev => prev + 1)
        }, 500)

        return () => clearInterval(interval)
    }, [liquidityCounter])
  return (
      <div id="hero" className="flex justify-center text-2xl md:text-[32px] xl:text-[45px] font-medium lg:font-extralight text-[#2A1F9D] mt-4">
          <div className="w-fit xl:w-[700px] gap-2 flex flex-col items-center justify-center px-8">
              <h1 className="lg:my-2">ICP <span className="font-semibold bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] bg-clip-text text-transparent">DeFi</span> Earn And</h1>
              <h1 className="lg:my-2"><span className="font-semibold bg-gradient-to-tr from-[#4659CF]/100 to-[#C562BD]/70 bg-clip-text text-transparent">Borrow</span> Across Network</h1>
              <p className="text-sm font-normal text-[#737373] text-center mt-3">Contrary to popular belief, Lorem Ipsum is not simply random text.  45 BC text is It has roots in a piece of classical Latin literature from 45 BC.</p>


              <div className="w-fit mt-8 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl text-center p-6">
                  <h1 className="text-[#2A1F9D] font-bold lg:my-3">$ {liquidityCounter}</h1>
                  <p className="text-sm font-normal text-[#585454] lg:my-3">of liquidity is locked in crypto across {8} networks and over {15} markets.</p>
              </div>
          </div>

      </div>
  )
}

export default HeroSection