import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isWalletConnected: false,
  isWalletModalOpen: false,
  assetDetailFilter: "Supply Info",
  isTestnetMode: false, 
  connectedWallet: null,
  isSwitchingWallet: false, 
}

const utilitySlice = createSlice({
  name: "utility",
  initialState,
  reducers: {

    setIsWalletConnected: (state, action) => {
      state.isWalletConnected = action.payload
    },

    setAssetDetailFilter: (state, action) => {
      state.assetDetailFilter = action.payload
    },

    setWalletModalOpen: (state, action) => {
      state.isWalletModalOpen = action.payload.isOpen;
      state.isSwitchingWallet = action.payload.isSwitching;
    },

    setConnectedWallet: (state, action) => {
      state.connectedWallet = action.payload;
      localStorage.setItem("connectedWallet", action.payload); 
    },

    disconnectWallet: (state) => {
      state.connectedWallet = null;
      state.isWalletConnected = false;
    },

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