#!/bin/bash
set -e


TOKEN_NAME="ckBTC"

# Set the canister name
CANISTER_NAME="dfinance_backend"
SCALING_FACTOR=100_000_000   #100 million

# Escape the TOKEN_NAME for use in the ReserveData
ESCAPED_TOKEN_NAME=$(printf '%s' "$TOKEN_NAME" | jq -sR .)

# Set the ReserveData values
liquidity_index=1
ltv=73
liquidation_threshold=78
liquidation_bonus=5
#10 Billion for borrow_cap and supply_cap
# The values will multiplied by SCALING_FACTOR to avoid floating point issues
borrow_cap=10_000_000_000     
supply_cap=10_000_000_000     

reserve_factor=15

# Perform the multiplication using bash arithmetic
liquidity_index=$(awk -v data=$liquidity_index -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
ltv=$(awk -v data=$ltv -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
liquidation_threshold=$(awk -v data=$liquidation_threshold -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
liquidation_bonus=$(awk -v data=$liquidation_bonus -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
borrow_cap=$(awk -v data=${borrow_cap//_/} -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
supply_cap=$(awk -v data=${supply_cap//_/} -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')
reserve_factor=$(awk -v data=$reserve_factor -v scale=${SCALING_FACTOR//_/} 'BEGIN { printf "%.0f", data * scale }')

# Set the RESERVE_DATA
RESERVE_DATA="(
  record {
    asset_name = "$ESCAPED_TOKEN_NAME";  
    id = 1;
    \"d_token_canister\" = null;
    \"debt_token_canister\" = null;
    \"borrow_rate\" = 0;
    \"current_liquidity_rate\" = 0;
    \"asset_supply\" = 0;
    \"asset_borrow\" = 0;
    \"liquidity_index\" = $liquidity_index;
    \"debt_index\" = 0;
    \"configuration\" = record {
      \"ltv\" = $ltv;
      \"liquidation_threshold\" = $liquidation_threshold;
      \"liquidation_bonus\" = $liquidation_bonus;
      \"borrowing_enabled\" = true;
      \"borrow_cap\" = $borrow_cap;
      \"supply_cap\" = $supply_cap;
      \"liquidation_protocol_fee\" = 0;
      \"reserve_factor\" = $reserve_factor;
    };
    \"can_be_collateral\" = opt true;
    \"last_update_timestamp\" = 1; 
    \"accure_to_platform\" = 0
  }
)"

ASSET_IMAGE_URL="https://storage.googleapis.com/dfinance/ckBTC.png"

if [[ ! "$ASSET_IMAGE_URL" =~ ^https://storage.googleapis.com ]]; then
  echo "Error: Invalid URL. Only URLs from 'storage.googleapis.com' are allowed."
  exit 1
fi

dfx canister call "$CANISTER_NAME" initialize \
  "(\"$TOKEN_NAME\", $RESERVE_DATA, principal \"$TOKEN_PRINCIPAL\", \"$ASSET_IMAGE_URL\")" --network ic