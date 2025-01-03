set -e
# dfx generate

# dfx build

# add delete canister for icrc1_ledger_canister

dfx identity new minter --storage-mode=plaintext || true
# dfx identity new reciever --storage-mode=plaintext || true
# dfx identity new testing --storage-mode=plaintext || true



# dfx identity use default


# to generate wasm
# cargo build --target wasm32-unknown-unknown -p d_token
dfx canister create dtoken
dfx canister create debttoken
dfx canister create token_ledger
dfx canister create ckbtc_ledger
dfx canister create cketh_ledger



dfx build dtoken
dfx build debttoken
dfx build token_ledger
dfx build ckbtc_ledger
dfx build cketh_ledger


# FOR ICP LEDGER
MINTER_ACCOUNT_ID=$(dfx --identity anonymous ledger account-id)
DEFAULT_ACCOUNT_ID=$(dfx --identity default ledger account-id)
backend=$CANISTER_ID_DFINANCE_BACKEND
# CANISTER IDS
# ASSET_CANISTER_ID=$(dfx canister id ic_asset_handler)
# DAO_CANISTER_ID=$(dfx canister id dao_canister)



# cargo install candid-extractor

# create .did files
# chmod 777 ./generate_did.sh
# ./generate_did.sh

MINTER=$(dfx --identity default identity get-principal)
DEFAULT=$(dfx --identity default identity get-principal)


# dfx identity new newminter  || true

# dfx identity use newminter 

export MINTER=$(dfx identity get-principal)
echo "Minter Principal: $MINTER"

export TOKEN_NAME="ckBTC"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="ckBTC"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0

# dfx identity use default

export USER=$(dfx identity get-principal)
echo "User Principal: $USER"

export ARCHIVE_CONTROLLER=$USER

export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000
export FEATURE_FLAGS=true

dfx deploy ckbtc_ledger --argument "(variant {Init =
record {
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
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "ckBTC got deployed with a transfer fee of ${TRANSFER_FEE}"





export TOKEN_NAME="ckETH"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="ckETH"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0

# dfx identity use default

export USER=$(dfx identity get-principal)
echo "User Principal: $USER"

export ARCHIVE_CONTROLLER=$USER

export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000
export FEATURE_FLAGS=true

dfx deploy cketh_ledger --argument "(variant {Init =
record {
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
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "ckBTC got deployed with a transfer fee of ${TRANSFER_FEE}"

export TOKEN_NAME="token_ledger"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="token_ledger"

dfx deploy token_ledger --argument "(variant { Init = record {
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
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }})"

 export TOKEN_NAME="dtoken"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="dtoken"

 dfx deploy dtoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} };
    
     initial_balances = vec {};
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }})"

 export TOKEN_NAME="debttoken"
echo "Token Name: $TOKEN_NAME"

export TOKEN_SYMBOL="debttoken"

 dfx deploy debttoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record { icrc2 = ${FEATURE_FLAGS} };
    
     initial_balances = vec {};
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }})"

dfx canister create xrc
dfx build xrc
dfx deploy xrc
dfx identity use default

# Get the admin principal and export it
export admin_principal=$(dfx identity get-principal)

dfx deploy
# Deploy the canister with the principal as an argument
dfx deploy dfinance_backend --argument "(
    principal \"$admin_principal\"
)"

dfx deploy

