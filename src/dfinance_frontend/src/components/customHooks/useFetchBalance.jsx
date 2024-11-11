import { useCallback, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";

const useFetchBalance = (ledgerActors, principal) => {
  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckUSDTBalance, setCkUSDTBalance] = useState(null);
  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);

  const fetchBalance = useCallback(
    async (assetType) => {
      console.log(`Calling fetchBalance for ${assetType}`);  // Ensure function is being called
      if (principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          const ledgerActor = ledgerActors[assetType];
          if (!ledgerActor || typeof ledgerActor.icrc1_balance_of !== "function") {
            console.warn(`Ledger actor for ${assetType} not initialized or method not available`);
            return;
          }

          console.log(`Fetching balance for ${assetType} with account:`, account);

          const balance = await ledgerActor.icrc1_balance_of(account);

          console.log(`Received balance for ${assetType}:`, balance);

          const formattedBalance = Number(balance) / 100000000;

          console.log(`Formatted balance for ${assetType}:`, formattedBalance);

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
            case "ckUSDT":
              setCkUSDTBalance(formattedBalance);
              break;
            default:
              throw new Error("Unsupported asset type");
          }
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      } else {
        console.warn("Principal not available");
      }
    },
    [ledgerActors, principalObj]
  );

  return {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
    error,
  };
};

export default useFetchBalance;
