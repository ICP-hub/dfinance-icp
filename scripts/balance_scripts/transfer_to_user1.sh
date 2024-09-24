#!/bin/bash

set -e

# Set variables
canister_id="a3shf-5eaaa-aaaaa-qaafa-cai" 
transfer_method="icrc1_transfer"

# dfx identity use anonymous
# anonymous_principal=$(dfx identity get-principal)
# echo "Default Principal (Spender): $anonymous_principal"
# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"

user1_principal="csh2e-dh7ad-a7d43-7ipcu-g2ir2-coxfu-yclgo-brck4-ebgbj-y7ef3-6ae"
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
# dfx identity use anonymous

transfer_amount=1000  # Set the amount to transfer to user1
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