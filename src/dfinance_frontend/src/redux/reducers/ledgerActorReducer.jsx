// features/ledger/ledgerSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Principal } from "@dfinity/principal";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger"; // Import the correct path

// Initial state for ledger slice
const initialState = {
  assetPrincipals: {},
  balances: {
    ckBTC: null,
    ckETH: null,
    ckUSDC: null,
    ICP: null,
  },
  usdRates: {
    ckBTC: null,
    ckETH: null,
    ckUSDC: null,
    ICP: null,
  },
  error: null,
  loading: false,
};

// Async thunk to fetch asset principals
export const fetchAssetPrincipals = createAsyncThunk(
  "ledger/fetchAssetPrincipals",
  async (_, { getState }) => {
    const { backendActor } = getState().auth;
    const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP"];
    const assetPrincipals = {};

    for (const asset of assets) {
      const result = await backendActor.get_asset_principal(asset);
      assetPrincipals[asset] = result.Ok.toText();
    }

    return assetPrincipals;
  }
);

// Async thunk to fetch balances
export const fetchBalances = createAsyncThunk(
  "ledger/fetchBalances",
  async (_, { getState }) => {
    const { assetPrincipals } = getState().ledger;
    const { principalObj } = getState().auth;

    const balances = {};
    const account = { owner: Principal.fromText(principalObj), subaccount: [] };

    for (const asset in assetPrincipals) {
      const ledgerActor = await createLedgerActor(assetPrincipals[asset], ledgerIdlFactory);
      balances[asset] = await ledgerActor.icrc1_balance_of(account);
    }

    return balances;
  }
);

// Slice
const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    resetError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetPrincipals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssetPrincipals.fulfilled, (state, action) => {
        state.assetPrincipals = action.payload;
        state.loading = false;
      })
      .addCase(fetchAssetPrincipals.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { resetError } = ledgerSlice.actions;
export default ledgerSlice.reducer;
