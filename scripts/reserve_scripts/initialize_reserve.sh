backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

initialize_reserve_method="initialize_reserve"

# Initialize reserve in the backend canister
echo "Initializing reserve for ckbtc in backend canister..."
dfx canister call $backend_canister $initialize_reserve_method