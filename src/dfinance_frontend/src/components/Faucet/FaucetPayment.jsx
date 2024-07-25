import { Check, X } from 'lucide-react';
import React, { useState } from 'react';

const FaucetPayment = ({ asset, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        setIsVisible(false);
        onClose(); // Also call onClose to close the parent popup
    };

    if (!isVisible) {
        return null; // Hide the component when isVisible is false
    }

    return (
        <div className="w-[400px] h-[340px] absolute bg-white shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
            <div className="w-full flex flex-col items-center">
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 focus:outline-none self-end">
                    <X size={24} />
                </button>
                <div className='border rounded-full p-2 my-3 text-green-500 border-green-500'>
                    <Check />
                </div>
                <h1 className='font-semibold text-xl'>All done!</h1>
                <p>You received 0.00025 {asset}</p>

                <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-3 items-center dark:bg-[#1D1B40] dark:text-darkText">
                    <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2">
                        Review Tx details
                    </button>
                </div>
                <button 
                    onClick={handleClose}
                    className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
                >
                    Close Now
                </button>
            </div>
        </div>
    );
};

export default FaucetPayment;
