import React, { useState } from "react";
import Button from "../../Common/Button";
import { Info, Check, Wallet, X } from "lucide-react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";

const WithdrawPopup = ({ asset, image, balance ,  setIsModalOpen, }) => {
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : "default";
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;

  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;

    // Convert input to a number
    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= supplyBalance) {
        // Calculate and format the USD value

        setAmount(inputAmount);
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else if (inputAmount === "") {
      // Allow empty input and reset error
      setAmount("");

      setError("");
    } else {
      setError("Amount must be a positive number");
    }
  };

  const { createLedgerActor, backendActor } = useAuth();

  const ledgerActorckBTC = useMemo(
    () =>
      createLedgerActor(
        process.env.CANISTER_ID_CKBTC_LEDGER,
        ledgerIdlFactoryckBTC
      ),
    [createLedgerActor]
  );

  const ledgerActorckETH = useMemo(
    () =>
      createLedgerActor(
        process.env.CANISTER_ID_CKETH_LEDGER,
        ledgerIdlFactoryckETH
      ),
    [createLedgerActor]
  );

  const handleWithdraw = async () => {
    console.log("Withdraw function called for", asset, amount);
    setIsLoading(true);
    let ledgerActor;

    // Example logic to select the correct backend actor based on the asset
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    } else {
      console.error("Unknown asset:", asset);
      return;
    }

    try {
      const amountInUnits = Number(amount);
      // Call the withdraw function on the selected ledger actor
      const withdrawResult = await backendActor.withdraw(
        asset,
        amountInUnits,
        [],
        true
      );
      console.log("Withdraw result", withdrawResult);
      setIsPaymentDone(true);
      setIsVisible(false);
      

      // Handle success, e.g., show success message, update UI, etc.
    } catch (error) {
      console.error("Error withdrawing:", error);
      // Handle error state, e.g., show error message
    }
  };
  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  return (
    <>
     {isVisible && (
      <div>
      <h1 className="font-semibold text-xl">Withdraw {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
            <div className="w-5/12 ">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg focus:outline-none bg-gray-100 rounded-md py-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                placeholder="Enter Amount"
              />
              <p className="">$0</p>
            </div>
            <div className="w-7/12  flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="connect_wallet_icon"
                  className="object-fill w-6 h-6 rounded-full"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-4">{supplyBalance.toFixed(2)} Max </p>
            </div>
          </div>
        </div>
        <div className="w-full ">
          <div className="w-full flex justify-between my-2 dark:text-darkText">
            <h1>Transaction overview</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
            <div className="w-8/12">
              <p className="text-sm">Remaining supply</p>
            </div>
            <div className="w-4/12 flex flex-col items-end">
              <p className="text-xs mt-2">{supplyBalance.toFixed(2)} Max </p>
            </div>
          </div>
        </div>

        <div className="w-full flex  mt-3">
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
        </div>

        <div>
          <Button title="Withdraw LINK" onClickHandler={handleWithdraw} />
          {isLoading && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{
                background: "rgba(0, 0, 0, 0.4)", // Dim background
                backdropFilter: "blur(1px)", // Blur effect
              }}
            >
              <div className="loader"></div>
            </div>
          )}
        </div>
      </div>
      </div>
     )}
      {isPaymentDone && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 hover:text-gray-600 focus:outline-none self-end"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <p className="mt-2"> 
            You have withdrawn {amount} d{asset}
            </p>

            {/* <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-3 items-center dark:bg-[#1D1B40] dark:text-darkText">
              <div className="flex items-center gap-3 mt-3 text-nowrap text-[11px] lg1:text-[13px]">
                <span>Add dToken to wallet to track your balance.</span>
              </div>
              <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2 mb-2">
                <Wallet />
                Add to wallet
              </button>
            </div> */}
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawPopup;
