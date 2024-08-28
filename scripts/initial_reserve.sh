#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Canister ID for the backend canister
BACKEND_CANISTER_ID="dfinance_backend"

# List of ledger tokens to initialize in the reserve list
LEDGER_TOKENS='(vec {
    record { "ckBTC"; principal "c2lt4-zmaaa-aaaaa-qaaiq-cai" };
    record { "ckETH"; principal "ctiya-peaaa-aaaaa-qaaja-cai" };
})'

# Call the initialize_reserve_list function on the backend canister
echo "Calling initialize_reserve_list on $BACKEND_CANISTER_ID..."
dfx canister call $BACKEND_CANISTER_ID initialize_reserve_list "$LEDGER_TOKENS"

echo "Initialization of reserve list completed."
