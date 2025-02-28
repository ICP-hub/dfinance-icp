#!/bin/bash

# transfer to user#
set -e

source ../../../../.env

CANISTER_ID=$CANISTER_ID_DFINANCE_BACKEND
ASSET="ICP"                         
AMOUNT=10000                       

# Validate the input parameters
if [ -z "$ASSET" ] || [ -z "$AMOUNT" ]; then
  echo "Usage: ./faucet.sh <asset> <amount>"
  exit 1
fi

dfx identity get-principal
# dfx identity use liquidator
dfx canister call "$CANISTER_ID" faucet "(\"$ASSET\", $AMOUNT)"