import { useEffect, useState } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        const result = await backendActor.get_user_account_data();

        if (result?.Err === "ERROR :: Pending") {
          console.warn("Pending state detected. Retrying...");
          setTimeout(fetchUserAccountData, 1000);
          return;
        }

        if (result && result.Ok && Number(result?.Ok?.[4]) / 100000000) {
          setHealthFactorBackend(Number(result?.Ok?.[4]) / 10000000000);
          
        } else {
          setError("Health factor not found");
        }
        if (!result) {
          console.log("result", result)
        } else {
          setUserAccountData(result);
        }

        
      } catch (error) {
        console.error(error.message)
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
  };
};

export default useUserData;
