import { Check, Wallet } from 'lucide-react';
import React, { useState } from 'react';

const PaymentDone = () => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) {
        return null; // Hide the component when isVisible is false
    }

    return (
        <div className="w-full flex flex-col items-center">
            <div className='border rounded-full p-2 my-3 text-green-500 border-green-500'>
                <Check />
            </div>
            <h1 className='font-semibold text-xl'>All done!</h1>
            <p className='text-[12px]'>You supplied 1.0000000 LINK</p>

            <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-1 items-center dark:bg-darkBackground/30 dark:text-darkText">
                <div className="flex items-center gap-3 text-nowrap text-[12px]">
                    <span>
                        Add aToken to wallet to track your balance.
                    </span>
                </div>
                <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2">
                    <Wallet />
                    Add to wallet
                </button>
            </div>
            <button 
                onClick={handleClose}
                className="bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
            >
                Close Now
            </button>
        </div>
    );
};

export default PaymentDone;
