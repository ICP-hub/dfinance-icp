import { createSlice } from "@reduxjs/toolkit";

const initialSoundState = JSON.parse(localStorage.getItem("isSoundOn")) ?? false;

const soundSlice = createSlice({
  name: "sound",
  initialState: {
    isSoundOn: initialSoundState,
  },
  reducers: {
    toggleSound: (state) => {
      state.isSoundOn = !state.isSoundOn;

      localStorage.setItem("isSoundOn", JSON.stringify(state.isSoundOn));
    },
  },
});

export const { toggleSound } = soundSlice.actions;
export default soundSlice.reducer;