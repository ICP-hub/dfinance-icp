// Combined useAuthClient for Internet Identity, NFID, and Bitfinity Integration
import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { createActor as createTokenActor} from "../../../declarations/token_ledger/index";

import { useDispatch } from "react-redux";
import { createContext, useContext, useEffect, useState } from "react";
import { useBalance, useIdentity, useAccounts, useDelegationType, useIsInitializing, useAuth ,useAgent} from '@nfid/identitykit/react'
import { Actor, HttpAgent } from "@dfinity/agent";
// import { loginSuccess, logoutSuccess, logoutFailure } from "../Redux/Reducers/InternetIdentityReducer";
import { useSelector } from "react-redux";
import { initGA, setUserId } from "./googleAnalytics";
const AuthContext = createContext();

export const useAuthClient = () => {
  const dispatch = useDispatch();
  const [backendActor, setBackendActor] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [User, setUser] = useState(null);
  const { connect, disconnect, isConnecting, user } = useAuth();
  const { balance, fetchBalance } = useBalance();
  const identity = useIdentity();
  const delegationType = useDelegationType();
  const isInitializing = useIsInitializing();
  

  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);

 console.log('identity',identity)
  useEffect(() => {
    const initActor = async () => {
      try {
        if (user && identity ) {
          const principal = identity.getPrincipal().toText();
          console.log('principal',principal)
          setPrincipal(principal);
          const User =identity.getPrincipal();
          setUser(User);
          // Fetch root key for local development
          const HOST =     process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app/#authorize"
          : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`;

          const agent = new HttpAgent({ identity, HOST });
          if (process.env.DFX_NETWORK !== "ic") {
            await agent.fetchRootKey();
          }

          // Create actor
          const actor = createActor(process.env.CANISTER_ID_DFINANCE_BACKEND, { agent });
          console.log('actor',actor)
          setBackendActor(actor);
        }
      } catch (error) {
        console.error("Error initializing actor:", error.message);
      }
    };
    initActor();
  
  }, [user, identity]);


  const login = async () => {
    try {
      await connect();
     
      // dispatch(
      //   loginSuccess({
      //     isAuthenticated: true,
      //     identity,
      //     principal,
      //   })
      // );
    } catch (error) {
      console.error("Login Error:", error);
      // dispatch(loginFailure(error.toString()));//
      const setSessionTimeout = () => {
        clearTimeout(logoutTimeout);
    
        logoutTimeout = setTimeout(() => {
          logout();
        }, 24 * 60 * 60 * 1000);
        localStorage.setItem("sessionStart", Date.now());
      };
    }
  };

  const logout = async () => {
    try {
      await disconnect();
      setBackendActor(null);
      // setIsAuthenticated(false);
      
      setPrincipal(null);
      // dispatch(logoutSuccess());
      localStorage.removeItem("sessionStart");
      if (isSwitchingWallet == false) {
        localStorage.removeItem("connectedWallet");
        window.location.reload();
      }    } catch (error) {
      console.error("Logout Error:", error);
      dispatch(logoutFailure(error.toString()));
    }
  };

  // const getIdentityProvider = (provider) => {
  //   switch (provider) {
  //     case "ii":
  //       return process.env.DFX_NETWORK === "ic"
  //         ? "https://identity.ic0.app/#authorize"
  //         : "http://localhost:4943";
  //     case "nfid":
  //       return "https://nfid.one/authenticate/?applicationName=my-ic-app#authorize";
  //     case "bifinity":
  //       return "https://wallet.infinityswap.one/#authorize"; // Placeholder, update as needed
  //     default:
  //       throw new Error(`Unsupported provider: ${provider}`);
  //   }
  // };

  const createLedgerActor = (canisterId, IdlFac) => {
    const HOST =     process.env.DFX_NETWORK === "ic"
    ? "https://identity.ic0.app/#authorize"
    : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`;
console.log("host",HOST)
          const agent = new HttpAgent({ identity });
    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => {});
    }
    return createTokenActor(IdlFac, { agent, canisterId });
  };

   const checkUser = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.register_user();
      console.log('result',result)
      if (result.Err) {
        console.error("Error from backend:", result.Err);
        throw new Error(result.Err);
      }
      return result;
    } catch (error) {
      console.error("Error in checkUser:", error.message);
      throw error;
    }
  };
useEffect(()=>{
  if(backendActor){
    checkUser();
  }
},[backendActor])
  const fetchReserveData = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const reserveData = await backendActor.get_reserve_data(asset);
      return reserveData;
    } catch (error) {
      console.error("Error fetching reserve data:", error.message);
      throw error;
    }
  };

  const getAllUsers = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const allUsers = await backendActor.get_all_users();
      return allUsers;
    } catch (error) {
      console.error("Error fetching users:", error.message);
      throw error;
    }
  };

  return {
    isAuthenticated: !!user,
    login,
    logout,
    identity,
     principal,
     User,
    backendActor,
    checkUser,
    createLedgerActor,
    fetchReserveData,
    getAllUsers,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuths = () => useContext(AuthContext);
