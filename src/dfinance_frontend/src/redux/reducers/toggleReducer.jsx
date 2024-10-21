// toggleSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isToggled: true, // default state
};

const toggleSlice = createSlice({
  name: "toggle",
  initialState,
  reducers: {
    setIsToggled(state, action) {
      state.isToggled = action.payload; // update the toggle state with the action payload
    },
  },
});

export const { setIsToggled } = toggleSlice.actions;

export default toggleSlice.reducer;
