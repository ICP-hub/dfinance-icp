#!/bin/bash

set -e

source ../../../../.env

# Set variables
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  

# Define an array of user identities
users=("user1" "user2")  # Update this list with desired identities

for user in "${users[@]}"; do
    echo "========================================="
    echo "Running script for identity: $user"
    echo "========================================="

    # Switch to the user identity
    dfx identity use $user
    user_principal=$(dfx identity get-principal)
    echo "User Principal: $user_principal"

    # Call the login function
    echo "Logging in..."
    login_result=$(dfx canister call $backend_canister register_user "()")
    echo "Login Execution Result: $login_result"

    echo "--------------------------------------"
done

echo "Script completed for all users!"
