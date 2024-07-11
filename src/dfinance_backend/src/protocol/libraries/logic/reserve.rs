use crate::protocol::libraries::types::datatypes::ReserveData;

pub struct ReserveLogic;

impl ReserveLogic {
    pub fn update_state(
        reserve: &mut ReserveData,
        reserve_cache: ReserveCache,
    ) {
        if reserve.last_update_timestamp == current_timestamp() {
            return;
        }

        Self::_update_indexes(reserve, &reserve_cache);
        Self::_accrue_to_treasury(reserve, reserve_cache);

        reserve.last_update_timestamp = current_timestamp();
    }

    pub fn update_interest_rates(
        reserve: &mut ReserveData,
        reserve_cache: &mut ReserveCache,
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

        vars.total_variable_debt = reserve_cache
            .next_scaled_variable_debt
            .ray_mul(reserve_cache.next_variable_borrow_index);

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
}
