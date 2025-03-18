#!/bin/bash

# Call each script sequentially
# dfx ledger fabricate-cycles --canister dfinance_backend
# dfx ledger fabricate-cycles --canister dfinance_backend
dfx ledger fabricate-cycles --canister dfinance_backend --cycles 11000000000000
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
