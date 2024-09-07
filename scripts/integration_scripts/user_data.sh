set -e

user_principal="gpgb2-wlbjp-ivvu6-mt64b-peiwj-3svh6-trmtc-epg2j-3mhja-ajizs-zqe"
backend_canister="be2us-64aaa-aaaaa-qaabq-cai"
get_user_method="get_user_data"
user=$(dfx canister call $backend_canister check_user "(\"$user_principal\")")
user_data=$(dfx canister call $backend_canister $get_user_method "(\"$user_principal\")")
echo "User data for the principal $user_principal is: $user_data" 
echo "--------------------------------------"