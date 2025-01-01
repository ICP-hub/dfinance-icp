#!/bin/bash

# Prompt the user to enter the asset name
read -p "Enter the asset name: " ASSET_NAME

# Validate the asset name
if [ -z "$ASSET_NAME" ]; then
    echo "Error: Asset name is required."
    exit 1
fi

# Prompt the user to enter the variable name
read -p "Enter the variable name: " VARIABLE_NAME

# Validate the variable name
if [ -z "$VARIABLE_NAME" ]; then
    echo "Error: Variable name is required."
    exit 1
fi

# Prompt the user to enter the reset value
read -p "Enter the reset value: " RESET_VALUE

# Validate the reset value
if [ -z "$RESET_VALUE" ]; then
    echo "Error: Reset value is required."
    exit 1
fi

# Set the canister name
CANISTER_NAME="dfinance_backend"

# Escape the input values for JSON serialization
ESCAPED_ASSET_NAME=$(printf '%s' "$ASSET_NAME" | jq -sR .)
ESCAPED_VARIABLE_NAME=$(printf '%s' "$VARIABLE_NAME" | jq -sR .)
ESCAPED_RESET_VALUE=$(printf '%s' "$RESET_VALUE" | jq -sR .)

# Call the reset_reserve_value function on the canister with the provided parameters
dfx canister call $CANISTER_NAME reset_reserve_value "($ESCAPED_ASSET_NAME, $ESCAPED_VARIABLE_NAME, $RESET_VALUE)"

# Check if the call was successful
if [ $? -eq 0 ]; then
    echo "Successfully called reset_reserve_value on canister $CANISTER_NAME."
else
    echo "Error: Failed to call reset_reserve_value on canister $CANISTER_NAME."
    exit 1
fi
