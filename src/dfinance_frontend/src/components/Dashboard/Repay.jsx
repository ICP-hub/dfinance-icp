import { Info } from 'lucide-react';
import React, { useState } from 'react';

const Repay = ({ asset, image }) => {
    const [amount, setAmount] = useState("0.00");

    const handleAmountChange = (e) => {
        setAmount(e.target.value);
    };

    const handleRepayETH = () => {
        // Implement your supply ETH logic here
        console.log("Repay", asset, "ETH:", amount);
    };
    return (
        <>
            <h1 className='font-semibold text-xl'>Repay {asset}</h1>
            <div className='flex flex-col gap-2 mt-5 text-sm'>
                <div className="w-full">
                    <div className="w-full flex justify-between my-2">
                        <h1>Amount</h1>
                        <h1>Slippage 0.10%</h1>
                    </div>
                    <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                        <div className="w-4/12">
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                className='text-lg focus:outline-none bg-gray-100  rounded-md p-2 w-full dark:bg-[#1D1B40] dark:text-darkText'
                                placeholder="0.00"

                            />
                            <p className='mt-2'>$30.00</p>
                        </div>
                        <div className="w-8/12 flex flex-col items-end">
                            <div className='w-auto flex items-center gap-2'>
                                <img src={image} alt="Item Image" className='object-fill w-8 h-8' />
                                <span className='text-lg'>{asset}</span>
                            </div>
                            <p className='text-xs mt-2'> Balance  0.0032560 Max</p>
                        </div>
                    </div>
                </div>
                <div className="w-full ">
                    <div className="w-full flex justify-between my-2">
                        <h1>Transaction overview</h1>
                    </div>
                    <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-[#1D1B40] dark:text-darkText">
                        <div className="w-full flex flex-col my-1">
                        <div className="w-full flex justify-between items-center mt-2">
                                <p className='text-nowrap -mt-12'>Remaining debt</p>
                                <p>
                                    <span className="text-[#2A1F9D] text-nowrap mt-2 dark:text-darkText">0.00001250 ETH</span>
                                    <span className="text-[#2A1F9D] dark:text-darkText">→</span> 
                                    <div className="w-full flex justify-end items-center mt-1 ">
                                <p className="text-[#2A1F9D] mb-2 dark:text-darkText">0.00002010 ETH</p>
                            </div>
                            <div className="w-full flex justify-end items-center ">
                               
                                <span className="text-[#909094] text-nowrap -mt-2">$6.0</span>
                                    <span className="text-[#909094] -mt-2 ">→</span> 
                                    <span className="text-[#909094] text-nowrap -mt-2">$6.0</span>
                            </div>
                                </p>
                            </div>
                            <div className="w-full flex justify-between items-center">
                                <p>Health Factor</p>
                                <p>
                                    <span className="text-green-500">5.23</span>
                                </p>
                            </div>
                            <div className="w-full flex justify-end items-center mt-1 ">
                                <p className="text-[#909094]">liquidation at &lt;1.5</p>
                            </div>
                        </div>
                       
                    </div>
                </div>
            </div>

            <div className="w-full mt-3">
                <div className='w-full'>
                    <div className="flex items-center">
                        <img src="/Vector.png" alt="Vector Image" className='w-4 h-4 mr-1 dark:text-[#8CC0D7]' />
                        <p className='dark:text-[#8CC0D7]'>$6.06</p>
                        <Info size={16} className="ml-2" />
                    </div>
                    <div className="w-full flex flex-col my-3 space-y-2">
                        <div className="w-full flex bg-[#6e3d17] p-1 rounded">
                            <div className="w-1/12 flex items-center justify-center">
                                <div className="warning-icon-container">
                                    <Info className=" text-[#f6ba43]" />
                                </div>
                            </div>
                            <div className="w-11/12 text-xs flex items-center text-white ml-1">
                                You do not have enough ETH in your account to pay for transaction fees on Ethereum Sepolia network. Please deposit ETH from another account.
                            </div>
                        </div>

                       
                    </div>
                </div>

                <div className="w-full">
                    <button
                        onClick={handleRepayETH}
                        className="bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
                    >
                        Repay {asset}
                    </button></div>
            </div>
        </>
    );
}

export default Repay;
