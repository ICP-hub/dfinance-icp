#!/bin/bash

set -e

# Set variables
canister_id="ckbtc_ledger" 
transfer_method="icrc1_transfer"

# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"


user1_principal="zqnqq-6zsp3-yzaft-nylxj-vpug4-d2c5y-7xuuq-qot3v-4edvx-eoewq-zqe"
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
dfx identity use default

transfer_amount=5000  # Set the amount to transfer to user1
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
