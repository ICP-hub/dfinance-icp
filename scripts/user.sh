
set -e

user_principal="rhddl-hq5dq-vuqjs-vzn32-5onmo-kqm7h-2irwx-fmbth-i6762-g3o2p-vae"
backend_canister="a3shf-5eaaa-aaaaa-qaafa-cai"
get_user_method="get_user_data"

user_data=$(dfx canister call $backend_canister $get_user_method "(\"$user_principal\")")
echo "User data for the principal $user_principal is: $user_data" 
echo "--------------------------------------"