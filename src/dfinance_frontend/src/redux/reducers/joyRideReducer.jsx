import { createSlice } from "@reduxjs/toolkit";

const joyrideSlice = createSlice({
  name: "joyride",
  initialState: {
    joyRideTrigger: false,
  },
  reducers: {
    joyRideTrigger: (state) => {
      state.joyRideTrigger = !state.joyRideTrigger; 
    },
  },
});

export const { joyRideTrigger } = joyrideSlice.actions;
export default joyrideSlice.reducer;
