import { configureStore } from "@reduxjs/toolkit";
import userNameReducer from "../features/user/userNameSlice"

export const store = configureStore({
    reducer: {
        username: userNameReducer
    }
});