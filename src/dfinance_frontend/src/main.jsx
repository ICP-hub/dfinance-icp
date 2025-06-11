import React, { useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./redux/store";
import { AuthProvider } from "./utils/useAuthClient";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReserveDataProvider, useReserveData } from "./context/ReserveDataContext";
import {
  IdentityKitProvider,
  IdentityKitTheme,
} from "@nfid/identitykit/react";
import "@nfid/identitykit/react/styles.css";
import Modal from "react-modal";
import { NFIDW, InternetIdentity } from "@nfid/identitykit";
import { useAuths } from "./utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { useLedgerActor } from "./components/CustomHooks/CustomLedger";


Modal.setAppElement("#root");

const signers = [NFIDW, InternetIdentity];
const canisterID = process.env.CANISTER_ID_DFINANCE_BACKEND;
const initialTargets = canisterID ? [canisterID] : [];

const signerClientOptions = {
  targets: initialTargets,
  maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days in nanoseconds
  idleOptions: {
    idleTimeout: 24 * 60 * 60 * 1000, // 24 hours
    disableIdle: false,
  },
  keyType: "Ed25519",
};

const AppWrapper = () => {
  const theme = useSelector((state) => state.theme.theme);
  const identityKitTheme =
    theme === "dark" ? IdentityKitTheme.DARK : IdentityKitTheme.LIGHT;

  const { principal, backendActor, createLedgerActor,agent } = useAuths();
  const [assetPrincipals, setAssetPrincipals] = useState({});
  const [assetBalances, setAssetBalances] = useState([]);
  const [updatedTargets, setUpdatedTargets] = useState(new Set(initialTargets));
  const [loading, setLoading] = useState(true);
  const { batchFetchReserveData } = useReserveData();

  const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];

  const getAssetPrincipal = async (asset) => {
    if (!backendActor) throw new Error("Backend actor not initialized");
    const result = await backendActor.get_asset_principal_certified(asset);
    return result.Ok[0].toText();
  };


  // Memoize the principal object to avoid unnecessary re-renders
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  const newTargets = new Set();
  const fetchAllAssetData = async () => {
    if (!assets || assets.length === 0) return;

    try {
      const batchedReserveData = await batchFetchReserveData(assets);
      const balances = [];

      for (const asset of assets) {
        const reserveDataForAsset = batchedReserveData[asset];
        const dtokenId = reserveDataForAsset?.Ok[0]?.d_token_canister?.[0];
        const debtTokenId = reserveDataForAsset?.Ok[0]?.debt_token_canister?.[0];
        const assetBalance = {
          asset,
          dtokenBalance: null,
          debtTokenBalance: null,
        };
        try {
          const assetPrincipal = await getAssetPrincipal(asset);
          if (assetPrincipal) {
            newTargets.add(assetPrincipal);
          }
        } catch (error) {
          console.error(`Error fetching asset principal for ${asset}:`, error);
        }


        if (dtokenId) {
          newTargets.add(dtokenId.toText());
          const dtokenActor = useLedgerActor(dtokenId, agent, "dToken");
          if (dtokenActor) {
            try {
              const account = { owner: principalObj, subaccount: [] };
              const balance = await dtokenActor.icrc1_balance_of(account);
              assetBalance.dtokenBalance = balance;
            } catch (error) {
              console.error(
                `Error fetching dtoken balance for ${asset}:`,
                error
              );
            }
          }
        }

        if (debtTokenId) {
          newTargets.add(debtTokenId.toText());
          const debtTokenActor =  useLedgerActor(debtTokenId, agent, "debtToken");
          if (debtTokenActor) {
            try {
              const account = { owner: principalObj, subaccount: [] };
              const balance = await debtTokenActor.icrc1_balance_of(account);
              assetBalance.debtTokenBalance = balance;
            } catch (error) {
              console.error(
                `Error fetching debt token balance for ${asset}:`,
                error
              );
            }
          }
        }


        balances.push(assetBalance);
      }

      setUpdatedTargets(prev => {
        const updated = new Set(prev);
        for (const id of newTargets) updated.add(id);
        return updated;
      })

      setAssetBalances(balances);
    } catch (error) {
      console.error("Error fetching asset data:", error);
    }
  };

  useEffect(() => {
    if (backendActor) {
      (async () => {
        setLoading(true);
        await fetchAllAssetData();
        setLoading(false);
      })();
    }
  }, [backendActor]);

  const signerClientOptionsWithTargets = {
    ...signerClientOptions,
    targets: Array.from(updatedTargets),
  };

  return (
    <IdentityKitProvider
      onConnectSuccess={(res) => {
        console.log("Logged in successfully", res);
        window.location.reload();
      }}
      onDisconnect={(res) => console.log("Logged out successfully", res)}
      signers={signers}
      theme={identityKitTheme}
      signerClientOptions={signerClientOptionsWithTargets}
    >
      <App />
    </IdentityKitProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <IdentityKitProvider
        signers={signers}
        theme={IdentityKitTheme.LIGHT}
        signerClientOptions={signerClientOptions}
      >
        <AuthProvider>
          <ReserveDataProvider>
            <BrowserRouter>
              <AppWrapper />
              <ToastContainer
                className="custom-toast"
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
                progress={undefined}
              />
            </BrowserRouter>
          </ReserveDataProvider>
        </AuthProvider>
      </IdentityKitProvider>
    </Provider>
  </React.StrictMode>
);
