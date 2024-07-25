import { configureStore } from "@reduxjs/toolkit";
import utilityReducer from "./reducers/utilityReducer";
import userReducer from "./reducers/userReducer";
import themeReducer from "./reducers/themeReducer"
import testnetReducer from "./reducers/testnetReducer";
import walletsReducer from "./reducers/walletsReducer"


export const store = configureStore({
    reducer: {
        user: userReducer,
        utility:utilityReducer,
        theme: themeReducer,
        testnetMode: testnetReducer,
        wallets: walletsReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});