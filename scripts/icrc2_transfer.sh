#!/bin/bash
source ../.env
# Configuration
TOKEN_CANISTER_IDS=(
    $CANISTER_ID_CKUSDT_LEDGER
    $CANISTER_ID_CKUSDC_LEDGER
    $CANISTER_ID_CKETH_LEDGER
    $CANISTER_ID_CKBTC_LEDGER
    $CANISTER_ID_ICP_LEDGER
   
)
BACKEND_CANISTER_ID=$CANISTER_ID_DFINANCE_BACKEND
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
