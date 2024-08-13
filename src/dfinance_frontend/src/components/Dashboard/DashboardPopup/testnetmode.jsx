import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Popup Component
const TestnetModePopup = ({ onClose, handleTestnetModeToggle }) => {
  const handleDisableTestnetClick = () => {
    handleTestnetModeToggle(false); // Update state to disable Testnet mode
    localStorage.removeItem("isTestnetMode"); // Remove Testnet mode from localStorage
    onClose(); // Close the popup after disabling Testnet mode
    toast.info('Testnet mode disabled successfully!');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black opacity-40 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg p-6 relative w-80 flex flex-col justify-between dark:bg-darkOverlayBackground dark:text-darkText"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6"
            onClick={onClose}
          >
            <X className="text-black w-6 h-6 dark:text-darkText cursor pointer" />
          </div>
          <div className="dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd dark:text-darkText">
            <h2 className="text-xl font-semibold mb-4 dark:text-darkText">Testnet Mode is ON</h2>
            <p className="text-gray-700 mb-4 dark:text-darkText">
              The app is running in testnet mode. Learn how it works in{' '}
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
    </>
  );
};

export default TestnetModePopup;
