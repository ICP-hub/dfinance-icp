#!/bin/bash

# Set the deployer identity
echo "Switching to 'default' identity..."
dfx identity use default

# Call the empty function
echo "Calling 'initialize_canister' on 'dfinance_backend' canister..."
dfx canister call dfinance_backend initialize_canister 
dfx canister call dfinance_backend initialize_reserve 
# Check for errors
if [ $? -eq 0 ]; then
    echo "Function called successfully!"
else
    echo "Failed to call the function. Please check for errors."
fi
