
# Canister and function details
backend_canister="dfinance_backend"
faucet_method="faucet"
supply_method="execute_supply"

# Ledger and approval details (ensure these variables are exported/set before running)
TOKEN_LEDGER_ID="x4hhs-wh777-77774-qaaka-cai"  # Replace with actual value
BACKEND_CANISTER_ID="vpyes-67777-77774-qaaeq-cai"   # Replace with actual value

# Number of users to process
NUM_USERS=1

# Loop to create users and call faucet + supply
for ((i=1; i<=NUM_USERS; i++)); do
  IDENTITY="user$i"

  # Create a new identity without encryption if it doesn't exist
  if ! dfx identity list | grep -q "$IDENTITY"; then
    dfx identity new "$IDENTITY" --disable-encryption
  fi

  # Use the identity
  dfx identity use "$IDENTITY"

  # Get the current principal
  PRINCIPAL=$(dfx identity get-principal)
  echo "User #$i - Principal: $PRINCIPAL"

  # Call the faucet function
  faucet_result=$(dfx canister call "$backend_canister" "$faucet_method" '("ICP", 110059085)')
  echo "Faucet result: $faucet_result"

  # Approve the backend canister to spend tokens
  approve_result=$(dfx canister call "$TOKEN_LEDGER_ID" icrc2_approve "(
    record {
      amount = 100059085 : nat;
      spender = record {
        owner = principal \"$BACKEND_CANISTER_ID\";
      };
    }
  )")
  echo "Approve result: $approve_result"

  # Call the execute_supply function
  supply_result=$(dfx canister call "$backend_canister" "$supply_method" '(
    record {
      asset = "ICP";
      amount = 100059085 : nat;
      can_be_collateral = true;
    }
  )')
  echo "Supply result: $supply_result"

done

# Switch back to the default identity
dfx identity use default

echo "All users processed!"