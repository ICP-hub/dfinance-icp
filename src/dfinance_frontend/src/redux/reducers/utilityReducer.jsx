import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isWalletConnected: false,
  isWalletModalOpen: false,
  assetDetailFilter: "Supply Info",
  isTestnetMode: false, // Default to false
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
    toggleTestnetMode: (state) => {
      state.isTestnetMode = !state.isTestnetMode
    },
  },
})

export const { setIsWalletConnected, setAssetDetailFilter, setWalletModalOpen, toggleTestnetMode } = utilitySlice.actions
export default utilitySlice.reducer
