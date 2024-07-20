import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isTestnetMode: JSON.parse(localStorage.getItem("isTestnetMode")) || false,
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
      localStorage.setItem("isTestnetMode", JSON.stringify(state.isTestnetMode));
    },
    initializeTestnetMode: (state) => {
      const storedIsTestnetMode = JSON.parse(localStorage.getItem("isTestnetMode"));
      if (storedIsTestnetMode !== undefined) {
        state.isTestnetMode = storedIsTestnetMode;
      }
    },
  },
});

export const { toggleTestnetMode, setTestnetMode, initializeTestnetMode } = testnetSlice.actions;
export default testnetSlice.reducer;
