import { Check, Wallet, X } from "lucide-react";

import React from "react";

const PaymentDone = ({ asset, isModalOpen, handleModalOpen }) => {
  
   /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div className="w-full flex flex-col items-center">
      <button
        open={isModalOpen}
        onClick={handleModalOpen}
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
        <button className="my-2 bg-[#AEADCB] rounded-md p-3 px-4 shadow-lg font-semibold text-sm flex items-center gap-2 mb-3">
          <Wallet />
          Add to wallet
        </button>
      </div>
      <button
        open={isModalOpen}
        onClick={handleModalOpen}
        className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
      >
        Close Now
      </button>
    </div>
  );
};

export default PaymentDone;
