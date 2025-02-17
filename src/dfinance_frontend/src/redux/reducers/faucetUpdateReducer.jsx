import { createSlice } from "@reduxjs/toolkit";

const faucetUpdateReducer = createSlice({
  name: "faucet",
  initialState: {
    refreshTrigger: false, // Tracks when data should be refreshed
  },
  reducers: {
    toggleRefresh: (state) => {
      state.refreshTrigger = !state.refreshTrigger; // Toggles the state
    },
  },
});

export const { toggleRefresh } = faucetUpdateReducer.actions;
export default faucetUpdateReducer.reducer;
