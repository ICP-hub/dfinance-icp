BACKEND_CANISTER_ID="dfinance_backend"

source ../../.env

# List of ledger tokens to initialize in the reserve list
LEDGER_TOKENS='(vec {
    record { "ckBTC"; principal "'$CANISTER_ID_CKBTC_LEDGER'" };
    record { "ckETH"; principal "'$CANISTER_ID_CKETH_LEDGER'" };
})'

# Call the initialize_reserve_list function on the backend canister
echo "Calling initialize_reserve_list on $BACKEND_CANISTER_ID..."
dfx canister call $BACKEND_CANISTER_ID initialize_reserve_list "$LEDGER_TOKENS"

echo "Initialization of reserve list completed."

