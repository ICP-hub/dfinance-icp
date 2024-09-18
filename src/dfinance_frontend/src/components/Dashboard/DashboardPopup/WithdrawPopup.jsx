import React, { useState } from "react";
import Button from "../../Common/Button";
import { Info } from "lucide-react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";


const WithdrawPopup = ({ asset, image }) => {
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';
  const [amount, setAmount] = useState("");
  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = BigInt(transferFee);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const { createLedgerActor, backendActor } = useAuth();

  const ledgerActorckBTC = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER, ledgerIdlFactoryckBTC), [createLedgerActor]);

  const ledgerActorckETH = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKETH_LEDGER, ledgerIdlFactoryckETH), [createLedgerActor]);

  const handleWithdraw = async () => {
    console.log("Withdraw function called for", asset, amount);
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

      const amountInUnits = BigInt(amount); 
      // Call the withdraw function on the selected ledger actor
      const withdrawResult = await backendActor.withdraw(asset, amountInUnits, [], true);
      console.log("Withdraw result", withdrawResult);
      // window.location.reload()

      // Handle success, e.g., show success message, update UI, etc.
    } catch (error) {
      console.error("Error withdrawing:", error);
      // Handle error state, e.g., show error message
    }
  };

  return (
    <>
      <h1 className="font-semibold text-xl">Withdraw {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>

          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
            <div className="w-5/12 md:w-4/12">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                 className="text-lg focus:outline-none bg-gray-100 rounded-md py-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                placeholder="Enter Amount"
              />
              <p className="">$0</p>
            </div>
            <div className="w-7/12 md:w-8/12 flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="connect_wallet_icon"
                  className="object-fill w-6 h-6 rounded-full"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-4">Supply Balance 0 Max</p>
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
              <p className="text-xs mt-2">0 Max</p>
            </div>
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
      </div>
    </>
  );
};

export default WithdrawPopup;
