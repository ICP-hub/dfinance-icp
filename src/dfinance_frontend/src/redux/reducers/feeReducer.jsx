// feesSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  fees: {
    asset1: 6.06,
    asset2: 2.50,
    asset3: 4.75,
    // Add more assets as needed
  }
};

// Create slice
const feesSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {
    setFee: (state, action) => {
      const { asset, fee } = action.payload;
      state.fees[asset] = fee;
    }
  }
});

// Export actions and reducer
export const { setFee } = feesSlice.actions;
export default feesSlice.reducer;
