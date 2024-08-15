use candid::{variant, CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

use ic_cdk::api::time;
use crate::protocol::libraries::math::math_utils;

use crate::protocol::libraries::math::wath_ray_math::wad_ray_math::{ray_mul, ray_div};
use crate::protocol::libraries::math::percentage_maths::percent_mul;
use crate::protocol::libraries::types::datatypes::CalculateInterestRatesParams;
use crate::declarations::assets::ReserveData;
use crate::declarations::assets::ReserveCache;
use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;
// use crate::protocol::libraries::logic::interface::ivariable_debt_token::VariableDebtToken;

fn current_timestamp() -> u64 {
    time() / 1_000_000_000 // time() returns nanoseconds since the UNIX epoch, we convert it to seconds
}
// type Result = variant {Ok : Nat; Err : String};

    
//     // #[derive(CandidType, Deserialize, Clone, Debug)]
//     // pub struct ReserveCache {
//     //     pub reserve_configuration: ReserveConfiguration,
//     //     pub reserve_factor: u128,
//     //     pub curr_liquidity_index: u128,
//     //     pub next_liquidity_index: u128,
//     //     pub curr_variable_borrow_index: u128,
//     //     pub next_variable_borrow_index: u128,
//     //     pub curr_liquidity_rate: u128,
//     //     pub curr_variable_borrow_rate: u128,
//     //     pub a_token_address: Principal,
//     //     pub stable_debt_token_address: Principal,
//     //     pub variable_debt_token_address: Principal,
//     //     pub reserve_last_update_timestamp: u64,
//     //     pub curr_scaled_variable_debt: u128,
//     //     pub next_scaled_variable_debt: u128,
//     //     pub curr_principal_stable_debt: u128,
//     //     pub curr_total_stable_debt: u128,
//     //     pub curr_avg_stable_borrow_rate: u128,
//     //     pub stable_debt_last_update_timestamp: u64,
//     //     pub next_total_stable_debt: u128,
//     //     pub next_avg_stable_borrow_rate: u128,
//     // }

//     struct AccrueToTreasuryLocalVars {
//         prev_total_variable_debt: u128,
//         curr_total_variable_debt: u128,
//         cumulated_stable_interest: u128,
//         prev_total_stable_debt: u128,
//         total_debt_accrued: u128,
//         amount_to_mint: u128,
//     }
    
//     impl Default for AccrueToTreasuryLocalVars {
//         fn default() -> Self {
//             AccrueToTreasuryLocalVars {
//                 prev_total_variable_debt: 0,
//                 curr_total_variable_debt: 0,
//                 cumulated_stable_interest: 0,
//                 prev_total_stable_debt: 0,
//                 total_debt_accrued: 0,
//                 amount_to_mint: 0,
//             }
//         }
//     }

//     #[derive(Default, Debug, CandidType, Deserialize, Serialize)]
//     struct UpdateInterestRatesLocalVars {
//         next_liquidity_rate: u128,
//         next_stable_rate: u128,
//         next_variable_rate: u128,
//         total_variable_debt: u128,
//     }

//     pub trait ReserveLogic {
//         fn cache(&self) -> ReserveCache;
//         fn update_state(&mut self, reserve_cache: &mut ReserveCache);
//         fn update_indexes(&mut self, reserve_cache: &mut ReserveCache);
//         fn accrue_to_treasury(&mut self, reserve_cache: &ReserveCache);
//         async fn update_interest_rates(
//             &mut self,
//             reserve_cache: &ReserveCache,
//             reserve_address: Principal,
//             liquidity_added: u128,
//             liquidity_taken: u128,
//             // strategy: &dyn IReserveInterestRateStrategy,
//         );
    
//     }

//     impl ReserveLogic for ReserveData {
//         fn cache(&self) -> ReserveCache {
//             // let debt_token_canister_id = env::var("CANISTER_ID_ATOKEN")
//             // .expect("CANISTER_ID_ATOKEN environment variable not set");
//             let variable_debt_token_address = &self.variable_debt_token_address;
//         //     let curr_scaled_variable_debt = block_on(VariableDebtToken::scaled_total_supply(variable_debt_token_address.clone()))
//         //     .expect("Failed to get current scaled variable debt");
//         // let next_scaled_variable_debt = curr_scaled_variable_debt;

//             let mut reserve_cache = ReserveCache {
//                 reserve_configuration: self.configuration.clone(),
//                 reserve_factor: self.configuration.get_reserve_factor(),
//                 curr_liquidity_index: self.liquidity_index.clone(),
//                 next_liquidity_index: self.liquidity_index.clone(),
//                 curr_variable_borrow_index: self.variable_borrow_index.clone(),
//                 next_variable_borrow_index: self.variable_borrow_index.clone(),
//                 curr_liquidity_rate: self.current_liquidity_rate.clone(),
//                 curr_variable_borrow_rate: self.current_variable_borrow_rate.clone(),
//                 a_token_address: self.a_token_address.clone(),
//                 stable_debt_token_address: self.stable_debt_token_address.clone(),
//                 variable_debt_token_address: self.variable_debt_token_address.clone(),
//                 reserve_last_update_timestamp: self.last_update_timestamp,
//                 // curr_scaled_variable_debt: VariableDebtToken::scaled_total_supply(self.variable_debt_token_address),
//                 // next_scaled_variable_debt: VariableDebtToken::scaled_total_supply(self.variable_debt_token_address),
//                 curr_scaled_variable_debt: 0,
//                 next_scaled_variable_debt: 0,
//                 curr_principal_stable_debt: 0,
//                 curr_total_stable_debt: 0,
//                 curr_avg_stable_borrow_rate: 0,
//                 stable_debt_last_update_timestamp: 0,
//                 next_total_stable_debt: 0,
//                 next_avg_stable_borrow_rate: 0,
//             };
//             let (principal_stable_debt, total_stable_debt, avg_stable_borrow_rate, stable_debt_last_update_timestamp) = <StableDebtTokenImpl as IStableDebtToken>::get_supply_data(self.stable_debt_token_address);

//             // let (principal_stable_debt, total_stable_debt, avg_stable_borrow_rate, stable_debt_last_update_timestamp) = IStableDebtToken::get_supply_data(self.stable_debt_token_address);
//             reserve_cache.curr_principal_stable_debt = principal_stable_debt;
//             reserve_cache.curr_total_stable_debt = total_stable_debt;
//             reserve_cache.curr_avg_stable_borrow_rate = avg_stable_borrow_rate;
//             reserve_cache.stable_debt_last_update_timestamp = stable_debt_last_update_timestamp;
//             reserve_cache.next_total_stable_debt = total_stable_debt.clone();
//             reserve_cache.next_avg_stable_borrow_rate = avg_stable_borrow_rate.clone();

//             reserve_cache
//         }

//         fn update_state(&mut self, reserve_cache: &mut ReserveCache) {
//             // If time didn't pass since last stored timestamp, skip state update
//             if self.last_update_timestamp == current_timestamp() {
//                 return;
//             }

//             self.update_indexes(reserve_cache);
//             self.accrue_to_treasury(reserve_cache);

//             // Update the last update timestamp
//             self.last_update_timestamp = current_timestamp();
//     }

//     fn update_indexes(&mut self, reserve_cache: &mut ReserveCache) {
//         // Only cumulate on the supply side if there is any income being produced
//         if reserve_cache.curr_liquidity_rate != 0 {
//             let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
//                 reserve_cache.curr_liquidity_rate,
//                 reserve_cache.reserve_last_update_timestamp,
//             );
//             reserve_cache.next_liquidity_index = ray_mul(cumulated_liquidity_interest, reserve_cache.curr_liquidity_index);
//             self.liquidity_index = reserve_cache.next_liquidity_index.clone();
//         }

//         // Variable borrow index only gets updated if there is any variable debt
//         if reserve_cache.curr_scaled_variable_debt != 0 {
//             let cumulated_variable_borrow_interest = math_utils::calculate_compounded_interest(
//                 reserve_cache.curr_variable_borrow_rate,
//                 reserve_cache.reserve_last_update_timestamp,
//                 current_timestamp(),
//             );
//             reserve_cache.next_variable_borrow_index = ray_mul(cumulated_variable_borrow_interest, reserve_cache.curr_variable_borrow_index);
//             self.variable_borrow_index = reserve_cache.next_variable_borrow_index.clone();
//         }
//     }

    
    
    
//     fn accrue_to_treasury(&mut self, reserve_cache: &ReserveCache) {
//         let mut vars = AccrueToTreasuryLocalVars::default();
    
//         if reserve_cache.reserve_factor == 0 {
//             return;
//         }
    
//         // calculate the total variable debt at moment of the last interaction
//         vars.prev_total_variable_debt = ray_mul(
//             reserve_cache.curr_scaled_variable_debt,
//             reserve_cache.curr_variable_borrow_index,
//         );
    
//         // calculate the new total variable debt after accumulation of the interest on the index
//         vars.curr_total_variable_debt = ray_mul(
//             reserve_cache.curr_scaled_variable_debt,
//             reserve_cache.next_variable_borrow_index,
//         );
    
//         // calculate the stable debt until the last timestamp update
//         vars.cumulated_stable_interest = math_utils::calculate_compounded_interest(
//             reserve_cache.curr_avg_stable_borrow_rate,
//             reserve_cache.stable_debt_last_update_timestamp,
//             reserve_cache.reserve_last_update_timestamp,
//         );
    
//         vars.prev_total_stable_debt = ray_mul(
//             reserve_cache.curr_principal_stable_debt,
//             vars.cumulated_stable_interest,
//         );
    
//         // debt accrued is the sum of the current debt minus the sum of the debt at the last update
//         vars.total_debt_accrued = vars.curr_total_variable_debt
//             + reserve_cache.curr_total_stable_debt
//             - vars.prev_total_variable_debt
//             - vars.prev_total_stable_debt;
    
//         vars.amount_to_mint = percent_mul(vars.total_debt_accrued, reserve_cache.reserve_factor);
    
//         if vars.amount_to_mint != 0 {
//             self.accrued_to_treasury += ray_div(vars.amount_to_mint, reserve_cache.next_liquidity_index) as u128;
//         }
//     }

    
    

//     // fn update_interest_rates(
//     //     &mut self,
//     //     reserve_cache: &ReserveCache,
//     //     reserve_address: Principal,
//     //     liquidity_added: u128,
//     //     liquidity_taken: u128,
//     //     strategy: &dyn IReserveInterestRateStrategy,
//     // ) {
//     //     let mut vars = UpdateInterestRatesLocalVars::default();

//     //     vars.total_variable_debt = reserve_cache.next_scaled_variable_debt
//     //         * reserve_cache.next_variable_borrow_index / 1e27 as u128;

//         // let (next_liquidity_rate, next_stable_rate, next_variable_rate) =
//         //     strategy.calculate_interest_rates(CalculateInterestRatesParams {
//         //         unbacked: self.unbacked,
//         //         liquidity_added,
//         //         liquidity_taken,
//         //         total_stable_debt: reserve_cache.next_total_stable_debt,
//         //         total_variable_debt: vars.total_variable_debt,
//         //         average_stable_borrow_rate: reserve_cache.next_avg_stable_borrow_rate,
//         //         reserve_factor: reserve_cache.reserve_factor,
//         //         reserve: reserve_address,
//         //         a_token: reserve_cache.a_token_address,
//         //     });

//     //     vars.next_liquidity_rate = next_liquidity_rate;
//     //     vars.next_stable_rate = next_stable_rate;
//     //     vars.next_variable_rate = next_variable_rate;

//     //     self.current_liquidity_rate = vars.next_liquidity_rate;
//     //     self.current_stable_borrow_rate = vars.next_stable_rate;
//     //     self.current_variable_borrow_rate = vars.next_variable_rate;

//     //     // Emit ReserveDataUpdated event (not available in Rust)
//     //     println!(
//     //         "ReserveDataUpdated: {}, {}, {}, {}, {}, {}",
//     //         reserve_address.to_text(),
//     //         vars.next_liquidity_rate,
//     //         vars.next_stable_rate,
//     //         vars.next_variable_rate,
//     //         reserve_cache.next_liquidity_index,
//     //         reserve_cache.next_variable_borrow_index
//     //     );
//     // }
//     async fn update_interest_rates(
//         &mut self,
//         reserve_cache: &ReserveCache,
//         reserve_address: Principal,
//         liquidity_added: u128,
//         liquidity_taken: u128,
//     ) {
//         let mut vars = UpdateInterestRatesLocalVars::default();
    
//         vars.total_variable_debt = reserve_cache.next_scaled_variable_debt * reserve_cache.next_variable_borrow_index / 1e27 as u128;
    
//         let params = CalculateInterestRatesParams {
//             unbacked: self.unbacked,
//             liquidity_added,
//             liquidity_taken,
//             total_stable_debt: reserve_cache.next_total_stable_debt,
//             total_variable_debt: vars.total_variable_debt,
//             average_stable_borrow_rate: reserve_cache.next_avg_stable_borrow_rate,
//             reserve_factor: reserve_cache.reserve_factor,
//             reserve: reserve_address,
//             a_token: reserve_cache.a_token_address,
//         };
    
//         let (next_liquidity_rate, next_stable_rate, next_variable_rate) = calculate_interest_rates(params).await;
    
//         self.current_liquidity_rate = next_liquidity_rate;
//         self.current_stable_borrow_rate = next_stable_rate;
//         self.current_variable_borrow_rate = next_variable_rate;
    
//         // Emit ReserveDataUpdated event equivalent
//         emit_reserve_data_updated(
//             reserve_address,
//             next_liquidity_rate,
//             next_stable_rate,
//             next_variable_rate,
//             reserve_cache.next_liquidity_index,
//             reserve_cache.next_variable_borrow_index,
//         ).await;
//     }
    
   
//     }

    

    
    
//     async fn emit_reserve_data_updated(
//         reserve_address: Principal,
//         next_liquidity_rate: u128,
//         next_stable_rate: u128,
//         next_variable_rate: u128,
//         next_liquidity_index: u128,
//         next_variable_borrow_index: u128,
//     ) {
//         // Implement the logging or state update logic
//         // For now, just a simple print statement
//         println!(
//             "ReserveDataUpdated: {:?}, {}, {}, {}, {}, {}",
//             reserve_address, next_liquidity_rate, next_stable_rate, next_variable_rate, next_liquidity_index, next_variable_borrow_index
//         );
//     }


// pub trait IStableDebtToken {
//     fn get_supply_data(token_address: Principal) -> (u128, u128, u128, u64);
// }

// pub struct StableDebtTokenImpl;
// impl IStableDebtToken for StableDebtTokenImpl {
//     fn get_supply_data(token_address: Principal) -> (u128, u128, u128, u64) {
//         // Implement the logic to get supply data from the token address
//         (0, 0, 0, 0)
//     }
// }
// //temp
// // pub trait IStableDebtToken {
// //     fn get_supply_data(token_address: Principal) -> (u128, u128, u128, u64) {
// //         // Implement the logic to get supply data from the token address
// //         (0, 0, 0, 0)
// //     }
// // }

// trait IReserveInterestRateStrategy {
//     fn calculate_interest_rates(&self, params: CalculateInterestRatesParams) -> (u128, u128, u128);
// }



// // src/reserve.rs
// use candid::Principal;
// use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;
// use crate::declarations::assets::{ReserveData, ReserveCache};
// use crate::protocol::libraries::types::datatypes::CalculateInterestRatesParams;
// use crate::protocol::libraries::math::math_utils;
// use crate::protocol::libraries::math::wath_ray_math::wad_ray_math::{ray_mul, ray_div};
// use crate::protocol::libraries::math::percentage_maths::percent_mul;

pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
        reserve_factor: reserve_data.configuration.get_reserve_factor(),
        curr_liquidity_index: reserve_data.liquidity_index,
        next_liquidity_index: reserve_data.liquidity_index,
        curr_variable_borrow_index: reserve_data.variable_borrow_index,
        next_variable_borrow_index: reserve_data.variable_borrow_index,
        curr_liquidity_rate: reserve_data.current_liquidity_rate,
        curr_variable_borrow_rate: reserve_data.current_variable_borrow_rate,
        a_token_address: reserve_data.a_token_address,
        stable_debt_token_address: reserve_data.stable_debt_token_address,
        variable_debt_token_address: reserve_data.variable_debt_token_address,
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,
        curr_scaled_variable_debt: 0,
        next_scaled_variable_debt: 0,
        curr_principal_stable_debt: 0,
        curr_total_stable_debt: 0,
        curr_avg_stable_borrow_rate: 0,
        stable_debt_last_update_timestamp: 0,
        next_total_stable_debt: 0,
        next_avg_stable_borrow_rate: 0,
    }
}

pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);
    accrue_to_treasury(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != 0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate,
            reserve_cache.reserve_last_update_timestamp,
        );
        reserve_cache.next_liquidity_index = ray_mul(cumulated_liquidity_interest, reserve_cache.curr_liquidity_index);
        reserve_data.liquidity_index = reserve_cache.next_liquidity_index;
    }

    if reserve_cache.curr_scaled_variable_debt != 0 {
        let cumulated_variable_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_variable_borrow_rate,
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        reserve_cache.next_variable_borrow_index = ray_mul(cumulated_variable_borrow_interest, reserve_cache.curr_variable_borrow_index);
        reserve_data.variable_borrow_index = reserve_cache.next_variable_borrow_index;
    }
}

pub fn accrue_to_treasury(reserve_data: &mut ReserveData, reserve_cache: &ReserveCache) {
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == 0 {
        return;
    }

    vars.prev_total_variable_debt = ray_mul(
        reserve_cache.curr_scaled_variable_debt,
        reserve_cache.curr_variable_borrow_index,
    );

    vars.curr_total_variable_debt = ray_mul(
        reserve_cache.curr_scaled_variable_debt,
        reserve_cache.next_variable_borrow_index,
    );

    vars.cumulated_stable_interest = math_utils::calculate_compounded_interest(
        reserve_cache.curr_avg_stable_borrow_rate,
        reserve_cache.stable_debt_last_update_timestamp,
        reserve_cache.reserve_last_update_timestamp,
    );

    vars.prev_total_stable_debt = ray_mul(
        reserve_cache.curr_principal_stable_debt,
        vars.cumulated_stable_interest,
    );

    vars.total_debt_accrued = vars.curr_total_variable_debt
        + reserve_cache.curr_total_stable_debt
        - vars.prev_total_variable_debt
        - vars.prev_total_stable_debt;

    vars.amount_to_mint = percent_mul(vars.total_debt_accrued, reserve_cache.reserve_factor);

    if vars.amount_to_mint != 0 {
        reserve_data.accrued_to_treasury += ray_div(vars.amount_to_mint, reserve_cache.next_liquidity_index) as u128;
    }
}

pub async fn update_interest_rates(
    reserve_data: &mut ReserveData,
    reserve_cache: &ReserveCache,
    // reserve_address: Principal,
    reserve_address: String,
    liquidity_added: u128,
    liquidity_taken: u128,
) {
    let mut vars = UpdateInterestRatesLocalVars::default();

    vars.total_variable_debt = reserve_cache.next_scaled_variable_debt * reserve_cache.next_variable_borrow_index / 1e27 as u128;

    let params = CalculateInterestRatesParams {
        unbacked: reserve_data.unbacked,
        liquidity_added,
        liquidity_taken,
        total_stable_debt: reserve_cache.next_total_stable_debt,
        total_variable_debt: vars.total_variable_debt,
        average_stable_borrow_rate: reserve_cache.next_avg_stable_borrow_rate,
        reserve_factor: reserve_cache.reserve_factor,
        reserve: reserve_address.clone(),
        a_token: reserve_cache.a_token_address,
    };

    let (next_liquidity_rate, next_stable_rate, next_variable_rate) = calculate_interest_rates(params).await;

    reserve_data.current_liquidity_rate = next_liquidity_rate;
    reserve_data.current_stable_borrow_rate = next_stable_rate;
    reserve_data.current_variable_borrow_rate = next_variable_rate;

    emit_reserve_data_updated(
        reserve_address,
        next_liquidity_rate,
        next_stable_rate,
        next_variable_rate,
        reserve_cache.next_liquidity_index,
        reserve_cache.next_variable_borrow_index,
    ).await;
}

async fn calculate_interest_rates(params: CalculateInterestRatesParams) -> (u128, u128, u128) {
    // Call the interest rate strategy canister to get the rates
    // For now, just return some dummy values
    (1, 1, 1)
}

async fn emit_reserve_data_updated(
    // reserve_address: Principal,
    reserve_address: String,
    next_liquidity_rate: u128,
    next_stable_rate: u128,
    next_variable_rate: u128,
    next_liquidity_index: u128,
    next_variable_borrow_index: u128,
) {
    // Implement the logging or state update logic
    // For now, just a simple print statement
    println!(
        "ReserveDataUpdated: {:?}, {}, {}, {}, {}, {}",
        reserve_address, next_liquidity_rate, next_stable_rate, next_variable_rate, next_liquidity_index, next_variable_borrow_index
    );
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

#[derive(Default, Debug, CandidType, Deserialize, Serialize)]
struct UpdateInterestRatesLocalVars {
    next_liquidity_rate: u128,
    next_stable_rate: u128,
    next_variable_rate: u128,
    total_variable_debt: u128,
}



