#!/bin/bash

set -e



# Set token name and symbol
export TOKEN_NAME="dckBTC"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="dckBTC"

# Set default principal (used for minting account)
export BACKEND="be2us-64aaa-aaaaa-qaabq-cai"

# Set pre-minted tokens and transfer fee (initial circulation is set to 0)
export PRE_MINTED_TOKENS=0
export TRANSFER_FEE=100

export 

# Set archive-related parameters
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# Set feature flags (optional)
export FEATURE_FLAGS=false

# Deploy the token canister with the specified arguments
dfx deploy dtoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${BACKEND}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} };
     initial_balances = vec {};  
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${BACKEND}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }})"

echo "dckBTC has been successfully deployed with initial circulation set to 0."