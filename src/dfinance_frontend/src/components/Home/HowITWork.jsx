import { ArrowRight } from 'lucide-react';
import React, { useState } from 'react'
import { Link } from 'react-router-dom';

const HowITWork = () => {
    const [isHover, setIsHover] = useState(false)
    const handleHoverIn = (e) => {
        console.log(e);
        !isHover &&
            setIsHover(true)
    }

    const handleHoverOut = (e) => {
        isHover &&
            setIsHover(false)
    }
    return (
        <section className="mt-24">
            <div className="w-full text-center text-[#2A1F9D]">
                <h1 className="text-[45px] font-extralight">How it Works</h1>
            </div>
            <div className="w-fit mx-auto mt-10 flex justify-center items-center flex-col relative" onMouseEnter={handleHoverIn} onMouseLeave={handleHoverOut}>
                <div className={`lg:w-[700px] ${isHover ? "translate-y-[0%]  z-20" : "translate-y-[0%]"} stack_card_single `}>

                    <div className="w-1/12 flex justify-center text-[64px] font-bold">
                        1
                    </div>
                    <div className="w-11/12 p-3 text-sm lg:text-lg">
                        <p className="font-semibold text-[#517687]">Submit ICP Request for comment(ARC)</p>
                        <p className="text-[#737373] text-base">Discuss with community members and receive feedback.</p>

                        <Link to={'/'} className='flex mt-2 font-semibold items-center gap-2 text-sm text-[#2A1F9D]'>Visit docs <ArrowRight /></Link>
                    </div>
                </div>
                <div className={`lg:w-[800px]  ${isHover ? "translate-y-[-10%]  z-10" : "translate-y-[-35%] "} stack_card_single`}>

                    <div className="w-1/12 flex justify-center text-[64px] font-bold">
                        2
                    </div>
                    <div className="w-11/12 p-3 text-sm lg:text-lg">
                        <p className="font-semibold text-[#517687]">Create a snapshot</p>
                        <p className="text-[#737373] text-base">Gauge community sentiment on a new proposal through a Snapshot.</p>

                        <Link to={'/'} className='flex mt-2 font-semibold items-center gap-2 text-sm text-[#2A1F9D]'>How to create a snapshot <ArrowRight /></Link>
                    </div>
                </div>
                <div className={`lg:w-[900px] ${isHover ? "translate-y-[-25%] " : "translate-y-[-75%] "} stack_card_single`}>

                    <div className="w-1/12 flex justify-center text-[64px] font-bold">
                        3
                    </div>
                    <div className="w-11/12 p-3 text-sm lg:text-lg">
                        <p className="font-semibold text-[#517687]">Submit an Aave Request for Improvement(AIP)</p>
                        <p className="text-[#737373] text-base">The proposal is submitted through a GitHub pull request, & community votes on approvals.</p>
                    </div>
                </div>
            </div>

        </section>
    )
}

export default HowITWork