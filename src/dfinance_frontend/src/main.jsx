import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';

import { Provider } from "react-redux";
import Modal from 'react-modal';
import { store } from "./redux/store";
import { AuthProvider } from "./utils/useAuthClient";
import { BrowserRouter } from 'react-router-dom';
import {
  IdentityKitProvider,
  IdentityKitTheme,
} from "@nfid/identitykit/react";
import {
  IdentityKitAuthType,
  NFIDW,
  Plug,
  InternetIdentity,
} from "@nfid/identitykit";
import "@nfid/identitykit/react/styles.css";

Modal.setAppElement('#root');

// Define signers
const signers = [NFIDW, Plug, InternetIdentity];

// Define canister IDs
const additionalCanisterIDs = [
  "aovwi-4maaa-aaaaa-qaagq-cai",
  "cpmcr-yeaaa-aaaaa-qaala-cai",
  "c5kvi-uuaaa-aaaaa-qaaia-cai",
  "a3shf-5eaaa-aaaaa-qaafa-cai",
  "cuj6u-c4aaa-aaaaa-qaajq-cai",
  "cbopz-duaaa-aaaaa-qaaka-cai",
  "ajuq4-ruaaa-aaaaa-qaaga-cai",
  "a4tbr-q4aaa-aaaaa-qaafq-cai",
  "aax3a-h4aaa-aaaaa-qaahq-cai",
  "ahw5u-keaaa-aaaaa-qaaha-cai",
  "ctiya-peaaa-aaaaa-qaaja-cai",
  "c2lt4-zmaaa-aaaaa-qaaiq-cai",
  "dfdal-2uaaa-aaaaa-qaama-cai",
  "cinef-v4aaa-aaaaa-qaalq-cai",
  "cgpjn-omaaa-aaaaa-qaakq-cai",
];

const canisterID = process.env.CANISTER_ID_DFINANCE_BACKEND;

// Combine all targets, filtering out undefined values
const targets = [canisterID, ...additionalCanisterIDs].filter(Boolean);

// Define signer client options
const signerClientOptions = {
  targets: targets,
  maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 1 week in nanoseconds
  idleOptions: {
    idleTimeout: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    disableIdle: false, // Enable logout on idle timeout
  },
  keyType: 'Ed25519', // Use Ed25519 key type for compatibility
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <IdentityKitProvider
    onConnectSuccess={(res) => console.log("logged in successfully", res)}
    onDisconnect={(res) => console.log("logged out successfully", res)}
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
