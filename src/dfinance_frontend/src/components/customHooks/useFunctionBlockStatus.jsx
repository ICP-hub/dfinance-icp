import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuthClient";

const useFunctionBlockStatus = (functionName) => {
  const { backendActor } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlockStatus = async () => {
      try {
        const response = await backendActor.is_function_blocked(functionName);
        if ("Ok" in response) {
          setIsBlocked(response.Ok);
        } else {
          console.error("Error checking block status:", response.Err);
          setIsBlocked(false);
        }
      } catch (error) {
        console.error("Failed to check block status:", error);
        setIsBlocked(false);
      }
      setLoading(false);
    };

    checkBlockStatus();
  }, [backendActor, functionName]);

  return { isBlocked, loading };
};

export default useFunctionBlockStatus;
