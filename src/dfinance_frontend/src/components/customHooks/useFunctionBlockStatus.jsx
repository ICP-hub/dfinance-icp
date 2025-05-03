import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";

const useFunctionBlockStatus = (functionName) => {
  const { backendActor, isAuthenticated ,verifyCertificate} = useAuth(); 
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!isAuthenticated || !backendActor) {
        setIsBlocked(false);
        setLoading(false);
        return;
      }
  
      try {
        const response = await backendActor.is_user_blocked();
  console.log("response in is user blocked",response)
        // If certificate is included as second element
        if (response && response[1]) {
          const isVerified = await verifyCertificate(response[1]);
          if (!isVerified) {
            console.error("Certificate verification failed for is_user_blocked()");
            setIsBlocked(false);
            setLoading(false);
            return;
          } else {
            console.log("is_user_blocked certificate verified");
          }
        }
  
        if ("Ok" in response) {
          setIsBlocked(response.Ok);
        } else {
          console.error("Error checking block status:", response.Err);
          setIsBlocked(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setIsBlocked(false);
      }
  
      setLoading(false);
    };
  
    checkBlockStatus();
  }, [backendActor, isAuthenticated, functionName]);
  

  return { isBlocked, loading };
};

export default useFunctionBlockStatus;
