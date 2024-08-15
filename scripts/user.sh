set -e
ckbtc_canister="br5f7-7uaaa-aaaaa-qaaca-cai"  # Replace with your actual canister ID if different
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"  # Replace with your actual backend canister ID
approve_method="icrc2_approve"
d_token="by6od-j4aaa-aaaaa-qaadq-cai"
dfx identity use user1
user1_principal=$(dfx identity get-principal)
echo "User1 Principal (Spender): $user1_principal"


# Approve the transfer
approve_amount=1000000000  # Set the amount you want to approve
echo "Approving transfer of $approve_amount from user1 to backend_canister..."
allow=$(dfx canister call $ckbtc_canister $approve_method "(record {
    from_subaccount=null;
    spender=record { owner=principal\"${d_token}\"; subaccount=null };
    amount=$approve_amount:nat;
    expected_allowance=null;
    expires_at=null;
    fee=null;
    memo=null;
    created_at_time=null
})")
echo "Allowance Set: $allow"
echo "--------------------------------------"

dfx identity use default
echo "Switched back to default identity."