use candid::{Nat, Principal};
use core::panic;

use crate::api::functions::{get_balance, get_fees};
use crate::constants::errors::Error;
use crate::declarations::assets::ReserveData;

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
    }

    // --------------------------------------
    // --------------- BORROW ---------------
    // --------------------------------------

    pub async fn validate_borrow(
        reserve: &ReserveData,
        amount: u128,
        user: Principal,
        ledger_canister: Principal,
    ) {
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

    // pub fn validate_borrow(
    //     reserves_data: &ReserveData,
    //     reserves_list: &ReserveCache,
    //     e_mode_categories: &HashMap<u8, DataTypes::EModeCategory>,
    //     params: &ValidateBorrowParams,
    // ) {
    //     if params.amount == 0 {
    //         panic!(Errors::INVALID_AMOUNT);
    //     }

    //     let mut vars = ValidateBorrowLocalVars::default();
    //     let flags = params.reserve_cache.reserve_configuration.get_flags();
    //     vars.is_active = flags.0;
    //     vars.is_frozen = flags.1;
    //     vars.borrowing_enabled = flags.2;
    //     vars.stable_rate_borrowing_enabled = flags.3;
    //     vars.is_paused = flags.4;

    //     if !vars.is_active {
    //         panic!(Errors::RESERVE_INACTIVE);
    //     }
    //     if vars.is_paused {
    //         panic!(Errors::RESERVE_PAUSED);
    //     }
    //     if vars.is_frozen {
    //         panic!(Errors::RESERVE_FROZEN);
    //     }
    //     if !vars.borrowing_enabled {
    //         panic!(Errors::BORROWING_NOT_ENABLED);
    //     }

    //     if params.price_oracle_sentinel != String::new()
    //         && !IPriceOracleSentinel::is_borrow_allowed(&params.price_oracle_sentinel)
    //     {
    //         panic!(Errors::PRICE_ORACLE_SENTINEL_CHECK_FAILED);
    //     }

    //     if params.interest_rate_mode != DataTypes::InterestRateMode::VARIABLE
    //         && params.interest_rate_mode != DataTypes::InterestRateMode::STABLE
    //     {
    //         panic!(Errors::INVALID_INTEREST_RATE_MODE_SELECTED);
    //     }

    //     vars.reserve_decimals = params.reserve_cache.reserve_configuration.get_decimals();
    //     vars.borrow_cap = params.reserve_cache.reserve_configuration.get_borrow_cap();
    //     vars.asset_unit = 10u128.pow(vars.reserve_decimals as u32);

    //     if vars.borrow_cap != 0 {
    //         vars.total_supply_variable_debt = params
    //             .reserve_cache
    //             .curr_scaled_variable_debt
    //             .ray_mul(params.reserve_cache.next_variable_borrow_index);

    //         vars.total_debt = params.reserve_cache.curr_total_stable_debt
    //             + vars.total_supply_variable_debt
    //             + params.amount;

    //         if vars.total_debt > vars.borrow_cap * vars.asset_unit {
    //             panic!(Errors::BORROW_CAP_EXCEEDED);
    //         }
    //     }

    //     if params.isolation_mode_active {
    //         if !params
    //             .reserve_cache
    //             .reserve_configuration
    //             .get_borrowable_in_isolation()
    //         {
    //             panic!(Errors::ASSET_NOT_BORROWABLE_IN_ISOLATION);
    //         }

    //         if reserves_data
    //             .get(&params.isolation_mode_collateral_address)
    //             .unwrap()
    //             .isolation_mode_total_debt
    //             + (params.amount
    //                 / 10u128.pow(
    //                     vars.reserve_decimals as u32 - ReserveConfiguration::DEBT_CEILING_DECIMALS,
    //                 )) as u128
    //             > params.isolation_mode_debt_ceiling
    //         {
    //             panic!(Errors::DEBT_CEILING_EXCEEDED);
    //         }
    //     }

    //     if params.user_emode_category != 0 {
    //         if params
    //             .reserve_cache
    //             .reserve_configuration
    //             .get_emode_category()
    //             != params.user_emode_category
    //         {
    //             panic!(Errors::INCONSISTENT_EMODE_CATEGORY);
    //         }
    //         vars.emode_price_source = e_mode_categories
    //             .get(&params.user_emode_category)
    //             .unwrap()
    //             .price_source
    //             .clone();
    //     }

    //     let (
    //         user_collateral_in_base_currency,
    //         user_debt_in_base_currency,
    //         current_ltv,
    //         _,
    //         health_factor,
    //         _,
    //     ) = GenericLogic::calculate_user_account_data(
    //         reserves_data,
    //         reserves_list,
    //         e_mode_categories,
    //         CalculateUserAccountDataParams {
    //             user_config: params.user_config.clone(),
    //             reserves_count: params.reserves_count,
    //             user: params.user_address.clone(),
    //             oracle: params.oracle.clone(),
    //             user_emode_category: params.user_emode_category,
    //         },
    //     );

    //     if user_collateral_in_base_currency == 0 {
    //         panic!(Errors::COLLATERAL_BALANCE_IS_ZERO);
    //     }
    //     if current_ltv == 0 {
    //         panic!(Errors::LTV_VALIDATION_FAILED);
    //     }

    //     if health_factor <= HEALTH_FACTOR_LIQUIDATION_THRESHOLD {
    //         panic!(Errors::HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD);
    //     }

    //     vars.amount_in_base_currency = IPriceOracleGetter::get_asset_price(
    //         &params.oracle,
    //         if vars.emode_price_source != String::new() {
    //             &vars.emode_price_source
    //         } else {
    //             &params.asset
    //         },
    //     ) * params.amount
    //         / vars.asset_unit;

    //     vars.collateral_needed_in_base_currency =
    //         (user_debt_in_base_currency + vars.amount_in_base_currency).percent_div(current_ltv);

    //     if vars.collateral_needed_in_base_currency > user_collateral_in_base_currency {
    //         panic!(Errors::COLLATERAL_CANNOT_COVER_NEW_BORROW);
    //     }

    //     if params.interest_rate_mode == DataTypes::InterestRateMode::STABLE {
    //         if !vars.stable_rate_borrowing_enabled {
    //             panic!(Errors::STABLE_BORROWING_NOT_ENABLED);
    //         }

    //         if !params
    //             .user_config
    //             .is_using_as_collateral(reserves_data.get(&params.asset).unwrap().id)
    //             || params.reserve_cache.reserve_configuration.get_ltv() == 0
    //             || params.amount
    //                 > IERC20::balance_of(
    //                     &params.reserve_cache.d_token_address,
    //                     &params.user_address,
    //                 )
    //         {
    //             panic!(Errors::COLLATERAL_SAME_AS_BORROWING_CURRENCY);
    //         }

    //         vars.available_liquidity =
    //             IERC20::balance_of(&params.asset, &params.reserve_cache.d_token_address);

    //         let max_loan_size_stable = vars
    //             .available_liquidity
    //             .percent_mul(params.max_stable_loan_percent);

    //         if params.amount > max_loan_size_stable {
    //             panic!(Errors::AMOUNT_BIGGER_THAN_MAX_LOAN_SIZE_STABLE);
    //         }
    //     }

    //     if params.user_config.is_borrowing_any() {
    //         let (siloed_borrowing_enabled, siloed_borrowing_address) = params
    //             .user_config
    //             .get_siloed_borrowing_state(reserves_data, reserves_list);

    //         if siloed_borrowing_enabled {
    //             if siloed_borrowing_address != params.asset {
    //                 panic!(Errors::SILOED_BORROWING_VIOLATION);
    //             }
    //         } else {
    //             if params
    //                 .reserve_cache
    //                 .reserve_configuration
    //                 .get_siloed_borrowing()
    //             {
    //                 panic!(Errors::SILOED_BORROWING_VIOLATION);
    //             }
    //         }
    //     }
    // }
}
