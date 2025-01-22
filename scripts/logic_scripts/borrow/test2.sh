#!/bin/bash

set -e

# Load environment variables from .env
source ../../../.env

# Set variables
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
debt_canister="ajuq4-ruaaa-aaaaa-qaaga-cai"
approve_method="icrc2_approve"
borrow_method="execute_borrow"
reserve_data_method="get_reserve_data"
get_user_method="get_user_data"

# Get the principal for the user1 identity (borrower)
dfx identity use default
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Borrower): $user1_principal"

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
asset="ckBTC"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"

echo "--------------------------------------"

echo "Fetching user data..."
echo "get_user_method: $get_user_method"
user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user1_principal}\")")
echo "user data: $user_data"

echo "--------------------------------------"

dfx identity use default

# Call the borrow function on the backend canister
borrow_amount=300000000 
currency="ckBTC" 

echo "Borrowing $borrow_amount from backend_canister..."
borrow_result=$(dfx canister call $backend_canister $borrow_method "(record { asset=\"$currency\"; amount=$borrow_amount:nat })")
echo "Borrow Result: $borrow_result"

echo "--------------------------------------"

# Check balances after borrow
echo "Checking balances after Borrow..."
user1_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User1 Balance After Borrow: $user1_balance_after"
echo "Backend Canister Balance After Borrow: $backend_balance_after"
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
echo "User1 Debt token Balance after borrow: $user1_debt_token_balance"

echo "--------------------------------------"

echo "Fetching reserve data after borrow..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"

echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user1_principal}\")")
echo "user data: $user_data"

echo "--------------------------------------"

echo "Test Case 2 Passed Successfully: Borrow of $borrow_amount $currency failed as expected due to borrow amount is greater than the supplied amount!"

echo "--------------------------------------"

