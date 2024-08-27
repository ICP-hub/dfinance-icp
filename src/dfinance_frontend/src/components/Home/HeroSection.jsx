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
        <div id="hero" className="flex justify-center text-2xl md:text-[32px] xl:text-[45px] font-medium lg:font-extralight text-[#2A1F9D] mt-4 dark:text-darkText">
            <div className="w-fit xl:w-[700px] gap-2 flex flex-col items-center justify-center px-8">
                <h1 className="text-lg lg:text-2xl xl:text-3xl ">
                    ICP <span className="font-semibold bg-gradient-to-r from-purple-500 to-pink-400 bg-clip-text text-transparent">DeFi</span> Earn And
                </h1>
                <h1 className="text-xl md:text-3xl xl:text-4xl ">
                    <span className="font-semibold bg-gradient-to-tr from-[#4659CF]/100 to-[#C562BD]/70 bg-clip-text text-transparent">Borrow</span> Across Network
                </h1>
                <p className="text-sm mt-6 font-normal text-[#737373] text-center dark:text-darkTextSecondary leading-snug mx-auto max-w-xs sm:max-w-md lg:max-w-2xl lg:leading-snug lg:text-base lg:max-h-[3.5rem] overflow-hidden">
                Contrary to common belief, smart investments aren’t just luck. They’re rooted in strategy and sound financial principles.
</p>




                <div className="w-full mt-10 h-32 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl text-center p-4 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                    <h1 className="text-[#2A1F9D] font-bold lg:my-3 dark:text-darkText">$ {liquidityCounter}</h1>
                    <p className="text-sm font-normal text-[#585454] lg:my-3 dark:text-darkText">of liquidity is locked in crypto across {8} networks and over {15} markets.</p>
                </div>

            </div>
        </div>
    )
}

export default HeroSection