import { Info } from 'lucide-react';
import React , { useState } from 'react';

const BorrowPopup = ({ asset, image }) => {
    const [amount, setAmount] = useState("0.00");

    const handleAmountChange = (e) => {
        setAmount(e.target.value);
    };

    const handleBorrowETH = () => {
        // Implement your supply ETH logic here
        console.log("Borrow", asset, "ETH:", amount);
    };
    return (
        <>
            <h1 className='font-semibold text-xl'>Borrow {asset}</h1>
            <div className='flex flex-col gap-2 mt-5 text-sm'>
                <div className="w-full">
                    <div className="w-full flex justify-between my-2">
                        <h1>Amount</h1>
                        <h1>Slippage 0.10%</h1>
                    </div>
                    <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 cursor-pointer p-3 rounded-md">
                        <div className="w-4/12">
                        <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className='text-lg focus:outline-none bg-gray-100  rounded-md p-2 w-full'
                placeholder="0.00"
                
            />
                            <p className='mt-2'>$30.00</p>
                        </div>
                        <div className="w-8/12 flex flex-col items-end">
                            <div className='w-auto flex items-center gap-2'>
                                <img src={image} alt="Item Image" className='object-fill w-8 h-8' />
                                <span className='text-lg'>{asset}</span>
                            </div>
                            <p className='text-xs mt-2'>Supply Balance  572.41 Max</p>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="w-full flex justify-between my-2">
                        <h1>Transaction overview</h1>
                    </div>
                    <div className="w-full bg-gray-100 hover:bg-gray-400 cursor-pointer p-3 rounded-md text-sm">
                        <div className="w-full flex justify-between items-center my-1">
                            <p>Health factor</p>
                            <p className='flex flex-col items-end'>
                                <span>24.04%</span>
                                <span>Liquidation at &lt; 1.0</span>
                            </p>
                        </div>
                        <div className="w-full flex justify-between items-center my-1">
                            <p>APY, borrow rate</p>
                            <p>2.02%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mt-3">
                <div className='w-full'>
                    <h1>$6.06</h1>

                    <div className="w-full flex my-3">
                        <div className="w-1/12">
                            <Info size={16}/>
                        </div>
                        <div className="w-11/12 text-xs">
                            Attention: Parameter changes via governance can alter your account health factor and risk of liquidation.
                            Follow the ICP Governance forum for updates.
                        </div>
                    </div>
                    
                </div>

                <div className="w-full">
                <button 
                onClick={handleBorrowETH}
                className="bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
            >
                Borrow {asset}
            </button></div>
            </div>
        </>
    );
}

export default BorrowPopup;
