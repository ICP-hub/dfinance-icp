#!/bin/bash

set -e

# Set variables
canister_id="ckbtc_ledger" 
transfer_method="icrc1_transfer"

# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"


user1_principal="rfvqc-vrlx7-4rvjr-jm6pv-nac3a-7rrxy-2o2fr-onzo7-2mhig-mclw5-wae"
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
dfx identity use default

transfer_amount=500  # Set the amount to transfer to user1
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
