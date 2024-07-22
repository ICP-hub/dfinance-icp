use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};
// use ic_cdk_macros::{query, update};
// use std::time::{SystemTime, UNIX_EPOCH};
use ic_cdk::api::time;
use crate::protocol::libraries::math::math_utils;
// use crate::protocol::libraries::math::math_utils::mathUtils;
use crate::protocol::libraries::math::wath_ray_math::wad_ray_math::{ray_mul, ray_div};
use crate::protocol::libraries::math::percentage_maths::percent_mul;
// use crate::protocol::libraries::types::datatypes;
use crate::declarations::assets::ReserveData;
use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;
use crate::protocol::libraries::logic::interface::ivariable_debt_token::VariableDebtToken;
// Assume the necessary traits and modules are imported as needed
//cache, update_state, update_interest_rates
fn current_timestamp() -> u64 {
    time() / 1_000_000_000 // time() returns nanoseconds since the UNIX epoch, we convert it to seconds
}
pub mod reserve_logic {
    use super::*;
    
    #[derive(CandidType, Deserialize, Clone, Debug)]
    pub struct ReserveCache {
        pub reserve_configuration: ReserveConfiguration,
        pub reserve_factor: u16,
        pub curr_liquidity_index: u128,
        pub next_liquidity_index: u128,
        pub curr_variable_borrow_index: u128,
        pub next_variable_borrow_index: u128,
        pub curr_liquidity_rate: u128,
        pub curr_variable_borrow_rate: u128,
        pub a_token_address: String,
        pub stable_debt_token_address: String,
        pub variable_debt_token_address: String,
        pub reserve_last_update_timestamp: u64,
        pub curr_scaled_variable_debt: u128,
        pub next_scaled_variable_debt: Nat,
        pub curr_principal_stable_debt: Nat,
        pub curr_total_stable_debt: Nat,
        pub curr_avg_stable_borrow_rate: Nat,
        pub stable_debt_last_update_timestamp: u64,
        pub next_total_stable_debt: Nat,
        pub next_avg_stable_borrow_rate: Nat,
    }

    struct AccrueToTreasuryLocalVars {
        prev_total_variable_debt: u128,
        curr_total_variable_debt: u128,
        cumulated_stable_interest: u128,
        prev_total_stable_debt: u128,
        total_debt_accrued: u128,
        amount_to_mint: u128,
    }
    
    impl Default for AccrueToTreasuryLocalVars {
        fn default() -> Self {
            AccrueToTreasuryLocalVars {
                prev_total_variable_debt: 0,
                curr_total_variable_debt: 0,
                cumulated_stable_interest: 0,
                prev_total_stable_debt: 0,
                total_debt_accrued: 0,
                amount_to_mint: 0,
            }
        }
    }

    pub trait ReserveLogic {
        fn cache(&self) -> ReserveCache;
        fn update_state(&mut self, reserve_cache: &mut ReserveCache);
        fn update_indexes(&mut self, reserve_cache: &mut ReserveCache);
        fn accrue_to_treasury(&mut self, reserve_cache: &ReserveCache);
    
    }

    impl ReserveLogic for ReserveData {
        fn cache(&self) -> ReserveCache {
            // let debt_token_canister_id = env::var("CANISTER_ID_ATOKEN")
            // .expect("CANISTER_ID_ATOKEN environment variable not set");

            let mut reserve_cache = ReserveCache {
                reserve_configuration: self.configuration.clone(),
                reserve_factor: self.configuration.get_reserve_factor(),
                curr_liquidity_index: self.liquidity_index.clone(),
                next_liquidity_index: self.liquidity_index.clone(),
                curr_variable_borrow_index: self.variable_borrow_index.clone(),
                next_variable_borrow_index: self.variable_borrow_index.clone(),
                curr_liquidity_rate: self.current_liquidity_rate.clone(),
                curr_variable_borrow_rate: self.current_variable_borrow_rate.clone(),
                a_token_address: self.a_token_address.clone(),
                stable_debt_token_address: self.stable_debt_token_address.clone(),
                variable_debt_token_address: self.variable_debt_token_address.clone(),
                reserve_last_update_timestamp: self.last_update_timestamp,
                curr_scaled_variable_debt: VariableDebtToken::scaled_total_supply(self.variable_debt_token_address),
                next_scaled_variable_debt: VariableDebtToken::scaled_total_supply(self.variable_debt_token_address),
                curr_principal_stable_debt: Nat::from(0),
                curr_total_stable_debt: Nat::from(0),
                curr_avg_stable_borrow_rate: Nat::from(0),
                stable_debt_last_update_timestamp: 0,
                next_total_stable_debt: Nat::from(0),
                next_avg_stable_borrow_rate: Nat::from(0),
            };

            let (principal_stable_debt, total_stable_debt, avg_stable_borrow_rate, stable_debt_last_update_timestamp) = IStableDebtToken::get_supply_data(self.stable_debt_token_address);
            reserve_cache.curr_principal_stable_debt = principal_stable_debt;
            reserve_cache.curr_total_stable_debt = total_stable_debt;
            reserve_cache.curr_avg_stable_borrow_rate = avg_stable_borrow_rate;
            reserve_cache.stable_debt_last_update_timestamp = stable_debt_last_update_timestamp;
            reserve_cache.next_total_stable_debt = total_stable_debt.clone();
            reserve_cache.next_avg_stable_borrow_rate = avg_stable_borrow_rate.clone();

            reserve_cache
        }

        fn update_state(&mut self, reserve_cache: &mut ReserveCache) {
            // If time didn't pass since last stored timestamp, skip state update
            if self.last_update_timestamp == current_timestamp() {
                return;
            }

            self.update_indexes(reserve_cache);
            self.accrue_to_treasury(reserve_cache);

            // Update the last update timestamp
            self.last_update_timestamp = current_timestamp();
    }

    fn update_indexes(&mut self, reserve_cache: &mut ReserveCache) {
        // Only cumulate on the supply side if there is any income being produced
        if reserve_cache.curr_liquidity_rate != 0 {
            let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
                reserve_cache.curr_liquidity_rate,
                reserve_cache.reserve_last_update_timestamp,
            );
            reserve_cache.next_liquidity_index = ray_mul(cumulated_liquidity_interest, reserve_cache.curr_liquidity_index);
            self.liquidity_index = reserve_cache.next_liquidity_index.clone();
        }

        // Variable borrow index only gets updated if there is any variable debt
        if reserve_cache.curr_scaled_variable_debt != 0 {
            let cumulated_variable_borrow_interest = math_utils::calculate_compounded_interest(
                reserve_cache.curr_variable_borrow_rate,
                reserve_cache.reserve_last_update_timestamp,
                current_timestamp(),
            );
            reserve_cache.next_variable_borrow_index = ray_mul(cumulated_variable_borrow_interest, reserve_cache.curr_variable_borrow_index);
            self.variable_borrow_index = reserve_cache.next_variable_borrow_index.clone();
        }
    }

    
    
    
    fn accrue_to_treasury(reserve: &mut ReserveData, reserve_cache: &ReserveCache) {
        let mut vars = AccrueToTreasuryLocalVars::default();
    
        if reserve_cache.reserve_factor == 0 {
            return;
        }
    
        // calculate the total variable debt at moment of the last interaction
        vars.prev_total_variable_debt = ray_mul(
            reserve_cache.curr_scaled_variable_debt,
            reserve_cache.curr_variable_borrow_index,
        );
    
        // calculate the new total variable debt after accumulation of the interest on the index
        vars.curr_total_variable_debt = ray_mul(
            reserve_cache.curr_scaled_variable_debt,
            reserve_cache.next_variable_borrow_index,
        );
    
        // calculate the stable debt until the last timestamp update
        vars.cumulated_stable_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_avg_stable_borrow_rate,
            reserve_cache.stable_debt_last_update_timestamp,
            reserve_cache.reserve_last_update_timestamp,
        );
    
        vars.prev_total_stable_debt = ray_mul(
            reserve_cache.curr_principal_stable_debt,
            vars.cumulated_stable_interest,
        );
    
        // debt accrued is the sum of the current debt minus the sum of the debt at the last update
        vars.total_debt_accrued = vars.curr_total_variable_debt
            + reserve_cache.curr_total_stable_debt
            - vars.prev_total_variable_debt
            - vars.prev_total_stable_debt;
    
        vars.amount_to_mint = percent_mul(vars.total_debt_accrued, reserve_cache.reserve_factor);
    
        if vars.amount_to_mint != 0 {
            reserve.accrued_to_treasury += ray_div(vars.amount_to_mint, reserve_cache.next_liquidity_index) as u128;
        }
    }
    }

    


    
}



//temp
pub trait IStableDebtToken {
    fn get_supply_data(token_address: Principal) -> (Nat, Nat, Nat, u64) {
        // Implement the logic to get supply data from the token address
        (Nat::from(0), Nat::from(0), Nat::from(0), 0)
    }
}



