#!/bin/bash

# Canister ID and function details
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"
register_method="register_user"
faucet_method="faucet"
supply_method="execute_supply"
borrow_method="execute_borrow"

# Number of users to register
NUM_USERS=600

# Loop to register users
for ((i=324; i<=NUM_USERS; i++))
do
  IDENTITY="user$i"

  # Create a new identity without encryption if it doesn't exist
  if ! dfx identity list | grep -q "$IDENTITY"; then
    dfx identity new "$IDENTITY" --disable-encryption
  fi

  # Use the identity
  dfx identity use "$IDENTITY"

  # Get the current principal
  PRINCIPAL=$(dfx identity get-principal)
  echo "Registering user #$i with Principal: $PRINCIPAL"

  # Call the register_user function
  register_result=$(dfx canister call $backend_canister $register_method)
  echo "User register result: $register_result"

  if [ $? -eq 0 ]; then
    echo "User registered successfully!"

    # Call the faucet function
    faucet_result=$(dfx canister call $backend_canister $faucet_method "(\"ICP\", 1000000000)")
    echo "Faucet result: $faucet_result"

   
  fi
done

# Switch back to the default identity
dfx identity use default

echo "All users registered!"