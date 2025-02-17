import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  assets: {},
};

const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    updateAssetValues: (state, action) => {
      const { asset, assetSupplyInUSD, assetBorrowInUSD } = action.payload;
      state.assets[asset] = {
        assetSupplyInUSD,
        assetBorrowInUSD,
      };
    },
  },
});

export const { updateAssetValues } = assetSlice.actions;
export default assetSlice.reducer;
