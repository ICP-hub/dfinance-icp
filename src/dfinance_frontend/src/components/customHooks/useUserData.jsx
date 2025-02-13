import { useEffect, useState } from "react";
import { useAuths } from "../../utils/useAuthClient";
import "react-toastify/dist/ReactToastify.css";
import { Principal } from "@dfinity/principal";
import { useSelector } from "react-redux";

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
  const { backendActor, principal, User, isAuthenticated } = useAuths();
  const [userData, setUserData] = useState(null);
  const [userAccountData, setUserAccountData] = useState(null);
  const [healthFactorBackend, setHealthFactorBackend] = useState(0);
  const [error, setError] = useState(null);
  const principalArray = principal ? principal.split("") : [];

  /**
   * Retrieves user data from the backend.
   * @param {string} user - The identifier for the user.
   * @returns {Object} - The user data retrieved from the backend.
   */
  const getUserData = async (User) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(User);
      console.log("result  in user data ",result)
      return result;
    } catch (error) {
      setError(error.message);
      console.error(error.message);
    }
  };

  const fetchUserData = async (User) => {
    if (backendActor) {
      try {
        const result = await getUserData(User);
        setUserData(result);
      } catch (error) {
        console.error(error.message);
      }
    } else {
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
        const result = await backendActor.get_user_account_data([]);

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
    fetchUserData(User);
  }, [User, backendActor, dashboardRefreshTrigger]);

  useEffect(() => {
    fetchUserAccountData();
  }, [principal, dashboardRefreshTrigger]);

  return {
    userData,
    healthFactorBackend,
    error,
    userAccountData,
    refetchUserData: fetchUserData,
    fetchUserAccountData,
  };
};

export default useUserData;
