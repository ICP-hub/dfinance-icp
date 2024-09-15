#!/bin/bash

set -e

source ../../.env

# Set variables
ckbtc_canister=$CANISTER_ID_CKBTC_LEDGER  
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
debt_canister=$CANISTER_ID_DEBTTOKEN
dtoken_canister=$CANISTER_ID_DTOKEN
reserve_data_method="get_reserve_data"

# Use the default identity
dfx identity use default

# Get the principal for the default identity
user_principal=$(dfx identity get-principal)
echo "User Principal (Debt User): $user_principal"

# Get the principal for the backend canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

# Fetch and display balances before repay
echo "Checking balances before repay..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User Balance: $user_balance"
echo "Backend Canister Balance: $backend_balance"
echo "User Debt Token Balance: $user1_debt_token_balance"
echo "--------------------------------------"

# Set the amount to repay
amount=1000
echo "Repaying $amount of ckbtc..."
ON_BEHALF_OF=null
asset="ckBTC"
# Call the repay function
repay=$(dfx canister call dfinance_backend repay "(\"ckBTC\", $amount:nat, ${ON_BEHALF_OF})")
echo "Repay Execution Result: $repay"

# Fetch and display balances after repay
echo "Checking balances after repay..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
# user_dtoken_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User Balance after repay: $user_balance"
echo "Backend Canister Balance after repay: $backend_balance"
echo "User Debt Token Balance after repay: $user1_debt_token_balance"

echo "--------------------------------------"

# Fetching reserve data after repay
echo "Fetching reserve data after repay..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"ckBTC\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"