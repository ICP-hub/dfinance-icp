use crate::api::functions::{get_balance, get_fees};
use crate::api::state_handler::mutate_state;
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::math::calculate::{calculate_ltv, UserPosition};
use candid::{Nat, Principal};
use core::panic;

pub struct ValidationLogic;

impl ValidationLogic {
    // -------------------------------------
    // -------------- SUPPLY ---------------
    // -------------------------------------

    pub async fn validate_supply(
        reserve: &ReserveData,
        amount: u128,
        user: Principal,
        ledger_canister: Principal,
    ) {
        // validating amount
        let user_balance = get_balance(ledger_canister, user).await;
        ic_cdk::println!("User balance: {:?}", user_balance);

        let transfer_fees = get_fees(ledger_canister).await;
        ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

        let final_amount = amount + transfer_fees;
        ic_cdk::println!("final_amount : {:?}", final_amount);

        if amount == 0 {
            panic!("{:?}", Error::InvalidAmount);
        }

        if final_amount > user_balance {
            panic!("{:?}", Error::InvalidAmount);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (true, false, false);

        if !is_active {
            panic!("{:?}", Error::ReserveInactive);
        }
        if is_paused {
            panic!("{:?}", Error::ReservePaused);
        }
        if is_frozen {
            panic!("{:?}", Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // Validating supply cap limit
        let supply_cap = Nat::from(100000u64);
        ic_cdk::println!("supply_cap : {:?}", supply_cap);

        let final_total_supply = final_amount + reserve.total_supply.unwrap_or(0.0) as u128;
        ic_cdk::println!("final_total_supply : {:?}", final_total_supply);

        if final_total_supply >= supply_cap {
            panic!("{:?}", Error::SupplyCapExceeded);
        }
    }

    // -------------------------------------
    // ------------- WITHDRAW --------------
    // -------------------------------------

    pub async fn validate_withdraw(
        reserve: &ReserveData,
        amount: u128,
        user: Principal,
        ledger_canister: Principal,
    ) {
        // amount < supply amount
        //
    }

    // --------------------------------------
    // --------------- BORROW ---------------
    // --------------------------------------

    pub async fn validate_borrow(reserve: &ReserveData, amount: f64, user_principal: Principal) {
        // Ensure the amount is valid
        if amount == 0.0 {
            panic!("{:?}", Error::InvalidAmount);
        }

        // validating reserve states
        let (is_active, is_frozen, is_paused) = (true, false, false);

        if !is_active {
            panic!("{:?}", Error::ReserveInactive);
        }
        if is_paused {
            panic!("{:?}", Error::ReservePaused);
        }
        if is_frozen {
            panic!("{:?}", Error::ReserveFrozen);
        }
        ic_cdk::println!("is_active : {:?}", is_active);
        ic_cdk::println!("is_paused : {:?}", is_paused);
        ic_cdk::println!("is_frozen : {:?}", is_frozen);

        // Fetch user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        // Handle user data result
        let user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                panic!("{:?}", e);
            }
        };

        let user_total_debt = user_data.total_debt.unwrap_or(0.0);

        // Calculate next total debt
        let next_total_debt = amount + user_total_debt;
        ic_cdk::println!("Next total debt: {}", next_total_debt);

        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap(),
            total_borrowed_value: next_total_debt,
            liquidation_threshold: 0.0,
        };

        let ltv = calculate_ltv(&user_position);
        ic_cdk::println!("LTV {:?}", ltv);
        ic_cdk::println!("user liq threshold {:?}", user_data.liquidation_threshold.unwrap());

        if ltv >= user_data.liquidation_threshold.unwrap() {
            panic!("{:?}", Error::LTVGreaterThanThreshold);
        }

        // Validating supply cap limit
        let borrow_cap = 100000f64; // reserve.config
        ic_cdk::println!("borrow_cap : {:?}", borrow_cap);

        let final_total_borrow = amount + reserve.total_supply.unwrap_or(0.0); // total_borrowed
        ic_cdk::println!("final_total_supply : {:?}", final_total_borrow);

        if final_total_borrow >= borrow_cap {
            panic!("{:?}", Error::BorrowCapExceeded);
        };
    }

    // --------------------------------------
    // ---------------- REPAY ---------------
    // --------------------------------------

    pub async fn validate_repay(
        reserve: &ReserveData,
        amount: u128,
        user: Principal,
        ledger_canister: Principal,
    ) {
    }

    // --------------------------------------
    // ---------------- LIQUIDATION ---------------
    // --------------------------------------

    pub async fn validate_liquidation(
        reserve: &ReserveData,
        amount: u128,
        user: Principal,
        ledger_canister: Principal,
    ) {
    }

    // pub fn validate_withdraw(reserve_cache: &ReserveCache, amount: u128, user_balance: u128) {
    //     if amount == 0 {
    //         panic!("{:?}", Error::InvalidAmount);
    //     }
    //     if amount > user_balance {
    //         panic!("{:?}", Error::NotEnoughAvailableUserBalance);
    //     }

    //     // let (is_active, _, _, _, is_paused) = reserve_cache.reserve_configuration.get_flags();
    //     // if !is_active {
    //     //     panic!("{:?}", Error::ReserveInactive);
    //     // }
    //     // if is_paused {
    //     //     panic!("{:?}", Error::ReservePaused);
    //     // }
    // }

}
