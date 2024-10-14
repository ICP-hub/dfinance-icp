#!/bin/bash

set -e

# Load environment variables from .env
source ../../.env

# Set variables
ckbtc_canister="aovwi-4maaa-aaaaa-qaagq-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
debt_canister="aax3a-h4aaa-aaaaa-qaahq-cai"
approve_method="icrc2_approve"
borrow_method="borrow"
reserve_data_method="get_reserve_data"

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
asset="ckETH"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

# Approve the transfer
# approve_amount=1000000000  # Set the amount you want to approve
# echo "Approving transfer of $approve_amount from user1 to backend_canister..."
# allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
#     from_subaccount=null;
#     spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
#     amount=$approve_amount:nat;
#     expected_allowance=null;
#     expires_at=null;
#     fee=null;
#     memo=null;
#     created_at_time=null
# })")
# echo "Allowance Set: $allow"
# echo "--------------------------------------"

dfx identity use default

# Call the borrow function on the backend canister
borrow_amount=300000000  
currency="ckETH" 
interest_rate=0  

echo "Borrowing $borrow_amount from backend_canister..."
borrow_result=$(dfx canister call $backend_canister $borrow_method "(\"$currency\", $borrow_amount:nat64)")
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
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"

# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
