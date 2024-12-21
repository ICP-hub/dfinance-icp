import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { useSelector } from "react-redux";
import { initGA, setUserId } from "./googleAnalytics";
const AuthContext = createContext();

const defaultOptions = {
  /**
   *  @type {import("@dfinity/auth-client").AuthClientCreateOptions}
   */
  createOptions: {
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, 
      disableDefaultIdleCallback: true, 
    },
  },
  /**
   * @type {import("@dfinity/auth-client").AuthClientLoginOptions}
   */
  loginOptionsii: {
    identityProvider:
      process.env.DFX_NETWORK === "ic"
        ? "https://identity.ic0.app/#authorize"
        : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`,
  },
  loginOptionsnfid: {
    identityProvider:
      process.env.DFX_NETWORK === "ic"
        ? `https://nfid.one/authenticate/?applicationName=my-ic-app#authorize`
        : `https://nfid.one/authenticate/?applicationName=my-ic-app#authorize`,
  },

  loginOptionsbifinity: {},
};

export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [user,setUser]=useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [accountId, setAccountId] = useState(null);

  const {
    isWalletCreated,
    isWalletModalOpen,
    isSwitchingWallet,
    connectedWallet,
  } = useSelector((state) => state.utility);

  useEffect(() => {
    AuthClient.create(options.createOptions).then((client) => {
      setAuthClient(client);
    });
  }, []);

  useEffect(() => {
    if (authClient) {
      updateClient(authClient);
    }
  }, [authClient]);

  const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) =>
      ("0" + (byte & 0xff).toString(16)).slice(-2)
    ).join("");
  };
  let logoutTimeout;

  const login = async (provider) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (
          authClient.isAuthenticated() &&
          !(await authClient.getIdentity().getPrincipal().isAnonymous())
        ) {
          updateClient(authClient);
          resolve(authClient);
        } else {
          const opt = getLoginOptions(provider);
          authClient.login({
            ...opt,
            onError: (error) => reject(error),
            onSuccess: () => {
              updateClient(authClient);
              setSessionTimeout();
              resolve(authClient);
            },
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const setSessionTimeout = () => {
    clearTimeout(logoutTimeout);

    logoutTimeout = setTimeout(() => {
      logout();
    }, 24 * 60 * 60 * 1000);
    localStorage.setItem("sessionStart", Date.now());
  };

  const getLoginOptions = (provider) => {
    switch (provider) {
      case "ii":
        return options.loginOptionsii;
      case "nfid":
        return options.loginOptionsnfid;
      case "bifinity":
        return options.loginOptionsbifinity;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      clearTimeout(logoutTimeout);
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setAccountId(null);
      localStorage.removeItem("sessionStart");
      if (isSwitchingWallet == false) {
        window.location.reload();
      }
    } catch (error) 
    {console.error(error.message)}
  };

  const checkSession = () => {
    const sessionStart = localStorage.getItem("sessionStart");
    if (sessionStart) {
      const elapsedTime = Date.now() - parseInt(sessionStart, 10);
      if (elapsedTime > 24 * 60 * 60 * 1000) {
        logout();
      } else if (elapsedTime > 24 * 60 * 60 * 1000) {
        setSessionTimeout();
      }
    }
  };

  checkSession();

  const updateClient = async (client) => {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      const identity = client.getIdentity();
      setIdentity(identity);

      const principal = identity.getPrincipal();
      setUser(principal)
      setPrincipal(principal.toString());
      initGA("G-EVCJPRHQYX");
      setUserId(principal.toString());

      const accountId = AccountIdentifier.fromPrincipal({ principal });
      setAccountId(toHexString(accountId.bytes));
      setAccountIdString(toHexString(accountId.bytes));

      const agent = new HttpAgent({ identity });

      const backendActor = createActor(
        process.env.CANISTER_ID_DFINANCE_BACKEND,
        { agent }
      );
      setBackendActor(backendActor);

      if (backendActor) {
        await checkUser();
      } else {
      }
    } catch (error) {}
  };

  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => {});
    }
    return Actor.createActor(IdlFac, { agent, canisterId });
  };
console.log("is authenticated",isAuthenticated)
  const reloadLogin = async () => {
    try {
      if (
        authClient.isAuthenticated() &&
        !(await authClient.getIdentity().getPrincipal().isAnonymous())
      ) {
        updateClient(authClient);
      }
    } catch (error) {}
  };

  const checkUser = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
  
    try {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
  
      if (!principal.isAnonymous()&&isAuthenticated) {
       
  
        
        const result = await backendActor.register_user();
       
  
        if (result.Ok) {
          if (result.Ok === "User available") {
           
            
          } else if (result.Ok === "User added") {
           
          }
        } else if (result.Err) {
          console.error("Error from backend:", result.Err);
          throw new Error(result.Err);
        }
  
        return result;
      } else {
        console.error("Anonymous principals are not allowed.");
        throw new Error("Anonymous principals are not allowed.");
      }
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
      throw error;
    }
  };

  return {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    user,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
    fetchReserveData,
    checkUser,
    getAllUsers,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  if (!auth.authClient || !auth.backendActor) {
    return null;
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
