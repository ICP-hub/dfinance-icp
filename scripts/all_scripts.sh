#!/bin/bash

set -e
# BACKEND_CANISTER_ID="avqkn-guaaa-aaaaa-qaaea-cai" 

output1=$(./deploy_ckbtc.sh)
echo "ckbtc ledger: $output"

# export CKBTC_CANISTER_ID=$(dfx canister id ckbtc_ledger)
# echo "ckBTC Canister Principal: $CKBTC_CANISTER_ID"
# dfx canister call $BACKEND_CANISTER_ID update_reserve_list "(\"ckbtc\", principal \"$CKBTC_CANISTER_ID\")"

output2=$(./deploy_debttoken.sh)
echo "debttoken ledger: $output"

output3=$(./deploy_dtoken.sh)
echo "dtoken ledger: $output"

output4=$(./deploy_cketh.sh)
echo "cketh ledger: $output"

# export CKETH_CANISTER_ID=$(dfx canister id cketh_ledger)
# echo "ckETH Canister Principal: $CKETH_CANISTER_ID"

# dfx canister call $BACKEND_CANISTER_ID update_reserve_list "(\"ckETH\", principal \"$CKETH_CANISTER_ID\")"

echo "all scripts deployed successfully: $output1 , $output2 , $output3, $output4"
