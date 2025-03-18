import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../utils/useAuthClient";
import "react-toastify/dist/ReactToastify.css";
import { Principal } from "@dfinity/principal";
import { useSelector } from "react-redux";
import useAssetData from "./useAssets";
import { idlFactory } from "../../../../declarations/debttoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/dtoken";
/**
 * Custom hook to fetch and manage user data from the backend canister.
 * Includes user account data, health factor, and error handling.
 *
 * @returns {Object} - Contains user data, health factor, error state, and refetch functions.
 */
const useUserData = () => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const {
    backendActor,
    principal,
    user,
    isAuthenticated,
    fetchReserveData,
    createLedgerActor,
  } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userAccountData, setUserAccountData] = useState(null);
  const [healthFactorBackend, setHealthFactorBackend] = useState(0);
  const [error, setError] = useState(null);
  const [assetBalances, setAssetBalances] = useState([]);
  const [isFreezePopupVisible, setIsFreezePopupVisible] = useState(false);
  const principalArray = principal ? principal.split("") : [];
  const { assets } = useAssetData();
  /**
   * Retrieves user data from the backend.
   * @param {string} user - The identifier for the user.
   * @returns {Object} - The user data retrieved from the backend.
   */
  const getUserData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(user);
      console.log("result", result);
      return result;
    } catch (error) {
      setError(error.message);
      console.error(error.message);

      // Check if the error message is related to a frozen canister
      if (error.message.toLowerCase().includes("freeze canister")) {
        setIsFreezePopupVisible(true);
      }
    }
  };

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );
  const fetchAssetData = async () => {
    const balances = [];

    for (const asset of assets) {
      const reserveDataForAsset = await fetchReserveData(asset);
      const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
      const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];
      const assetBalance = {
        asset,
        dtokenBalance: null,
        debtTokenBalance: null,
      };

      if (dtokenId) {
        const dtokenActor = createLedgerActor(dtokenId, idlFactory);
        if (dtokenActor) {
          try {
            const account = { owner: principalObj, subaccount: [] };
            const balance = await dtokenActor.icrc1_balance_of(account);
            const formattedBalance = Number(balance) / 100000000;
            assetBalance.dtokenBalance = balance;
          } catch (error) {
            console.error(`Error fetching dtoken balance for ${asset}:`, error);
          }
        }
      }

      if (debtTokenId) {
        const debtTokenActor = createLedgerActor(debtTokenId, idlFactory1);

        if (debtTokenActor) {
          try {
            const account = { owner: principalObj, subaccount: [] };
            const balance = await debtTokenActor.icrc1_balance_of(account);
            const formattedBalance = Number(balance) / 100000000;
            assetBalance.debtTokenBalance = balance;
          } catch (error) {
            console.error(
              `Error fetching debt token balance for ${asset}:`,
              error
            );
          }
        }
      }
      balances.push(assetBalance);
    }
    setAssetBalances(balances);
  };
  const fetchUserData = async (user) => {
    if (backendActor) {
      try {
        const result = await getUserData(user);
        setUserData(result);
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  /**
   * Fetches account-specific data for the authenticated user.
   * Includes handling for pending states and health factor calculation.
   */
  const fetchUserAccountData = async () => {
    if (backendActor && isAuthenticated) {
      try {
        if (!principal || typeof principal !== "string") {
          console.error("Invalid principal provided");
          return;
        }
        const principalObj = Principal.fromText(principal);

        // Extract reserves from userData
        const reserves = userData?.Ok?.reserves?.[0] || [];

        // Separate objects for asset balances and borrow balances
        let assetBalancesObj = [];
        let borrowBalancesObj = [];

        reserves.forEach((reserveGroup) => {
          const asset = reserveGroup[0]; // Extract asset name from reserveGroup

          // Match asset with assetBalances
          const assetBalance =
            assetBalances.find((balance) => balance.asset === asset)
              ?.dtokenBalance || 0n;
          const borrowBalance =
            assetBalances.find((balance) => balance.asset === asset)
              ?.debtTokenBalance || 0n;

          // Only include non-zero balances, push into respective arrays
          if (BigInt(assetBalance) > 0n) {
            assetBalancesObj.push({
              balance: BigInt(assetBalance),
              name: asset,
            });
          }
          if (BigInt(borrowBalance) > 0n) {
            borrowBalancesObj.push({
              balance: BigInt(borrowBalance),
              name: asset,
            });
          }
        });

        console.log("Asset Balances Set:", assetBalancesObj);
        console.log("Borrow Balances Set:", borrowBalancesObj);

        // If no balances exist, pass an empty array instead of null
        const assetBalancesParam =
          assetBalancesObj.length > 0 ? [assetBalancesObj] : [];
        const borrowBalancesParam =
          borrowBalancesObj.length > 0 ? [borrowBalancesObj] : [];

        // Call backend with separate sets for asset and borrow balances
        const result = await backendActor.get_user_account_data(
          [],
          assetBalancesParam,
          borrowBalancesParam
        );
        console.log("result reslut", result);

        if (result?.Err === "ERROR :: Pending") {
          console.warn("Pending state detected. Retrying...");
          setTimeout(fetchUserAccountData, 1000);
          return;
        }

        if (result?.Ok && result.Ok[4]) {
          const healthFactor = Number(result.Ok[4]) / 10000000000;
          if (healthFactor) {
            setHealthFactorBackend(healthFactor);
          } else {
            setError("Health factor not found");
          }
        } else {
          setError("Invalid result format or missing health factor");
        }

        if (result?.Ok) {
          setUserAccountData(result);
        }
      } catch (error) {
        console.error("Error fetching user account data:", error.message);
      }
    }
  };

  useEffect(() => {
    fetchUserData(user);
  }, [user, backendActor, dashboardRefreshTrigger]);

  useEffect(() => {
    if (userData) {
      fetchUserAccountData();
    }
  }, [userData, assetBalances, dashboardRefreshTrigger]);

  useEffect(() => {
    fetchAssetData();
  }, [assets, principalObj, dashboardRefreshTrigger]);
  return {
    userData,
    healthFactorBackend,
    error,
    userAccountData,
    refetchUserData: fetchUserData,
    fetchUserAccountData,
    isFreezePopupVisible,
    setIsFreezePopupVisible,
  };
};

export default useUserData;
