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
import borrowSupplyReducer from './reducers/borrowSupplyReducer';
import joyRideReducer from './reducers/joyRideReducer';
import faucetUpdateReducer from "./reducers/faucetUpdateReducer"
import dashboardDataUpdateReducer from "./reducers/dashboardDataUpdateReducer"
import liquidateUpdateReducer from "./reducers/liquidateUpdateReducer"

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
        borrowSupply: borrowSupplyReducer,
        joyride: joyRideReducer,
        faucetUpdate:faucetUpdateReducer,
        dashboardUpdate: dashboardDataUpdateReducer,
        liquidateUpdate: liquidateUpdateReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false, 
        }),
});