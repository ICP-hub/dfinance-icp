dfx identity use anonymous
# Approve the transfer
ckbtc_canister="bkyz2-fmaaa-aaaaa-qaaaq-cai"  
backend_canister="bw4dl-smaaa-aaaaa-qaacq-cai"  
dtoken_canister="c5kvi-uuaaa-aaaaa-qaaia-cai"
approve_method="icrc2_approve"
backend_canister_principal=$(dfx canister id $backend_canister)
approve_amount=10000000  # Set the amount you want to approve
echo "Approving transfer of $approve_amount from user1 to backend_canister..."
allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
    from_subaccount=null;
    spender=record { owner=principal\"${backend_canister_principal}\"; subaccount=null };
    amount=$approve_amount:nat;
    expected_allowance=null;
    expires_at=null;
    fee=null;
    memo=null;
    created_at_time=null
})")
echo "Allowance Set: $allow"
echo "--------------------------------------"