import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  run: false, // Initial state of the tour
};

const joyrideSlice = createSlice({
  name: 'joyride',
  initialState,
  reducers: {
    startTour: (state) => {
      state.run = true; // Set run to true when the tour starts
    },
    stopTour: (state) => {
      state.run = false; // Stop the tour
    },
  },
});

export const { startTour, stopTour } = joyrideSlice.actions;

export const selectJoyrideState = (state) => state.joyride.run;

export default joyrideSlice.reducer;
