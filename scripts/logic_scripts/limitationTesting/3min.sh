#!/bin/bash

set -e  # Exit script on error

# Load environment variables from .env
source ../../../.env 

# Set variables  
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai"
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
approve_method="icrc2_approve"

# Get the principal for the user1 identity (spender)
dfx identity use default
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Spender): $user1_principal"

# Get the principal for the backend_canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

echo "--------------------------------------"

# Approve the transfer
approve_amount=100000
echo "Approving transfer of $approve_amount from user1 to backend_canister..."
dfx canister call $ckbtc_canister $approve_method "(record {
    from_subaccount=null;
    spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
    amount=$approve_amount:nat;
    expected_allowance=null;
    expires_at=null;
    fee=null;
    memo=null;
    created_at_time=null
})"
echo "Allowance Set"

echo "--------------------------------------"

# Run the supply function in batches
dfx identity use default

deposit_amount=100
currency="ckBTC"  
is_collateral=true
num_attempts=3  # Number of batches (change to 4 if needed)
num_supply_calls=7  # Number of times execute_supply runs per batch

for ((batch=1; batch<=num_attempts; batch++))
do
    echo "Starting Batch $batch..."
    
    for ((supply=1; supply<=num_supply_calls; supply++))
    do
        echo "Executing Supply $supply in Batch $batch..."
        result=$(dfx canister call $backend_canister execute_supply "(record { asset=\"$currency\"; amount=$deposit_amount:nat; is_collateral=$is_collateral })")
        echo "Supply Execution Result (Batch $batch, Attempt $supply): $result"
        sleep 2  # Small delay between calls to avoid flooding
    done

    echo "--------------------------------------"

    if [ $batch -lt $num_attempts ]; then
        echo "Waiting for exactly 3 minutes before the next batch..."
        sleep 180  # Exact 3-minute delay
        echo "Continuing to the next batch..."
    fi
done

echo "--------------------------------------"
echo "Test Case Passed: Supply function executed $num_supply_calls times in $num_attempts batches!"
echo "--------------------------------------"
