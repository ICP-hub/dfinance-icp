import { useEffect, useState } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Principal } from "@dfinity/principal";
const useUserData = () => {
  const { backendActor, principal } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userAccountData, setUserAccountData] = useState(null);
  const [healthFactorBackend, setHealthFactorBackend] = useState(0);
  const [error, setError] = useState(null);

  const getUserData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(user);
      return result;
    } catch (error) {
      setError(error.message);
      console.error(error.message)
    }
  };

  const fetchUserData = async () => {
    if (backendActor) {
      try {
        const result = await getUserData(principal.toString());
        setUserData(result);
      } catch (error) {
        console.error(error.message)
      }
    } else {
    }
  };
  
  const fetchUserAccountData = async () => {
  if (backendActor) {
    try {
      console.log("principal in user account data = ", principal);

      // Ensure principal is a string before converting
      if (!principal || typeof principal !== 'string') {
        console.error("Invalid principal provided");
        return;
      }

      // Create a Principal object from the string
      const principalObj = Principal.fromText(principal);

      // Pass the Principal object directly to the backend
      const result = await backendActor.get_user_account_data([]);

      console.log("result get user account data = ", result);

      // Handle pending state
      if (result?.Err === "ERROR :: Pending") {
        console.warn("Pending state detected. Retrying...");
        setTimeout(fetchUserAccountData, 1000);
        return;
      }

      // Check if result exists and health factor is available
      if (result?.Ok && result.Ok[4]) {
        const healthFactor = Number(result.Ok[4]) / 100000000;
        if (healthFactor) {
          setHealthFactorBackend(healthFactor);
        } else {
          setError("Health factor not found");
        }
      } else {
        setError("Invalid result format or missing health factor");
      }

      // If result is valid, update user account data
      if (result?.Ok) {
        setUserAccountData(result);
      }

    } catch (error) {
      console.error("Error fetching user account data:", error.message);
    }
  }
};



  useEffect(() => {
    fetchUserData();
  }, [principal, backendActor]);

  useEffect(() => {
    fetchUserAccountData();
  }, []);

  

  return {
    userData,
    healthFactorBackend,
    error,
    userAccountData,
    refetchUserData: fetchUserData,
    fetchUserAccountData
  };
};

export default useUserData;
