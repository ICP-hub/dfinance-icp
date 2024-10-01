#!/bin/bash

set -e

# Set variables
canister_id="aax3a-h4aaa-aaaaa-qaahq-cai" 
transfer_method="icrc1_transfer"

# dfx identity use anonymous
# anonymous_principal=$(dfx identity get-principal)
# echo "Default Principal (Spender): $anonymous_principal"
# Get the principal for the default identity (spender)
dfx identity use default
default_principal=$(dfx identity get-principal)
echo "Default Principal (Spender): $default_principal"

<<<<<<< HEAD
user1_principal="jbrl6-ig4ap-zqnea-weygb-axcfn-ytque-6x7hb-5wy7p-lp3lt-6f5ih-eqe"
=======
user1_principal="br5f7-7uaaa-aaaaa-qaaca-cai"
>>>>>>> 392d2cbc44afbb6dc708c77df86eb6b720ab4abc
echo "User1 Principal (Recipient): $user1_principal"

# Switch back to the default identity
# dfx identity use anonymous

<<<<<<< HEAD
transfer_amount=312500  # Set the amount to transfer to user1
=======
transfer_amount=1000000  # Set the amount to transfer to user1
>>>>>>> 392d2cbc44afbb6dc708c77df86eb6b720ab4abc
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