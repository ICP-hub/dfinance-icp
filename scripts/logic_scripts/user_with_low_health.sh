#!/bin/bash

# Canister ID and function details
register_method="register_user"
faucet_method="faucet"

# add tester
dfx canister call dfinance_backend add_tester "(\"liq_user1\", principal \"bxvzw-wxpx6-aeafv-26okg-sc4ag-2iwc6-aajx2-kkywl-y5rhf-teadh-sae\")"
ASSET_SUPPLY=0.0045
ASSET_BORROW=0.14
SUPPLY_TOKENS="ckBTC"
BORROW_TOKENS="ckETH"
# dfx canister call dfinance_backend create_user_reserve_with_low_health \
#     "(\"$AS
SET_SUPPLY\", \"$ASSET_BORROW\", $SUPPLY_TOKENS, $BORROW_TOKENS)"
IDENTITY_NAME="liq_user1"
PRINCIPAL_ID="lor7f-li7tj-5oqz6-j6aep-pn5sh-f5jct-kn5r4-sa73a-74bf2-zleh4-2ae"
dfx identity new $IDENTITY_NAME --disable-encryption || echo "Identity already exists"
dfx identity use $IDENTITY_NAME

# Import the principal into the identity
dfx identity import $PRINCIPAL_ID


dfx canister call dfinance_backend create_user_reserve_with_low_health \
    "(\"ckBTC\", \"ckETH\", "450000", "14000000")"

dfx identity use default