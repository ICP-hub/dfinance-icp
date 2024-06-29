use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::dependencies::{
    icrc2::*,
    safe_icrc2::*,
    safe_cast::*,
    access_control::*,
    address::*
};

use crate::interfaces::{
    reserve_interest_rate_strategy::*,
    stable_debt_token::*,
    scaled_balanced_token::*,
    price_oracle_getter::*,
    price_oracle_sentinel::*,
    pool_address_provider::*,
};

use crate::protocol::libraries::{
    configuration::{reserve_configuration::ReserveConfiguration, user_configuration::UserConfiguration},
    helpers::errors::*,
    math::{wadray::WadRayMath, percentage::PercentageMath},
    types::datatypes::*,
    logic::{reserve_logic::ReserveLogic, generic_logic::GenericLogic},
};

use crate::protocol::tokenization::base::incentivized_icrc2::*;

// Placeholder for constants
const REBALANCE_UP_LIQUIDITY_RATE_THRESHOLD: u128 = 0.9e4;
const MINIMUM_HEALTH_FACTOR_LIQUIDATION_THRESHOLD: u128 = 0.95e18;
const HEALTH_FACTOR_LIQUIDATION_THRESHOLD: u128 = 1e18;
const ISOLATED_COLLATERAL_SUPPLIER_ROLE: [u8; 32] = *b"ISOLATED_COLLATERAL_SUPPLIER";

pub struct ValidationLogic;

impl ValidationLogic {
    pub fn validate_supply(
        reserve_cache: &ReserveCache,
        reserve: &ReserveData,
        amount: u128,
    ) {
        if amount == 0 {
            panic!(Errors::INVALID_AMOUNT);
        }

        let (is_active, is_frozen, _, _, is_paused) = reserve_cache.reserve_configuration.get_flags();
        if !is_active {
            panic!(Errors::RESERVE_INACTIVE);
        }
        if is_paused {
            panic!(Errors::RESERVE_PAUSED);
        }
        if is_frozen {
            panic!(Errors::RESERVE_FROZEN);
        }

        let supply_cap = reserve_cache.reserve_configuration.get_supply_cap();
        if supply_cap != 0 {
            let total_supply = IAToken::scaled_total_supply(&reserve_cache.a_token_address)
                + reserve.accrued_to_treasury as u128;
            if total_supply.ray_mul(reserve_cache.next_liquidity_index) + amount
                > supply_cap * 10u128.pow(reserve_cache.reserve_configuration.get_decimals() as u32)
            {
                panic!(Errors::SUPPLY_CAP_EXCEEDED);
            }
        }
    }

    pub fn validate_withdraw(
        reserve_cache: &ReserveCache,
        amount: u128,
        user_balance: u128,
    ) {
        if amount == 0 {
            panic!(Errors::INVALID_AMOUNT);
        }
        if amount > user_balance {
            panic!(Errors::NOT_ENOUGH_AVAILABLE_USER_BALANCE);
        }

        let (is_active, _, _, _, is_paused) = reserve_cache.reserve_configuration.get_flags();
        if !is_active {
            panic!(Errors::RESERVE_INACTIVE);
        }
        if is_paused {
            panic!(Errors::RESERVE_PAUSED);
        }
    }

    pub fn validate_borrow(
        reserves_data: &HashMap<String, ReserveData>,
        reserves_list: &HashMap<u64, String>,
        e_mode_categories: &HashMap<u8, DataTypes::EModeCategory>,
        params: &ValidateBorrowParams,
    ) {
        if params.amount == 0 {
            panic!(Errors::INVALID_AMOUNT);
        }

        let mut vars = ValidateBorrowLocalVars::default();
        let flags = params.reserve_cache.reserve_configuration.get_flags();
        vars.is_active = flags.0;
        vars.is_frozen = flags.1;
        vars.borrowing_enabled = flags.2;
        vars.stable_rate_borrowing_enabled = flags.3;
        vars.is_paused = flags.4;

        if !vars.is_active {
            panic!(Errors::RESERVE_INACTIVE);
        }
        if vars.is_paused {
            panic!(Errors::RESERVE_PAUSED);
        }
        if vars.is_frozen {
            panic!(Errors::RESERVE_FROZEN);
        }
        if !vars.borrowing_enabled {
            panic!(Errors::BORROWING_NOT_ENABLED);
        }

        if params.price_oracle_sentinel != String::new()
            && !IPriceOracleSentinel::is_borrow_allowed(&params.price_oracle_sentinel)
        {
            panic!(Errors::PRICE_ORACLE_SENTINEL_CHECK_FAILED);
        }

        if params.interest_rate_mode != DataTypes::InterestRateMode::VARIABLE
            && params.interest_rate_mode != DataTypes::InterestRateMode::STABLE
        {
            panic!(Errors::INVALID_INTEREST_RATE_MODE_SELECTED);
        }

        vars.reserve_decimals = params.reserve_cache.reserve_configuration.get_decimals();
        vars.borrow_cap = params.reserve_cache.reserve_configuration.get_borrow_cap();
        vars.asset_unit = 10u128.pow(vars.reserve_decimals as u32);

        if vars.borrow_cap != 0 {
            vars.total_supply_variable_debt = params
                .reserve_cache
                .curr_scaled_variable_debt
                .ray_mul(params.reserve_cache.next_variable_borrow_index);

            vars.total_debt = params.reserve_cache.curr_total_stable_debt
                + vars.total_supply_variable_debt
                + params.amount;

            if vars.total_debt > vars.borrow_cap * vars.asset_unit {
                panic!(Errors::BORROW_CAP_EXCEEDED);
            }
        }

        if params.isolation_mode_active {
            if !params.reserve_cache.reserve_configuration.get_borrowable_in_isolation() {
                panic!(Errors::ASSET_NOT_BORROWABLE_IN_ISOLATION);
            }

            if reserves_data
                .get(&params.isolation_mode_collateral_address)
                .unwrap()
                .isolation_mode_total_debt
                + (params.amount / 10u128.pow(vars.reserve_decimals as u32 - ReserveConfiguration::DEBT_CEILING_DECIMALS)) as u128
                > params.isolation_mode_debt_ceiling
            {
                panic!(Errors::DEBT_CEILING_EXCEEDED);
            }
        }

        if params.user_emode_category != 0 {
            if params.reserve_cache.reserve_configuration.get_emode_category() != params.user_emode_category {
                panic!(Errors::INCONSISTENT_EMODE_CATEGORY);
            }
            vars.emode_price_source = e_mode_categories
                .get(&params.user_emode_category)
                .unwrap()
                .price_source
                .clone();
        }

        let (user_collateral_in_base_currency, user_debt_in_base_currency, current_ltv, _, health_factor, _) = GenericLogic::calculate_user_account_data(
            reserves_data,
            reserves_list,
            e_mode_categories,
            CalculateUserAccountDataParams {
                user_config: params.user_config.clone(),
                reserves_count: params.reserves_count,
                user: params.user_address.clone(),
                oracle: params.oracle.clone(),
                user_emode_category: params.user_emode_category,
            },
        );

        if user_collateral_in_base_currency == 0 {
            panic!(Errors::COLLATERAL_BALANCE_IS_ZERO);
        }
        if current_ltv == 0 {
            panic!(Errors::LTV_VALIDATION_FAILED);
        }

        if health_factor <= HEALTH_FACTOR_LIQUIDATION_THRESHOLD {
            panic!(Errors::HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD);
        }

        vars.amount_in_base_currency = IPriceOracleGetter::get_asset_price(
            &params.oracle,
            if vars.emode_price_source != String::new() {
                &vars.emode_price_source
            } else {
                &params.asset
            },
        ) * params.amount / vars.asset_unit;

        vars.collateral_needed_in_base_currency = (user_debt_in_base_currency + vars.amount_in_base_currency)
            .percent_div(current_ltv);

        if vars.collateral_needed_in_base_currency > user_collateral_in_base_currency {
            panic!(Errors::COLLATERAL_CANNOT_COVER_NEW_BORROW);
        }

        if params.interest_rate_mode == DataTypes::InterestRateMode::STABLE {
            if !vars.stable_rate_borrowing_enabled {
                panic!(Errors::STABLE_BORROWING_NOT_ENABLED);
            }

            if !params.user_config.is_using_as_collateral(reserves_data.get(&params.asset).unwrap().id)
                || params.reserve_cache.reserve_configuration.get_ltv() == 0
                || params.amount > IERC20::balance_of(&params.reserve_cache.a_token_address, &params.user_address)
            {
                panic!(Errors::COLLATERAL_SAME_AS_BORROWING_CURRENCY);
            }

            vars.available_liquidity = IERC20::balance_of(&params.asset, &params.reserve_cache.a_token_address);

            let max_loan_size_stable = vars.available_liquidity.percent_mul(params.max_stable_loan_percent);

            if params.amount > max_loan_size_stable {
                panic!(Errors::AMOUNT_BIGGER_THAN_MAX_LOAN_SIZE_STABLE);
            }
        }

        if params.user_config.is_borrowing_any() {
            let (siloed_borrowing_enabled, siloed_borrowing_address) = params.user_config.get_siloed_borrowing_state(reserves_data, reserves_list);

            if siloed_borrowing_enabled {
                if siloed_borrowing_address != params.asset {
                    panic!(Errors::SILOED_BORROWING_VIOLATION);
                }
            } else {
                if params.reserve_cache.reserve_configuration.get_siloed_borrowing() {
                    panic!(Errors::SILOED_BORROWING_VIOLATION);
                }
            }
        }
    }

    // Other validation functions can be implemented similarly...

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}

#[derive(Default)]
struct ValidateBorrowLocalVars {
    current_ltv: u128,
    collateral_needed_in_base_currency: u128,
    user_collateral_in_base_currency: u128,
    user_debt_in_base_currency: u128,
    available_liquidity: u128,
    health_factor: u128,
    total_debt: u128,
    total_supply_variable_debt: u128,
    reserve_decimals: u8,
    borrow_cap: u128,
    amount_in_base_currency: u128,
    asset_unit: u128,
    emode_price_source: String,
    siloed_borrowing_address: String,
    is_active: bool,
    is_frozen: bool,
    is_paused: bool,
    borrowing_enabled: bool,
    stable_rate_borrowing_enabled: bool,
    siloed_borrowing_enabled: bool,
}

