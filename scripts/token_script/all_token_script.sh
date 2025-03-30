#!/bin/bash

# Call each script sequentially
dfx ledger fabricate-cycles --canister dfinance_backend
dfx ledger fabricate-cycles --canister dfinance_backend

./ckbtc_token.sh
if [ $? -ne 0 ]; then
  echo "ckbtc_token.sh failed. Exiting."
  exit 1
fi

./cketh_token.sh
if [ $? -ne 0 ]; then
  echo "cketh_token.sh failed. Exiting."
  exit 1
fi

./ckusdc_token.sh
if [ $? -ne 0 ]; then
  echo "ckusdc_token.sh failed. Exiting."
  exit 1
fi

./icp_token.sh
if [ $? -ne 0 ]; then
  echo "icp_token.sh failed. Exiting."
  exit 1
fi

./ckusdt_token.sh
if [ $? -ne 0 ]; then
  echo "ckusdt_token.sh failed. Exiting."
  exit 1
fi

BUY_BURN_CANISTER_ID=$(dfx canister id buy_burn)
echo "Buy Burn canister ID: $BUY_BURN_CANISTER_ID"

dfx canister call dfinance_backend set_canister_id "(\"buy_burn\", principal \"$BUY_BURN_CANISTER_ID\")"

LP_POOL_CANISTER_ID=$(dfx canister id lp_pool)
echo "Lp pool canister ID: $LP_POOL_CANISTER_ID"

dfx canister call dfinance_backend set_canister_id "(\"buy_burn\", principal \"$BUY_BURN_CANISTER_ID\")"
dfx canister call dfinance_backend set_canister_id "(\"lp_pool\", principal \"$LP_POOL_CANISTER_ID\")"


dfx canister call dfinance_backend update_reserves_price