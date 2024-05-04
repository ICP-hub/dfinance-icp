import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isWalletConnected: false,
  isWalletModalOpen: false,
  assetDetailFilter: "Supply Info",
}

const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {
    // set wallet created status
    setIsWalletConnected: (state, action) => {
      state.isWalletConnected = action.payload
    },
    // set asset detail filter
    setAssetDetailFilter: (state, action) => {
      state.assetDetailFilter = action.payload
    },
    setWalletModalOpen: (state, action) => {
      state.isWalletModalOpen = action.payload
    },
  },
})

export const { setIsWalletConnected, setAssetDetailFilter, setWalletModalOpen } = utilitySlice.actions
export default utilitySlice.reducer
