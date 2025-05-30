set -e

# -------------------------------
# Create new identity for minter
# -------------------------------
dfx identity new minter --storage-mode=plaintext || true


# ----------------------------------
# Create canisters
# ----------------------------------
dfx canister create dtoken
dfx canister create debttoken
dfx canister create token_ledger

# -----------------------------
# Build canisters
# -----------------------------
dfx build dtoken
dfx build debttoken
dfx build token_ledger

# -----------------------------
# Set common environment variables
# -----------------------------
export MINTER="$(dfx identity get-principal)"
dfx identity use default
export USER="$(dfx identity get-principal)"
echo "Minter Principal: $MINTER"
echo "User Principal: $USER"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=10
export ARCHIVE_CONTROLLER="$USER"
export TRIGGER_THRESHOLD=2_000
export NUM_OF_BLOCK_TO_ARCHIVE=1_000
export CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
export FEATURE_FLAGS=true
export TRANSFER_FEE_TOKEN=0

# -----------------------------
# Deploy token_ledger
# -----------------------------
export TOKEN_NAME="token_ledger"
export TOKEN_SYMBOL="token_ledger"
echo "Token Name: $TOKEN_NAME"

dfx deploy token_ledger --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = "${TRANSFER_FEE}";
     metadata = vec {};
     feature_flags = opt record { icrc2 = "${FEATURE_FLAGS}" };
    
     initial_balances = vec { record { record { owner = principal \"${USER}\"; }; "${PRE_MINTED_TOKENS}"; }; };
     archive_options = record {
         num_blocks_to_archive = "${NUM_OF_BLOCK_TO_ARCHIVE}";
         trigger_threshold = "${TRIGGER_THRESHOLD}";
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt "${CYCLE_FOR_ARCHIVE_CREATION}";
     };
 }})"


# -----------------------------
# Deploy dtoken
# -----------------------------
export TOKEN_NAME="dtoken"
export TOKEN_SYMBOL="dtoken"
echo "Token Name: $TOKEN_NAME"

 dfx deploy dtoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = "${TRANSFER_FEE_TOKEN}";
     metadata = vec {};
     feature_flags = opt record { icrc2 = "${FEATURE_FLAGS}" };
    
     initial_balances = vec {};
     archive_options = record {
         num_blocks_to_archive = "${NUM_OF_BLOCK_TO_ARCHIVE}";
         trigger_threshold = "${TRIGGER_THRESHOLD}";
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt "${CYCLE_FOR_ARCHIVE_CREATION}";
     };
 }})"


# -----------------------------
# Deploy debttoken
# -----------------------------
export TOKEN_NAME="debttoken"
export TOKEN_SYMBOL="debttoken"
echo "Token Name: $TOKEN_NAME"

 dfx deploy debttoken --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = "${TRANSFER_FEE_TOKEN}";
     metadata = vec {};
     feature_flags = opt record { icrc2 = "${FEATURE_FLAGS}" };
    
     initial_balances = vec {};
     archive_options = record {
         num_blocks_to_archive = "${NUM_OF_BLOCK_TO_ARCHIVE}";
         trigger_threshold = "${TRIGGER_THRESHOLD}";
         controller_id = principal \"${USER}\";
         cycles_for_archive_creation = opt "${CYCLE_FOR_ARCHIVE_CREATION}";
     };
 }})"

# -----------------------------
# Deploy data_storage canister
# -----------------------------
dfx canister create data_storage
dfx build data_storage
dfx deploy data_storage


# -----------------------------
# Deploy xrc canister
# -----------------------------
dfx canister create xrc
dfx build xrc
dfx deploy xrc



# -----------------------------
# Deploy dfinance_backend and set canister references
# -----------------------------
export admin_principal="$(dfx identity get-principal)"
dfx deploy dfinance_backend --argument "(
    principal \"$admin_principal\"
)"

# -----------------------------
# Add backend canister the controller of the data_storage canister
# -----------------------------
BACKEND_CANISTER_ID=$(dfx canister id dfinance_backend)
dfx canister update-settings data_storage --add-controller "$BACKEND_CANISTER_ID"


# -------------------------------
# Set xrc and log canister ID
# -------------------------------
XRC_CANISTER_ID=$(dfx canister id xrc)
DATA_STORAGE_CANISTER_ID=$(dfx canister id data_storage)
dfx canister call dfinance_backend set_canister_id "(\"xrc\", principal \"$XRC_CANISTER_ID\")"
dfx canister call dfinance_backend set_canister_id "(\"data_storage\", principal \"$DATA_STORAGE_CANISTER_ID\")"
dfx canister call dfinance_backend admin_restart_reset_task

# Final deploy
dfx deploy
