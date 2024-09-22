#!/bin/bash

set -e

# Set variables
canister_id="c5kvi-uuaaa-aaaaa-qaaia-cai" 
transfer_method="icrc1_transfer"

# dfx identity use anonymous
# anonymous_principal=$(dfx identity get-principal)
# echo "Default Principal (Spender): $anonymous_principal"
# Get the principal for the default identity (spender)
dfx identity use abcd
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"

user1_principal="r4qhz-bwc3c-jhjiq-tbusz-xxsoi-qat5u-qtngc-ypvla-hri5v-uj7ix-sae"
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
# dfx identity use anonymous

transfer_amount=300000  # Set the amount to transfer to user1
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
dfx identity use abcd
echo "Switched back to default identity."