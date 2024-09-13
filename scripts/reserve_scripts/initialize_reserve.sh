backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"


BACKEND_CANISTER_ID="dfinance_backend"

# List of ledger tokens to initialize in the reserve list
LEDGER_TOKENS='(vec {
    record { "ckBTC"; principal "bkyz2-fmaaa-aaaaa-qaaaq-cai" };
    record { "ckETH"; principal "br5f7-7uaaa-aaaaa-qaaca-cai" };
})'

# Call the initialize_reserve_list function on the backend canister
echo "Calling initialize_reserve_list on $BACKEND_CANISTER_ID..."
dfx canister call $BACKEND_CANISTER_ID initialize_reserve_list "$LEDGER_TOKENS"

echo "Initialization of reserve list completed."

