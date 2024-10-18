#!/bin/bash

# transfer to default user#
set -e

# Load environment variables from .env
source ../../.env

CANISTER_ID=$CANISTER_ID_DFINANCE_BACKEND
ASSET="ckETH"                         
AMOUNT=300000000                       

# Validate the input parameters
if [ -z "$ASSET" ] || [ -z "$AMOUNT" ]; then
  echo "Usage: ./faucet.sh <asset> <amount>"
  exit 1
fi

dfx identity use liquidator
dfx canister call "$CANISTER_ID" faucet "(\"$ASSET\", $AMOUNT)"