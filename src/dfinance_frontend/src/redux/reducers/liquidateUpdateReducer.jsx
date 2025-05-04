import { createSlice } from "@reduxjs/toolkit";

const liquidateUpdateReducer = createSlice({
  name: "liquidate",
  initialState: {
    LiquidateTrigger: false, 
  },
  reducers: {
    toggleRefreshLiquidate: (state) => {
      state.LiquidateTrigger = !state.LiquidateTrigger; 
    },
  },
});

export const { toggleRefreshLiquidate } = liquidateUpdateReducer.actions;
export default liquidateUpdateReducer.reducer;
