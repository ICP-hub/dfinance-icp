#!/bin/bash

set -e

source ../../.env

# Set variables
ckbtc_canister="aovwi-4maaa-aaaaa-qaagq-cai" 
backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
debt_canister="aax3a-h4aaa-aaaaa-qaahq-cai"
dtoken_canister="ahw5u-keaaa-aaaaa-qaaha-cai"
approve_method="icrc2_approve"
deposit_method="supply"
reserve_data_method="get_reserve_data"

# Get the principal for the user1 identity (spender)
dfx identity use default
user_principal=$(dfx identity get-principal)
echo "User1 Principal (Debt User): $user_principal"
dfx identity new liquidator --disable-encryption || true
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
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User1 Debt Token Balance: $user1_debt_token_balance"
user1_d_token_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User1 D Token Balance: $user1_d_token_balance"
liquidator_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
echo "Liquidator Debt Token Balance: $liquidator_debt_token_balance"
liquidator_d_token_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
echo "Liquidator D Token Balance: $liquidator_d_token_balance"
echo "--------------------------------------"

# Echo the reserve data
echo "Fetching reserve data..."
asset="ckETH"
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
approve_amount=100000000 # Set the amount you want to approve
echo "Approving transfer of $approve_amount from liquidator to backend_canister..."
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


# Calling liquidation function
amount=100000000
liquiation=$(dfx canister call dfinance_backend liquidation_call "(\"ckETH\", \"ckETH\", $amount:nat64, \"${ON_BEHALF_OF}\")")

echo "Liquidation Execution Result: $liquidation"

# Check balances after withdraw
echo "Checking balances after getting reward..."
user_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
liquidator_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
backend_balance=$(dfx canister call $ckbtc_canister icrc1_balance_of "(record {owner=principal\"${backend_canister_principal}\"; subaccount=null})")
user1_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User1 Debt Token Balance: $user1_debt_token_balance"
user1_d_token_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${user_principal}\"; subaccount=null})")
echo "User1 D Token Balance: $user1_d_token_balance"
echo "User Balance after withdraw: $user_balance"
echo "Liquidator Balance after withdraw: $liquidator_balance"
echo "Backend Canister Balance after withdraw: $backend_balance"
liquidator_debt_token_balance=$(dfx canister call $debt_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
echo "Liquidator Debt Token Balance: $liquidator_debt_token_balance"
liquidator_d_token_balance=$(dfx canister call $dtoken_canister icrc1_balance_of "(record {owner=principal\"${liquidator_principal}\"; subaccount=null})")
echo "Liquidator D Token Balance: $liquidator_d_token_balance"
echo "--------------------------------------"

# Fetching reserve data
echo "Fetching reserve data after withdraw..."
reserve_data=$(dfx canister call $backend_canister $reserve_data_method "(\"$asset\")")
echo "Reserve Data: $reserve_data"
echo "--------------------------------------"

echo "Fetching user data..."
user_data=$(../integration_scripts/user_data.sh)
echo "user data: $user_data"
