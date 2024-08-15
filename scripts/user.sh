
set -e

user_principal="i5hok-bgbg2-vmnlz-qa4ur-wm6z3-ha5xl-c3tut-i7oxy-6ayyw-2zvma-lqe"
backend_canister="avqkn-guaaa-aaaaa-qaaea-cai"
get_user_method="get_user_data"

user_data=$(dfx canister call $backend_canister $get_user_method "(\"$user_principal\")")
echo "User data for the principal $user_principal is: $user_data" 
echo "--------------------------------------"