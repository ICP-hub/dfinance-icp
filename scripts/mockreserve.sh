#!/bin/bash

# Set the canister ID for the backend
BACKEND_CANISTER_ID="avqkn-guaaa-aaaaa-qaaea-cai"

# Function to call a canister method
call_canister_method() {
    local method_name=$1
    local params=$2
    dfx canister call $BACKEND_CANISTER_ID $method_name "$params"
}

echo "Select the function you want to run:"
echo "1. set_reserve_borrowing"
echo "2. set_reserve_stable_rate_borrowing"
echo "3. set_reserve_flash_loaning"
echo "4. set_reserve_active"
echo "5. set_reserve_freeze"
echo "6. set_reserve_pause"
echo "7. set_reserve_factor"
echo "8. set_debt_ceiling"
echo "9. set_siloed_borrowing"
echo "10. set_borrow_cap"
echo "11. set_supply_cap"
echo "12. set_liquidation_protocol_fee"
echo "13. configure_reserve_as_collateral"
echo "14. set_unbacked_mint_cap"
echo "15. set_pool_pause"
echo -n "Enter the function number: "
read function_number

case $function_number in
    1)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enable borrowing (true/false): "
        read enabled
        call_canister_method "set_reserve_borrowing" "($asset, $enabled)"
        ;;
    2)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enable stable rate borrowing (true/false): "
        read enabled
        call_canister_method "set_reserve_stable_rate_borrowing" "($asset, $enabled)"
        ;;
    3)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enable flash loaning (true/false): "
        read enabled
        call_canister_method "set_reserve_flash_loaning" "($asset, $enabled)"
        ;;
    4)
        echo -n "Enter asset name: "
        read asset
        echo -n "Set reserve active (true/false): "
        read active
        # call_canister_method "set_reserve_active"  echo -n "Enter asset name: "
        # read asset
        # echo -n "Set reserve active (true/false): "
        # read active
        call_canister_method "set_reserve_active" "(record { asset=\"$asset\"; active=$active })"
        ;;
    5)
        echo -n "Enter asset name: "
        read asset
        echo -n "Freeze reserve (true/false): "
        read freeze
        call_canister_method "set_reserve_freeze" "($asset, $freeze)"
        ;;
    6)
        echo -n "Enter asset name: "
        read asset
        echo -n "Pause reserve (true/false): "
        read paused
        call_canister_method "set_reserve_pause" "($asset, $paused)"
        ;;
    7)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new reserve factor (as u128): "
        read new_reserve_factor
        call_canister_method "set_reserve_factor" "($asset, $new_reserve_factor)"
        ;;
    8)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new debt ceiling (as u64): "
        read new_debt_ceiling
        call_canister_method "set_debt_ceiling" "($asset, $new_debt_ceiling)"
        ;;
    9)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enable siloed borrowing (true/false): "
        read new_siloed
        call_canister_method "set_siloed_borrowing" "($asset, $new_siloed)"
        ;;
    10)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new borrow cap (as u64): "
        read new_borrow_cap
        call_canister_method "set_borrow_cap" "($asset, $new_borrow_cap)"
        ;;
    11)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new supply cap (as u64): "
        read new_supply_cap
        call_canister_method "set_supply_cap" "($asset, $new_supply_cap)"
        ;;
    12)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new liquidation protocol fee (as u16): "
        read new_fee
        call_canister_method "set_liquidation_protocol_fee" "($asset, $new_fee)"
        ;;
    13)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter LTV (as u16): "
        read ltv
        echo -n "Enter liquidation threshold (as u16): "
        read liquidation_threshold
        echo -n "Enter liquidation bonus (as u16): "
        read liquidation_bonus
        call_canister_method "configure_reserve_as_collateral" "($asset, $ltv, $liquidation_threshold, $liquidation_bonus)"
        ;;
    14)
        echo -n "Enter asset name: "
        read asset
        echo -n "Enter new unbacked mint cap (as u64): "
        read new_unbacked_mint_cap
        call_canister_method "set_unbacked_mint_cap" "($asset, $new_unbacked_mint_cap)"
        ;;
    15)
        echo -n "Pause the entire pool (true/false): "
        read paused
        call_canister_method "set_pool_pause" "($paused)"
        ;;
    
    *)
        echo "Invalid function number."
        ;;
esac
