#!/bin/bash

set -e

# Load environment variables from .env
source ../../../../.env

CANISTER_ID=$CANISTER_ID_DFINANCE_BACKEND
ASSET="ckBTC"
AMOUNT=100000

# Define an array of user identities
users=("user1" "user2")  # Replace with desired user identities

for user in "${users[@]}"; do
    echo "========================================="
    echo "Executing faucet transfer for identity: $user"
    echo "========================================="

    # Switch to the user identity
    dfx identity use $user
    user_principal=$(dfx identity get-principal)
    echo "User Principal: $user_principal"

    # Call the faucet function
    echo "Requesting $AMOUNT $ASSET from faucet..."
    faucet_result=$(dfx canister call "$CANISTER_ID" faucet "(\"$ASSET\", $AMOUNT)")
    echo "Faucet Execution Result: $faucet_result"

    echo "--------------------------------------"
done

echo "Faucet transfers completed for all users!"
