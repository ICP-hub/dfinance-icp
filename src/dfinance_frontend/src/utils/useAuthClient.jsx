import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor, idlFactory } from "../../../declarations/dfinance_backend/index";
import { idlFactory as ledgerIdlFactory } from "../../../declarations/ckbtc_ledger";
import useAssetData from "../components/Common/useAssets";
import { useSelector } from "react-redux";

// Create a React context for authentication state
const AuthContext = createContext();

const defaultOptions = {
  /**
   *  @type {import("@dfinity/auth-client").AuthClientCreateOptions}
   */
  createOptions: {
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // set to 30 minutes
      disableDefaultIdleCallback: true, // disable the default reload behavior
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
        : `https://nfid.one/authenticate/?applicationName=my-ic-app#authorize`
  },

  loginOptionsbifinity: {
    // identityProvider: `https://bifinity.com/authenticate/?applicationName=my-ic-app#authorize`,
  },
};

// Custom hook to manage authentication with Internet Identity
export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [accountId, setAccountId] = useState(null);

  const { isWalletCreated, isWalletModalOpen, isSwitchingWallet, connectedWallet } = useSelector(state => state.utility)

  useEffect(() => {
    // On component mount, create an authentication client
    AuthClient.create(options.createOptions).then((client) => {
      setAuthClient(client);
    });
  }, []);

  useEffect(() => {
    if (authClient) {
      updateClient(authClient);
    }
  }, [authClient]);

  // Helper function to convert binary data to a hex string
  const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => ("0" + (byte & 0xff).toString(16)).slice(-2)).join("");
  };

  const login = async (provider) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (authClient.isAuthenticated() && !(await authClient.getIdentity().getPrincipal().isAnonymous())) {
          updateClient(authClient);
          resolve(authClient);
        } else {
          const opt = getLoginOptions(provider);
          authClient.login({
            ...opt,
            onError: (error) => reject(error),
            onSuccess: () => {
              updateClient(authClient);
              resolve(authClient);
            },
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        reject(error);
      }
    });
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

  // Function to handle logout
  const logout = async () => {
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setAccountId(null);
      if(isSwitchingWallet == false){
        window.location.reload();
      }
      
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Update client state after authentication
  const updateClient = async (client) => {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      const identity = client.getIdentity();
      setIdentity(identity);

      const principal = identity.getPrincipal();
      setPrincipal(principal.toString());
      // console.log('principal', principal.toString());

      const accountId = AccountIdentifier.fromPrincipal({ principal });
      setAccountId(toHexString(accountId.bytes));
      setAccountIdString(toHexString(accountId.bytes));

      const agent = new HttpAgent({ identity });

      const backendActor = createActor(process.env.CANISTER_ID_DFINANCE_BACKEND, { agent });
      setBackendActor(backendActor);

      // Ensure backendActor is initialized before making calls
    if (backendActor) {
      await checkUser(principal.toString());
    } else {
      console.error('Backend actor initialization failed.');
    }

    } catch (error) {
      console.error("Authentication update error:", error);
    }
  };

  // Function to create an actor for interacting with the ledger
  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== 'production') {
      agent.fetchRootKey().catch(err => {
        console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
        console.error(err);
      });
    }
    return Actor.createActor(IdlFac, { agent, canisterId });
  };

  // Function to refresh login without user interaction
  const reloadLogin = async () => {
    try {
      if (authClient.isAuthenticated() && !(await authClient.getIdentity().getPrincipal().isAnonymous())) {
        updateClient(authClient);
      }
    } catch (error) {
      console.error("Reload login error:", error);
    }
  };

  const checkUser = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.check_user(user);
      return result;
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  };

  const fetchReserveData = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
  
    try {
      const reserveData = await backendActor.get_reserve_data(asset);
      // console.log('Reserve Data:', reserveData);
      return reserveData;
    } catch (error) {
      console.error('Error fetching reserve data:', error);
      throw error;
    }
  };
  
  // Function to fetch all users
const getAllUsers = async () => {
  if (!backendActor) {
    throw new Error("Backend actor not initialized");
  }

  try {
    const allUsers = await backendActor.get_all_users();
    console.log('get_all_users:', allUsers);
    return allUsers;
  } catch (error) {
    console.error('Error fetching all users:', error);
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

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  if (!auth.authClient || !auth.backendActor) {
    return null; // Or render a loading indicator
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Hook to access authentication context
export const useAuth = () => useContext(AuthContext);