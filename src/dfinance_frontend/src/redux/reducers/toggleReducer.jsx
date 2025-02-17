import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toggles: {}, 
};

const toggleSlice = createSlice({
  name: "toggle",
  initialState,
  reducers: {
    setToggled(state, action) {
     
      const { toggles } = action.payload;
      state.toggles = { ...state.toggles, ...toggles };
    },
  },
});

export const { setToggled } = toggleSlice.actions;

export default toggleSlice.reducer;
