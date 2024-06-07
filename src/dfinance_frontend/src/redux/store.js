import { configureStore } from "@reduxjs/toolkit";
import utilityReducer from "./reducers/utilityReducer";
import userReducer from "./reducers/userReducer";

export const store = configureStore({
    reducer: {
        user: userReducer,
        utility:utilityReducer
    }
});