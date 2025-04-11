import React from 'react';

export const ZapIntoDlpContent = (onClose) => {
    return (
      <div className="text-white">
        {/* Header with back and close buttons */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button className="text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-lg font-medium">Zap into dLP</h2>
          <button className="text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* RDNT emissions section */}
        <div className="p-4 bg-gray-800 bg-opacity-30 mx-4 my-4 rounded-lg border border-blue-500/30">
          <div className="mb-2">
            <h3 className="font-medium">Want to activate RDNT emissions?</h3>
            <p className="text-sm text-gray-400">When your locked dLP value is greater than 5% of your total deposit value you become emissions eligible.</p>
          </div>
          
          <div className="flex items-center mt-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm">$0 (0%) out of $0 deposits</span>
          </div>
          
          <div className="mt-2 bg-gray-800 rounded-full h-2 w-full">
            <div className="h-2 bg-blue-500 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
        
        {/* Amount input section */}
        <div className="px-4">
          <div className="p-4 bg-gray-800 rounded-lg mb-2">
            <input
              type="text"
              placeholder="0.0"
              className="bg-transparent w-full text-2xl font-bold focus:outline-none"
            />
          </div>
          
          {/* Wallet/Borrow tabs */}
          <div className="flex mb-4">
            <button className="py-2 px-4 bg-gray-800 rounded-lg text-sm mr-2">Wallet</button>
            <button className="py-2 px-4 bg-transparent text-gray-400 text-sm">Borrow</button>
            <div className="ml-auto flex items-center">
              <span className="text-purple-500 mr-1">0</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          
          {/* ETH selector */}
          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <circle cx="12" cy="12" r="10" fill="#627EEA" />
                <path d="M12 6V14L16 10L12 6Z" fill="white" />
                <path d="M12 6L8 10L12 14V6Z" fill="white" fillOpacity="0.8" />
                <path d="M12 15V18L16 11L12 15Z" fill="white" />
                <path d="M12 18V15L8 11L12 18Z" fill="white" fillOpacity="0.8" />
              </svg>
              <span>ETH</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Add RDNT to dLP button */}
          <div className="border border-gray-700 border-dashed rounded-lg p-4 flex flex-col items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-gray-400 text-sm">Add RDNT to dLP (optional)</span>
          </div>
          
          {/* Slippage info */}
          <div className="text-sm text-gray-400 mb-4">
            Slippage: 5%
          </div>
          
          {/* Continue button */}
          <button className="w-full py-3 bg-purple-600 rounded-lg font-medium mb-4">
            Continue →
          </button>
          
          {/* Bottom value info */}
          <div className="border-t border-gray-800 pt-4 pb-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Total value of deposited assets</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Required locked dLP value for emissions</span>
              <span>$0</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Currently locked</span>
              <span>$0</span>
            </div>
          </div>
        </div>
      </div>
    );
};

// Also add default export
export default ZapIntoDlpContent;