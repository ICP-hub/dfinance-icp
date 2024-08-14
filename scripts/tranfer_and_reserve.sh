#!/bin/bash

set -e

# Set variables
ckbtc_canister="br5f7-7uaaa-aaaaa-qaaca-cai"  # Replace with your actual canister ID if different
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"  # Replace with your actual backend canister ID
approve_method="icrc2_approve"
transfer_method="icrc1_transfer"
reserve_data_method="get_asset_data"
initialize_reserve_method="initialize_reserve"

# Get the principal for the user1 identity (spender)
dfx identity use user1
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Spender): $user1_principal"

# Get the principal for the backend_canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

# Check balances before operations
echo "Checking balances before operations..."
user1_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User1 Balance: $user1_balance"
echo "Backend Canister Balance: $backend_balance"
echo "--------------------------------------"

# Initialize reserve in the backend canister
echo "Initializing reserve for ckbtc in backend canister..."
dfx canister call $backend_canister $initialize_reserve_method

# Echo the reserve data
echo "Fetching reserve data..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method)
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

# Approve the transfer
approve_amount=1000000000  # Set the amount you want to approve
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

# Perform the transfer from user1 to backend_canister
transfer_amount=100  # Set the amount to transfer
echo "Transferring $transfer_amount from user1 to backend_canister..."
transfer_result=$(dfx canister call $ckbtc_canister $transfer_method "(record {
    from_subaccount=null;
    to=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
    amount=$transfer_amount:nat;
    fee=null;
    memo=null;
    created_at_time=null
})")
echo "Transfer Result: $transfer_result"
echo "--------------------------------------"

# Check balances after transfer
echo "Checking balances after transfer..."
user1_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User1 Balance After Transfer: $user1_balance_after"
echo "Backend Canister Balance After Transfer: $backend_balance_after"
echo "--------------------------------------"

# Fetch and echo the updated reserve data
# echo "Fetching updated reserve data..."
# updated_reserve_data=$(dfx canister call $backend_canister $reserve_data_method)
# echo "Updated Reserve Data: $updated_reserve_data"
# echo "--------------------------------------"

# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
