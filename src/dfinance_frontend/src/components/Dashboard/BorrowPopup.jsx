import { Info, TriangleAlert } from "lucide-react";
import React, { useState } from "react";

const Borrow = ({ asset, image }) => {
  const [amount, setAmount] = useState("0.00");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };
  const handleAcknowledgeChange = (e) => {
    setIsAcknowledged(e.target.checked);
  };
  const handleBorrowETH = () => {
    // Implement your supply ETH logic here
    console.log("Borrow", asset, "ETH:", amount);
  };
  return (
    <>
      <h1 className="font-semibold text-xl">Borrow {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>
            <h1>Slippage 0.10%</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
            <div className="w-4/12">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg focus:outline-none bg-gray-100  rounded-md p-2 px-4 w-full dark:bg-darkBackground/5 dark:text-darkText"
                placeholder="0.00"
              />
              <p className="mt-2">$30.00</p>
            </div>
            <div className="w-8/12 flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="Item Image"
                  className="object-fill w-8 h-8"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-2"> Balance 0.0032560 Max</p>
            </div>
          </div>
        </div>
        <div className="w-full dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 px-4">
          <div className="w-full flex justify-between my-2">
            <h1>Transaction overview</h1>
          </div>
          <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/5 dark:text-darkText">
            <div className="w-full flex flex-col my-1">
              <div className="w-full flex justify-between items-center">
                <p>Health Factor</p>
                <p>
                  <span className="text-red-500">1.00</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="text-green-500">5.23</span>
                </p>
              </div>
              <div className="w-full flex justify-end items-center mt-1 ">
                <p className="text-gray-500">liquidation at &lt;1.5</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="w-full mt-3">
        <div className="w-full">
          <div className="flex items-center">
            <img
              src="/Vector.png"
              alt="Vector Image"
              className="w-4 h-4 mr-1"
            />
            <h1>$6.06</h1>
            <Info size={16} className="ml-2" />
          </div>
          
          <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="acknowledgeRisk"
                className="mr-2"
                onChange={handleAcknowledgeChange}
              />
              <label
                htmlFor="acknowledgeRisk"
                className="text-sm text-gray-700 dark:text-white"
              >
                I acknowledge the risk involved
              </label>
            </div>
          <div className="w-full flex flex-col my-3 space-y-2">
          <div className="w-full flex bg-[#BA5858] p-3 rounded-lg">
              <div className="w-1/12 flex items-center justify-center">
                <div className="warning-icon-container">
                  <TriangleAlert />
                </div>
              </div>
              <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                Borrowing this amount will reduce your health factor and
                increase risk of liquidation
              </div>
            </div>
            <div className="w-full flex bg-[#1e627e] dark:bg-[#59588D] opacity-80  p-2 rounded-md">
              <div className="w-1/12 flex items-center justify-center">
                <div className="warning-icon-container">
                  <Info className=" text-[#120f34]" />
                </div>
              </div>
              <div className="w-11/12 text-[11px] text-white flex items-center ml-2">
                Attention: Parameter changes via governance can alter your
                account health factor and risk of liquidation. Follow the ICP
                Governance forum for updates.
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <button
            onClick={handleBorrowETH}
            className="bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
          >
            Borrow {asset}
          </button>
        </div>
      </div>
    </>
  );
};

export default Borrow;
