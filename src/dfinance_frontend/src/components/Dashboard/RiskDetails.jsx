import React from 'react';

const RiskPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-3xl mx-auto z-10 border p-4 relative">
        {/* Close button */}
        <button
          className="text-gray-600 hover:text-gray-900 absolute top-4 right-4"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center pb-3">
            <h3 className="text-lg font-semibold text-center w-full" style={{ color: '#4659CF' }}>Liquidation Risk Parameters</h3>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Your health factor and loan to value determine the assurance of your collateral. To avoid liquidations, you can supply more collateral or repay borrow positions. <a href="#" className="text-blue-500 underline">Learn more</a>
          </div>
          <div className="mt-4 space-y-6">
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700">Health Factor</h4>
              <p className="text-sm text-gray-500">
                Safety of your deposited collateral against the borrowed assets and its underlying value.
              </p>
              <div className="flex items-center mt-2">
                <span className="text-red-500 font-bold mr-2">1.00</span>
                <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-green-500 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                </div>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded">5.26</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">If the health factor goes below 1, the liquidation of your collateral might be triggered.</p>
            </div>
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700">Current LTV</h4>
              <p className="text-sm text-gray-500">
                Your current loan to value based on your collateral supplied.
              </p>
              <div className="flex items-center mt-2">
                <span className="text-blue-500 font-bold mr-2">15.28%</span>
                <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-green-500 h-2.5 rounded-full" style={{ width: '76.57%' }}></div>
                </div>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-500 font-bold rounded">76.57%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">If your loan to value goes above the liquidation threshold, your collateral may be liquidated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPopup;
