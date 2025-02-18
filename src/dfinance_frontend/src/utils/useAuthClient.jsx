import { createActor } from "../../../declarations/dfinance_backend/index";
import { createActor as createTokenActor } from "../../../declarations/token_ledger/index";
import { useDispatch } from "react-redux";
import { createContext, useContext, useEffect, useState } from "react";
import {useIdentity,useAuth,} from "@nfid/identitykit/react";
import { HttpAgent } from "@dfinity/agent";
import { useSelector } from "react-redux";
const AuthContext = createContext();

export const useAuthClient = () => {

  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const dispatch = useDispatch();
  const { connect, disconnect, user } = useAuth();
  const identity = useIdentity();
  
  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [backendActor, setBackendActor] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [User, setUser] = useState(null);
  const [agent, setnewagent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 

  
  /* ===================================================================================
   *                                 HELPER FUNCTION
   * =================================================================================== */

  const LOCAL_HOST = "http://127.0.0.1:4943";
  const MAINNET_HOST = "https://icp0.io";
  const HOST = process.env.DFX_NETWORK === "ic" ? MAINNET_HOST : LOCAL_HOST;

  
  /* ===================================================================================
   *                                 REDUX-SELECTOR
   * =================================================================================== */

  const { isSwitchingWallet } = useSelector((state) => state.utility);

  
  /* ===================================================================================
   *                                 FUNCTIONS
   * =================================================================================== */
  
  const initActor = async () => {
    try {
      let agent;
      let principal;

      if (user && identity) {
        principal = identity.getPrincipal().toText();
        setPrincipal(principal);
        setUser(identity.getPrincipal());
        const storedSignerId = localStorage.getItem("signerId");

        if (storedSignerId) {
          setIsAuthenticated(true);
        }
        agent = new HttpAgent({ identity, host: HOST });
        if (process.env.DFX_NETWORK !== "ic") {
          await agent.fetchRootKey();
        }
      } else {
        agent = new HttpAgent({ host: HOST });
        if (process.env.DFX_NETWORK !== "ic") {
          await agent.fetchRootKey();
        }
      }
      const actor = createActor(process.env.CANISTER_ID_DFINANCE_BACKEND, {
        agent,
      });
      setBackendActor(actor);
    } catch (error) {
      console.error("Error initializing actor:", error.message);
    }
  };

  const login = async () => {
    try {
      const res = await connect();
      await initActor();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await disconnect();
      setBackendActor(null);
      setIsAuthenticated(false);
      setPrincipal(null);

      localStorage.removeItem("sessionStart");
      if (isSwitchingWallet == false) {
        localStorage.removeItem("connectedWallet");
        localStorage.removeItem("signerId");
        window.location.reload();
      }
    } catch (error) {
      console.error("Logout Error:", error);
      dispatch(logoutFailure(error.toString()));
    }
  };

  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity, HOST });

    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => {});
    }
    return createTokenActor(IdlFac, { agent, canisterId: canisterId });
  };

  const checkUser = async () => {
    try {
      const result = await backendActor.register_user();
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

  
  /* ===================================================================================
   *                                 EFFECTS
   * =================================================================================== */


  useEffect(() => {
    if (backendActor && isAuthenticated) {
      checkUser();
    }
  }, [backendActor, isAuthenticated]);

  useEffect(() => {
    const initializeAgent = async () => {
      const newAgent = new HttpAgent({
        identity: identity || undefined,
        host: HOST,
      });

      if (process.env.DFX_NETWORK !== "ic") {
        await newAgent.fetchRootKey();
      }
      setnewagent(newAgent);
    };
    initializeAgent();

    
    initActor();
  }, [user, identity]);

  return {
    agent,
    isAuthenticated,
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
