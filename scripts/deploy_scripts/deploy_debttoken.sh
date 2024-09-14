#!/bin/bash

set -e

# dfx identity use minter

# export MINTER=$(dfx identity get-principal)
# echo $MINTER
export BACKEND="avqkn-guaaa-aaaaa-qaaea-cai"

export TOKEN_NAME="debtckBTC"
echo "token_name : $TOKEN_NAME"

export TOKEN_SYMBOL="debtckBTC"

#dfx identity use default

export DEFAULT="2vxsx-fae"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=100

dfx identity use abcd

export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

export TRIGGER_THRESHOLD=2000

export NUM_OF_BLOCK_TO_ARCHIVE=1000

export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

export FEATURE_FLAGS=false

dfx deploy debttoken --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${BACKEND}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "debtckbtc got deployed"