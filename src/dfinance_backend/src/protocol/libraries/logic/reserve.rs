// use candid::{CandidType, Principal};
// use serde::{Deserialize, Serialize};

// use crate::protocol::libraries::math::math_utils;
// use ic_cdk::api::time;

// use crate::declarations::assets::ReserveCache;
// use crate::declarations::assets::ReserveData;
// use crate::protocol::libraries::math::percentage_maths::percent_mul;
// use crate::protocol::libraries::types::datatypes::CalculateInterestRatesParams;

// fn current_timestamp() -> u64 {
//     time() / 1_000_000_000 // time() returns nanoseconds since the UNIX epoch, we convert it to seconds
// }
    


// pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
//     ReserveCache {
//         reserve_configuration: reserve_data.configuration.clone(),
//         curr_liquidity_index: reserve_data.liquidity_index,
//         next_liquidity_index: reserve_data.liquidity_index,
//         curr_liquidity_rate: reserve_data.current_liquidity_rate,  
//         d_token_canister: reserve_data.d_token_canister.clone(),
//         debt_token_canister: Principal::anonymous(),
//         reserve_last_update_timestamp: reserve_data.last_update_timestamp,
//         curr_principal_stable_debt: 0, //It is the initial principal borrowed when the loan is first issued under a stable rate.
//         curr_total_stable_debt: 0, // total amount of debt that a borrower owes under a stable interest rate. //stable debt is locked in at a fixed rate at the time of borrowing
//         curr_avg_stable_borrow_rate: 0, //If a borrower takes out multiple loans under different stable interest rates, the average stable borrow rate reflects the overall interest rate they are paying across all their stable loans.
//         stable_debt_last_update_timestamp: 0,
//         next_total_stable_debt: 0,
//         next_avg_stable_borrow_rate: 0,
//     }
// }

// pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
//     let current_time = current_timestamp();
//     ic_cdk::println!("Current timestamp: {}", current_time);

//     if reserve_data.last_update_timestamp == current_time {
//         return;
//     }

//     // update_indexes(reserve_data, reserve_cache);
//     // accrue_to_treasury(reserve_data, reserve_cache);

//     reserve_data.last_update_timestamp = current_time;
// }

// // pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
// //     if reserve_cache.curr_liquidity_rate != 0 {
// //         let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
// //             reserve_cache.curr_liquidity_rate,
// //             reserve_cache.reserve_last_update_timestamp,
// //         );
// //         reserve_cache.next_liquidity_index = ray_mul(
// //             cumulated_liquidity_interest,
// //             reserve_cache.curr_liquidity_index,
// //         );
// //         reserve_data.liquidity_index = reserve_cache.next_liquidity_index;
// //     }

//     // if reserve_cache.curr_scaled_variable_debt != 0 {
//     //     let cumulated_variable_borrow_interest = math_utils::calculate_compounded_interest(
//     //         reserve_cache.curr_variable_borrow_rate,
//     //         reserve_cache.reserve_last_update_timestamp,
//     //         current_timestamp(),
//     //     );
//     //     reserve_cache.next_variable_borrow_index = ray_mul(cumulated_variable_borrow_interest, reserve_cache.curr_variable_borrow_index);
//     //     // reserve_data.variable_borrow_index = reserve_cache.next_variable_borrow_index;
//     // }
// // }

// // pub fn accrue_to_treasury(reserve_data: &mut ReserveData, reserve_cache: &ReserveCache) {
// //     let mut vars = AccrueToTreasuryLocalVars::default();

// //     if reserve_cache.reserve_factor == 0 {
// //         return;
// //     }

// //     // vars.prev_total_variable_debt = ray_mul(
// //     //     reserve_cache.curr_scaled_variable_debt,
// //     //     reserve_cache.curr_variable_borrow_index,
// //     // );

// //     // vars.curr_total_variable_debt = ray_mul(
// //     //     reserve_cache.curr_scaled_variable_debt,
// //     //     reserve_cache.next_variable_borrow_index,
// //     // );

// //     vars.cumulated_stable_interest = math_utils::calculate_compounded_interest(
// //         reserve_cache.curr_avg_stable_borrow_rate,
// //         reserve_cache.stable_debt_last_update_timestamp,
// //         reserve_cache.reserve_last_update_timestamp,
// //     );

// //     // vars.prev_total_stable_debt = ray_mul(
// //     //     reserve_cache.curr_principal_stable_debt,
// //     //     vars.cumulated_stable_interest,
// //     // );

// //     vars.total_debt_accrued = vars.curr_total_variable_debt + reserve_cache.curr_total_stable_debt
// //         - vars.prev_total_variable_debt
// //         - vars.prev_total_stable_debt;

// //     vars.amount_to_mint = percent_mul(vars.total_debt_accrued, reserve_cache.reserve_factor);

// //     // if vars.amount_to_mint != 0 {
// //     //     reserve_data.accrued_to_treasury +=
// //     //         ray_div(vars.amount_to_mint, reserve_cache.next_liquidity_index) as u128;
// //     // }
// // }

// pub async fn update_interest_rates(
//     reserve_data: &mut ReserveData,
//     reserve_cache: &ReserveCache,
//     reserve_address: String,
//     liquidity_added: u128,
//     liquidity_taken: u128,
// ) {
//     let mut vars = UpdateInterestRatesLocalVars::default();

//     // vars.total_variable_debt = reserve_cache.next_scaled_variable_debt * reserve_cache.next_variable_borrow_index / 1e27 as u128;

//     let params = CalculateInterestRatesParams {
//         liquidity_added,
//         liquidity_taken,
//         total_stable_debt: reserve_cache.next_total_stable_debt,
//         total_variable_debt: vars.total_variable_debt,
//         average_stable_borrow_rate: reserve_cache.next_avg_stable_borrow_rate,
//         // reserve_factor: reserve_cache.reserve_factor,
//         reserve: reserve_address.clone(),
//         d_token: reserve_cache.d_token_canister.clone(),
//     };

//     let (next_liquidity_rate, next_stable_rate, next_variable_rate) =
//         calculate_interest_rates(params).await;

//     reserve_data.current_liquidity_rate = next_liquidity_rate;

//     emit_reserve_data_updated(
//         reserve_address,
//         next_liquidity_rate,
//         next_stable_rate,
//         next_variable_rate,
//         reserve_cache.next_liquidity_index,
//         // reserve_cache.next_variable_borrow_index,
//     )
//     .await;
// }

// async fn calculate_interest_rates(params: CalculateInterestRatesParams) -> (u128, u128, u128) {
//     // Call the interest rate strategy canister to get the rates
//     // For now, just return some dummy values
//     (1, 1, 1)
// }
// // fn calculate_liquidity_rate(total_supply: u64, total_borrowed: u64) -> f64 {
// //     let utilization_rate = if total_supply == 0 {
// //         0.0
// //     } else {
// //         total_borrowed as f64 / total_supply as f64
// //     };

// //     let base_rate = 0.02; // 2% base rate
// //     let interest_rate_model = |utilization: f64| -> f64 {
// //         base_rate + utilization * 0.1 // Linear model: 10% slope
// //     };

// //     interest_rate_model(utilization_rate)
// // }


// async fn emit_reserve_data_updated(
    
//     reserve_address: String,
//     next_liquidity_rate: u128,
//     next_stable_rate: u128,
//     next_variable_rate: u128,
//     next_liquidity_index: u128,
//     // next_variable_borrow_index: u128,
// ) {
//     // Implement the logging or state update logic
//     // For now, just a simple print statement
//     println!(
//         "ReserveDataUpdated: {:?}, {}, {}, {}, {}",
//         reserve_address,
//         next_liquidity_rate,
//         next_stable_rate,
//         next_variable_rate,
//         next_liquidity_index,
//         // next_variable_borrow_index
//     );
// }

// struct AccrueToTreasuryLocalVars {
//     prev_total_variable_debt: u128,
//     curr_total_variable_debt: u128,
//     cumulated_stable_interest: u128,
//     prev_total_stable_debt: u128,
//     total_debt_accrued: u128,
//     amount_to_mint: u128,
// }

// impl Default for AccrueToTreasuryLocalVars {
//     fn default() -> Self {
//         AccrueToTreasuryLocalVars {
//             prev_total_variable_debt: 0,
//             curr_total_variable_debt: 0,
//             cumulated_stable_interest: 0,
//             prev_total_stable_debt: 0,
//             total_debt_accrued: 0,
//             amount_to_mint: 0,
//         }
//     }
// }

// #[derive(Default, Debug, CandidType, Deserialize, Serialize)]
// struct UpdateInterestRatesLocalVars {
//     next_liquidity_rate: u128,
//     next_stable_rate: u128,
//     next_variable_rate: u128,
//     total_variable_debt: u128,
// }

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};


use crate::protocol::libraries::math::math_utils;
use ic_cdk::api::time;

use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;
use crate::protocol::libraries::math::percentage_maths::percent_mul;
use crate::protocol::libraries::types::datatypes::CalculateInterestRatesParams;
use crate::protocol::libraries::logic::interest_rate::{calculate_interest_rates, initialize_interest_rate_params};
use crate::protocol::libraries::math::math_utils::ScalingMath;



fn current_timestamp() -> u64 {
    time() / 1_000_000_000 // time() returns nanoseconds since the UNIX epoch, we convert it to seconds
}
    


pub fn cache(reserve_data: &ReserveData) -> ReserveCache {
    ReserveCache {
        reserve_configuration: reserve_data.configuration.clone(),
        d_token_canister: reserve_data.d_token_canister.clone(),
        debt_token_canister: reserve_data.debt_token_canister.clone(),
        reserve_last_update_timestamp: reserve_data.last_update_timestamp,

        curr_liquidity_index: reserve_data.liquidity_index,
        next_liquidity_index: reserve_data.liquidity_index,
        curr_liquidity_rate: reserve_data.current_liquidity_rate,

         curr_debt_index: reserve_data.debt_index,
         curr_debt_rate: reserve_data.borrow_rate.clone(),
         next_debt_rate: 0.0,
         next_debt_index: 0.0,
         debt_last_update_timestamp: 0,

    }
}

pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);
    // accrue_to_treasury(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != 0.0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate,
            reserve_cache.reserve_last_update_timestamp,
        );
        let interest= cumulated_liquidity_interest.scaled_to_float();
        reserve_cache.next_liquidity_index = 
            interest * reserve_cache.curr_liquidity_index;
        
        reserve_data.liquidity_index = reserve_cache.next_liquidity_index;
    }

    if reserve_cache.curr_debt_index != 0.0 {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate,
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        let interest = cumulated_borrow_interest.scaled_to_float();
        ic_cdk::println!("interest on debt {:?}", interest);
        reserve_cache.next_debt_index = interest * reserve_cache.curr_debt_index;
        reserve_data.debt_index = reserve_cache.next_debt_index;
    }
}



pub async fn update_interest_rates(
        reserve_data: &mut ReserveData,
        reserve_cache: &mut ReserveCache,
        liquidity_added: f64,
        liquidity_taken: f64,
    ){
        let total_debt = (reserve_data.total_borrowed +liquidity_taken ) * reserve_cache.curr_debt_index as f64;
        let total_supply= (reserve_data.total_supply + liquidity_added) * reserve_cache.curr_liquidity_index as f64;
        let total_borrowed= reserve_data.total_borrowed +liquidity_taken;
        let interest_rate_params = initialize_interest_rate_params();

        let (next_liquidity_rate, next_debt_rate) =
        calculate_interest_rates(
            total_supply as f64,                        // f64
            total_borrowed as f64,                      // f64
            total_debt as f64,            // f64        
            reserve_cache.curr_debt_rate as f64,   // f64
            &interest_rate_params,               // InterestRateParams struct
           
        );
        reserve_data.total_borrowed= total_borrowed;
        reserve_data.total_supply= total_supply;
        reserve_data.current_liquidity_rate = next_liquidity_rate;
        reserve_data.borrow_rate = next_debt_rate;


    }
