import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";

import { Provider, useSelector } from "react-redux";
import Modal from "react-modal";
import { store } from "./redux/store";
import { AuthProvider, useAuths } from "./utils/useAuthClient";
import { BrowserRouter } from "react-router-dom";
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";
import { IdentityKitAuthType, NFIDW, Plug, InternetIdentity } from "@nfid/identitykit";
import "@nfid/identitykit/react/styles.css";


Modal.setAppElement("#root");

const signers = [NFIDW, Plug, InternetIdentity];

const canisterID = process.env.CANISTER_ID_DFINANCE_BACKEND;
const initialTargets = [canisterID].filter(Boolean);

const signerClientOptions = {
  targets: initialTargets,
  maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
  idleOptions: {
    idleTimeout: 4 * 60 * 60 * 1000,
    disableIdle: false,
  },
  keyType: "Ed25519",
};

const AppWrapper = () => {
  const theme = useSelector((state) => state.theme.theme);
  const identityKitTheme =
    theme === "dark" ? IdentityKitTheme.DARK : IdentityKitTheme.LIGHT;

  const { backendActor ,fetchReserveData} = useAuths();
  const [assetPrincipal, setAssetPrincipal] = useState({});
  const [updatedTargets, setUpdatedTargets] = useState(initialTargets);

  useEffect(() => {
    if (backendActor) {
      const fetchAssetPrinciple = async () => {
        const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
        for (const asset of assets) {
          try {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));

            setUpdatedTargets((prevTargets) => {
              const newTargets = [...prevTargets, result];
             
              return newTargets;
            });

            // Fetch reserve data and include dtokenId & debtTokenId
            const reserveDataForAsset = await fetchReserveData(asset);
            const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
            const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];

            setUpdatedTargets((prevTargets) => {
              const newTargets = [
                ...prevTargets,
                dtokenId,
                debtTokenId,
              ].filter(Boolean);
              return newTargets;
            });

          } catch (error) {
            console.error(`Error fetching principal for ${asset}:`, error);
          }
        }
      };
      fetchAssetPrinciple();
    }
  }, [backendActor]);

  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_asset_principal(asset);
      return result.Ok.toText();
    } catch (error) {
      throw error;
    }
  };

  const signerClientOptionsWithTargets = {
    ...signerClientOptions,
    targets: updatedTargets,
  };


  return (
    <IdentityKitProvider
      onConnectSuccess={(res) => console.log("logged in successfully", res)}
      onDisconnect={(res) => console.log("logged out successfully", res)}
      signers={signers}
      theme={identityKitTheme}
      authType={IdentityKitAuthType.DELEGATION}
      signerClientOptions={signerClientOptionsWithTargets}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IdentityKitProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <IdentityKitProvider
      signers={signers}
      theme={IdentityKitTheme.LIGHT}
      authType={IdentityKitAuthType.DELEGATION}
      signerClientOptions={signerClientOptions}
    >
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </IdentityKitProvider>
  </Provider>
);
