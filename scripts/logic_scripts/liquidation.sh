#!/bin/bash

set -e

# Set variables
ckbtc_canister="c2lt4-zmaaa-aaaaa-qaaiq-cai"
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"
approve_method="icrc2_approve"
deposit_method="supply"

reserve_data_method="get_reserve_data"
# initialize_reserve_method="initialize_reserve"

# Get the principal for the user1 identity (spender)
dfx identity use default
user_principal=$(dfx identity get-principal)
echo "User1 Principal (Debt User): $user_principal"
# dfx identity new liquidator
dfx identity use liquidator
liquidator_principal=$(dfx identity get-principal)
echo "Liquidator Principal (Liquidator): $liquidator_principal"

dfx identity use default

# Get the principal for the backend_canister (receiver)
backend_canister_principal=$(dfx canister id $backend_canister)
echo "Backend Canister Principal (Receiver): $backend_canister_principal"

# Check balances before operations
echo "Checking balances before operations..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
liquidator_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User Balance: $user_balance"
echo "Liquidator Balance: $liquidator_balance"
echo "Backend Canister Balance: $backend_balance"
echo "--------------------------------------"

# Initialize reserve in the backend canister
# echo "Initializing reserve for ckbtc in backend canister..."
# dfx canister call $backend_canister $initialize_reserve_method

# Echo the reserve data
echo "Fetching reserve data..."
asset="ckbtc"
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"



# Call the deposit function on the backend canister
dfx identity use default




# Get the principal of the default identity
ON_BEHALF_OF=$(dfx identity get-principal)


dfx identity use liquidator
# Approve the transfer
# approve_amount=10000000 # Set the amount you want to approve
# echo "Approving transfer of $approve_amount from liquidator to backend_canister..."
# allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
#     from_subaccount=null;
#     spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
#     amount=$approve_amount:nat;
#     expected_allowance=null;
#     expires_at=null;
#     fee=null;
#     memo=null;
#     created_at_time=null
# })")
# echo "Allowance Set: $allow"
# echo "--------------------------------------"
amount=1000
# call the repay function
repay=$(dfx canister call dfinance_backend repay "(\"ckbtc\", $amount:nat, \"${ON_BEHALF_OF}\")")

echo "Repay Execution Result: $repay"

# Check balances after repay
echo "Checking balances after repay..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
liquidator_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
echo "User Balance after repay: $user_balance"
echo "Liquidator Balance after repay: $liquidator_balance"
echo "Backend Canister Balance after repay: $backend_balance"
echo "--------------------------------------"

echo "Fetching reserve data after repay..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

# call the withdraw function
collateral=true
withdraw=$(dfx canister call dfinance_backend withdraw "(\"ckbtc\", $amount:nat, \"${ON_BEHALF_OF}\", $collateral:bool)")
echo "Withdraw Execution Result: $withdraw"
dtoken_canister="c5kvi-uuaaa-aaaaa-qaaia-cai"
# Check balances after withdraw
echo "Checking balances after getting reward..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
liquidator_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User Balance after withdraw: $user_balance"
echo "User Dtoken Balance after withdraw: $user_dtoken_balance"
echo "Liquidator Balance after withdraw: $liquidator_balance"
echo "Backend Canister Balance after withdraw: $backend_balance"
echo "--------------------------------------"

# Fetching reserve data
echo "Fetching reserve data after withdraw..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"
