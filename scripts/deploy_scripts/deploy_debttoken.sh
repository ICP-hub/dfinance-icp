#!/bin/bash

set -e

dfx identity new newminter  || true

dfx identity use newminter 

export MINTER=$(dfx identity get-principal)
echo "Minter Principal: $MINTER"

export TOKEN_NAME="debtToken"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="debtToken"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0

export 

export USER=$(dfx identity get-principal)
echo "User Principal: $USER"

export ARCHIVE_CONTROLLER=$USER

export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000
export FEATURE_FLAGS=true

# Deploy the token canister with the specified arguments
dfx deploy dtoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} };
    
     initial_balances = vec { record { record { owner = principal \"${USER}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${BACKEND}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }})"

echo "ckBTC got deployed with a transfer fee of ${TRANSFER_FEE}"