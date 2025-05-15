set -e

# -------------------------------
# Create new identity for minter
# -------------------------------
#TODO: i think we need to avoid using plain test in principal
dfx identity new minter --storage-mode=plaintext || true

# -------------------------------
# Create canisters
# -------------------------------
dfx canister create dtoken --network ic || exit 1
dfx canister create debttoken --network ic || exit 1
dfx canister create token_ledger --network ic || exit 1


# -------------------------------
# Build all canisters
# -------------------------------
dfx build dtoken --network ic || exit 1
dfx build debttoken --network ic || exit 1
dfx build token_ledger --network ic || exit 1


# -----------------------------
# Set common environment variables
# -----------------------------
export MINTER="$(dfx identity get-principal)"
export USER="$(dfx identity get-principal)"
echo "Minter Principal: $MINTER"
echo "User Principal: $USER"



export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0
export ARCHIVE_CONTROLLER=$USER
export TRIGGER_THRESHOLD=2_000
export NUM_OF_BLOCK_TO_ARCHIVE=1_000
export CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
export FEATURE_FLAGS=true


# -----------------------------
# Deploy ckBTC ledger
# -----------------------------
export TOKEN_NAME="ckBTC"
export TOKEN_SYMBOL="ckBTC"

dfx deploy ckbtc_ledger --network ic --argument "(variant {Init =
record {
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
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt "${CYCLE_FOR_ARCHIVE_CREATION}";
     };
 }
})"
echo "ckBTC got deployed"

# -----------------------------
# Deploy ckETH ledger
# -----------------------------
export TOKEN_NAME="ckETH"
export TOKEN_SYMBOL="ckETH"

dfx deploy cketh_ledger --network ic --argument "(variant {Init =
record {
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
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt "${CYCLE_FOR_ARCHIVE_CREATION}";
     };
 }
})"
echo "ckBTC got deployed"

# -----------------------------
# Deploy token_ledger
# -----------------------------
export TOKEN_NAME="token_ledger"
export TOKEN_SYMBOL="token_ledger"
echo "Token Name: $TOKEN_NAME"

dfx deploy token_ledger --network ic --argument "(variant { Init = record {
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

 dfx deploy dtoken --network ic --argument "(variant { Init = record {
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
export TOKEN_SYMBOL="debttoken"
export TOKEN_NAME="debttoken"
echo "Token Name: $TOKEN_NAME"

 dfx deploy debttoken --network ic --argument "(variant { Init = record {
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
# Deploy logs canister
# -----------------------------
dfx canister create logs --network ic || exit 1
dfx build logs --network ic || exit 1
dfx deploy logs --network ic || exit 1


# -------------------------------
# Create, build, and deploy xrc canister
# -------------------------------
dfx canister create xrc --network ic || exit 1
dfx build xrc --network ic || exit 1
dfx deploy xrc --network ic || exit 1

# -----------------------------
# Switch to default identity and deploy backend
# -----------------------------
dfx identity use default


# -------------------------------
# Deploy backend
# -------------------------------
export admin_principal="$(dfx identity get-principal)"
dfx deploy dfinance_backend --network ic --argument "(
    principal \"$admin_principal\"
)" || exit 1

# -----------------------------
# Add backend canister the controller of the logs canister
# -----------------------------
BACKEND_CANISTER_ID=$(dfx canister id dfinance_backend --network ic)
dfx canister update-settings logs --add-controller "$BACKEND_CANISTER_ID" --network ic

# -------------------------------
# Set xrc and log canister ID
# -------------------------------
XRC_CANISTER_ID=$(dfx canister id xrc --network ic)
LOGS_CANISTER_ID=$(dfx canister id logs --network ic)
dfx canister call dfinance_backend set_canister_id "(\"xrc\", principal \"$XRC_CANISTER_ID\")"  --network ic || exit 1
dfx canister call dfinance_backend set_canister_id "(\"logs\", principal \"$LOGS_CANISTER_ID\")" --network ic || exit 1

# Final deployment step
dfx deploy --network ic || exit 1
 