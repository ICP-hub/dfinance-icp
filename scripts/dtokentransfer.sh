#!/bin/bash
set -e
set -x

TOKEN_LEDGER_ID="c5kvi-uuaaa-aaaaa-qaaia-cai"
BACKEND_CANISTER_ID="by6od-j4aaa-aaaaa-qaadq-cai"
SENDER_PRINCIPAL="ysnd6-gzmgp-5hlvd-fgewp-ekp6u-xbj7a-xyuho-v3pzq-udj3f-6exeg-nqe"
RECIPIENT_PRINCIPAL="nthqt-grnwh-rhu4a-p7phg-fm636-bka26-ckljd-gcvau-wqqtn-yyuat-wae"
AMOUNT="100000000"
FEE="0"
MEMO="null"
CREATED_AT_TIME="null"
echo "✅ Step 0: Approve spender using icrc2_approve"
approve_result=$(dfx canister call "$TOKEN_LEDGER_ID" icrc2_approve "(
    record {
      amount = 100000000 : nat;
      spender = record {
        owner = principal \"$BACKEND_CANISTER_ID\";
      };
    }
  )")
  echo "Approve result: $approve_result"

echo "🔁 Step 1: DToken transfer using icrc2_transfer_from"
dfx canister call $TOKEN_LEDGER_ID icrc2_transfer_from \
"(record {
    from = record {
        owner = principal \"$SENDER_PRINCIPAL\";
        subaccount = null;
    };
    to = record {
        owner = principal \"$RECIPIENT_PRINCIPAL\";
        subaccount = null;
    };
    spender_subaccount = null;
    amount = $AMOUNT : nat;
    fee = opt ($FEE : nat);
    memo = $MEMO;
    created_at_time = $CREATED_AT_TIME;
})"

echo "💸 Step 2: ICP transfer using icrc1_transfer"
dfx canister call $TOKEN_LEDGER_ID icrc1_transfer \
"(record {
    to = record {
        owner = principal \"$RECIPIENT_PRINCIPAL\";
        subaccount = null;
    };
    amount = $AMOUNT : nat;
    fee = opt ($FEE : nat);
    memo = $MEMO;
    created_at_time = $CREATED_AT_TIME;
}, false, opt principal \"$SENDER_PRINCIPAL\")"
