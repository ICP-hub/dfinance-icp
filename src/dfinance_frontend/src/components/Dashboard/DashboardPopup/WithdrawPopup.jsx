import React from "react";
import Button from "../../Common/Button";
import { Info } from "lucide-react";
import Vector from "../../../../public/Helpers/Vector.png"

const WithdrawPopup = ({ asset, image }) => {
  return (
    <>
      <h1 className="font-semibold text-xl">Withdraw {asset}</h1>
      <div className="flex flex-col gap-2 mt-5 text-sm">
        <div className="w-full">
          <div className="w-full flex justify-between my-2">
            <h1>Amount</h1>
            <h1>Slippage 0.10%</h1>
          </div>
          <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-400 dark:bg-darkBackground/30 dark:text-darkText cursor-pointer p-3 rounded-md">
            <div className="w-4/12">
              <p className="text-xl">0.00</p>
              <p className="mt-2">$0</p>
            </div>
            <div className="w-8/12 flex flex-col items-end">
              <div className="w-auto flex items-center gap-2">
                <img
                  src={image}
                  alt="connect_wallet_icon"
                  className="object-fill w-8 h-8"
                />
                <span className="text-lg">{asset}</span>
              </div>
              <p className="text-xs mt-2">Supply Balance 572.41 Max</p>
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
              <p className="text-xs mt-2">572.41 Max</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex  mt-3">
        <div className="flex items-center">
          <img src={Vector} alt="Vector Image" className="w-4 h-4 mr-1" />
          <h1>$6.06</h1>
          <Info size={16} className="ml-2" />
        </div>

      </div>
      <div>
      <Button title="Withdraw LINK" onClickHandler={() => console.log("Hello")} className={"my-2  w-full bg-gradient-to-tr from-[#ffaf5a]  to-[#81198E]  text-white  rounded-md p-3 px-8 shadow-lg font-semibold text-sm"} />
      </div>
    </>
  );
};

export default WithdrawPopup;
