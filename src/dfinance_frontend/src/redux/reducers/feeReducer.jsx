// redux/slices/transactionSlice.js
import { createSlice } from '@reduxjs/toolkit';

const feeReducer = createSlice({
  name: 'transaction',
  initialState: {
    fees: {
      default: '0',  // Default fee for assets
      ckbtc: '0',    // Fee for ckbtc
      cketh: '0'     // Fee for cketh
    },
  },
  reducers: {
    // You can add actions if needed
  }
});

export default feeReducer.reducer;
