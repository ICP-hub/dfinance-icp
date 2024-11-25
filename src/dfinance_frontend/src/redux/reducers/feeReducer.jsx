
import { createSlice } from '@reduxjs/toolkit';

const feeReducer = createSlice({
  name: 'transaction',
  initialState: {
    fees: {
      default: '0', 
      ckbtc: '0',    
      cketh: '0'    
    },
  },
  reducers: {
  }
});

export default feeReducer.reducer;
