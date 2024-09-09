set -e

user_principal="gsyb3-neiyj-ybncb-5xjnt-nh2kf-u3h3b-bvtqm-4uyzh-uqkvk-yrvqd-oae"
backend_canister="b77ix-eeaaa-aaaaa-qaada-cai"
get_user_method="get_user_data"
user=$(dfx canister call $backend_canister check_user "(\"$user_principal\")")
user_data=$(dfx canister call $backend_canister $get_user_method "(\"$user_principal\")")
echo "User data for the principal $user_principal is: $user_data" 
echo "--------------------------------------"