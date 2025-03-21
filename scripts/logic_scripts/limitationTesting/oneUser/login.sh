#!/bin/bash

set -e

source ../../../../.env

# Set variables
ICP_canister="cuj6u-c4aaa-aaaaa-qaajq-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  

# Use the identity
dfx identity get-principal

# Get the principal for the identity
user_principal=$(dfx identity get-principal)
echo "User Principal: $user_principal"

# echo "Fetching user data..."
# user_data=$(../integration_scripts/user_data.sh)
# echo "user data: $user_data"

# Call the login function
echo "Logging in..."
login_result=$(dfx canister call $backend_canister register_user "()")
echo "Login Execution Result: $login_result"
# echo "Fetching user data..."
# user_data=$(../integration_scripts/user_data.sh)
# echo "user data: $user_data"

echo "Script completed."
