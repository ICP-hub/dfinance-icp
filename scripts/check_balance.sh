# #!/bin/bash

# set -e

# # Function to check the balance for a specific identity
# check_balance() {
#     local identity=$1
#     local canister_id="ckbtc_ledger"  # Replace with your actual canister ID if different
#     local balance_method="icrc1_balance_of"

#     # Switch to the identity
#     if [ "$identity" == "anonymous" ]; then
#         dfx identity use anonymous
#     else
#         dfx identity use $identity
#     fi

#     # Get the principal for the identity
#     principal=$(dfx identity get-principal)
#     echo "$identity Principal: $principal"

#     # Check the balance
#     balance=$(dfx canister call $canister_id $balance_method "(record {owner=principal\"${principal}\"; subaccount=null})")
#     echo "$identity Balance: $balance"
#     echo "--------------------------------------"
# }

# backend_canister_principal=$(dfx canister id dfinance_backend)
# # Check balance and principal for each identity
# echo "Checking balance and principal for identities..."

# check_balance anonymous
# check_balance default
# check_balance minter
# check_balance user1
# check_balance $backend_canister_principal "Backend Canister"

# # Switch back to the default identity at the end
# dfx identity use default
# echo "Switched back to default identity."



#!/bin/bash

set -e

# Function to check the balance for a specific principal
check_balance() {
    local principal=$1
    local label=$2
    local canister_id="ckbtc_ledger"  # Replace with your actual canister ID if different
    local balance_method="icrc1_balance_of"

    # Check the balance
    balance=$(dfx canister call $canister_id $balance_method "(record {owner=principal\"${principal}\"; subaccount=null})")
    echo "$label Principal: $principal"
    echo "$label Balance: $balance"
    echo "--------------------------------------"
}

# Get the principal for backend_canister
backend_canister_principal=$(dfx canister id dfinance_backend)
dtoken_canister=$(dfx canister id dtoken)
# Check balance and principal for each identity
echo "Checking balance and principal for identities and backend canister..."

check_balance $(dfx identity get-principal --identity anonymous) "Anonymous"
check_balance $(dfx identity get-principal --identity default) "Default"
check_balance $(dfx identity get-principal --identity minter) "Minter"
check_balance $(dfx identity get-principal --identity user1) "User1"
check_balance $backend_canister_principal "Backend Canister"
check_balance $dtoken_canister "DToken Canister"
# Switch back to the default identity at the end
dfx identity use default
echo "Switched back to default identity."
