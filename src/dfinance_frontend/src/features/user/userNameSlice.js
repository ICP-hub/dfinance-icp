//example


import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const userNameSlice = createSlice({
    name: "username",
    initialState,
    reducers: {
        addUserName: (state, action) => {
            state.push(action.payload); // Correct use of mutating the draft state
        },
        removeUserName: (state, action) => {
            return state.filter((item) => item !== action.payload); // Return the new state
        },
    }
});

export const { addUserName, removeUserName } = userNameSlice.actions;
export default userNameSlice.reducer;