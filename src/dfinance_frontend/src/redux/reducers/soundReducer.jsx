// soundSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Retrieve the sound setting from localStorage or default to `true`
const initialSoundState = JSON.parse(localStorage.getItem("isSoundOn")) ?? false;

const soundSlice = createSlice({
  name: "sound",
  initialState: {
    isSoundOn: initialSoundState,
  },
  reducers: {
    toggleSound: (state) => {
      state.isSoundOn = !state.isSoundOn;
      // Update localStorage whenever the toggle changes
      localStorage.setItem("isSoundOn", JSON.stringify(state.isSoundOn));
    },
  },
});

export const { toggleSound } = soundSlice.actions;
export default soundSlice.reducer;
