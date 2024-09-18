// redux/slices/transactionSlice.js
import { createSlice } from '@reduxjs/toolkit';

const feeReducer = createSlice({
  name: 'transaction',
  initialState: {
    fees: {
      default: '5.00',  // Default fee for assets
      ckbtc: '100',    // Fee for ckbtc
      cketh: '110'     // Fee for cketh
    },
  },
  reducers: {
    // You can add actions if needed
  }
});

export default feeReducer.reducer;
