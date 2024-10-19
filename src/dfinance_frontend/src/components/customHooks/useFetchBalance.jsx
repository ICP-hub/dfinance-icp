import { useCallback, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";

const useFetchBalance = (ledgerActors, principal) => {
  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);

  const fetchBalance = useCallback(
    async (assetType) => {
      if (principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          const ledgerActor = ledgerActors[assetType];
          if (!ledgerActor || typeof ledgerActor.icrc1_balance_of !== "function") {
            console.warn(`Ledger actor for ${assetType} not initialized or method not available`);
            return;
          }

          const balance = await ledgerActor.icrc1_balance_of(account);
          const formattedBalance = Number(balance)/100000000;


          switch (assetType) {
            case "ckBTC":
              setCkBTCBalance(formattedBalance);
              break;
            case "ckETH":
              setCkETHBalance(formattedBalance);
              break;
            case "ckUSDC":
              setCKUSDCBalance(formattedBalance);
              break;
            case "ICP":
              setCkICPBalance(formattedBalance);
              break;
            default:
              throw new Error("Unsupported asset type");
          }
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      }
    },
    [ledgerActors, principalObj]
  );

  return {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    fetchBalance,
    error,
  };
};

export default useFetchBalance;
