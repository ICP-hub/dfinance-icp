import React from 'react';
import Button from '../Button';

const SupplyPopup = ({ asset, image, balance }) => {
    const transactionFee = 0.01; // Example transaction fee
    const hasEnoughBalance = balance >= transactionFee;

    return (
        <>
            <h1 className='font-semibold text-xl'>Supply {asset}</h1>
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
                                <img src={image} alt="connect_wallet_icon" className='object-cover w-8 h-8' />
                                <span className='text-lg'>{asset}</span>
                            </div>
                            <p className='text-xs mt-2'>Supply Balance {balance} Max</p>
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

            {!hasEnoughBalance && (
                <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-1 text-yellow-500">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c.72 0 1.392-.386 1.732-1l6.939-12a2 2 0 00-1.732-3H4.134a2 2 0 00-1.732 3l6.939 12c.34.614 1.012 1 1.732 1z" />
                    </svg>
                    <p className="text-yellow-700">
                        You do not have enough ETH in your account to pay for transaction fees on the Ethereum Sepolia network. Please deposit ETH from another account.
                    </p>
                </div>
            )}

            <div className="w-full flex justify-between items-center mt-3">
                <div className='w-auto flex items-end gap-2'>
                    <img src="/Group.svg" alt="Icon" className='w-8 h-8 object-contain' />
                </div>
                
                <div className="w-[200px]">
                    <input type="text" placeholder='Enter an amount' className={"w-full my-2 focus:outline-none bg-gradient-to-r text-white from-[#00000073] to-[#0000007d] rounded-md p-3 px-8 shadow-lg font-semibold text-sm placeholder:text-white"} />
                </div>
            </div>
        </>
    );
}

export default SupplyPopup;
