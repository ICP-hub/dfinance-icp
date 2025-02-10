import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { StoicIdentity } from "ic-stoic-identity";
import { useSelector } from "react-redux";
import { initGA, setUserId } from "./googleAnalytics";

const AuthContext = createContext();

const defaultOptions = {
  createOptions: {
    idleOptions: {
      idleTimeout: 1000 * 60 * 30,
      disableDefaultIdleCallback: true,
    },
  },
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
  const [user, setUser] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [walletProvider, setWalletProvider] = useState(null);

  const { isSwitchingWallet } = useSelector((state) => state.utility);

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
        if (provider === "stoic") {
          console.log("Attempting Stoic Wallet login...");
          const id = await StoicIdentity.connect();
          if (!id) throw new Error("Failed to connect to Stoic Wallet");

          console.log("Stoic Wallet login successful:", id);
          setWalletProvider("stoic");
          setIdentity(id);
          await updateClient(id);

          localStorage.setItem("walletProvider", "stoic");
          resolve(id);
        } else {
          const opt = getLoginOptions(provider);
          authClient.login({
            ...opt,
            onError: (error) => reject(error),
            onSuccess: () => {
              updateClient(authClient);
              setSessionTimeout();
              localStorage.setItem("walletProvider", provider);
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
      if (walletProvider === "stoic") {
        await StoicIdentity.disconnect();
      } else if (authClient) {
        await authClient.logout();
      }

      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setAccountId(null);
      setWalletProvider(null);

      localStorage.removeItem("walletProvider");
      if (!isSwitchingWallet) {
        localStorage.removeItem("connectedWallet");
        window.location.reload();
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const updateClient = async (client) => {
    try {
      const isAuthenticated = client.isAuthenticated ? await client.isAuthenticated() : true;
      setIsAuthenticated(isAuthenticated);

      const identity = walletProvider === "stoic" ? client : client.getIdentity();
      if (!identity) throw new Error("Identity is null");

      setIdentity(identity);

      const principal = await identity.getPrincipal();
      if (!principal) throw new Error("Principal retrieval failed");

      setPrincipal(principal.toString());
      setUser(principal);
      initGA("G-HP2ELMSQCW");

      if (isAuthenticated) setUserId(principal.toString());

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

  const checkUser = async () => {
    if (!backendActor) throw new Error("Backend actor not initialized");
    if (!identity || !isAuthenticated || !principal) {
      console.error("User not authenticated or principal is null.");
      return;
    }

    try {
      const result = await backendActor.register_user();
      if (result.Err) throw new Error(result.Err);
      return result;
    } catch (error) {
      console.error("Error in checkUser:", error.message);
      throw error;
    }
  };

  const fetchReserveData = async (asset) => {
    if (!backendActor) throw new Error("Backend actor not initialized");
    return await backendActor.get_reserve_data(asset);
  };

  const getAllUsers = async () => {
    if (!backendActor) throw new Error("Backend actor not initialized");
    return await backendActor.get_all_users();
  };

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
    fetchReserveData,
    checkUser,
    getAllUsers,
    reloadLogin
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
