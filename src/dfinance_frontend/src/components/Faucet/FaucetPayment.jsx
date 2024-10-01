import { Check, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const FaucetPayment = ({ asset, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                handleClose();
            }
        };

        // Add event listener for clicks outside the component
        document.addEventListener('mousedown', handleClickOutside);

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        return () => {
            // Remove event listener on cleanup
            document.removeEventListener('mousedown', handleClickOutside);

            // Restore body scrolling
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        onClose(); // Also call onClose to close the parent popup
        window.location.reload()
    };

    if (!isVisible) {
        return null; // Hide the component when isVisible is false
    }

    return (
        <div ref={modalRef} className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
            <div className="w-full flex flex-col items-center">
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 focus:outline-none self-end">
                    <X size={24} />
                </button>
                <div className='border rounded-full p-2 my-3 text-green-500 border-green-500'>
                    <Check />
                </div>
                <h1 className='font-semibold text-xl'>All done!</h1>
                <p>You received 1,000 {asset}</p>


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
