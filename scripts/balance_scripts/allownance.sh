#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Load environment variables from .env
source ../../.env 

# Get the backend canister ID from the environment variable
backend_canister=$CANISTER_ID_DFINANCE_BACKEND 

# Use the default identity for the transaction
dfx identity use default

# Set the transfer amount and token type
transfer_amount=100  # This should be a number, as expected by Rust
token_type="ckBTC"   # Token name as a string

# Call the transfer function and store the response
reserve_data=$(dfx canister call "$backend_canister" transfer "($transfer_amount, \"$token_type\")")

# Output the reserve data received from the transfer call
echo "Reserve Data: $reserve_data"
