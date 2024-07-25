import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor, idlFactory } from "../../../declarations/dfinance_backend/index";
import { idlFactory as ledgerIdlFactory } from "../../../declarations/ckbtc_ledger";
import { dfinance_backend } from "../../../declarations/dfinance_backend";
import { useDispatch, useSelector } from 'react-redux';
import { setIsWalletConnected, setWalletModalOpen, setWalletDetails } from '../redux/reducers/walletsReducer';

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
      process.env.DFX_NETWORK === "dfinity"
        ? "https://identity.ic0.app/#authorize"
        : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`,
  },
  loginOptionsnfid: {
    identityProvider:
      process.env.DFX_NETWORK === "nfid"
        ? `https://nfid.one/authenticate/?applicationName=my-ic-app#authorize`
        : `https://nfid.one/authenticate/?applicationName=my-ic-app#authorize`
  },
  loginOptionsbifinity: {},
};

export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [backendActor, setBackendActor] = useState(dfinance_backend);
  const [accountId, setAccountId] = useState(null);
  const dispatch = useDispatch();
  const { isWalletConnected, walletDetails } = useSelector(state => state.wallets);

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

  useEffect(() => {
    if (authClient && isWalletConnected) {
      login(walletDetails.provider.id);
    }
  }, [authClient, isWalletConnected]);

  const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => ("0" + (byte & 0xff).toString(16)).slice(-2)).join("");
  };

  const login = async (providerId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (authClient.isAuthenticated() && !(await authClient.getIdentity().getPrincipal().isAnonymous())) {
          updateClient(authClient);
          resolve(authClient);
        } else {
          const provider = walletDetails.wallets.find(wallet => wallet.id === providerId);
          if (!provider) {
            throw new Error(`Unsupported provider: ${providerId}`);
          }
          const opt = getLoginOptions(provider.id);
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

  const getLoginOptions = (providerId) => {
    switch (providerId) {
      case "ii":
        return options.loginOptionsii;
      case "nfid":
        return options.loginOptionsnfid;
      case "bifinity":
        return options.loginOptionsbifinity;
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setAccountId(null);

      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateClient = async (client) => {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      const identity = client.getIdentity();
      setIdentity(identity);

      const principal = identity.getPrincipal();
      setPrincipal(principal.toString());

      const accountId = AccountIdentifier.fromPrincipal({ principal });
      setAccountId(toHexString(accountId.bytes));
      setAccountIdString(toHexString(accountId.bytes));

      const agent = new HttpAgent({ identity });

      const backendActor = createActor(process.env.CANISTER_ID_DFINANCE_BACKEND, { agent });
      setBackendActor(backendActor);

    } catch (error) {
      console.error("Authentication update error:", error);
    }
  };

  const createLedgerActor = (canisterId) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== 'production') {
      agent.fetchRootKey().catch(err => {
        console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
        console.error(err);
      });
    }
    return Actor.createActor(ledgerIdlFactory, { agent, canisterId });
  };

  const reloadLogin = async () => {
    try {
      if (authClient.isAuthenticated() && !(await authClient.getIdentity().getPrincipal().isAnonymous())) {
        updateClient(authClient);
      }
    } catch (error) {
      console.error("Reload login error:", error);
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
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  if (!auth.authClient || !auth.backendActor) {
    return null; // Or render a loading indicator
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
