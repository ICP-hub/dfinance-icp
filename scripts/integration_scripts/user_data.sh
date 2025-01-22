set -e

source ../../.env
echo "why things"

echo "--------------------------------------"

dfx identity use default
echo "Fetching user data"
user_principal=$(dfx identity get-principal)
echo "User Principal: $user_principal"
echo "things are fine"
backend_canister=$CANISTER_ID_DFINANCE_BACKEND
echo "backend Principal: $backend_canister"
get_user_method="get_user_data"
echo "get_user_method: $get_user_method"
user=$(dfx canister call $backend_canister register_user "()")
user_data=$(dfx canister call $backend_canister $get_user_method "(\"$user_principal\")")
echo "User data for the user principal $user_principal is: $user_data" 
echo "--------------------------------------"

# dfx identity use liquidator
# liquidator_principal=$(dfx identity get-principal)
# backend_canister=$CANISTER_ID_DFINANCE_BACKEND
# get_user_method="get_user_data"
# user=$(dfx canister call $backend_canister check_user "(\"$liquidator_principal\")")
# user_data=$(dfx canister call $backend_canister $get_user_method "(\"$liquidator_principal\")")
# echo "User data for the liquidator principal $liquidator_principal is: $user_data" 
# echo "--------------------------------------"

dfx identity use default