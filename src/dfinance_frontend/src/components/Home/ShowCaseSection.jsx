import React from 'react'
import { MoveRight } from "lucide-react";


const ShowCaseSection = ({ data }) => {
    return (
        <>
            <div className="w-full">
                <h1 className="text-[#2A1F9D] font-bold text-xl xl:text-[64px]">{data.title}</h1>
            </div>
            <div className="w-full flex flex-wrap">
                <div className="w-full lg:w-8/12 pr-6">
                    <p className="text-[#737373] font-semibold my-6 text-sm lg:text-base">
                        {data.description}
                    </p>
                </div>
                {
                    data.isICP && <div className="w-full lg:w-4/12 text-white font-semibold pl-6 mt-5 lg:mt-0">
                        <div className="w-full flex justify-center lg:justify-start mb-2">
                            <button type="button" className="rounded-full p-2 px-6 bg-gradient-to-r from-[#4659CF] to-[#FCBD78] border border-[#517688] flex items-center gap-2">Apply for a Grant <MoveRight /> </button>
                        </div>
                        <div className="w-full flex justify-center lg:justify-end mb-2">
                            <button type="button" className="rounded-full p-2 px-6 bg-gradient-to-r from-[#4659CF] to-[#FCBD78] border border-[#517688] flex items-center gap-2">Subscribe to ICP News <MoveRight /> </button>
                        </div>
                    </div>
                }
            </div>

            {
                data.isICP ?
                    <div className="w-full flex justify-center">
                        <button type="button" className="bg-gradient-to-r from-[#4659CF] to-[#FCBD78] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm mt-5 text-white">LEARN MORE</button>
                    </div> :
                    <div className="w-full flex justify-center mt-8">
                        <img src="./Group-company.svg" alt="as" className='w-full h-full object-contain'/>
                    </div>
            }
        </>
    )
}

export default ShowCaseSection