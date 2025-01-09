#!/bin/bash

# Canister ID and function details
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"
register_method="register_user"
faucet_method="faucet"
supply_method="execute_supply"
borrow_method="execute_borrow"

# Number of users to register
NUM_USERS=200

# Loop to register users
for ((i=1; i<=NUM_USERS; i++))
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

    if [ $? -eq 0 ]; then
      echo "Faucet successful!"

      # Call the execute_supply function
      supply_result=$(dfx canister call $backend_canister $supply_method "(record { asset = \"ICP\"; amount = 1000000000; is_collateral = true; })")
      echo "Supply result: $supply_result"

      if [ $? -eq 0 ]; then
        echo "Supply successful!"

        # Call the execute_borrow function
        borrow_result=$(dfx canister call $backend_canister $borrow_method "(record { asset = \"ICP\"; amount = 700000000; })")
        echo "Borrow result: $borrow_result"

        if [ $? -eq 0 ]; then
          echo "Borrow successful!"
        else
          echo "Failed to borrow the user. Please check for errors."
        fi
      else
        echo "Failed to supply the user. Please check for errors."
      fi
    else
      echo "Failed to faucet the user. Please check for errors."
    fi
  else
    echo "Failed to register the user. Please check for errors."
  fi
done

# Switch back to the default identity
dfx identity use default

echo "All users registered!"
