import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    isWalletCreated: false,
    assetDetailFilter:"Supply Info"
};

const utilitySlice = createSlice({
    name: "utility",
    initialState,
    reducers: {
        setIsWalletCreated: (state, action) => {
            state.isWalletCreated = action.payload;
        },
        setAssetDetailFilter: (state, action) => {
            state.assetDetailFilter = action.payload;
        }
    }
});


export const { setIsWalletCreated, setAssetDetailFilter } = utilitySlice.actions;
export default utilitySlice.reducer;