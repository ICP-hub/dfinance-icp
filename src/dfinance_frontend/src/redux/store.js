import { configureStore } from "@reduxjs/toolkit";
import userNameReducer from "../features/user/userNameSlice"
import utilityReducer from "./reducers/utilityReducer";

export const store = configureStore({
    reducer: {
        username: userNameReducer,
        utility:utilityReducer
    }
});