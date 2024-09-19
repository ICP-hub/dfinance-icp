#!/bin/bash

set -e

# Set variables
canister_id="cketh_ledger" 
transfer_method="icrc1_transfer"

dfx identity use default
anonymous_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $anonymous_principal"
# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"

user1_principal="i4f5r-ibyds-5a2i3-26a4t-5xw6v-57xoh-sslj6-hv25w-gzcyx-eorjg-fqe"
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
dfx identity use default

transfer_amount=100001  # Set the amount to transfer to user1
transfer_result=$(dfx canister call $canister_id $transfer_method "(record {
    from_subaccount=null;
    to=record { owner=principal\"${user1_principal}\"; subaccount=null };
    amount=$transfer_amount:nat;
    fee=null;
    memo=null;
    created_at_time=null
})")

echo "Transfer Result: $transfer_result"

# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."