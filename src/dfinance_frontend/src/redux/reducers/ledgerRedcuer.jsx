// ledgerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ckBTC: null,
  ckETH: null,
  ckUSDC: null,
  ckUSDT: null, 
  ICP: null,
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setLedgerActor(state, action) {
      const { asset, actor } = action.payload;
      state[asset] = actor;
    },
    clearLedgerActors(state) {
      state.ckBTC = null;
      state.ckETH = null;
      state.ckUSDC = null;
      state.ckUSDT = null; 
      state.ICP = null;
    },
  },
});

export const { setLedgerActor, clearLedgerActors } = ledgerSlice.actions;
export default ledgerSlice.reducer;
