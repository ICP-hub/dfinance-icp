#!/bin/bash

set -e

# Set variables
ckbtc_canister="bkyz2-fmaaa-aaaaa-qaaaq-cai"
backend_canister="b77ix-eeaaa-aaaaa-qaada-cai"
debt_canister="asrmz-lmaaa-aaaaa-qaaeq-cai"
dtoken_canister="avqkn-guaaa-aaaaa-qaaea-cai"
reserve_data_method="get_reserve_data"

# Use the default identity
dfx identity use default

# Get the principal for the default identity
user_principal=$(dfx identity get-principal)
echo "User Principal (Debt User): $user_principal"

# Fetch and display balances before withdraw
echo "Checking balances before withdraw..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister}\"; subaccount=null})")
user_dtoken_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User Balance: $user_balance"
echo "Backend Canister Balance: $backend_balance"
echo "User Dtoken Balance: $user_dtoken_balance"
echo "--------------------------------------"

# Set the amount to withdraw
amount=1000
collateral=true
on_behalf_of=null  

# Call the withdraw function
echo "Withdrawing $amount of ckbtc..."
withdraw=$(dfx canister call dfinance_backend withdraw "(\"ckBTC\", $amount:nat, ${on_behalf_of}, $collateral:bool)")
echo "Withdraw Execution Result: $withdraw"

# Fetch and display balances after withdraw
echo "Checking balances after withdraw..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister}\"; subaccount=null})")
user_dtoken_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User Balance after withdraw: $user_balance"
echo "Backend Canister Balance after withdraw: $backend_balance"
echo "User Dtoken Balance after withdraw: $user_dtoken_balance"
echo "--------------------------------------"

# Fetching reserve data after withdraw
echo "Fetching reserve data after withdraw..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"ckBTC\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"
