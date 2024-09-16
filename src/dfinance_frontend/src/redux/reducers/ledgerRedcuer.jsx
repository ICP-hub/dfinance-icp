import { createSlice } from '@reduxjs/toolkit';
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../declarations/cketh_ledger";
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../declarations/ckbtc_ledger";

const initialState = {
  ledgerActorckBTC: null,
  ledgerActorckETH: null,
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setLedgerActorckBTC: (state, action) => {
      state.ledgerActorckBTC = action.payload;
    },
    setLedgerActorckETH: (state, action) => {
      state.ledgerActorckETH = action.payload;
    },
  },
});

export const { setLedgerActorckBTC, setLedgerActorckETH } = ledgerSlice.actions;

export const selectLedgerActorckBTC = (state) => state.ledger.ledgerActorckBTC;
export const selectLedgerActorckETH = (state) => state.ledger.ledgerActorckETH;

export default ledgerSlice.reducer;
