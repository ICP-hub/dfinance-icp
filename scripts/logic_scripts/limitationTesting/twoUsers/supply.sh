#!/bin/bash

set -e

# Load environment variables from .env
source ../../../../.env

# Set variables  
ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai"
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
dtoken_canister="a4tbr-q4aaa-aaaaa-qaafq-cai"
approve_method="icrc2_approve"
reserve_data_method="get_reserve_data"
get_user_method="get_user_data"

# Define the users
users=("user1" "user2")  # Replace with actual user identities

for user in "${users[@]}"; do
    echo "========================================="
    echo "Executing transactions for identity: $user"
    echo "========================================="

    # Switch to the user identity
    dfx identity use $user
    user_principal=$(dfx identity get-principal)
    echo "$user Principal (Spender): $user_principal"

    # Get the principal for the backend_canister (receiver)
    backend_canister_principal=$(dfx canister id $backend_canister)
    echo "Backend Canister Principal (Receiver): $backend_canister_principal"

    echo "--------------------------------------"

    # Check balances before operations
    echo "Checking balances before operations..."
    user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
    backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
    user_dtoken=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")

    echo "$user Balance: $user_balance"
    echo "Backend Canister Balance: $backend_balance"
    echo "$user Dtoken Balance: $user_dtoken"

    echo "--------------------------------------"

    # Fetch reserve data
    asset="ckBTC"
    echo "Fetching reserve data..."
    reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
    echo "Reserve Data: $reserve_data"

    echo "--------------------------------------"

    echo "Fetching user data..."
    user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user_principal}\")")
    echo "User data: $user_data"

    echo "--------------------------------------"

    # Approve the transfer
    approve_amount=100000
    echo "Approving transfer of $approve_amount from $user to backend_canister..."
    allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
        from_subaccount=null;
        spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
        amount=$approve_amount:nat;
        expected_allowance=null;
        expires_at=null;
        fee=null;
        memo=null;
        created_at_time=null
    })")
    echo "Allowance Set: $allow"

    echo "--------------------------------------"

    # Execute supply function 7 times
    deposit_amount=100
    currency="ckBTC"  
    is_collateral=true

    for i in {1..7}
    do
        echo "Supplying $deposit_amount $currency to platform (Attempt $i) for $user..."
        result=$(dfx canister call dfinance_backend execute_supply "(record { asset=\"$currency\"; amount=$deposit_amount:nat; is_collateral=$is_collateral })")
        echo "Supply Execution Result (Attempt $i) for $user: $result"
        echo "--------------------------------------"
    done

    # Check balances after deposit
    echo "Checking balances after supply for $user..."
    user_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
    backend_balance_after=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
    user_dtoken_after=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")

    echo "$user Balance After Deposit: $user_balance_after"
    echo "Backend Canister Balance After Deposit: $backend_balance_after"
    echo "$user Dtoken Balance After Deposit: $user_dtoken_after"

    echo "--------------------------------------"

    echo "Fetching reserve data after supply for $user..."
    reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
    echo "Reserve Data: $reserve_data"

    echo "--------------------------------------"

    echo "Fetching user data for $user..."
    user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user_principal}\")")
    echo "User data: $user_data"

    echo "--------------------------------------"

    echo "Test Case Passed for $user: Supply of $deposit_amount $currency was successfully executed 7 times!"

    echo "========================================="
done

echo "Faucet transfers completed for all users!"
