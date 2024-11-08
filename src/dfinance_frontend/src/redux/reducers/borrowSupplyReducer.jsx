import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  totalUsdValueBorrow: 0,
  totalUsdValueSupply: 0,
};

const borrowSupplySlice = createSlice({
  name: 'borrowSupply',
  initialState,
  reducers: {
    setTotalUsdValueBorrow: (state, action) => {
      state.totalUsdValueBorrow = action.payload;
    },
    setTotalUsdValueSupply: (state, action) => {
      state.totalUsdValueSupply = action.payload;
    },
    updateValues: (state, action) => {
      const { borrowValue, supplyValue } = action.payload;
      state.totalUsdValueBorrow = borrowValue ?? state.totalUsdValueBorrow;
      state.totalUsdValueSupply = supplyValue ?? state.totalUsdValueSupply;
    },
  },
});

export const {
  setTotalUsdValueBorrow,
  setTotalUsdValueSupply,
  updateValues,
} = borrowSupplySlice.actions;
export default borrowSupplySlice.reducer;
