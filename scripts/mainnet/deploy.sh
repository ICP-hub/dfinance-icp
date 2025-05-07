set -e

# Basic sanitization: Checks for typical principal format and disallowed characters
sanitize_principal() {
    local principal_str="$1"
    local sanitized_principal=""

    # Basic check: Length
    if [ ${#principal_str} -lt 5 ] || [ ${#principal_str} -gt 70 ]; then
        echo "Error: Principal '$principal_str' has unusual length." >&2 
        return 1 
    fi

    # Check if it roughly looks like a principal (alphanumeric and dashes)
    if [[ "$principal_str" =~ ^[a-zA-Z0-9-]+$ ]]; then
        echo "$principal_str" 
        return 0 
    else
        echo "Error: Principal '$principal_str' contains unexpected characters." >&2
        return 1 
    fi
}


dfx identity new minter --storage-mode=plaintext || true


dfx canister create dtoken --network ic || exit 1
dfx canister create debttoken --network ic || exit 1

dfx build dtoken --network ic || exit 1
dfx build debttoken --network ic || exit 1

# FOR ICP LEDGER
MINTER_ACCOUNT_ID=$(dfx --identity anonymous ledger account-id --network ic)
DEFAULT_ACCOUNT_ID=$(dfx --identity default ledger account-id --network ic)
backend=$CANISTER_ID_DFINANCE_BACKEND



MINTER_PRINCIPAL_RAW=$(dfx --identity minter identity get-principal --network ic)
# --- Sanitize Minter Principal ---
MINTER=$(sanitize_principal "$MINTER_PRINCIPAL_RAW") || exit 1 

DEFAULT_PRINCIPAL_RAW=$(dfx --identity default identity get-principal --network ic)
# --- Sanitize Default Principal ---
DEFAULT=$(sanitize_principal "$DEFAULT_PRINCIPAL_RAW") || exit 1 




MINTER_PRINCIPAL_RAW=$(dfx identity get-principal --network ic)
# --- Sanitize Minter Principal ---
export MINTER=$(sanitize_principal "$MINTER_PRINCIPAL_RAW") || exit 1 
echo "Minter Principal: $MINTER"

export TOKEN_NAME="ckBTC"
export TOKEN_SYMBOL="ckBTC"
export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0


USER_PRINCIPAL_RAW=$(dfx identity get-principal --network ic)
export USER=$(sanitize_principal "$USER_PRINCIPAL_RAW") || exit 1 
echo "User Principal: $USER"

export ARCHIVE_CONTROLLER=$USER
export TRIGGER_THRESHOLD=2_000
export NUM_OF_BLOCK_TO_ARCHIVE=1_000
export CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
export FEATURE_FLAGS=true

dfx deploy ckbtc_ledger  --network ic --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
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

echo "ckBTC got deployed with a transfer fee of ${TRANSFER_FEE}"


export TOKEN_NAME="ckETH"
export TOKEN_SYMBOL="ckETH"
export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=0
echo "Token Name: $TOKEN_NAME"


USER_PRINCIPAL_RAW=$(dfx identity get-principal --network ic)
export USER=$(sanitize_principal "$USER_PRINCIPAL_RAW") || exit 1 
echo "User Principal: $USER"

export ARCHIVE_CONTROLLER=$USER
export TRIGGER_THRESHOLD=2_000
export NUM_OF_BLOCK_TO_ARCHIVE=1_000
export CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
export FEATURE_FLAGS=true

dfx deploy cketh_ledger  --network ic --argument "(variant {Init =
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

echo "ckBTC got deployed with a transfer fee of ${TRANSFER_FEE}"

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

dfx canister create xrc --network ic || exit 1
dfx build xrc --network ic || exit 1
dfx deploy xrc --network ic || exit 1
dfx identity use default


# Get the admin principal and export it
admin_principal_raw=$(dfx identity get-principal  --network ic)
export admin_principal=$(sanitize_principal "$admin_principal_raw") || exit 1 

# Deploy the canister with the principal as an argument
dfx deploy dfinance_backend --network ic --argument "(
    principal \"$admin_principal\"
)"|| exit 1

XRC_CANISTER_ID=$(dfx canister id xrc  --network ic)
dfx canister call dfinance_backend set_canister_id "(\"xrc\", principal \"$XRC_CANISTER_ID\")" --network ic || exit 1

dfx deploy --network ic || exit 1
