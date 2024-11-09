#!/bin/bash

set -e

# Load environment variables from .env
source ../../.env 

# Set variables
# ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai"
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai"
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
dtoken_canister="a4tbr-q4aaa-aaaaa-qaafq-cai"
approve_method="icrc2_approve"
deposit_method="supply"
reserve_data_method="get_reserve_data"

# Get the principal for the user1 identity (spender)
dfx identity use default
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Spender): $user1_principal"

# Get the principal for the backend_canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

# Check balances before operations
echo "Checking balances before operations..."
user1_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_dtoken=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
echo "User1 Balance: $user1_balance"
echo "Backend Canister Balance: $backend_balance"
echo "User1 Dtoken Balance: $user1_dtoken"

echo "--------------------------------------"

# Echo the reserve data
echo "Fetching reserve data..."
asset="ckBTC"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

# Approve the transfer
approve_amount=300000000  # 2 tokens
echo "Approving transfer of $approve_amount from user1 to backend_canister..."
allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
    from_subaccount=null;
    spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
    amount=$approve_amount:nat;
    expected_allowance=null;
    expires_at=null;
    fee=null;
    memo=null;
    created_at_time=null
})")
echo "Allowance Set: $allow"
echo "--------------------------------------"

# Call the deposit function on the backend canister
dfx identity use default

# Get the principal of the default identity
deposit_amount=200000000
currency="ckBTC"  
is_collateral=true

# call the execute supply function
echo "Suppling $deposit_amount $currency to platform......."
result=$(dfx canister call dfinance_backend supply "(\"$currency\", $deposit_amount:nat64, $is_collateral:bool)")

echo "Supply Execution Result: $result"

# Check balances after deposit
echo "Checking balances after supply..."
user1_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_dtoken=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")

echo "User1 Balance After Deposit: $user1_balance_after"
echo "Backend Canister Balance After Deposit: $backend_balance_after"
echo "User1 Dtoken Balance After Deposit: $user1_dtoken"
echo "--------------------------------------"

echo "Fetching reserve data after supply..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"
