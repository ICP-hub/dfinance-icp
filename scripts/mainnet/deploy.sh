set -e

#TODO: i think we need to avoid using plain test in principal
dfx identity new minter --storage-mode=plaintext || true

# -------------------------------
# Create canisters
# -------------------------------
dfx canister create dtoken --network ic || exit 1
dfx canister create debttoken --network ic || exit 1

# -------------------------------
# Build canisters
# -------------------------------
dfx build dtoken --network ic || exit 1
dfx build debttoken --network ic || exit 1


export MINTER="$(dfx identity get-principal --network ic)"
dfx identity use deployer_defi
export USER"=$(dfx identity get-principal --network ic)"

export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0
export ARCHIVE_CONTROLLER=$USER
export TRIGGER_THRESHOLD=2_000
export NUM_OF_BLOCK_TO_ARCHIVE=1_000
export CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
export FEATURE_FLAGS=true


# -----------------------------
# Deploy dtoken
# -----------------------------
export TOKEN_NAME="dtoken"
export TOKEN_SYMBOL="dtoken"
echo "Token Name: $TOKEN_NAME"

 dfx deploy dtoken  --network ic --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = "${TRANSFER_FEE}";
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

 dfx deploy debttoken  --network ic --argument "(variant { Init = record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${USER}\" };
     transfer_fee = "${TRANSFER_FEE}";
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
dfx canister create data_storage --network ic || exit 1
dfx build data_storage --network ic || exit 1
dfx deploy data_storage --network ic || exit 1



# -------------------------------
# Deploy backend
# -------------------------------
export admin_principal=$(dfx identity get-principal  --network ic)
dfx deploy dfinance_backend --network ic --argument "(
    principal \"$admin_principal\"
)"|| exit 1

# -----------------------------
# Add backend canister the controller of the data_storage canister
# -----------------------------
BACKEND_CANISTER_ID=$(dfx canister id dfinance_backend --network ic)
dfx canister update-settings data_storage --add-controller "$BACKEND_CANISTER_ID" --network ic


# -------------------------------
# Set xrc and data_storage canister ID
# -------------------------------
XRC_CANISTER_ID=uf6dk-hyaaa-aaaaq-qaaaq-cai
DATA_STORAGE_CANISTER_ID=$(dfx canister id data_storage  --network ic)

dfx canister call dfinance_backend set_canister_id "(\"xrc\", principal \"$XRC_CANISTER_ID\")" --network ic || exit 1
dfx canister call dfinance_backend set_canister_id "(\"data_storage\", principal \"$DATA_STORAGE_CANISTER_ID\")" --network ic || exit 1

# Final deployment step
dfx deploy --network ic || exit 1
