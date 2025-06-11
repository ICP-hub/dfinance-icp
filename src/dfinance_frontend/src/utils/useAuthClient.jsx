import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor, blsVerify } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { useSelector } from "react-redux";
import { initGA, setUserId } from "./googleAnalytics";
import { Principal } from "@dfinity/principal";
import { Certificate, Cbor, reconstruct } from "@dfinity/agent";
import { useIdentity, useAuth, } from "@nfid/identitykit/react";

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

const LOCAL_HOST = "http://127.0.0.1:4943";
const MAINNET_HOST = "https://icp0.io";
const HOST = process.env.DFX_NETWORK === "ic" ? MAINNET_HOST : LOCAL_HOST;

/**
 * Custom hook for handling authentication with Internet Identity and other providers.
 *
 * @param {Object} options - Authentication configuration options.
 * @returns {Object} - Authentication state and utility functions.
 */
export const useAuthClient = (options = defaultOptions) => {
  // const dispatch = useDispatch();
  const { connect, disconnect, user } = useAuth();
  const identity = useIdentity();
  const [agent, setnewagent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [User, setUser] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [certObj, setCertObj] = useState(null);
  const [rootKey, setRootKey] = useState(null);
  const { isSwitchingWallet } = useSelector((state) => state.utility);

  useEffect(() => {
    AuthClient.create(options.createOptions).then((client) => {
      setAuthClient(client.getIdentity());
    });
    initActor();
  }, []);

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
  const login = async () => {
    try {
      const res = await connect();
      await initActor();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const setSessionTimeout = () => {
    clearTimeout(logoutTimeout);

    logoutTimeout = setTimeout(() => {
      logout();
    }, 24 * 60 * 60 * 1000);
    localStorage.setItem("sessionStart", Date.now());
  };

  // Function to get login options based on the provider
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
      await disconnect();
      setBackendActor(null);
      setIsAuthenticated(false);
      setPrincipal(null);

      localStorage.removeItem("connectedWallet");
      localStorage.removeItem("signerId");

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

  // function to check sessionstart
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

  useEffect(() => {
    checkSession();
  }, []);

  const initActor = async () => {
    try {

      // If identity is not available, fallback to AuthClient identity
      if (!identity) {
        const client = await AuthClient.create(options.createOptions);

        let clientIdentity = client.getIdentity();
        setUser(clientIdentity.getPrincipal());
        const principalText = clientIdentity.getPrincipal().toText();
        setPrincipal(principalText);
        const accountId = AccountIdentifier.fromPrincipal({ principal: clientIdentity.getPrincipal() });
        setAccountId(toHexString(accountId.bytes));
        setAccountIdString(toHexString(accountId.bytes));
      }

      let agent;
      let principal;
      let originalPrincipal;
      if (user && identity) {

        principal = identity.getPrincipal().toText();
        originalPrincipal = identity.getPrincipal();
        setPrincipal(principal);
        setUser(identity.getPrincipal());
        const accountId = AccountIdentifier.fromPrincipal({ principal: originalPrincipal });
        setAccountId(toHexString(accountId.bytes));
        setAccountIdString(toHexString(accountId.bytes));

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


  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      reloadLogin();
    }
  }, []);

  // Function to create a ledger actor
  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => { console.error(err) });
    }
    return Actor.createActor(IdlFac, { agent, canisterId });
  };

  // Function to reload login
  const reloadLogin = async () => {
    try {
      if (
        authClient.isAuthenticated() &&
        !(await authClient.getIdentity().getPrincipal().isAnonymous())
      ) {
        initActor()
      }
    } catch (error) {
      console.error(error)
    }
  };
  const buffersEqual = (buf1, buf2) => {
    if (!buf1 || !buf2 || buf1.byteLength !== buf2.byteLength) return false;
    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) return false;
    }
    return true;
  };

  const verifyCertificate = async (certObj) => {
    const agent = new HttpAgent({ identity });
    const rootKey = await agent.fetchRootKey();
    const cert = new Certificate(
      certObj.certificate,
      rootKey,
      process.env.CANISTER_ID_DFINANCE_BACKEND,
      blsVerify
    );
    await cert.verify;
    const te = new TextEncoder();
    const canisterId = Principal.fromText(
      process.env.CANISTER_ID_DFINANCE_BACKEND
    );

    const pathData = [
      te.encode("canister"),
      canisterId.toUint8Array(),
      te.encode("certified_data"),
    ];

    const certifiedData = cert.lookup(pathData);

    let witnessTree = Cbor.decode(certObj.witness);
    let witnessRootHash = await reconstruct(witnessTree);

    if (!certifiedData || !buffersEqual(certifiedData, witnessRootHash)) {
      return false;
    } else {
      return true;
    }
  };

  // Fetches all registered users
  const getAllUsers = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }

    try {
      const allUsers = await backendActor.get_all_users_certified();

      const cert = allUsers?.[1];

      if (cert) {
        try {
          const verified = await verifyCertificate(cert);
          if (!verified) {
            console.error("Certificate verification failed for users data");
            return [];
          }
        } catch (verificationError) {
          console.error(
            "Error verifying certificate for users:",
            verificationError
          );
          return [];
        }
      }

      return allUsers;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };
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
    authClient,
    identity,
    principal,
    User,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
    getAllUsers,
    verifyCertificate,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  if (!auth.authClient || !auth.backendActor) {
    return null;
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuths = () => useContext(AuthContext);
