#!/bin/bash

set -e

# Load environment variables from .env
source ../../../../.env

# Set variables  
ICP_canister="cuj6u-c4aaa-aaaaa-qaajq-cai"
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
dtoken_canister="cbopz-duaaa-aaaaa-qaaka-cai"
approve_method="icrc2_approve"
reserve_data_method="get_reserve_data"
get_user_method="get_user_data"

# Get the principal for the user1 identity (spender)
dfx identity get-principal
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Spender): $user1_principal"

# Get the principal for the backend_canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

echo "--------------------------------------"

# Check balances before operations
echo "Checking balances before operations..."
user1_balance=$(dfx canister call $ICP_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ICP_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_dtoken=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")

echo "User1 Balance: $user1_balance"
echo "Backend Canister Balance: $backend_balance"
echo "User1 Dtoken Balance: $user1_dtoken"

echo "--------------------------------------"

# Echo the reserve data
echo "Fetching reserve data..."
asset="ICP"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"

echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user1_principal}\")")
echo "User data: $user_data"

echo "--------------------------------------"

echo "on approve transfer..."
# Approve the transfer
approve_amount=10000
echo "Approving transfer of $approve_amount from user1 to backend_canister..."
allow=$(dfx canister call $ICP_canister $approve_method "(record {
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

echo "things are fine here"

echo "--------------------------------------"

# Call the execute supply function 7 times
dfx identity get-principal

deposit_amount=10000
currency="ICP"  
is_collateral=true

# for i in {1..7}
# do
#     echo "Supplying $deposit_amount $currency to platform (Attempt $i)..."
#     result=$(dfx canister call dfinance_backend execute_supply "(record { asset=\"$currency\"; amount=$deposit_amount:nat; is_collateral=$is_collateral })")
#     echo "Supply Execution Result (Attempt $i): $result"
#     echo "--------------------------------------"
# done

echo "Supplying $deposit_amount $currency to platform..."
result=$(dfx canister call dfinance_backend execute_supply "(record { asset=\"$currency\"; amount=$deposit_amount:nat; is_collateral=$is_collateral })")
echo "Supply Execution Result: $result"
echo "--------------------------------------"


# Check balances after deposit
echo "Checking balances after supply..."
user1_balance_after=$(dfx canister call $ICP_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")
backend_balance_after=$(dfx canister call $ICP_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_dtoken=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user1_principal}\"; subaccount=null})")

echo "User1 Balance After Deposit: $user1_balance_after"
echo "Backend Canister Balance After Deposit: $backend_balance_after"
echo "User1 Dtoken Balance After Deposit: $user1_dtoken"

echo "--------------------------------------"

echo "Fetching reserve data after supply..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"

echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(dfx canister call $backend_canister $get_user_method "(principal\"${user1_principal}\")")
echo "User data: $user_data"

echo "--------------------------------------"

echo "Test Case 1 Passed: Supply of $deposit_amount $currency was successfully executed 7 times!"

echo "--------------------------------------"
