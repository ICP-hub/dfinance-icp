import { configureStore } from "@reduxjs/toolkit";
import utilityReducer from "./reducers/utilityReducer";
import userReducer from "./reducers/userReducer";
import themeReducer from "./reducers/themeReducer";
import testnetReducer from "./reducers/testnetReducer";
import feeReducer from "./reducers/feeReducer";
import ledgerReducer from "./reducers/LedgerReducer"; // Correctly import ledgerReducer
import assetReducer from "./reducers/assetReducer";

export const store = configureStore({
  reducer: {
    user: userReducer,
    utility: utilityReducer,
    theme: themeReducer,
    testnetMode: testnetReducer,
    fees: feeReducer,
    ledger: ledgerReducer,
    assets: assetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["SET_LEDGER_ACTORS"], // Ignore specific action
        ignoredPaths: ["ledger.ledgerActors"], // Ignore ledgerActors path in the state
      },
    }),
});
