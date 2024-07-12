import React from "react";
import { useAuth } from "../../utils/useAuthClient";





const Login = () => {
    const { actor, login, authClient } = useAuth();




    const handleLogin = async (event) => {
        let auth = await login();
        console.log("authClient", auth);
        console.log("actor", actor);
        const principal_id = authClient.getIdentity().getPrincipal().toString();
        console.log(principal_id);

        // console.log("real authClient", authClient);
        // const is_already_registered = await actor.is_user_already_registered();

        // const newUserType = event.target.value;
        // console.log(newUserType);

        // console.log(userType);
        // navigate('/');

    };

    return (

        <div className="flex flex-col items-center justify-center w-full">
            <div className=" text-[#00227A] text-2xl md2:text-4xl font-medium p ">
                Log in/Sign up as
            </div>
            <div className="mt-[48px] w-full flex flex-col  items-center gap-4 px-10">
                <button
                    className="sm:w-1/2 w-full h-14 text-white text-xl rounded-xl bg-[#646ED6]"
                    value="sign in"
                    onClick={handleLogin}
                >
                    sign in
                </button>
            </div>
        </div>



    );
};

export default Login;