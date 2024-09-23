#!/bin/bash

set -e

# Function to check the balance for a specific principal
check_balance() {
    local principal=$1
    local label=$2
    local canister_id="cuj6u-c4aaa-aaaaa-qaajq-cai"
    local balance_method="icrc1_balance_of"

    # Check the balance
    balance=$(dfx canister call $canister_id $balance_method "(record {owner=principal\"${principal}\"; subaccount=null})")
    echo "$label Principal: $principal"
    echo "$label Balance: $balance"
    echo "--------------------------------------"
}

# Get the principal for backend_canister
backend_canister_principal=$(dfx canister id dfinance_backend)
# dtoken_canister=$(dfx canister id dcketh)
user3="ajuq4-ruaaa-aaaaa-qaaga-cai"
# Check balance and principal for each identity
echo "Checking balance and principal for identities and backend canister..."

check_balance $(dfx identity get-principal --identity anonymous) "Anonymous"
check_balance $(dfx identity get-principal --identity default) "Default"
check_balance $(dfx identity get-principal --identity newminter) "newminter"
check_balance $user3 "User1"
check_balance $backend_canister_principal "Backend Canister"
# check_balance $dtoken_canister "DToken Canister"
# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
