import { Info, Check, Wallet, X } from "lucide-react";
import React, { useState ,useRef } from "react";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import {idlFactory as ledgerIdlFactoryckETH} from "../../../../../declarations/cketh_ledger";
import {idlFactory as ledgerIdlFactoryckBTC} from "../../../../../declarations/ckbtc_ledger";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useEffect } from "react";
const Repay = ({ asset, image ,balance ,  setIsModalOpen,isModalOpen,
  handleModalOpen,

  onLoadingChange  }) => {
  const [amount, setAmount] = useState(0);
  const modalRef = useRef(null); // Reference to the modal container
  const { createLedgerActor, backendActor } = useAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [error, setError] = useState('');
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const ledgerActorckBTC = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER, ledgerIdlFactoryckBTC), [createLedgerActor]);

  const ledgerActorckETH = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKETH_LEDGER, ledgerIdlFactoryckETH), [createLedgerActor]);

  const value = 5.23;
  const handleAmountChange = (e) => {
    const inputAmount = e.target.value;
    
    // Convert input to a number
    const numericAmount = parseFloat(inputAmount);
  
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= supplyBalance) {
        // Calculate and format the USD value
       
        setAmount(inputAmount);
        setError('');
      } else {
        setError('Amount exceeds the supply balance');
       
      }
    } else if (inputAmount === '') {
      // Allow empty input and reset error
      setAmount('');
    
      setError('');
    } else {
      setError('Amount must be a positive number');
     
    }
  };
  const fees = useSelector((state) => state.fees.fees);
  console.log("Asset:", asset); // Check what asset value is being passed
  console.log("Fees:", fees); // Check the fees object
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;

  const handleApprove = async () => {
    console.log("Approve function called for", asset);
    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    }

 // Convert amount and transferFee to numbers and add them
 const repayAmount = Number(amount);
 const totalAmount = repayAmount + transferfee;

    const approval = await ledgerActor.icrc2_approve({
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: totalAmount,
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

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);
  const handleRepayETH = async () => {
    console.log("Repay function called for", asset, amount);
    let ledgerActor;
  
    // Example logic to select the correct backend actor based on the asset
    if (asset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    }
  
    console.log("Backend actor", ledgerActor);
  
    try {
      // Convert the amount to the appropriate units, if necessary
      const amountInUnits = Number(amount); // Example conversion to appropriate units
  
      // Call the repay function on the selected ledger actor
      const repayResult = await backendActor.repay(asset, amountInUnits, []);
      console.log("Repay result", repayResult);
      setIsPaymentDone(true);
      setIsVisible(false);
  
      // Handle success, e.g., show success message, update UI, etc.
    } catch (error) {
      console.error("Error repaying:", error);
      // Handle error state, e.g., show error message
    }
  };
  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleRepayETH();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isLoading) {
        setIsModalOpen(false);
      }
    };
  
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);
  return (
    <>
    {isVisible && (
      <div className="repay-popup" ref={modalRef}>
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
              <p className="mt-1">$0</p>
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
              <p className="text-xs mt-4">{supplyBalance.toFixed(2)} Max </p>
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
                transaction fees on Ethereum Sepolia network. Please deposit {' '} {asset} {' '}
                from another account.
              </div>
            </div>
          </div>
        </div>

        <button
            onClick={handleClick}
            className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 flex justify-center items-center"
            disabled={isLoading}
          >
            {isApproved ? `Repay ${asset}` : `Approve ${asset} to continue`}
          </button>

          {/* Fullscreen Loading Overlay with Dim Background */}
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center z-50"
              style={{
                background: "rgba(0, 0, 0, 0.4)", // Dim background
                backdropFilter: "blur(1px)", // Blur effect
                pointerEvents: "all",
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
            <p>
            You have repayed {amount} d{asset}
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

export default Repay;
