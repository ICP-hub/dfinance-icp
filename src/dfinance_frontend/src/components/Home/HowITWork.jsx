import React, { useEffect } from 'react'
import { GoArrowRight } from "react-icons/go";
import Aos from 'aos'
import 'aos/dist/aos.css'

const HowITWork = () => {

    useEffect(() => {
        Aos.init();
    }, [])

    // https://i.ibb.co/bb4YGbN/ICP-request.png
    // https://i.ibb.co/Bw2dGRz/Submit-ICPRequest.png
    // https://i.ibb.co/j8jGcgd/calculator.png
    return (
        <section className="mt-24 font-poppins ">
            <div className="w-full text-center text-[#2A1F9D] dark:text-darkText">
                <h1 className="text-[32px] md:text-[45px] font-extralight">How it Works</h1>
            </div>
           <div className='mt-[21px] lg:mt-[53px] grid grid-cols-1 gap-4 lg:gap-0 lg:grid-cols-3 '>

           <div data-aos="fade-left" data-aos-duration="2000" className='lg:mr-0 mr-auto ml-auto w-[309px] rounded-3xl lg:my-auto border p-[15px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]'>
                <div className='flex gap-4 mt-[35px]'>
                    <p className='text-[#233D63] text-[64px] font-[700] font-poppins dark:text-darkText'>1</p>
                    <div className='text-[16px] '>
                <p className='text-[#517687] font-[700] font-poppins dark:text-darkText'>Submit ICP </p>
              <p className='text-[#737373] font-[400] dark:text-darkText'>Request for comment Discuss with community members and receive feedback.</p>
              <p className='text-[#233D63] flex gap-3 text-[12px] mt-[14px] items-center font-[700] dark:text-darkText'>Visit Docs <GoArrowRight size={20} /></p>
              </div>
              </div>
              <img className='mx-auto mt-[16px] mb-[21px] w-[120px] ' src="https://i.ibb.co/bb4YGbN/ICP-request.png" draggable="false" />
            </div>

            <div className='mx-auto w-[309px] rounded-3xl border p-[15px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]'>
                <div className='flex gap-4 mt-[35px] '>
                    <p className='text-[#233D63] text-[64px] font-[700] font-poppins dark:text-darkText'>2</p>
                    <div className='text-[16px] '>
                <p className='text-[#517687] font-[700] font-poppins dark:text-darkText'>Create a snapshot</p>
              <p className='text-[#737373] font-[400] dark:text-darkText'>Gauge community sentiment on a new proposal through a Snapshot.</p>
              <p className='text-[#233D63] flex gap-3 text-[12px] mt-[14px] items-center font-[700] dark:text-darkText'>How to create Snapshot <GoArrowRight size={20} /></p>
              </div>
              </div>
              <img className='mx-auto mt-[36px] mb-[21px] w-[157px]  ' src="https://i.ibb.co/j8jGcgd/calculator.png" draggable="false" />
            </div>
         

           <div data-aos="fade-right" data-aos-duration="2000" className='lg:ml-0 ml-auto mr-auto w-[309px] rounded-3xl border lg:my-auto p-[15px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0]  dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]'>
                <div className='flex gap-4 mt-[25px]'>
                    <p className='text-[#233D63] text-[64px] font-[700] font-poppins dark:text-darkText'>3</p>
                    <div className='text-[16px] dark:text-darkText'>
                <p className='text-[#517687] font-[700] font-poppins dark:text-darkText'>Submit an DFinance Request for Improvement</p>
              <p className='text-[#737373] font-[400] dark:text-darkText'>The proposal is submitted through a GitHub pull request, & community votes on approvals</p>
              </div>
              </div>
              <img className='mx-auto mt-[16px] mb-[21px] w-[153px]  ' src="https://i.ibb.co/Bw2dGRz/Submit-ICPRequest.png" draggable="false" />
            </div>
            </div> 
        </section>
    )
}

export default HowITWork