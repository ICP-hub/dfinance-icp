#!/bin/bash
set -e
set -x
# Configuration variables
backend_canister="dfinance_backend"
faucet_method="faucet"
supply_method="execute_supply"
borrow_method="execute_borrow"
TOKEN_LEDGER_IDS=("cgpjn-omaaa-aaaaa-qaakq-cai" "mxzaz-hqaaa-aaaaa-qaaoa-cai" "3e3x4-paaaa-aaaaa-qaaba-cai")  # ICP, ckBTC, CHAT ledgers
BACKEND_CANISTER_ID="a3shf-5eaaa-aaaaa-qaafa-cai"
USER_ID=3
ITERATIONS=50
AMOUNT=100000000
ASSETS=("ICP" "ckBTC" )

# Create logs directory
mkdir -p logs/stress_test

# Use single identity for stress testing
dfx identity use "user$USER_ID"
PRINCIPAL=$(dfx identity get-principal)
echo "Using identity: user$USER_ID - Principal: $PRINCIPAL"
echo "Starting stress test at $(date)" > logs/stress_test/operations.log
START_TIME=$(date +%s)

# Function to call faucet for an asset
call_faucet() {
  local asset=$1
  local amount=$2
  local timestamp=$(date +%s)
  
  echo "[$timestamp] Calling faucet for $asset (amount: $amount)" >> logs/stress_test/operations.log
  
  dfx canister call "$backend_canister" "$faucet_method" "(\"$asset\", $amount)" > logs/stress_test/faucet_${asset}_${timestamp}.log 2>&1
  
  sleep 1
}

# Function to approve the backend canister
approve_backend() {
  local asset=$1
  local ledger_id=$2
  local amount=$3
  local timestamp=$(date +%s)
  
  echo "[$timestamp] Approving backend for $asset (amount: $amount)" >> logs/stress_test/operations.log
  
  dfx canister call "$ledger_id" icrc2_approve "(
    record {
      amount = $amount : nat;
      spender = record {
        owner = principal \"$BACKEND_CANISTER_ID\";
      };
    }
  )" > logs/stress_test/approve_${asset}_${timestamp}.log 2>&1
  
  sleep 1
}

# Function to execute supply operation
execute_supply() {
  local asset=$1
  local amount=$2
  local timestamp=$(date +%s)
  
  echo "[$timestamp] Executing supply for $asset (amount: $amount)" >> logs/stress_test/operations.log
  
  dfx canister call "$backend_canister" "$supply_method" "(
    record {
      asset = \"$asset\";
      amount = $amount : nat;
      is_collateral = true;
    }
  )" > logs/stress_test/supply_${asset}_${timestamp}.log 2>&1
  
  sleep 1
}

# Function to execute borrow operation
execute_borrow() {
  local asset=$1
  local amount=$2
  local timestamp=$(date +%s)
  
  echo "[$timestamp] Executing borrow for $asset (amount: $amount)" >> logs/stress_test/operations.log
  
  dfx canister call "$backend_canister" "$borrow_method" "(
    record {
      asset = \"$asset\";
      amount = $amount : nat;
      is_collateral = true;
    }
  )" > logs/stress_test/borrow_${asset}_${timestamp}.log 2>&1
  
  sleep 1
}

echo "🔹 Starting stress test with user$USER_ID for $ITERATIONS iterations"

# Main stress test loop
for ((i=1; i<=ITERATIONS; i++)); do
  echo "Iteration $i of $ITERATIONS"
  
  # Process each asset
  for index in "${!ASSETS[@]}"; do
    asset="${ASSETS[$index]}"
    ledger_id="${TOKEN_LEDGER_IDS[$index]}"
    
    # Calculate amount with some variation
    actual_amount=$((AMOUNT + (i % 10) * 1000000))
    borrow_amount=$((actual_amount / 2))  # Borrow half of the supplied amount
    
    echo "Processing $asset (supply: $actual_amount, borrow: $borrow_amount)"
    
    # Step 1: Get tokens from faucet
    call_faucet "$asset" $actual_amount
    
    # Step 2: Approve backend to spend tokens
    approve_backend "$asset" "$ledger_id" $actual_amount
    
    # Step 3: Supply tokens
    execute_supply "$asset" $actual_amount
    
    # Check for errors in supply
    if grep -q "Error\|rejected\|failed" logs/stress_test/supply_${asset}_*.log 2>/dev/null; then
      echo "⚠️ Error detected in supply operation for $asset on iteration $i" | tee -a logs/stress_test/errors.log
    fi
    
    # Small delay between supply and borrow
    sleep 2
    
    # Step 4: Borrow tokens (after supply)
    execute_borrow "$asset" $borrow_amount
    
    # Check for errors in borrow
    if grep -q "Error\|rejected\|failed" logs/stress_test/borrow_${asset}_*.log 2>/dev/null; then
      echo "⚠️ Error detected in borrow operation for $asset on iteration $i" | tee -a logs/stress_test/errors.log
    fi
    
    # Delay between assets
    sleep 3
  done
  
  # Progress update
  echo "Completed iteration $i ($(( i * 100 / ITERATIONS ))%)"
  
  # Longer delay between iterations
  sleep 5
done

# Calculate total duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "✅ Stress test completed in $DURATION seconds" | tee -a logs/stress_test/operations.log
echo "Total operations performed: $((ITERATIONS * ${#ASSETS[@]} * 4))" | tee -a logs/stress_test/operations.log

# Switch back to default identity
dfx identity use default