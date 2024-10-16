import React, { useState } from "react";
import { X } from 'lucide-react';
import FaucetPayment from "./FaucetPayment";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
const FaucetPopup = ({ isOpen, onClose, asset, assetImage }) => {
  const {
    backendActor,
  } = useAuth()

  const [amount, setAmount] = useState("");
  const [showFaucetPayment, setShowFaucetPayment] = useState(false);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
    } else {
      const numericValue = Number(value);
      if (maxAmount) {
        setAmount(Math.min(numericValue, maxAmount));
      } else {
        setAmount(numericValue);
      }
    }
  };

  const handleMaxAmountClick = () => {
    if (maxAmount) {
      setAmount(maxAmount);
    }
  };

  const handleFaucetETH = (asset) => {
    console.log("Faucet", asset, "ETH:", amount);
    setShowFaucetPayment(true);
    try {
      if (backendActor) {
        const result = backendActor.faucet(asset, amount * 100000000);
        console.log("Faucet result.", result);
      }
    } catch (error) {
      console.error("Error:", error)
    }
  };

  const handleClose = () => {
    setShowFaucetPayment(false);
    onClose();
  };

  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const maxAmount = asset === "ckUSDC" ? 10000 : 500;

  return (
    <>
      {!showFaucetPayment && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl rounded-[1rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-7 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
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
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[60%]">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className="lg:text-lg focus:outline-none bg-gray-100 rounded-md p-2  w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                    min="0"
                  />
                </div>
                <div className="w-9/12 flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={assetImage}
                      alt="connect_wallet_icon"
                      className="object-cover w-8 h-8 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  {maxAmount && <p className="button1 cursor-pointer bg-blue-100 dark:bg-gray-700/45 text-xs mt-4 p-2 py-1 rounded-md button1"
                    onClick={handleMaxAmountClick}>{maxAmount} Max
                  </p>}
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => handleFaucetETH(asset)}
              disabled={amount <= 0}
              className={`w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] ${amount > 0
                ? "opacity-100 cursor-pointer"
                : "opacity-50 cursor-not-allowed"
                }`}
            >
              Faucet {asset}
            </button>
          </div>
        </div>
      )}
      {showFaucetPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50" />
          <FaucetPayment asset={asset} amount={amount} onClose={handleClose} />
        </div>
      )}
    </>
  );
};

export default FaucetPopup;
