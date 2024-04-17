import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    isWalletCreated: false
};

const utilitySlice = createSlice({
    name: "utility",
    initialState,
    reducers: {
        setIsWalletCreated: (state, action) => {
            state.isWalletCreated = action.payload;
        }
    }
});


export const { setIsWalletCreated } = utilitySlice.actions;
export default utilitySlice.reducer;