import { useCallback, useState, useEffect, useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useSelector } from "react-redux";
import { useAuths } from "../../utils/useAuthClient";
/**
 * Custom hook to fetch and store balances for multiple ckAssets.
 * @param {Object} ledgerActors - An object mapping asset types to their respective ledger actor instances.
 * @param {string} principal - The user's principal ID as a string.
 * @returns {Object} - An object containing balances for ckAssets and a function to fetch balances.
 */
const useFetchBalance = (ledgerActors, principal) => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
const {  isAuthenticated } = useAuths();
  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckUSDTBalance, setCkUSDTBalance] = useState(null);
  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [error, setError] = useState(null);

  const principalObj = useMemo(() => {
     if (principal){
      try {
        return Principal.fromText(principal);
      } catch (error) {
        console.error("Invalid principal:", principal);
        return null;
      }}
  }, [principal]);

  /**
   * Fetches the balance of a given asset type using the corresponding ledger actor.
   * @param {string} assetType - The asset symbol (e.g., "ckBTC").
   */
  const fetchBalance = useCallback(
    async (assetType) => {
      if (principalObj && ledgerActors && isAuthenticated) {
       

      try {
        const account = { owner: principalObj, subaccount: [] };

        console.log("Fetching balance for:", assetType);
        console.log("Account:", account);

        const ledgerActor = ledgerActors[assetType];
        if (!ledgerActor || typeof ledgerActor.icrc1_balance_of !== "function") {
          console.warn(`Ledger actor not available for ${assetType}`);
          return;
        }

        const balance = await ledgerActor.icrc1_balance_of(account);
        const formattedBalance = Number(balance) / 100000000;

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
            throw new Error(`Unsupported asset type: ${assetType}`);
        }
      } catch (error) {
        setError(error);
        console.error(`Error fetching balance for ${assetType}:`, error);
      }
    }else{
        // console.error("Principal is not initialized. Skipping balance fetch for:", assetType);

      }
    },
    [ledgerActors, principalObj, dashboardRefreshTrigger]
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
