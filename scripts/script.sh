#!/bin/bash
set -e
set -x

TOKEN_LEDGER_ID="cbopz-duaaa-aaaaa-qaaka-cai"
BACKEND_CANISTER_ID="avqkn-guaaa-aaaaa-qaaea-cai"
SENDER_PRINCIPAL="fqib7-ohypg-oulzm-mxm44-laxw7-4jqsg-nryxh-7ll5p-r5upk-2pwvt-fqe"
RECIPIENT_PRINCIPAL="xcw7s-ta4nw-3owxv-2f6v3-og6xs-a5kbc-vxye5-b4nkf-nfrx7-2jd5p-qqe"
AMOUNT="200000000"
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

# echo "💸 Step 2: ICP transfer using icrc1_transfer"
# dfx canister call $TOKEN_LEDGER_ID icrc1_transfer \
# "(record {
#     to = record {
#         owner = principal \"$RECIPIENT_PRINCIPAL\";
#         subaccount = null;
#     };
#     amount = $AMOUNT : nat;
#     fee = opt ($FEE : nat);
#     memo = $MEMO;
#     created_at_time = $CREATED_AT_TIME;
# }, false, opt principal \"$SENDER_PRINCIPAL\")"