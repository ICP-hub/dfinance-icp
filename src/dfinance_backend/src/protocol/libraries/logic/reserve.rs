use crate::protocol::libraries::math::math_utils;
use ic_cdk::api::time;

use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;

use crate::protocol::libraries::logic::interest_rate::{calculate_interest_rates, initialize_interest_rate_params};
use crate::protocol::libraries::math::math_utils::ScalingMath;


use crate::protocol::libraries::types::datatypes::UserState;


use crate::api::functions::asset_transfer;
use candid::{Nat, Principal};


fn current_timestamp() -> u64 {
    time() / 1_000_000_000 // time() returns nanoseconds.
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
         curr_debt_rate: reserve_data.borrow_rate,
         next_debt_rate: reserve_data.borrow_rate,
         next_debt_index: reserve_data.debt_index,
         debt_last_update_timestamp: 0,

         reserve_factor: reserve_data.configuration.reserve_factor.clone(),

    }
}

pub fn update_state(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    let current_time = current_timestamp();
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        return;
    }

    update_indexes(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != 0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate,
            reserve_cache.reserve_last_update_timestamp,
        );
        reserve_cache.next_liquidity_index = 
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index);
        
        reserve_data.liquidity_index = reserve_cache.next_liquidity_index;
    }

    if reserve_cache.curr_debt_index != 0 {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate,
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        reserve_cache.next_debt_index = cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index);
        reserve_data.debt_index = reserve_cache.next_debt_index;
    }
}



pub async fn update_interest_rates(
        reserve_data: &mut ReserveData,
        reserve_cache: &mut ReserveCache,
        total_borrowed: u128,
        total_supplies: u128,
    ){
        let total_debt = total_borrowed.scaled_mul(reserve_cache.curr_debt_index);
        let total_supply= total_supplies.scaled_mul(reserve_cache.curr_liquidity_index);
        let asset=reserve_data.asset_name.clone().unwrap_or("no token".to_string());
        let interest_rate_params = initialize_interest_rate_params(&asset);
        ic_cdk::println!("interest rate params {:?}", interest_rate_params);
        ic_cdk::println!("total debt: {:?}", total_debt);
        let (next_liquidity_rate, next_debt_rate) =
        calculate_interest_rates(
            total_supply,                        
            total_borrowed,                    
            total_debt,                
            reserve_cache.curr_debt_rate,   
            &interest_rate_params, 
            reserve_cache.reserve_factor,           
           
        );
        reserve_data.total_borrowed = total_borrowed;
        reserve_data.total_supply= total_supply;
        reserve_data.current_liquidity_rate = next_liquidity_rate;
        reserve_data.borrow_rate = next_debt_rate;
        ic_cdk::println!("reserve_data.total_borrowed: {:?}", reserve_data.total_borrowed);

    }


  
pub async fn burn_scaled(
    user_state: &mut UserState,
    amount: u128,
    current_liquidity_index: u128,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
) -> Result<(), String> {
    ic_cdk::println!("burn user state value = {:?}", user_state);
    ic_cdk::println!("burn amount value = {}", amount);
    ic_cdk::println!(
        "burn current_liquidity_index value = {}",
        current_liquidity_index
    );
    ic_cdk::println!("burn user_principal value = {}", user_principal);
    ic_cdk::println!(
        "burn token_canister_principal value = {}",
        token_canister_principal
    );
    ic_cdk::println!("burn platform_principal value = {}", platform_principal);

    let adjusted_amount = amount.scaled_div(current_liquidity_index);

    if adjusted_amount == 0 {
        return Err("Invalid burn amount".to_string());
    }

    // Calculate interest accrued since the last liquidity index update
    let balance_increase = (user_state
        .adjusted_balance
        .scaled_mul(current_liquidity_index))
        - (user_state
            .adjusted_balance
            .scaled_mul(user_state.last_liquidity_index));

    if adjusted_amount > user_state.adjusted_balance + balance_increase {
        return Err("Insufficient balance to burn".to_string());
    }

    user_state.adjusted_balance -= adjusted_amount;

    user_state.last_liquidity_index = current_liquidity_index;

    ic_cdk::println!("burn updated user state = {:?}", user_state);

    let burn_amount = adjusted_amount as u128;

    // Perform token transfer from the user to the platform to burn the tokens
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        Nat::from(burn_amount),
    )
    .await
    {
        Ok(_) => {
            ic_cdk::println!("Dtoken transfer from user to backend executed successfully");
            Ok(())
        }
        Err(err) => Err(format!("Burning failed. Error: {:?}", err)),
    }
}

pub async fn mint_scaled(
    user_state: &mut UserState,
    amount: u128,
    current_liquidity_index: u128,
    user_principal: Principal,
    token_canister_principal: Principal,
    platform_principal: Principal,
) -> Result<(), String> {
    ic_cdk::println!("user state value = {:?}", user_state);
    ic_cdk::println!("amount value = {}", amount);
    ic_cdk::println!(
        "current_liquidity_index value = {}",
        current_liquidity_index
    );
    ic_cdk::println!("user_principal value = {}", user_principal);
    ic_cdk::println!(
        "token_canister_principal value = {}",
        token_canister_principal
    );
    ic_cdk::println!("platform_principal value = {}", platform_principal);

    let adjusted_amount: u128 = amount.scaled_div(current_liquidity_index);
    if adjusted_amount == 0 {
        return Err("Invalid mint amount".to_string());
    }

    // Calculate interest accrued since the last liquidity index update
    let balance_increase = (user_state
        .adjusted_balance
        .scaled_mul(current_liquidity_index))
        - (user_state
            .adjusted_balance
            .scaled_mul(user_state.last_liquidity_index));

    user_state.adjusted_balance += adjusted_amount + balance_increase;

    user_state.last_liquidity_index = current_liquidity_index;

    ic_cdk::println!("updated user state value = {:?}", user_state);

    let newmint: u128 = adjusted_amount as u128;

    // Perform token transfer to the user with the newly minted aTokens
    match asset_transfer(
        user_principal,
        token_canister_principal,
        platform_principal,
        Nat::from(newmint),
    )
    .await
    {
        Ok(_) => {
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
            Ok(())
        }
        Err(err) => Err(format!("Minting failed. Error: {:?}", err)),
    }
}


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

