import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';

import { Provider } from "react-redux"

import {store} from "./redux/store";
// import { PersistGate } from "redux-persist/integration/react";
import { AuthProvider } from "./utils/useAuthClient"
import {
  IdentityKitProvider,
  IdentityKitTheme,
} from "@nfid/identitykit/react";
import { BrowserRouter } from 'react-router-dom';
import {
  IdentityKitAuthType,
  NFIDW,
  Plug,
  InternetIdentity,
} from "@nfid/identitykit";
import "@nfid/identitykit/react/styles.css";



// Define signers and canister ID
const signers = [NFIDW, Plug];
const canisterID = process.env.CANISTER_ID_ICPLAUNCHPAD_BACKEND;
const signerClientOptions = {
  targets: [canisterID],
  maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 1 week in nanoseconds
  idleOptions: {
    idleTimeout: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    disableIdle: false, // Enable logout on idle timeout
  },
  keyType: 'Ed25519', // Use Ed25519 key type for compatibility
};
ReactDOM.createRoot(document.getElementById("root")).render(
  <IdentityKitProvider
    onConnectSuccess={(res) => {
      console.log("logged in successfully", res);
    }}
    onDisconnect={(res) => {
      console.log("logged out successfully", res);
    }}
    signers={signers}
    theme={IdentityKitTheme.SYSTEM}
    authType={IdentityKitAuthType.DELEGATION}
    signerClientOptions={signerClientOptions}
  >
    <React.StrictMode>
      <Provider store={store}>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
      </Provider>
    </React.StrictMode>
  </IdentityKitProvider>
);