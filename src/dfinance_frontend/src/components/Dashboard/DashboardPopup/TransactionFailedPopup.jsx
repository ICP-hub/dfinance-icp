import React from 'react';

const Popup = ({ show, onClose }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${show ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="bg-white p-6 rounded-lg text-center shadow-lg w-80">
      <img
       src="/cross.png"
       alt="connect_wallet_icon"
       className="w-10 h-10"
     />
        <h2 className="text-xl font-bold text-gray-800">Transaction Failed</h2>
        <p className="mt-2 text-gray-600">
          You can report incident to our <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-blue-500">Discord</a> or <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-500">Github</a>
        </p>
        <button 
          onClick={() => navigator.clipboard.writeText("Error message goes here").then(() => alert("Error message copied to clipboard!"))}
          className="mt-4 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
        >
          COPY ERROR
        </button>
        <button 
          onClick={onClose} 
          className="mt-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 px-4 rounded hover:from-pink-600 hover:to-orange-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Popup;
