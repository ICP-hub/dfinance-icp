import { configureStore } from "@reduxjs/toolkit";
import utilityReducer from "./reducers/utilityReducer";
import userReducer from "./reducers/userReducer";
import themeReducer from "./reducers/themeReducer"
import testnetReducer from "./reducers/testnetReducer";
import feeReducer from "./reducers/feeReducer";
import ledgerReducer from "./reducers/ledgerRedcuer";
import assetReducer from "./reducers/assetReducer";
import toggleReducer from "./reducers/toggleReducer";
import soundReducer from "./reducers/soundReducer";
export const store = configureStore({
    reducer: {
        user: userReducer,
        utility:utilityReducer,
        theme: themeReducer,
        testnetMode: testnetReducer,
        fees: feeReducer ,
        ledger: ledgerReducer,
        assets: assetReducer,  
        toggle: toggleReducer,
        sound: soundReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, // Disable serializability check
        }),
});