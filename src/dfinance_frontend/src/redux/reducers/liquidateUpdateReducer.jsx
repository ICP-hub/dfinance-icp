import { createSlice } from "@reduxjs/toolkit";

const liquidateUpdateReducer = createSlice({
  name: "liquidate",
  initialState: {
    LiquidateTrigger: false, // Tracks when data should be refreshed
  },
  reducers: {
    toggleRefreshLiquidate: (state) => {
      state.LiquidateTrigger = !state.LiquidateTrigger; // Toggles the state
    },
  },
});

export const { toggleRefreshLiquidate } = liquidateUpdateReducer.actions;
export default liquidateUpdateReducer.reducer;
