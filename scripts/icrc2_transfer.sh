#!/bin/bash

# Configuration
TOKEN_CANISTER_IDS=(
    "br5f7-7uaaa-aaaaa-qaaca-cai"
    "bw4dl-smaaa-aaaaa-qaacq-cai"
    "avqkn-guaaa-aaaaa-qaaea-cai"
    "asrmz-lmaaa-aaaaa-qaaeq-cai"
    "by6od-j4aaa-aaaaa-qaadq-cai"
)
BACKEND_CANISTER_ID="a4tbr-q4aaa-aaaaa-qaafq-cai"
SPENDER_PRINCIPAL=$(dfx --identity default identity get-principal)
SPENDER_ACCOUNT="(record { owner = principal \"$SPENDER_PRINCIPAL\"; subaccount = null })"
AMOUNT=10000000000000

# Create the common argument
TRANSFER_ARG="(record {
    spender_subaccount = null;
    from = $SPENDER_ACCOUNT;
    to = (record { owner = principal \"$BACKEND_CANISTER_ID\"; subaccount = null });
    amount = $AMOUNT;
    fee = null;
    memo = null;
    created_at_time = null;
})"

# Loop through each token canister ID and perform the transfer
for TOKEN_CANISTER_ID in "${TOKEN_CANISTER_IDS[@]}"; 
do
    echo "Transferring from $TOKEN_CANISTER_ID..."

    RESULT=$(dfx canister call "$TOKEN_CANISTER_ID" icrc2_transfer_from "$TRANSFER_ARG")

    echo "Result for $TOKEN_CANISTER_ID: $RESULT"
    echo "----------------------------------------"
done
