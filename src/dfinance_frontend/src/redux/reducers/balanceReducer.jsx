import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  balances: {
    ckBTC: null,
    ckETH: null,
    ckUSDC: null,
    ICP: null,
  },
  error: null,
};

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {
    setBalances(state, action) {
      state.balances = { ...state.balances, ...action.payload };
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setBalances, setError } = balanceSlice.actions;

export const selectBalances = (state) => state.balance.balances;
export const selectError = (state) => state.balance.error;

export default balanceSlice.reducer;
