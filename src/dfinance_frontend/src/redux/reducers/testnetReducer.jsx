import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Always set to true for now, ignoring localStorage
  isTestnetMode: true,
};

const testnetSlice = createSlice({
  name: 'testnet',
  initialState,
  reducers: {
    // Force isTestnetMode to be true, even when toggle is called
    toggleTestnetMode: (state) => {
      state.isTestnetMode = true; // Ensure it's always true
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },
    // Set isTestnetMode to true directly
    setTestnetMode: (state) => {
      state.isTestnetMode = true; // Always true
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },
    // Initialize isTestnetMode, but always force it to true
    initializeTestnetMode: (state) => {
      state.isTestnetMode = true; // Always true on initialization
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },
  },
});

export const { toggleTestnetMode, setTestnetMode, initializeTestnetMode } = testnetSlice.actions;
export default testnetSlice.reducer;
