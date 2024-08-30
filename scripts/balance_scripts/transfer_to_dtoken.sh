#!/bin/bash

set -e

# Set variables
canister_id="c5kvi-uuaaa-aaaaa-qaaia-cai" 
transfer_method="icrc1_transfer"

# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"


platform_canister=$(dfx canister id dfinance_backend)
# Get the principal for the user1 identity (recipient)
# dfx identity use user1
# user1_principal=$(dfx identity get-principal)
# echo "User1 Principal (Recipient): $user1_principal"

user1_dtoken=$(dfx canister call $canister_id icrc1_balance_of "(record {owner=principal\"${default_principal}\"; subaccount=null})")
echo "User1 Principal (Recipient) Balance of Dtoken: $user1_dtoken"

# Switch back to the default identity
dfx identity use default

# Directly perform the transfer to user1 (skip the approval since self-approval is not allowed)
transfer_amount=50  # Set the amount to transfer to user1
transfer_result=$(dfx canister call $canister_id $transfer_method "(record {
    
    to=record { owner=principal\"${platform_canister}\"; subaccount=null };
    
    fee=null;
    spender_subaccount=null;
    memo=null;
    created_at_time=null;
    amount=$transfer_amount:nat;
})")

echo "Transfer Result: $transfer_result"

# Switch back to the default identity at the end
user1_dtoken=$(dfx canister call $canister_id icrc1_balance_of "(record {owner=principal\"${default_principal}\"; subaccount=null})")
echo "User1 Principal (Recipient) Balance of Dtoken: $user1_dtoken"

dfx identity use default
echo "Switched back to default identity."
