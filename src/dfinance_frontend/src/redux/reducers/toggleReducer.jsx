import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toggles: {}, // This will hold toggle states for each asset
};

const toggleSlice = createSlice({
  name: "toggle",
  initialState,
  reducers: {
    setToggled(state, action) {
      // Update the toggle states with the action payload
      const { toggles } = action.payload;
      state.toggles = { ...state.toggles, ...toggles };
    },
  },
});

export const { setToggled } = toggleSlice.actions;

export default toggleSlice.reducer;
