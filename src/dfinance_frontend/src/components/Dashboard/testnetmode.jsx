import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Popup Component
const TestnetModePopup = ({ onClose, setIsTestnetMode }) => {
  const handleDisableTestnetClick = () => {
    setIsTestnetMode(false); // Update state to disable Testnet mode
    localStorage.removeItem("isTestnetMode"); // Remove Testnet mode from localStorage
    onClose(); // Close the popup after disabling Testnet mode
    toast.info('Testnet mode disabled successfully!');
  };

  return (
    <div className="absolute left-[48px] top-[100px] mt-2 w-80 flex items-center justify-center z-50">
      <div className="bg-white border rounded-lg shadow-lg p-6 relative w-full flex flex-col justify-between dark:bg-darkBackground dark:text-darkText">
      <div
      className=" h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 "
      onClick={onClose}
    >
      <X className="text-black w-6 h-6" />
    </div>
        <div className='dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd dark:text-darkText'>
          <h2 className="text-xl font-semibold mb-4 dark:text-darkText">Testnet Mode is ON</h2>
          <p className="text-gray-700 mb-4 dark:text-darkText">
            The app is running in testnet mode. Learn how it works in {' '}
            <a
              href="/#faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              FAQ
            </a>
          </p>
        </div>
        <button
          onClick={handleDisableTestnetClick}
          className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 shadow-lg font-semibold text-sm"
        >
          Disable Testnet Mode
        </button>
      </div>
    
      <ToastContainer />
    </div>
  );
};

export default TestnetModePopup;
