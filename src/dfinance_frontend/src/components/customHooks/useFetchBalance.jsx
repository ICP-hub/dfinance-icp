import { useCallback, useState } from "react";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import { useSelector } from "react-redux";

const useFetchBalance = (ledgerActors, principal) => {
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
    () => Principal.fromText(principal),
    [principal]
  );

  const fetchBalance = useCallback(
    async (assetType) => {
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
              throw new Error("Unsupported asset type");
          }
        } catch (error) {
          setError(error);
        }
      } else {
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
