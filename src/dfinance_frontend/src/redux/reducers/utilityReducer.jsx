import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isWalletConnected: false,
  isWalletModalOpen: false,
  assetDetailFilter: "Supply Info",
  isTestnetMode: false, // Default to false
  connectedWallet: null,
  isSwitchingWallet: false, 
}

const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {
    // Set wallet connected status
    setIsWalletConnected: (state, action) => {
      state.isWalletConnected = action.payload
    },
    // Set asset detail filter
    setAssetDetailFilter: (state, action) => {
      state.assetDetailFilter = action.payload
    },
    // Open/close wallet modal and specify if switching
    setWalletModalOpen: (state, action) => {
      state.isWalletModalOpen = action.payload.isOpen;
      state.isSwitchingWallet = action.payload.isSwitching;
    },
    // Set connected wallet info
    setConnectedWallet: (state, action) => {
      state.connectedWallet = action.payload
    },
    // Disconnect wallet (clear current wallet)
    disconnectWallet: (state) => {
      state.connectedWallet = null;
      state.isWalletConnected = false;
    },
    // Set wallet switching state
    setIsSwitchingWallet: (state, action) => {
      state.isSwitchingWallet = action.payload;
    }
  },
})

export const { 
  setIsWalletConnected, 
  setAssetDetailFilter, 
  setWalletModalOpen, 
  setConnectedWallet, 
  disconnectWallet, 
  setIsSwitchingWallet 
} = utilitySlice.actions;

export default utilitySlice.reducer;
