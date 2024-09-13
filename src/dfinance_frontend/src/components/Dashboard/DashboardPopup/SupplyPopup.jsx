import React, { useState } from "react";
import { Info, Check, Wallet, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import Setting from "../../../../public/Helpers/settings.png";
const SupplyPopup = ({
  asset,
  image,
  balance,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
}) => {
  const transactionFee = 0.01;
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : 'default';

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const transferFee = fees[normalizedAsset] || fees.default;
  const hasEnoughBalance = balance >= transactionFee;
  const value = 5.23;
  const [amount, setAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const { createLedgerActor, backendActor } = useAuth();

  const ledgerActor = createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER);

  const handleApprove = async () => {
    console.log("Approve function called for", asset);
    console.log("Ledger Actor", ledgerActor);

    const approval = await ledgerActor.icrc2_approve({
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: 100000,
      expected_allowance: [],
      expires_at: [],
      spender: {
        owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
        subaccount: [],
      },
    });

    console.log("Approve", approval);
    setIsApproved(true);
    console.log("isApproved state after approval:", isApproved);
  };
  const isCollateral = true;
  const handleSupplyETH = async () => {
    console.log("Supply function called for", asset, "ETH:", amount);
    // const supply = await
    console.log("Backend actor", backendActor);
    const sup = await backendActor.deposit("ckbtc", 100, "user", 0);
    console.log("Supply", sup);
    setIsPaymentDone(true); // Show payment done popup after successful transaction
    setIsVisible(false); // Close SupplyPopup
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false); // Hide the payment done popup
    setIsModalOpen(false);
  };

  return (
    <>
      {isVisible && (
        <div className="supply-popup">
          <h1 className="font-semibold text-xl">Supply {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2 dark:text-darkText">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-300 cursor-pointer p-3 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-3/12">
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className="text-xs focus:outline-none bg-gray-100 rounded-md py-2  w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder="Enter Amount"
                  />
                  <p className="text-xs text-gray-500 mt-3">$0</p>
                </div>
                <div className="w-9/12 flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-8 h-8 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p className="text-xs mt-3">Supply Balance {balance} Max</p>
                </div>
              </div>
            </div>
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 hover:bg-gray-300 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex justify-between items-center my-1">
                  <p>Supply APY</p>
                  <p>24.04%</p>
                </div>
                <div className="w-full flex justify-between items-center my-1">
                  <p>Collateralization</p>
                  <p
                    className={`font-semibold ${
                      isCollateral ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isCollateral ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center">
                    <p>Health Factor</p>
                    <p>
                      <span className="text-red-500">1.00</span>
                      <span className="text-gray-500 mx-1">→</span>
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
                  <div className="w-full flex justify-end items-center mt-1">
                    <p className="text-gray-500">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!hasEnoughBalance && (
            <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
              <p className="text-yellow-700">
                You do not have enough {asset} in your account to pay for
                transaction fees on the Ethereum Sepolia network. Please deposit{" "}
                {asset} from another account.
              </p>
            </div>
          )}

          <div className="w-full flex justify-between items-center mt-3">
            <div className="flex items-center justify-start">
              <Fuel className="w-4 h-4 mr-1" />
              <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
              <img
                src={image}
                alt="asset icon"
                className="object-cover w-8 h-8 rounded-full" // Ensure the image is fully rounded
              />
              <div className="relative group">
                <Info size={16} className="ml-2 cursor-pointer" />

                {/* Tooltip */}
                <div className="absolute left-1/2 transform -translate-x-1/3 bottom-full mb-4 hidden group-hover:flex items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-4 shadow-lg border border-gray-300 whitespace-nowrap">
                  Fees deducted on every transaction
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <p
                className={`text-xs whitespace-nowrap ${
                  isApproved ? "text-green-500" : "text-red-500"
                }`}
              >
                {isApproved
                  ? "Approved with signed message"
                  : "Approve with signed message"}
              </p>
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-3">
            <button
              onClick={() => {
                console.log("Button clicked");
                isApproved ? handleSupplyETH() : handleApprove();
              }}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
              // disabled={!hasEnoughBalance} // Disable button if balance is not enough
            >
              {isApproved ? `Supply ${asset}` : `Approve ${asset} to continue`}
            </button>
          </div>
        </div>
      )}

      {isPaymentDone && (
        <div className="w-[325px] lg1:w-[420px]   h-[380px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
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
            <p>You received 0.00025 {asset}</p>

            <div className="w-full my-2 focus:outline-none bg-gradient-to-r mt-6 bg-[#F6F6F6] rounded-md p-3 px-8 shadow-lg text-sm placeholder:text-white flex flex-col gap-3 items-center dark:bg-[#1D1B40] dark:text-darkText">
              <div className="flex items-center gap-3 mt-3 text-nowrap text-[11px] lg1:text-[13px]">
                <span>Add dToken to wallet to track your balance.</span>
              </div>
              <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-2 shadow-lg font-semibold text-sm flex items-center gap-2 mb-2">
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
