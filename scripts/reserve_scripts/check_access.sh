#!/bin/bash

# Define the backend canister ID
BACKEND_CANISTER_ID="dfinance_backend"

# Simulate a non-controller principal 
dfx identity use user1


echo "Attempting to call initialize_reserve on $BACKEND_CANISTER_ID with a non-controller principal..."


dfx canister call $BACKEND_CANISTER_ID initialize_reserve

# Capture the output and error
if [ $? -ne 0 ]; then
    echo "Failed to call initialize_reserve. The caller might not be a controller."
else
    echo "initialize_reserve was called successfully."
fi

echo "Test completed."
