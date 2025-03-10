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

/**
 * Custom hook for handling authentication with Internet Identity and other providers.
 *
 * @param {Object} options - Authentication configuration options.
 * @returns {Object} - Authentication state and utility functions.
 */
export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [user, setUser] = useState(null);
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

  /**
   * Handles login process with selected identity provider.
   * @param {string} provider - The provider name (ii, nfid, bifinity).
   * @returns {Promise<AuthClient>} - Returns the authenticated client instance.
   */
  const login = async (provider) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!authClient) {
          console.error("AuthClient not initialized. Cannot log in.");
          reject("AuthClient not initialized.");
          return;
        }
  
        if (
          authClient.isAuthenticated() &&
          !(await authClient.getIdentity().getPrincipal().isAnonymous())
        ) {
          console.log("User is already authenticated.");
          updateClient(authClient);
          resolve(authClient);
          return;
        }
  
        const supportedProviders = ["ii", "nfid", "bifinity"];
        if (!supportedProviders.includes(provider)) {
          console.error(`Unsupported provider: ${provider}`);
          reject(`Unsupported provider: ${provider}`);
          return;
        }
  
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

  /**
   * Logs out the user and clears session data.
   */
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
        localStorage.removeItem("connectedWallet");
        window.location.reload();
      }
    } catch (error) {
      console.error(error.message);
    }
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

  /**
   * Updates client state with authentication details.
   * @param {AuthClient} client - AuthClient instance.
   */
  const updateClient = async (client) => {
    console.log("client", client);
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      const identity = client.getIdentity();
      setIdentity(identity);

      const principal = identity.getPrincipal();
      setUser(principal);
      setPrincipal(principal.toString());
      initGA("G-HP2ELMSQCW");
      if (isAuthenticated) {
        setUserId(principal.toString());
      }

      const accountId = AccountIdentifier.fromPrincipal({ principal });
      setAccountId(toHexString(accountId.bytes));
      setAccountIdString(toHexString(accountId.bytes));

      const agent = new HttpAgent({ identity });

      const backendActor = createActor(
        process.env.CANISTER_ID_DFINANCE_BACKEND,
        { agent }
      );
      setBackendActor(backendActor);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      reloadLogin();
    }
  }, []);

  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => {});
    }
    return Actor.createActor(IdlFac, { agent, canisterId });
  };
  
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

  // Registers user
  const checkUser = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }

    try {
      const identity = authClient.getIdentity();
      if (!identity.getPrincipal().isAnonymous() && isAuthenticated) {
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

  if (backendActor && isAuthenticated) {
    checkUser();
  }

  // Fetches reserve data for a specific asset
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

  // Fetches all registered users
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
