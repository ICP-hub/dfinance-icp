use std::collections::HashMap;

use crate::dependencies::{
    icrc2::*,
    safe_icrc2::*,
    safe_cast::*
};

use crate::protocol::libraries::{
    configuration::reserve_configuration::*,
    helpers::errors::*,
    math::{wadray::WadRayMath, percentage::PercentageMath, math_utils::*},
    types::datatypes::*,
};

use crate::interfaces::{
    stable_debt_token::*,
    variable_debt_token::*,
    reserve_interest_rate_strategy::*
};

pub struct ReserveLogic;

impl ReserveLogic {
    pub fn get_normalized_income(reserve: &data_types::ReserveData) -> u128 {
        let timestamp = reserve.last_update_timestamp;

        if timestamp == current_timestamp() {
            reserve.liquidity_index
        } else {
            MathUtils::calculate_linear_interest(reserve.current_liquidity_rate, timestamp)
                .ray_mul(reserve.liquidity_index)
        }
    }

    pub fn get_normalized_debt(reserve: &data_types::ReserveData) -> u128 {
        let timestamp = reserve.last_update_timestamp;

        if timestamp == current_timestamp() {
            reserve.variable_borrow_index
        } else {
            MathUtils::calculate_compounded_interest(reserve.current_variable_borrow_rate, timestamp)
                .ray_mul(reserve.variable_borrow_index)
        }
    }

    pub fn update_state(reserve: &mut data_types::ReserveData, reserve_cache: ReserveCache) {
        if reserve.last_update_timestamp == current_timestamp() {
            return;
        }

        Self::_update_indexes(reserve, &reserve_cache);
        Self::_accrue_to_treasury(reserve, reserve_cache);

        reserve.last_update_timestamp = current_timestamp();
    }

    pub fn cumulate_to_liquidity_index(
        reserve: &mut data_types::ReserveData,
        total_liquidity: u128,
        amount: u128,
    ) -> u128 {
        let result = (amount.wad_to_ray().ray_div(total_liquidity.wad_to_ray()) + WadRayMath::RAY)
            .ray_mul(reserve.liquidity_index);
        reserve.liquidity_index = result;
        result
    }

    pub fn init(
        reserve: &mut data_types::ReserveData,
        a_token_address: String,
        stable_debt_token_address: String,
        variable_debt_token_address: String,
        interest_rate_strategy_address: String,
    ) {
        if reserve.a_token_address != "" {
            panic!(Errors::RESERVE_ALREADY_INITIALIZED);
        }

        reserve.liquidity_index = WadRayMath::RAY;
        reserve.variable_borrow_index = WadRayMath::RAY;
        reserve.a_token_address = a_token_address;
        reserve.stable_debt_token_address = stable_debt_token_address;
        reserve.variable_debt_token_address = variable_debt_token_address;
        reserve.interest_rate_strategy_address = interest_rate_strategy_address;
    }

    pub fn update_interest_rates(
        reserve: &mut data_types::ReserveData,
        reserve_cache: &ReserveCache,
        reserve_address: String,
        liquidity_added: u128,
        liquidity_taken: u128,
    ) {
        let mut vars = UpdateInterestRatesLocalVars {
            next_liquidity_rate: 0,
            next_stable_rate: 0,
            next_variable_rate: 0,
            total_variable_debt: 0,
        };

        vars.total_variable_debt = reserve_cache.next_scaled_variable_debt.ray_mul(
            reserve_cache.next_variable_borrow_index,
        );

        let interest_rates = IReserveInterestRateStrategy::calculate_interest_rates(
            reserve.interest_rate_strategy_address.clone(),
            data_types::CalculateInterestRatesParams {
                unbacked: reserve.unbacked,
                liquidity_added,
                liquidity_taken,
                total_stable_debt: reserve_cache.next_total_stable_debt,
                total_variable_debt: vars.total_variable_debt,
                average_stable_borrow_rate: reserve_cache.next_avg_stable_borrow_rate,
                reserve_factor: reserve_cache.reserve_factor,
                reserve: reserve_address.clone(),
                a_token: reserve_cache.a_token_address.clone(),
            },
        );

        vars.next_liquidity_rate = interest_rates.0;
        vars.next_stable_rate = interest_rates.1;
        vars.next_variable_rate = interest_rates.2;

        reserve.current_liquidity_rate = vars.next_liquidity_rate;
        reserve.current_stable_borrow_rate = vars.next_stable_rate;
        reserve.current_variable_borrow_rate = vars.next_variable_rate;

        let event = events::ReserveDataUpdated {
            reserve: reserve_address,
            liquidity_rate: vars.next_liquidity_rate,
            stable_borrow_rate: vars.next_stable_rate,
            variable_borrow_rate: vars.next_variable_rate,
            liquidity_index: reserve_cache.next_liquidity_index,
            variable_borrow_index: reserve_cache.next_variable_borrow_index,
        };

        println!("{:?}", event);
    }

    fn _accrue_to_treasury(reserve: &mut data_types::ReserveData, reserve_cache: data_types::ReserveCache
            prev_total_stable_debt: 0,
            prev_total_variable_debt: 0,
            curr_total_variable_debt: 0,
            cumulated_stable_interest: 0,
            total_debt_accrued: 0,
            amount_to_mint: 0,
        };

        if reserve_cache.reserve_factor == 0 {
            return;
        }

        vars.prev_total_variable_debt = reserve_cache.curr_scaled_variable_debt.ray_mul(
            reserve_cache.curr_variable_borrow_index,
        );

        vars.curr_total_variable_debt = reserve_cache.curr_scaled_variable_debt.ray_mul(
            reserve_cache.next_variable_borrow_index,
        );

        vars.cumulated_stable_interest = MathUtils::calculate_compounded_interest(
            reserve_cache.curr_avg_stable_borrow_rate,
            reserve_cache.stable_debt_last_update_timestamp,
            reserve_cache.reserve_last_update_timestamp,
        );

        vars.prev_total_stable_debt = reserve_cache.curr_principal_stable_debt.ray_mul(
            vars.cumulated_stable_interest,
        );

        vars.total_debt_accrued = vars.curr_total_variable_debt
            + reserve_cache.curr_total_stable_debt
            - vars.prev_total_variable_debt
            - vars.prev_total_stable_debt;

        vars.amount_to_mint = vars.total_debt_accrued.percent_mul(reserve_cache.reserve_factor);

        if vars.amount_to_mint != 0 {
            reserve.accrued_to_treasury += vars.amount_to_mint.ray_div(reserve_cache.next_liquidity_index);
        }
    }

    fn _update_indexes(reserve: &mut data_types::ReserveData, reserve_cache: &data_types::ReserveCache) {
        if reserve_cache.curr_liquidity_rate != 0 {
            let cumulated_liquidity_interest = MathUtils::calculate_linear_interest(
                reserve_cache.curr_liquidity_rate,
                reserve_cache.reserve_last_update_timestamp,
            );
            reserve_cache.next_liquidity_index = cumulated_liquidity_interest.ray_mul(
                reserve_cache.curr_liquidity_index,
            );
            reserve.liquidity_index = reserve_cache.next_liquidity_index;
        }

        if reserve_cache.curr_scaled_variable_debt != 0 {
            let cumulated_variable_borrow_interest = MathUtils::calculate_compounded_interest(
                reserve_cache.curr_variable_borrow_rate,
                reserve_cache.reserve_last_update_timestamp,
            );
            reserve_cache.next_variable_borrow_index = cumulated_variable_borrow_interest.ray_mul(
                reserve_cache.curr_variable_borrow_index,
            );
            reserve.variable_borrow_index = reserve_cache.next_variable_borrow_index;
        }
    }

    pub fn cache(reserve: &data_types::ReserveData) -> data_types::ReserveCache {
        let mut reserve_cache = data_types::ReserveCache {
            reserve_configuration: reserve.configuration.clone(),
            reserve_factor: reserve.configuration.get_reserve_factor(),
            curr_liquidity_index: reserve.liquidity_index,
            next_liquidity_index: reserve.liquidity_index,
            curr_variable_borrow_index: reserve.variable_borrow_index,
            next_variable_borrow_index: reserve.variable_borrow_index,
            curr_liquidity_rate: reserve.current_liquidity_rate,
            curr_variable_borrow_rate: reserve.current_variable_borrow_rate,
            a_token_address: reserve.a_token_address.clone(),
            stable_debt_token_address: reserve.stable_debt_token_address.clone(),
            variable_debt_token_address: reserve.variable_debt_token_address.clone(),
            reserve_last_update_timestamp: reserve.last_update_timestamp,
            curr_scaled_variable_debt: IVariableDebtToken::scaled_total_supply(
                &reserve.variable_debt_token_address,
            ),
            next_scaled_variable_debt: 0,
            curr_principal_stable_debt: 0,
            curr_total_stable_debt: 0,
            curr_avg_stable_borrow_rate: 0,
            stable_debt_last_update_timestamp: 0,
            next_total_stable_debt: 0,
            next_avg_stable_borrow_rate: 0,
        };

        let stable_debt_data = IStableDebtToken::get_supply_data(&reserve_cache.stable_debt_token_address);
        reserve_cache.curr_principal_stable_debt = stable_debt_data.0;
        reserve_cache.curr_total_stable_debt = stable_debt_data.1;
        reserve_cache.curr_avg_stable_borrow_rate = stable_debt_data.2;
        reserve_cache.stable_debt_last_update_timestamp = stable_debt_data.3;
        reserve_cache.next_total_stable_debt = stable_debt_data.1;
        reserve_cache.next_avg_stable_borrow_rate = stable_debt_data.2;

        reserve_cache
    }
}

fn current_timestamp() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

