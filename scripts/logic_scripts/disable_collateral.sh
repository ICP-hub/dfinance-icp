#!/bin/bash

set -e

# Load environment variables from .env
source ../../.env

# Set variables
ckbtc_canister="aovwi-4maaa-aaaaa-qaagq-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
debt_canister="aax3a-h4aaa-aaaaa-qaahq-cai"
approve_method="icrc2_approve"
disable_collateral_method="disable_collateral"
reserve_data_method="get_reserve_data"

# Get the principal for the user1 identity (disable_collateral)
dfx identity use default
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (disable_collateral): $user1_principal"

# Get the principal for the backend_canister (lender)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Lender): $backend_canister_principal"

# Check balances before operations
echo "Checking balances before operations..."
user1_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User1 Balance: $user1_balance"
echo "Backend Canister Balance: $backend_balance"
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
echo "User1 Debt Balance: $user1_debt_token_balance"
echo "--------------------------------------"


echo "Fetching reserve data..."
asset="ckETH"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

dfx identity use default

# Call the disable_collateral function on the backend canister
# borrow_amount=300000000
collateral_amount=300000
currency="ckETH" 
# interest_rate=0  

#echo "Borrowing $borrow_amount from backend_canister..."
echo "collateral $collateral_amount from backend_canister..."
disable_collateral_result=$(dfx canister call $backend_canister $disable_collateral_method "(\"$currency\", $collateral_amount:nat)")
echo "disable_collateral Result: $disable_collateral_result"
echo "--------------------------------------"

# Check balances after borrow
echo "Checking balances after Borrow..."
user1_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User1 Balance After function calling: $user1_balance_after"
echo "Backend Canister Balance After function calling: $backend_balance_after"
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
echo "User1 Debt token Balance after function calling: $user1_debt_token_balance"
echo "--------------------------------------"

echo "Fetching reserve data after function calling..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
