import { useCallback, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import { useSelector } from "react-redux";

/**
 * Custom hook to fetch and store balances of various ckAssets from the backend canister.
 * @returns {Object} - An object containing balances for ckAssets, fetchBalance function, and error state.
 */
const useFetchBalanceBackend = () => {
  const ledgerActors = useSelector((state) => state.ledger);
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckUSDTBalance, setCkUSDTBalance] = useState(null);
  const [ckICPBalance, setCkICPBalance] = useState(null);
  const [error, setError] = useState(null);

  const principalObj = useMemo(
    () => Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
    [process.env.CANISTER_ID_DFINANCE_BACKEND]
  );

  /**
   * Fetches the balance of a specific asset type from the corresponding ledger actor.
   * @param {string} assetType - The asset symbol (e.g., "ckBTC", "ckETH").
   */
  const fetchBalance = useCallback(
    async (assetType) => {
      console.log("assetType", assetType);
      if (principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          const ledgerActor = ledgerActors[assetType];
          if (
            !ledgerActor ||
            typeof ledgerActor.icrc1_balance_of !== "function"
          ) {
            return;
          }
          console.log("ledgerActor", ledgerActor);
          const balance = await ledgerActor.icrc1_balance_of(account);

          const formattedBalance = Number(balance) / 100000000;
          console.log("formattedBalance", formattedBalance);
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
          setError(error);
          console.error(error);
        }
      } else {
        console.log("Error occured in useFetchBalanceBackend Hook");
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

export default useFetchBalanceBackend;
