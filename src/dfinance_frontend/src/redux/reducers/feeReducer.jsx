// redux/slices/transactionSlice.js
import { createSlice } from '@reduxjs/toolkit';

const feeReducer = createSlice({
  name: 'transaction',
  initialState: {
    fees: {
      default: '5.00',  // Default fee for assets
      ckbtc: '0.10',    // Fee for ckbtc
      cketh: '0.05'     // Fee for cketh
    },
  },
  reducers: {
    // You can add actions if needed
  }
});

export default feeReducer.reducer;
