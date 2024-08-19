#!/bin/bash

set -e

# Set variables
canister_id="ckbtc_ledger"  # Replace with your actual canister ID if different
transfer_method="icrc1_transfer"

# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"


dtoken_canister=$(dfx canister id dfinance_backend)
# Get the principal for the user1 identity (recipient)
# dfx identity use user1
# user1_principal=$(dfx identity get-principal)
# echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
dfx identity use default

# Directly perform the transfer to user1 (skip the approval since self-approval is not allowed)
transfer_amount=50000  # Set the amount to transfer to user1
transfer_result=$(dfx canister call $canister_id $transfer_method "(record {
    from_subaccount=null;
    to=record { owner=principal\"${dtoken_canister}\"; subaccount=null };
    amount=$transfer_amount:nat;
    fee=null;
    memo=null;
    created_at_time=null
})")

echo "Transfer Result: $transfer_result"

# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
