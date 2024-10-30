import { useEffect, useState } from "react";
import { useAuth } from "../../utils/useAuthClient";
const useUserData = () => {
    const { backendActor, principal } = useAuth();
    const [userData, setUserData] = useState(null);
    const [healthFactorBackend, setHealthFactorBackend] = useState(0);
    const [error, setError] = useState(null);

    const getUserData = async (user) => {
        if (!backendActor) {
            throw new Error("Backend actor not initialized");
        }
        try {
            const result = await backendActor.get_user_data(user);
            console.log("get_user_data in supplypopup:", result);

            if (result && result.Ok && Number(result.Ok.health_factor)/100000000) {
                setHealthFactorBackend(Number(result.Ok.health_factor)/10000000000);
            } else {
                setError("Health factor not found");
            }
            return result;
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError(error.message);
        }
    };

    const fetchUserData = async () => {
        if (backendActor) {
            try {
                const result = await getUserData(principal.toString());
                console.log("get_user_data:", result);
                setUserData(result);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            console.error("Backend actor initialization failed.");
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [principal, backendActor]);

    return {
        userData,
        healthFactorBackend,
        error,
        refetchUserData: fetchUserData, // In case you need to refetch user data
    };
};

export default useUserData;
