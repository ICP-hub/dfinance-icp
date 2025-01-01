#!/bin/bash

TOKEN_NAME="ICP"

# Set the canister name
CANISTER_NAME="dfinance_backend"

# Escape the TOKEN_NAME for use in the ReserveData
ESCAPED_TOKEN_NAME=$(printf '%s' "$TOKEN_NAME" | jq -sR .)

# Set the RESERVE_DATA
RESERVE_DATA="(
  record {
    asset_name = null; 
    id = 4;
    \"d_token_canister\" = null;
    \"debt_token_canister\" = null;
    \"borrow_rate\" = 0;
    \"current_liquidity_rate\" = 0;
    \"asset_supply\" = 0;
    \"asset_borrow\" = 0;
    \"liquidity_index\" = 1;
    \"debt_index\" = 0;
    \"configuration\" = record {
      \"ltv\" = 58;
      \"liquidation_threshold\" = 63;
      \"liquidation_bonus\" = 1;
      \"borrowing_enabled\" = true;
      \"borrow_cap\" = 10000000000;
      \"supply_cap\" = 10000000000;
      \"liquidation_protocol_fee\" = 0;
      \"frozen\" = false;
      \"active\" = true;
      \"paused\" = false;
      \"reserve_factor\" = 15
    };
    \"can_be_collateral\" = opt true;
    \"last_update_timestamp\" = 1; 
    \"accure_to_platform\" = 0
  }
)"

# Call the initialize function on the canister with the serialized ReserveData
dfx canister call $CANISTER_NAME initialize "(\"$TOKEN_NAME\", $RESERVE_DATA)" && dfx canister call $CANISTER_NAME update_reserves_price
