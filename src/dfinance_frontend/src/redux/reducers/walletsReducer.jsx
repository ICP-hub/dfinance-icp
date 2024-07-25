
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    isWalletConnected: false,
    isWalletModalOpen: false,
    walletDetails: {
        provider: {},
        ledgerActor: {},
        principalId: null,
        accountId: null,
        walletActive: null,
        balance: null,
        wallets: [],
        canisterActors: {},
        getWalletBalance: {}
    },
}

const walletsSlice = createSlice({
    name: 'utility',
    initialState,
    reducers: {
        setIsWalletConnected: (state, action) => {
            state.isWalletConnected = action.payload
        },
        setWalletModalOpen: (state, action) => {
            state.isWalletModalOpen = action.payload
        },
        setWalletDetails: (state, action) => {
            state.walletDetails = { ...state.walletDetails, ...action.payload }
        },
        setWalletProviders: (state, action) => {
            state.walletDetails.wallets = action.payload;
        },
    },
})

export const {
    setIsWalletConnected,
    setWalletModalOpen,
    setWalletDetails,
    walletDetails
} = walletsSlice.actions

export default walletsSlice.reducer
