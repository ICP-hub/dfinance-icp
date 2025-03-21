#!/bin/bash

TOKEN_NAME="ckUSDC"

# Set the canister name
CANISTER_NAME="dfinance_backend"
SCALING_FACTOR=100000000

# Escape the TOKEN_NAME for use in the ReserveData
ESCAPED_TOKEN_NAME=$(printf '%s' "$TOKEN_NAME" | jq -sR .)

# Set the ReserveData values
liquidity_index=1
ltv=75
liquidation_threshold=78
liquidation_bonus=5
borrow_cap=10000000000
supply_cap=10000000000
reserve_factor=15

# Perform the multiplication using bash arithmetic
liquidity_index=$(awk -v bonus=$liquidity_index -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
ltv=$(awk -v bonus=$ltv -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
liquidation_threshold=$(awk -v bonus=$liquidation_threshold -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
liquidation_bonus=$(awk -v bonus=$liquidation_bonus -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
borrow_cap=$(awk -v bonus=$borrow_cap -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
supply_cap=$(awk -v bonus=$supply_cap -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')
reserve_factor=$(awk -v bonus=$reserve_factor -v scale=$SCALING_FACTOR 'BEGIN { printf "%.0f", bonus * scale }')

# Set the RESERVE_DATA
RESERVE_DATA="(
  record {
    asset_name = null; 
    id = 3;
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
      \"frozen\" = false;
      \"active\" = true;
      \"paused\" = false;
      \"reserve_factor\" = $reserve_factor;
    };
    \"can_be_collateral\" = opt true;
    \"last_update_timestamp\" = 1; 
    \"accure_to_platform\" = 0
  }
)"

# Call the initialize function on the canister with the serialized ReserveData
dfx canister call $CANISTER_NAME initialize "(\"$TOKEN_NAME\", $RESERVE_DATA)" 
