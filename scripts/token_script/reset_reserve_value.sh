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
SCALING_FACTOR=100000000

# Escape the input values for JSON serialization
ESCAPED_ASSET_NAME=$(printf '%s' "$ASSET_NAME" | jq -sR .)
ESCAPED_VARIABLE_NAME=$(printf '%s' "$VARIABLE_NAME" | jq -sR .)

# Calculate the reset value using awk and multiply by scaling factor
ESCAPED_RESET_VALUE=$(awk -v bonus=$RESET_VALUE -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')

# Call the reset_reserve_value function on the canister with the provided parameters
dfx canister call $CANISTER_NAME reset_reserve_value "($ESCAPED_ASSET_NAME, $ESCAPED_VARIABLE_NAME, $ESCAPED_RESET_VALUE)"
