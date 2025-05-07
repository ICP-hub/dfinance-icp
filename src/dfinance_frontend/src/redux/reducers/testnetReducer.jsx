import { createSlice } from "@reduxjs/toolkit";

const isProduction = process.env.DFX_PRODUCTION === 'true';

const initialState = {
  isTestnetMode: !isProduction, // true if not production, false if production
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