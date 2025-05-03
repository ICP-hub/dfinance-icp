import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor, blsVerify } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { useSelector } from "react-redux";
import { initGA, setUserId } from "./googleAnalytics";
import { Principal } from "@dfinity/principal";
// import useCertificateVerification from "../components/customHooks/useVerifiedCetificate";

import { Certificate, Cbor, reconstruct } from "@dfinity/agent";
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
  const [certObj, setCertObj] = useState(null);
  const [rootKey, setRootKey] = useState(null);
  const {
    isSwitchingWallet,
  } = useSelector((state) => state.utility);
  // const { isVerified, error: verificationError } = useCertificateVerification(certObj, rootKey, process.env.CANISTER_ID_DFINANCE_BACKEND, blsVerify);

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
      await authClient.logout();
      clearTimeout(logoutTimeout);
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setAccountId(null);
      localStorage.removeItem("connectedWallet");
      localStorage.removeItem("sessionStart");
      sessionStorage.removeItem("hasCheckedUser");
      if (isSwitchingWallet == false) {
        localStorage.removeItem("connectedWallet");
        window.location.reload();
      }
    } catch (error) {
      console.error(error.message);
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

  /**
   * Updates client state with authentication details.
   * @param {AuthClient} client - AuthClient instance.
   */
  const updateClient = async (client) => {
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
      console.error(error.message);
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
      agent.fetchRootKey().catch((err) => {});
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
        updateClient(authClient);
      }
    } catch (error) { }
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

  


  const verifyCertificate = async (certObj)=>{
    const agent = new HttpAgent({ identity });
    const rootKey = await agent.fetchRootKey();
    const cert = new Certificate(certObj.certificate, rootKey, process.env.CANISTER_ID_DFINANCE_BACKEND, blsVerify);
    await cert.verify();
    const te = new TextEncoder();
    const canisterId = Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND);
    
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
  }
  // Todo make this function commented 
  // const getCanisterIdByName = async (canisterName) => {
  //   if (!backendActor) {
  //     console.error("Backend actor not initialized");
  //     throw new Error("Backend actor not initialized");
  //   }
  //   try {
  //     const result = await backendActor.get_canister_id_by_name(canisterName);
  //     if ("Ok" in result) {
  //       const [principal, certObj] = result.Ok;
  //       const agent = new HttpAgent({ identity });
  //       const rootKey = await agent.fetchRootKey();
  //       setCertObj(certObj);
  //       setRootKey(rootKey);
  //       console.log("Canister ID fetched successfully");
  //       return {
  //         principal: Principal.from(principal),
  //         verified: isVerified,
  //       };
  //     } else {
  //       console.error("Error result received:", result.Err);
  //       throw new Error(result.Err);
  //     }
  //   } catch (error) {
  //     console.error("Error during getCanisterIdByName execution:", error);
  //     throw error;
  //   }
  // };

  // useEffect(() => {
  //   const fetchCanisterInfo = async () => {
  //     try {
  //       console.log("Fetching canister info...");
  //       const data = await getCanisterIdByName("xrc");
  //       console.log("Canister data fetched:", data);
  //     } catch (err) {
  //       console.error("Error fetching canister info:", err);
  //     }
  //   };

  //   if (backendActor) {
  //     fetchCanisterInfo();
  //   }
  // }, [backendActor]);

  // useEffect(() => {
  //   if (certObj && rootKey) {
  //     if (isVerified === null || isVerified === undefined) {
  //       return;
  //     }
  //     if (!isVerified) {
  //       console.error("Certificate verification failed:", verificationError);
  //     } else {
  //       console.log("Certificate verified successfully");
  //     }
  //   }
  // }, [rootKey, verificationError]);


  // Fetches all registered users
  const getAllUsers = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
  
    try {
      const allUsers = await backendActor.get_all_users();
  
      // Assuming certificate is present as the second element of the result
      const cert = allUsers?.[1];
  
      if (cert) {
        try {
          const verified = await verifyCertificate(cert);
          if (!verified) {
            console.error("Certificate verification failed for users data");
            return []; // Return empty array if verification fails
          } else {
            console.log("Users certificate verified successfully");
          }
        } catch (verificationError) {
          console.error("Error verifying certificate for users:", verificationError);
          return []; // Return empty array if verification fails
        }
      }
  
      return allUsers; // Return the data after successful verification
    } catch (error) {
      console.error("Error fetching users:", error);
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
    getAllUsers,
    verifyCertificate
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
