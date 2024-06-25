import React from 'react';

const SwitchTokensPopup = ({ onClose }) => {
  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow-xl border w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Switch Tokens</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            &times;
          </button>
        </div>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-red-500">
            Please switch to Ethereum. <a href="#" className="text-blue-500 underline">Switch Network</a>
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-gray-700">Token</label>
            <span className="text-blue-500 text-sm">Slippage 0.10%</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md">
            <input type="text" className="flex-grow p-2 border rounded-md" value="0.00" readOnly />
            <select className="p-2 border rounded-md">
              <option>ETH</option>
              {/* Add more options here */}
            </select>
          </div>
          <div className="flex justify-center my-2">
            <button className="text-gray-600 hover:text-gray-900">
              &uarr;&darr;
            </button>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md">
            <input type="text" className="flex-grow p-2 border rounded-md" value="0.00" readOnly />
            <select className="p-2 border rounded-md">
              <option>1INCH</option>
              {/* Add more options here */}
            </select>
          </div>
          <button className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-2 rounded-md mt-4">
            Switch
          </button>
        </div>
      </div>
    </>
  );
};

export default SwitchTokensPopup;
