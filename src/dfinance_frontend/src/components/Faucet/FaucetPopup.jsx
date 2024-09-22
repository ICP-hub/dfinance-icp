import React, { useState } from "react";
import { Info, X } from 'lucide-react';
import FaucetPayment from "./FaucetPayment"; // Import FaucetPayment component
import Vector from "../../../public/Helpers/Vector.png"
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
const FaucetPopup = ({ asset, image, onClose }) => {
  const [amount, setAmount] = useState("");
  const [showFaucetPayment, setShowFaucetPayment] = useState(false); // State for showing/hiding FaucetPayment popup

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleFaucetETH = () => {
    console.log("Faucet", asset, "ETH:", amount);
    setShowFaucetPayment(true); // Show FaucetPayment popup after faucet action
  };

  const handleClose = () => {
    setShowFaucetPayment(false);
    onClose();
  };
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  return (
    <>
      {!showFaucetPayment && (
        <div className="w-[325px] lg1:w-[420px] h-[290px] absolute bg-white shadow-xl filter backdrop-blur-lg rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-semibold text-xl">Faucet {asset}</h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 cursor-pointer p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-3/12">
                <p>Amount</p>
                </div>
                <div className="w-9/12 flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-8 h-8"
                    />
                    <span className="text-lg">1,000{asset}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex  mt-3">
        <div className="flex items-center">
          <Fuel className="w-4 h-4 mr-1" />
          <h1 className="text-lg font-semibold mr-1">{transferfee}</h1>
          <img
            src={image}
            alt="asset icon"
            className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
          />
          <div className="relative group">
            <Info size={16} className="ml-2 cursor-pointer" />

            {/* Tooltip */}
            <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
              Fees deducted on every transaction
            </div>
          </div>
        </div>

      </div>
          <div>
            <button
              onClick={handleFaucetETH}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
            >
              Faucet {asset}
            </button>
          </div>
        </div>
      )}

      {showFaucetPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50" />
          <FaucetPayment asset={asset} onClose={handleClose} />
        </div>
      )}
    </>
  );
};

export default FaucetPopup;
