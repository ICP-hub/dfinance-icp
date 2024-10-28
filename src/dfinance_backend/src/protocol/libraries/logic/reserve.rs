

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




use crate::protocol::libraries::math::math_utils;
use ic_cdk::api::time;

use crate::declarations::assets::ReserveCache;
use crate::declarations::assets::ReserveData;

use crate::protocol::libraries::logic::interest_rate::{calculate_interest_rates, initialize_interest_rate_params};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use crate::api::functions::asset_transfer;



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
    // accrue_to_treasury(reserve_data, reserve_cache);

    reserve_data.last_update_timestamp = current_time;
}

pub fn update_indexes(reserve_data: &mut ReserveData, reserve_cache: &mut ReserveCache) {
    if reserve_cache.curr_liquidity_rate != 0 {
        //liq_rate as scaled 
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_cache.curr_liquidity_rate,
            reserve_cache.reserve_last_update_timestamp,
        );
        // let interest= cumulated_liquidity_interest.scaled_to_float();
        reserve_cache.next_liquidity_index = 
            // (cumulated_liquidity_interest * reserve_cache.curr_liquidity_index) /100000000; //scal_mul
            cumulated_liquidity_interest.scaled_mul(reserve_cache.curr_liquidity_index);
        
        reserve_data.liquidity_index = reserve_cache.next_liquidity_index;
    }

    if reserve_cache.curr_debt_index != 0 {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_cache.curr_debt_rate,
            reserve_cache.reserve_last_update_timestamp,
            current_timestamp(),
        );
        // let interest = cumulated_borrow_interest.scaled_to_float();
        // ic_cdk::println!("interest on debt {:?}", interest);
        // reserve_cache.next_debt_index = (cumulated_borrow_interest * reserve_cache.curr_debt_index) /100000000;// scal_mul
        reserve_cache.next_debt_index = cumulated_borrow_interest.scaled_mul(reserve_cache.curr_debt_index);
        reserve_data.debt_index = reserve_cache.next_debt_index;
    }
}



pub async fn update_interest_rates(
        reserve_data: &mut ReserveData,
        reserve_cache: &mut ReserveCache,
        liquidity_added: u128,
        liquidity_taken: u128,
    ){
        ic_cdk::println!("Borrow liquidity_taken (in USD): {}", liquidity_taken);
        // let total_debt = ((reserve_data.total_borrowed +liquidity_taken ) * reserve_cache.curr_debt_index) / 100000000;  //scal_mul
        // let total_supply= ((reserve_data.total_supply + liquidity_added) * reserve_cache.curr_liquidity_index) / 100000000; //scale_mul
        let total_debt = (reserve_data.total_borrowed +liquidity_taken ).scaled_mul(reserve_cache.curr_debt_index);
        let total_supply= (reserve_data.total_supply + liquidity_added).scaled_mul(reserve_cache.curr_liquidity_index);
        let total_borrowed= reserve_data.total_borrowed + liquidity_taken;
        let asset=reserve_data.asset_name.clone().unwrap_or("no token".to_string());
        let interest_rate_params = initialize_interest_rate_params(&asset);
        ic_cdk::println!("interest rate params {:?}", interest_rate_params);
        ic_cdk::println!("total debt: {:?}", total_debt);
        let (next_liquidity_rate, next_debt_rate) =
        calculate_interest_rates(
            total_supply,                        // f64
            total_borrowed,                      // f64
            total_debt,            // f64        
            reserve_cache.curr_debt_rate,   // f64
            &interest_rate_params, 
            reserve_cache.reserve_factor,              // InterestRateParams struct
           
        );
        reserve_data.total_borrowed = total_borrowed;
        reserve_data.total_supply= total_supply;
        reserve_data.current_liquidity_rate = next_liquidity_rate;
        reserve_data.borrow_rate = next_debt_rate;
        ic_cdk::println!("reserve_data.total_borrowed: {:?}", reserve_data.total_borrowed);

    }
    #[derive(Debug)]
    pub struct UserState {
        pub adjusted_balance: u128, // the balance adjusted by the liquidity index  //reserve_cache.curr_liquidity_index * total_supply
        pub last_liquidity_index: u128, // stores the previous liquidity index    //reserve_cache.curr_liqui
    }
    
   pub async fn mint_scaled(
        user_state: &mut UserState,
        amount: u128,                     // Incoming amount in f64                     //
        current_liquidity_index: u128,     // The current liquidity index    //reserve_cache.next_liqui
        user_principal: Principal,        // Principal of the user
        token_canister_principal: Principal, // dToken canister principal
        platform_principal: Principal,    // Platform principal
    ) -> Result<(), String> {

        ic_cdk::println!("user state value = {:?}",user_state);
        ic_cdk::println!("amount value = {}",amount);
        ic_cdk::println!("current_liquidity_index value = {}",current_liquidity_index);
        ic_cdk::println!("user_principal value = {}",user_principal);
        ic_cdk::println!("token_canister_principal value = {}",token_canister_principal);
        ic_cdk::println!("platform_principal value = {}",platform_principal);
    
        // Calculate the amount to mint adjusted by the liquidity index
        let adjusted_amount: u128 = amount.scaled_div(current_liquidity_index) ;
        if adjusted_amount == 0 {
            return Err("Invalid mint amount".to_string());
        }

        ic_cdk::println!("adjusted_amount value = {}",adjusted_amount);
    
        // Calculate interest accrued since the last liquidity index update
        let balance_increase = (user_state.adjusted_balance.scaled_mul(current_liquidity_index))
            - (user_state.adjusted_balance.scaled_mul(user_state.last_liquidity_index));

            
        // Update user's adjusted balance with the new deposit and interest
        user_state.adjusted_balance += adjusted_amount + balance_increase;
    
        // Update the user's last liquidity index
        user_state.last_liquidity_index = current_liquidity_index;

        ic_cdk::println!("updated user state value = {:?}",user_state);
    
        // Convert adjusted_amount and balance_increase to Nat (you need to use integer representation)
        let newmint = adjusted_amount as u128; // Scale it up to represent integer amount
    
        // Perform token transfer to the user with the newly minted aTokens
        match asset_transfer(
            user_principal,
            token_canister_principal,
            platform_principal,
            Nat::from(newmint), // Transfer the total minted amount including the interest
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
                Ok(())
            }
            Err(err) => {
                Err(format!("Minting failed. Error: {:?}", err))
            }
        }
    }


    pub async fn burn_scaled(
        user_state: &mut UserState,
        amount: u128,                     // Incoming amount in f64
        current_liquidity_index: u128,    // The current liquidity index
        user_principal: Principal,       // Principal of the user
        token_canister_principal: Principal, // dToken canister principal
        platform_principal: Principal,   // Platform principal
    ) -> Result<(), String> {

        ic_cdk::println!("user state value = {:?}",user_state);
        ic_cdk::println!("amount value = {}",amount);
        ic_cdk::println!("current_liquidity_index value = {}",current_liquidity_index);
        ic_cdk::println!("user_principal value = {}",user_principal);
        ic_cdk::println!("token_canister_principal value = {}",token_canister_principal);
        ic_cdk::println!("platform_principal value = {}",platform_principal);
    
        // Calculate the amount to burn adjusted by the liquidity index
        let adjusted_amount = amount.scaled_div(current_liquidity_index);

        if adjusted_amount == 0 {
            return Err("Invalid burn amount".to_string());
        }
    
        // Calculate interest accrued since the last liquidity index update
        let balance_increase = (user_state.adjusted_balance.scaled_mul(current_liquidity_index))
            - (user_state.adjusted_balance.scaled_mul(user_state.last_liquidity_index));
    
        // Ensure user has enough balance to burn
        if adjusted_amount > user_state.adjusted_balance + balance_increase {
            return Err("Insufficient balance to burn".to_string());
        }
    
        // Update user's adjusted balance by subtracting the burn amount
        user_state.adjusted_balance -= adjusted_amount;
    
        // Update the user's last liquidity index
        user_state.last_liquidity_index = current_liquidity_index;
    
        // Convert adjusted_amount to Nat (you need to use integer representation)
        let burn_amount = adjusted_amount as u128; // Scale it up to represent integer amount
    
        // Perform token transfer from the user to the platform to burn the tokens
        match asset_transfer(
            user_principal,
            platform_principal,
            token_canister_principal,
            Nat::from(burn_amount), // Transfer the total burnt amount
        )
        .await
        {
            Ok(_) => {
                ic_cdk::println!("Dtoken transfer from user to backend executed successfully");
                Ok(())
            }
            Err(err) => {
                Err(format!("Burning failed. Error: {:?}", err))
            }
        }
    }
    