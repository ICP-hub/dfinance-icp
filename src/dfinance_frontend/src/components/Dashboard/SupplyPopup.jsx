import React, { useState } from "react";
import { Info, Check, Wallet } from "lucide-react"; // Ensure lucide-react is installed

const SupplyPopup = ({ asset, image, balance }) => {
  const transactionFee = 0.01; // Example transaction fee
  const hasEnoughBalance = balance >= transactionFee;

  const [amount, setAmount] = useState("0.00");
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleApprove = () => {
    console.log("Approve function called for", asset);
    setIsApproved(true); // Change to true after approval
    console.log("isApproved state after approval:", isApproved);
  };

  const handleSupplyETH = () => {
    console.log("Supply function called for", asset, "ETH:", amount);
    setIsPaymentDone(true); // Show payment done popup after successful transaction
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false); // Hide the payment done popup
  };

  return (
    <>
      <h1 className="font-semibold text-xl">Supply {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2 dark:bg-darkBackground dark:text-darkText">
            <h1>Amount</h1>
            <h1>Slippage 0.10%</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 cursor-pointer p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
            <div className="w-3/12">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-[#1D1B40] dark:text-darkText"
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-2">$0</p>
            </div>
            <div className="w-9/12 flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="connect_wallet_icon"
                  className="object-cover w-8 h-8"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-2">Supply Balance {balance} Max</p>
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Transaction overview</h1>
          </div>
          <div className="w-full bg-gray-100 hover:bg-gray-300 cursor-pointer p-3 rounded-md text-sm dark:bg-[#1D1B40] dark:text-darkText">
            <div className="w-full flex justify-between items-center my-1">
              <p>Supply APY</p>
              <p>24.04%</p>
            </div>
            <div className="w-full flex justify-between items-center my-1">
              <p>Collateralization</p>
              <p className="bg-[#68c861]  text-[#2A1F9D] rounded-full p-2">Enabled</p>
            </div>
            <div className="w-full flex flex-col my-1">
              <div className="w-full flex justify-between items-center">
                <p>Health Factor</p>
                <p>
                  <span className="text-red-500">1.00</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="text-green-500">5.23</span>
                </p>
              </div>
              <div className="w-full flex justify-end items-center mt-1">
                <p className="text-gray-500">liquidation at &lt;1.5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasEnoughBalance && (
        <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-1 text-yellow-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c.72 0 1.392-.386 1.732-1l6.939-12a2 2 0 00-1.732-3H4.134a2 2 0 00-1.732 3l6.939 12c.34.614 1.012 1 1.732 1z" />
          </svg>
          <p className="text-yellow-700">
            You do not have enough ETH in your account to pay for transaction fees on the Ethereum Sepolia network. Please deposit ETH from another account.
          </p>
        </div>
      )}

      <div className="w-full flex justify-between items-center mt-3">
        <div className="flex items-center justify-start">
          <img src="/Vector.png" alt="Vector Image" className="w-4 h-4 mr-1" />
          <h1>$6.06</h1>
          <Info size={16} className="ml-2" />
        </div>

        <div className="flex items-center">
          <p className="text-xs">Approved with signed message</p>
          <img
            src="/settings.png"
            alt="settings_icon"
            className="object-contain w-[20px] h-[20px]"
          />
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-3">
        <button
          onClick={() => {
            console.log("Button clicked");
            isApproved ? handleSupplyETH() : handleApprove();
          }}
          className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
          disabled={!hasEnoughBalance} // Disable button if balance is not enough
        >
          {isApproved ? `Supply ${asset}` : `Approve ${asset} to continue`}
        </button>
      </div>

      {isPaymentDone && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-md shadow-md text-center">
            <div className='border rounded-full p-2 my-3 text-green-500 border-green-500'>
              <Check />
            </div>
            <h1 className='font-semibold text-xl'>All done!</h1>
            <p>You supplied {amount} {asset}</p>
            <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-3 items-center dark:bg-[#1D1B40] dark:text-darkText">
              <div className="flex items-center gap-3 text-nowrap">
                <span>Add aToken to wallet to track your balance.</span>
              </div>
              <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2">
                <Wallet />
                Add to wallet
              </button>
            </div>
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplyPopup;
