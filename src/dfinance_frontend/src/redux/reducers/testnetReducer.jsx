import { createSlice } from "@reduxjs/toolkit";

const initialState = {

  isTestnetMode: true,
};

const testnetSlice = createSlice({
  name: 'testnet',
  initialState,
  reducers: {

    toggleTestnetMode: (state) => {
      state.isTestnetMode = true; 
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },

    setTestnetMode: (state) => {
      state.isTestnetMode = true; 
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },

    initializeTestnetMode: (state) => {
      state.isTestnetMode = true; 
      localStorage.setItem("isTestnetMode", JSON.stringify(true));
    },
  },
});

export const { toggleTestnetMode, setTestnetMode, initializeTestnetMode } = testnetSlice.actions;
export default testnetSlice.reducer;