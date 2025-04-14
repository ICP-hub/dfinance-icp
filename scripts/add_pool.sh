
# 2. Add ksICP/ksUSDT pool
IDENTITY="--identity kong"

KSICP_SYMBOL="ksETH"
KSICP_KSUSDT_PRICE=7.50
KSICP_KSUSDT_PRICE=${KSICP_KSUSDT_PRICE//_/}        # remove underscore
KSICP_AMOUNT=500_000_000_000            # 5,000 ksICP
KSICP_AMOUNT=${KSICP_AMOUNT//_/}        # remove underscore
KSICP_CHAIN="IC"
KSICP_LEDGER=$(dfx canister id ${NETWORK} ${IDENTITY} $(echo ${KSICP_SYMBOL} | tr '[:upper:]' '[:lower:]')_ledger)
echo "ksICP_LEDGER: ${KSICP_LEDGER}"
KSICP_DECIMALS=$(dfx canister call ${NETWORK} ${IDENTITY} ${KSICP_LEDGER} icrc1_decimals '()' | awk -F"[^0-9]*" '{print $2}')
KSICP_DECIMALS=$(echo "10^${KSICP_DECIMALS}" | bc)
KSICP_KSUSDT_DECIMALS=$(echo "${KSICP_DECIMALS} / ${KSUSDT_DECIMALS}" | bc -l) # convert ksICP to ksUSDT precision
KSICP_FEE=$(dfx canister call ${NETWORK} ${IDENTITY} ${KSICP_LEDGER} transfer_fee "(record {})" | awk -F'=' '{print $3}' | awk '{print $1}')
KSICP_FEE=${KSICP_FEE//_/}
KSUSDT_AMOUNT=$(echo "scale=0; ${KSICP_AMOUNT} * ${KSICP_KSUSDT_PRICE} / ${KSICP_KSUSDT_DECIMALS}" | bc -l)
KSUSDT_AMOUNT_inusd=$(echo "scale=0; ${KSICP_AMOUNT} * ${KSICP_KSUSDT_PRICE}" | bc -l)
echo "ksUSDT_AMOUNT: ${KSUSDT_AMOUNT}"
echo "ksUSDT_AMOUNT: ${KSUSDT_AMOUNT_inusd}"
echo "ksICP amount : ${KSICP_AMOUNT}"
EXPIRES_AT=$(echo "$(date +%s)*1000000000 + 60000000000" | bc)  # 60 seconds from now


dfx canister call ${NETWORK} ${IDENTITY} ${KSICP_LEDGER} icrc2_approve "(record {
    amount = $(echo "${KSICP_AMOUNT} + ${KSICP_FEE}" | bc);
    expires_at = opt ${EXPIRES_AT};
    spender = record {
        owner = principal \"${KONG_CANISTER}\";
    };
})"

# dfx canister call ${NETWORK} ${IDENTITY} ${KSUSDT_LEDGER} icrc2_approve "(record {
#     amount = $(echo "${KSUSDT_AMOUNT} + ${KSUSDT_FEE}" | bc);
#     expires_at = opt ${EXPIRES_AT};
#     spender = record {
#         owner = principal \"${KONG_CANISTER}\";
#     };
# })"

dfx canister call ${NETWORK} ${IDENTITY} ${KONG_CANISTER} add_pool --output json "(record {
    token_0 = \"${KSICP_CHAIN}.${KSICP_LEDGER}\";
    amount_0 = ${KSICP_AMOUNT};
    token_1 = \"${KSUSDT_CHAIN}.${KSUSDT_LEDGER}\";
    amount_1 = ${KSUSDT_AMOUNT};
    on_kong = opt true;
})" | jq