import React from "react"
import CircleProgess from "../../Common/CircleProgess"
import LineGraph from "../../Common/LineGraph"
import { Check } from 'lucide-react';
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../../../utils/useAuthClient";
import { useCallback
 } from "react";
 import { useEffect } from "react";

const SupplyInfo = ({filteredItems}) => {

  const {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
  } = useAuth()
  const { id } = useParams();

  const [balance, setBalance] = useState(null);
  const [usdBalance, setUsdBalance] = useState(null);
  const [supplyCapUsd, setSupplyCapUsd] = useState(null);
  const [borrowCapUsd, setBorrowCapUsd] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);
  const ledgerActor = useMemo(() => createLedgerActor(process.env.CANISTER_ID_CKBTC_LEDGER), [createLedgerActor]);

  const fetchBalance = useCallback(async () => {
    if (isAuthenticated && ledgerActor && principalObj) {
      try {
        const account = { owner: principalObj, subaccount: [] };
        const balance = await ledgerActor.icrc1_balance_of(account);
        setBalance(balance.toString());
        console.log("Fetched Balance:", balance.toString());
      } catch (error) {
        console.error("Error fetching balance:", error);
        setError(error);
      }
    }
  }, [isAuthenticated, ledgerActor, principalObj]);

  const fetchConversionRate = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setConversionRate(data['internet-computer'].usd);
      console.log("Fetched Conversion Rate:", data['internet-computer'].usd);
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      setError(error);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBalance(), fetchConversionRate()]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchBalance, fetchConversionRate]);

  let supply_cap
  let borrow_cap
  filteredItems.map((item, index) =>{
     supply_cap = item[1].Ok.configuration.supply_cap;
     borrow_cap = item[1].Ok.configuration.borrow_cap;
  })

  useEffect(() => {
    if (balance && conversionRate) {
      const balanceInUsd = (parseFloat(balance) * conversionRate).toFixed(2);
      const supplyCapUsd = (parseFloat(supply_cap) * conversionRate).toFixed(2);
      const borrowCapUsd = (parseFloat(borrow_cap) * conversionRate).toFixed(2);
      setUsdBalance(balanceInUsd);
      setSupplyCapUsd(supplyCapUsd)
      setBorrowCapUsd(borrowCapUsd)
    }

    
  }, [balance, conversionRate]);

 

  return (

  
     
      <div className="w-full lg:w-10/12 ">
      {filteredItems.map((item, index) => (
      <>
      <div className="w-full flex flex-col md:flex-row items-start sxs3:flex-row sxs3:mb-7">
        <div className="w-full md:w-2/12">
          <CircleProgess progessValue={75} />
        </div>
        <div className="w-full lg:9/12  md:w-12/12 flex gap-12 lg:px-3 overflow-auto text-xs md:text-sm lg:text-base whitespace-nowrap sxs3:flex-col lg:flex-row md:flex-row sxs3:text-base sxs3:overflow-hidden sxs3:gap-4 md:gap-14">
        
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold mb-[1px] dark:text-darkText">Total Supplied</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5 mb-[1px]`}
            />
            <p>  <span >{item[1].Ok.total_supplied ? item[1].Ok.total_supplied : "0"}</span> of <span>{item[1].Ok.configuration.supply_cap.toString()}</span></p>
            <p className="text-[11px]">${usdBalance} of ${supplyCapUsd}</p>
          </div>
          <hr
              className={`ease-in-out duration-500 bg-[#8CC0D7] md:h-[40px] md:w-[1px] sxs3:w-[120px] sxs3:h-[2px]`}
            />
          <div className="relative text-[#5B62FE] dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold  mb-[1px] dark:text-darkText">Total Borrowed</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5  mb-[1px]`}
            />
              <p>  <span >{item[1].Ok.total_borrow ? item[1].Ok.total_borrow : "0"}</span> of <span>{item[1].Ok.configuration.borrow_cap.toString()}</span></p>
              <p className="text-[11px]">${usdBalance} of ${borrowCapUsd}</p>
          </div>
        </div>
      </div>
      <div className="w-full mt-3 border-t border-t-[#5B62FE] py-6">
        <div className="w-full flex gap-5 text-[#2A1F9D] mb-6 dark:text-darkText">
          <button className='cursor-pointer hover:text-[#7369df]'>Supply APR</button>
        </div>
        <LineGraph />

        <p className="mt-8 text-[#5B62FE] flex items-center gap-2 dark:text-darkText">
          Collateral usage <Check /> Can be collateral
        </p>

        <div className="w-full flex flex-wrap gap-8 mt-6 whitespace-nowrap">
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Max LTV</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{item[1].Ok.configuration.ltv}</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
              Liquidation threshold
            </h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{item[1].Ok.configuration.liquidation_threshold}</p>
          </div>
          <div className="relative text-[#5B62FE] p-3 border border-[#FFFFFF] flex-1 rounded-xl dark:text-darkText">
            <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">Liquidation penalty</h1>
            <hr
              className={`ease-in-out duration-500 bg-[#5B62FE] h-[2px] w-1/5`}
            />
            <p>{item[1].Ok.configuration.liquidation_bonus}</p>
          </div>
        </div>
      </div>
      </>
        ))}
    </div>
 

  )
  
}

export default SupplyInfo
