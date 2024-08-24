# #!/bin/bash

# set -e

# dfx identity use minter

# export MINTER=$(dfx identity get-principal)
# echo $MINTER

# export TOKEN_NAME="dckBTC"
# echo "token_name : $TOKEN_NAME"

# export TOKEN_SYMBOL="dckBTC"

# #dfx identity use default

# export DEFAULT="2vxsx-fae"

# export PRE_MINTED_TOKENS=10_000_000_000
# export TRANSFER_FEE=10_000

# dfx identity use default

# export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

# export TRIGGER_THRESHOLD=2000

# export NUM_OF_BLOCK_TO_ARCHIVE=1000

# export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# export FEATURE_FLAGS=false

# dfx deploy dtoken --argument "(variant {Init =
# record {
#      token_symbol = \"${TOKEN_SYMBOL}\";
#      token_name = \"${TOKEN_NAME}\";
#      minting_account = record { owner = principal \"${MINTER}\" };
#      transfer_fee = ${TRANSFER_FEE};
#      metadata = vec {};
#      feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
#      initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
#      archive_options = record {
#          num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
#          trigger_threshold = ${TRIGGER_THRESHOLD};
#          controller_id = principal \"${ARCHIVE_CONTROLLER}\";
#          cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
#      };
#  }
# })"

# echo "dckbtc got deployed"

#!/bin/bash

set -e



# Set token name and symbol
export TOKEN_NAME="dckBTC"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="dckBTC"

# Set default principal (used for minting account)
export BACKEND="avqkn-guaaa-aaaaa-qaaea-cai"

# Set pre-minted tokens and transfer fee (initial circulation is set to 0)
export PRE_MINTED_TOKENS=0
export TRANSFER_FEE=100



# Set archive-related parameters
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# Set feature flags (optional)
export FEATURE_FLAGS=false
# Debugging: Print the command before execution
echo "Running command: dfx deploy dtoken --argument \"(variant { Init = record { token_symbol = \"${TOKEN_SYMBOL}\"; token_name = \"${TOKEN_NAME}\"; minting_account = record { owner = principal \"${BACKEND}\" }; transfer_fee = ${TRANSFER_FEE}; metadata = vec {}; feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} }; initial_balances = vec {};  archive_options = record { num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE}; trigger_threshold = ${TRIGGER_THRESHOLD}; controller_id = principal \"${BACKEND}\"; cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION}; }; }})\""

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

# Deploy the token canister with the specified arguments
# dfx deploy dtoken --argument "(variant { Init = record {
#      token_symbol = \"${TOKEN_SYMBOL}\";
#      token_name = \"${TOKEN_NAME}\";
#      minting_account = record { owner = principal \"${BACKEND}\" };
#      transfer_fee = ${TRANSFER_FEE};
#      metadata = vec {};
#      feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} };
#      initial_balances = vec {};  
#      archive_options = record {
#          num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
#          trigger_threshold = ${TRIGGER_THRESHOLD};
#          controller_id = principal \"${BACKEND}\";
#          cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
#      };
#  }})"

echo "dckBTC has been successfully deployed with initial circulation set to 0."
