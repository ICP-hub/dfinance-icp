#!/bin/bash

set -e

# Use the specific identity
# dfx identity new user1
dfx identity use default

# Get the principal of the user1 identity
USER=$(dfx identity get-principal)
echo "User Principal: $USER"

# Get the balance of the user1 identity
SPECIFIC_PRINCIPAL=$(dfx identity get-principal)
balance=$(dfx canister call ckbtc_ledger icrc1_balance_of "(record {owner=principal\"${SPECIFIC_PRINCIPAL}\"; subaccount=null})")
echo "Balance of the specific account \"${SPECIFIC_PRINCIPAL}\" : $balance"

# Switch to the default identity
dfx identity use user1
echo "Using user1 identity"
SPENDER=$(dfx identity get-principal)

#back to user
dfx identity use default
echo "Using default identity"

# Approve a spender with the necessary arguments
allow=$(dfx canister call ckbtc_ledger icrc2_approve "(record {
    from_subaccount=null;
    spender=record { owner=principal\"${SPENDER}\"; subaccount=null };
    amount=1000000000:nat;
    expected_allowance=null;
    expires_at=null;
    fee=null;
    memo=null;
    created_at_time=null
})")

echo "Allowance Result: $allow"

# call the execute supply function
result=$(dfx canister call dfinance backend execute_supply "(record {
    asset=\"$ASSET\";
    amount=$AMOUNT:nat;
    on_behalf_of=\"$ON_BEHALF_OF\";
    referral_code=$REFERRAL_CODE:nat16
})")

echo "Supply Execution Result: $result"

dfx identity use user2
echo "Using user2 identity"
Borrower=$(dfx identity get-principal)


# call the execute borrow function
result=$(dfx canister call dfinance backend execute_borrow "(record {
    asset=\"$ASSET\";
    amount=$AMOUNT:nat;
    on_behalf_of=\"$ON_BEHALF_OF\";
    referral_code=$REFERRAL_CODE:nat16
})")

echo "Borrow Execution Result: $result"



