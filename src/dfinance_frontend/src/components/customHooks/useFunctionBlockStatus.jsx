import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";

const useFunctionBlockStatus = (functionName) => {
  const { backendActor, isAuthenticated } = useAuth(); 
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
