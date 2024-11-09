#!/bin/bash

set -e

source ../../.env

# Set variables
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  

# Use the default identity
dfx identity use default

# Get the principal for the default identity
user_principal=$(dfx identity get-principal)
echo "User Principal: $user_principal"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

# Call the login function
echo "Logging in..."
login_result=$(dfx canister call $backend_canister login "()")
echo "Login Execution Result: $login_result"
echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

echo "Script completed."
