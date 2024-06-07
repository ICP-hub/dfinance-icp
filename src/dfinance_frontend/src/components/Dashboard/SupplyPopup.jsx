import React from 'react'
import Button from '../Button'

const SupplyPopup = ({ }) => {
    return (
        <>
            <h1 className='font-semibold text-xl'>Supply LINK</h1>
            <div className='flex flex-col gap-2 mt-5 text-sm'>
                <div className="w-full">
                    <div className="w-full flex justify-between my-2">
                        <h1>Amount</h1>
                        <h1>Slippage 0.10%</h1>
                    </div>
                    <div className="w-full flex items-center justify-between bg-[#1A173E] hover:bg-[#13112c] cursor-pointer p-3 rounded-md">
                        <div className="w-4/12">
                            <p className='text-xl'>0.00</p>
                            <p className='mt-2'>$0</p>
                        </div>
                        <div className="w-8/12 flex flex-col items-end">
                            <div className='w-auto flex items-center gap-2'>
                                <img src={"/connect_wallet_icon.png"} alt="connect_wallet_icon" className='object-fill w-8 h-8' />
                                <span className='text-lg'>LINK</span>
                            </div>
                            <p className='text-xs mt-2'>Supply Balance  572.41 Max</p>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="w-full flex justify-between my-2">
                        <h1>Transaction overview</h1>
                    </div>
                    <div className="w-full bg-[#1A173E] hover:bg-[#13112c] cursor-pointer p-3 rounded-md text-sm">
                        <div className="w-full flex justify-between items-center my-1">
                            <p>Supply APY</p>
                            <p>24.04%</p>
                        </div>
                        <div className="w-full flex justify-between items-center my-1">
                            <p>Collateralization</p>
                            <p>Enabled</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-between items-center mt-3">
                <div className='w-auto flex items-end gap-2'>
                    <img src="/Group.svg" alt="Icon" className='w-8 h-8 object-contain' />
                    {/* <h1>$6.06</h1> */}
                </div>
                
                <div className="w-[200px]">
                    <input type="text" placeholder='Enter an amount' className={"w-full my-2 focus:outline-none bg-gradient-to-r text-white from-[#00000073] to-[#0000007d] rounded-md p-3 px-8 shadow-lg font-semibold text-sm placeholder:text-white"} />
                </div>
            </div>
        </>
    )
}

export default SupplyPopup