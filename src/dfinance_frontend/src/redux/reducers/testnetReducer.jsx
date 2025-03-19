import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isTestnetMode: JSON.parse(localStorage.getItem("isTestnetMode")) ?? false, // Initialize from localStorage
};

const testnetSlice = createSlice({
  name: 'testnet',
  initialState,
  reducers: {

    toggleTestnetMode: (state) => {
      state.isTestnetMode = !state.isTestnetMode; 
      localStorage.setItem("isTestnetMode", JSON.stringify(state.isTestnetMode));
    },

    setTestnetMode: (state, action) => {
      state.isTestnetMode = action.payload; 
      localStorage.setItem("isTestnetMode", JSON.stringify(action.payload));
    },

    initializeTestnetMode: (state) => {
      const storedValue = JSON.parse(localStorage.getItem("isTestnetMode"));
      state.isTestnetMode = storedValue ?? false; 
    },
  },
});

export const { toggleTestnetMode, setTestnetMode, initializeTestnetMode } = testnetSlice.actions;
export default testnetSlice.reducer;
