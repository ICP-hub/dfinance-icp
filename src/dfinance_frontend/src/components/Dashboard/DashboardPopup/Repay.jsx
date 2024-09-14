import { Info } from "lucide-react";
import React, { useState } from "react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
const Repay = ({ asset, image }) => {
  const [amount, setAmount] = useState("");
  const value = 5.23;
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const transferFee = fees[normalizedAsset] || fees.default;
  const handleRepayETH = () => {
    // Implement your supply ETH logic here

    console.log("Repay", asset, "ETH:", amount);
  };
  return (
    <>
      <h1 className="font-semibold text-xl">Repay {asset} </h1>

      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
            <div className="w-5/12">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg focus:outline-none bg-gray-100  rounded-md py-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                placeholder="Enter Amount"
              />
              <p className="mt-1">$30.00</p>
            </div>
            <div className="w-7/12 flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="Item Image"
                  className="object-fill w-6 h-6 rounded-full"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-4"> Balance 0.0032560 Max</p>
            </div>
          </div>
        </div>
        <div className="w-full ">
          <div className="w-full flex justify-between my-2">
            <h1>Transaction overview</h1>
          </div>
          <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
            <div className="w-full flex flex-col my-1">
              <div className="w-full flex justify-between items-center mt-2">
                <p className="text-nowrap -mt-12">Remaining debt</p>
                <p>
                  <span className="text-[#2A1F9D] text-nowrap mt-2 dark:text-darkText">
                    0.00001250 ETH
                  </span>
                  <span className="text-[#2A1F9D] dark:text-darkText">→</span>
                  <div className="w-full flex justify-end items-center mt-1 ">
                    <p className="text-[#2A1F9D] mb-2 dark:text-darkText">
                      0.00002010 ETH
                    </p>
                  </div>
                  <div className="w-full flex justify-end items-center ">
                    <span className="text-[#909094] text-nowrap -mt-2">
                      $6.0
                    </span>
                    <span className="text-[#909094] -mt-2 ">→</span>
                    <span className="text-[#909094] text-nowrap -mt-2">
                      $6.0
                    </span>
                  </div>
                </p>
              </div>
              <div className="w-full flex justify-between items-center">
                <p>Health Factor</p>
                <p>
                  <span
                    className={`${
                      value > 3
                        ? "text-green-500"
                        : value <= 1
                        ? "text-red-500"
                        : value <= 1.5
                        ? "text-orange-600"
                        : value <= 2
                        ? "text-orange-400"
                        : "text-orange-300"
                    }`}
                  >
                    {value}
                  </span>
                </p>
              </div>
              <div className="w-full flex justify-end items-center mt-1 ">
                <p className="text-[#909094]">liquidation at &lt;1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-3">
        <div className="w-full">
          <div className="flex items-center">
            <Fuel className="w-4 h-4 mr-1" />
            <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
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
          <div className="w-full flex flex-col my-3 space-y-2">
            <div className="w-full flex bg-[#6e3d17] p-2 rounded-md">
              <div className="w-1/12 flex items-center justify-center">
                <div className="warning-icon-container">
                  <Info className=" text-[#f6ba43]" />
                </div>
              </div>
              <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                You do not have enough {asset} in your account to pay for
                transaction fees on Ethereum Sepolia network. Please deposit {' '} {asset}
                from another account.
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <button
            onClick={handleRepayETH}
            className="bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
          >
            Repay {asset}
          </button>
        </div>
      </div>
    </>
  );
};

export default Repay;
