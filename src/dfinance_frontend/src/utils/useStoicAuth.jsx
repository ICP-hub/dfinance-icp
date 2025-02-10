import { createContext, useContext, useEffect, useState } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { StoicIdentity } from "ic-stoic-identity";
import { createActor } from "../../../declarations/dfinance_backend/index";
import { useSelector } from "react-redux";

const StoicAuthContext = createContext();

export const useStoicWallet = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [user, setUser] = useState(null);

  const { isSwitchingWallet } = useSelector((state) => state.utility);

  useEffect(() => {
    reloadLogin();
  }, []);

  const login = async () => {
    try {
      console.log("Attempting Stoic Wallet login...");
      const id = await StoicIdentity.connect();

      if (!id) throw new Error("Failed to connect to Stoic Wallet");

      const principal = id.getPrincipal();
      console.log("Principal:", principal.toText());

      if (principal.isAnonymous()) {
        console.error("Anonymous principal detected.");
        return;
      }

      console.log("Delegation:", id.getDelegation ? id.getDelegation() : "No delegation found");

      setIdentity(id);
      setPrincipal(principal.toString());
      setIsAuthenticated(true);
      setUser(principal);

      await updateClient(id);
    } catch (error) {
      console.error("Stoic Wallet login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await StoicIdentity.disconnect();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setBackendActor(null);
      setUser(null);
      localStorage.clear();
      if (!isSwitchingWallet) window.location.reload();
    } catch (error) {
      console.error("Stoic Wallet logout failed:", error);
    }
  };

  const updateClient = async (id) => {
    try {
      if (!id) return console.error("Identity is null.");

      const agent = new HttpAgent({
        identity: id,
        fetchOptions: {
          credentials: "include",  // Important for cookies/session management
        },
        headers: {
          "Content-Type": "application/cbor",  // Ensure proper content type
        },
      });
      

      agent.addTransform(async (request) => {
        console.log("Agent Request:", request);

        if (!request.headers) {
          request.headers = new Headers();
        }

        console.log("Request Headers:", request.headers);
        request.headers.append("X-Debug-Mode", "true");

        return request;
      });

      if (process.env.DFX_NETWORK !== "ic") {
        await agent.fetchRootKey().catch((err) => {
          console.error("Failed to fetch root key:", err);
        });
      }
      

      const backendActor = createActor(process.env.CANISTER_ID_DFINANCE_BACKEND, { agent });
      setBackendActor(backendActor);
      console.log("Agent:", agent);
      console.log("Identity:", id);
      console.log("Principal:", id.getPrincipal().toText());
      console.log("Is Anonymous:", id.getPrincipal().isAnonymous());
      
      console.log("Backend Actor initialized:", Object.keys(backendActor));
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const checkUser = async () => {
    console.log("checking user")
    if (!backendActor || !identity || identity.getPrincipal().isAnonymous()) {
      console.error("Invalid session. Re-login required.");
      await login();
      return;
    }

    try {
      const result = await backendActor.register_user();
      console.log("User registration result:", result);
      return result;
    } catch (error) {
      console.error("Error in checkUser:", error);
      
    }
  };

if(backendActor&& isAuthenticated){
  checkUser();
}
  const createLedgerActor = (canisterId, IdlFac) => {
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "production") {
      agent.fetchRootKey().catch((err) => {
        console.error("Failed to fetch root key:", err);
      });
    }

    return Actor.createActor(IdlFac, { agent, canisterId });
  };

  const fetchReserveData = async (asset) => {
    console.log("backendActor in reserveData:", backendActor);
    if (!backendActor) throw new Error("Backend actor not initialized");

    return await backendActor.get_reserve_data(asset);
  };

  const getAllUsers = async () => {
    console.log("Fetching all users...");
    if (!backendActor) throw new Error("Backend actor not initialized");

    return await backendActor.get_all_users();
  };

  const reloadLogin = async () => {
    try {
      const id = await StoicIdentity.load();
      if (id && !id.getPrincipal().isAnonymous()) {
        await updateClient(id);
        setIsAuthenticated(true);
        setIdentity(id);
        setPrincipal(id.getPrincipal().toString());
      } else {
        console.warn("No active Stoic session found.");
      }
    } catch (error) {
      console.error("Error reloading Stoic session:", error);
    }
  };

  return {
    isAuthenticated,
    login,
    logout,
    updateClient,
    identity,
    principal,
    backendActor,
    checkUser,
    reloadLogin,
    createLedgerActor,
    fetchReserveData,
    getAllUsers,
    user,
  };
};

export const StoicAuthProvider = ({ children }) => {
  const auth = useStoicWallet();
  return <StoicAuthContext.Provider value={auth}>{children}</StoicAuthContext.Provider>;
};

export const useStoicAuth = () => useContext(StoicAuthContext);
