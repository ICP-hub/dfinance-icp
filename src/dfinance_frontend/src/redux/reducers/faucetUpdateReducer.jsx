import { createSlice } from "@reduxjs/toolkit";

const faucetUpdateReducer = createSlice({
  name: "faucet",
  initialState: {
    refreshTrigger: false, 
  },
  reducers: {
    toggleRefresh: (state) => {
      state.refreshTrigger = !state.refreshTrigger; 
    },
  },
});

export const { toggleRefresh } = faucetUpdateReducer.actions;
export default faucetUpdateReducer.reducer;
