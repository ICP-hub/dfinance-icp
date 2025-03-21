#!/bin/bash

# Set the canister name
CANISTER_NAME="dfinance_backend"
USER_PRINCIPAL=$(dfx identity get-principal)

# Fetch all asset names
echo "Fetching assets from $CANISTER_NAME..."
RAW_OUTPUT=$(dfx canister call $CANISTER_NAME get_all_assets --output json)

echo "Raw Output:"
echo "$RAW_OUTPUT"

# Convert JSON array to Bash array
ASSET_NAMES=($(echo "$RAW_OUTPUT" | tr -d '[]" ' | tr ',' '\n'))

# Check if assets exist
if [ ${#ASSET_NAMES[@]} -eq 0 ]; then
    echo "No assets found."
    exit 1
fi

# Vectors to store different principals
declare -a PRINCIPALS
declare -a D_TOKEN_PRINCIPALS
declare -a DEBT_TOKEN_PRINCIPALS

# Iterate over each asset name
for asset in "${ASSET_NAMES[@]}"; do
    echo "Fetching principal for asset: $asset"
    
    # Fetch Asset Principal
    PRINCIPAL_OUTPUT=$(dfx canister call $CANISTER_NAME get_asset_principal "(\"$asset\")" --output json)
    PRINCIPAL=$(echo "$PRINCIPAL_OUTPUT" | grep -oP '(?<="Ok": ")[^"]+')

    # Fetch Reserve Data
    RESERVE_OUTPUT=$(dfx canister call $CANISTER_NAME get_reserve_data "(\"$asset\")" --output json)

    echo "Raw Reserve Data Output for $asset:"
    echo "$RESERVE_OUTPUT"

    # Extract d_token_canister and debt_token_canister
    D_TOKEN=$(echo "$RESERVE_OUTPUT" | jq -r '.Ok.d_token_canister[0]')
    DEBT_TOKEN=$(echo "$RESERVE_OUTPUT" | jq -r '.Ok.debt_token_canister[0]')

    # Debugging statements
    echo "Extracted D-Token Principal for $asset: $D_TOKEN"
    echo "Extracted Debt-Token Principal for $asset: $DEBT_TOKEN"

    # Store values in respective arrays
    if [ -n "$PRINCIPAL" ]; then
        PRINCIPALS+=("$PRINCIPAL")
    else
        echo "Error fetching principal for asset: $asset"
    fi

    if [ -n "$D_TOKEN" ]; then
        D_TOKEN_PRINCIPALS+=("$D_TOKEN")
    else
        echo "No d_token_canister found for asset: $asset"
    fi

    if [ -n "$DEBT_TOKEN" ]; then
        DEBT_TOKEN_PRINCIPALS+=("$DEBT_TOKEN")
    else
        echo "No debt_token_canister found for asset: $asset"
    fi
done

# Function to add controllers to each canister
add_controller() {
    local CANISTER_ID=$1
    echo "Adding user $USER_PRINCIPAL as a controller to canister $CANISTER_ID..."
    
    dfx canister call $CANISTER_NAME add_controllers "(principal \"$CANISTER_ID\", principal \"$USER_PRINCIPAL\")"
}

# Add controllers for all collected principals
echo "Updating controllers for all assets, D-Tokens, and Debt Tokens..."

for principal in "${PRINCIPALS[@]}"; do
    add_controller "$principal"
    dfx canister install --wasm "/home/jyotirmay1789/dfinance-icp/target/wasm32-unknown-unknown/release/token_ledger.wasm" $principal --mode upgrade
done

for dtoken in "${D_TOKEN_PRINCIPALS[@]}"; do
    add_controller "$dtoken"
    dfx canister install --wasm "/home/jyotirmay1789/dfinance-icp/target/wasm32-unknown-unknown/release/dtoken.wasm" $dtoken --mode upgrade
done

for debt_token in "${DEBT_TOKEN_PRINCIPALS[@]}"; do
    add_controller "$debt_token"
    dfx canister install --wasm "/home/jyotirmay1789/dfinance-icp/target/wasm32-unknown-unknown/release/debttoken.wasm" $debt_token --mode upgrade
done

echo "All controllers updated successfully."
