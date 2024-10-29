use std::string;

use candid::types::principal;
use candid::Nat;
use candid::Principal;
use declarations::assets::{
    ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
};
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use ic_cdk_macros::update;
use implementations::reserve;
use protocol::libraries::math::calculate::calculate_health_factor;
use protocol::libraries::math::calculate::calculate_ltv;
use protocol::libraries::math::calculate::UserPosition;
use protocol::libraries::math::math_utils;
use protocol::libraries::math::math_utils::ScalingMath;
use protocol::libraries::types::datatypes::UserReserveData;
mod api;
mod constants;
pub mod declarations;
mod dynamic_canister;
mod guards;
mod implementations;
mod memory;
mod protocol;
mod state;
use crate::api::state_handler::{mutate_state, read_state};
use crate::declarations::assets::ReserveData;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::borrow;
// use crate::protocol::libraries::logic::liquidation::LiquidationLogic;
use crate::protocol::libraries::logic::supply::SupplyLogic;
use crate::protocol::libraries::types::datatypes::UserData;

#[init]
fn init() {
    // initialize_reserve();
    ic_cdk::println!("function called");
}

// Function to call the execute_supply logic
#[update]
async fn supply(asset: String, amount: u64, is_collateral: bool) -> Result<(), String> {
    ic_cdk::println!("Starting deposit function");
    let params = ExecuteSupplyParams {
        asset,
        amount: amount as u128,
        is_collateral,
    };
    ic_cdk::println!("Parameters for execute_supply: {:?}", params);
    match SupplyLogic::execute_supply(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_supply function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_supply: {:?}", e);
            Err(e)
        }
    }
}

// #[update]
// async fn liquidation_call(
//     asset: String,
//     collateral_asset: String,
//     amount: u64,
//     on_behalf_of: String,
// ) -> Result<(), String> {
//     match LiquidationLogic::execute_liquidation(
//         asset,
//         collateral_asset,
//         amount as u128,
//         on_behalf_of,
//     )
//     .await
//     {
//         Ok(_) => {
//             ic_cdk::println!("execute_liquidation function called successfully");
//             Ok(())
//         }
//         Err(e) => {
//             ic_cdk::println!("Error calling execute_liquidation: {:?}", e);
//             Err(e)
//         }
//     }
// }
// Function to fetch the reserve-data based on the asset
#[query]
fn get_reserve_data(asset: String) -> Result<ReserveData, String> {
    read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset.to_string()))
    })
}

// Function to call the execute_borrow logic
#[update]
async fn borrow(asset: String, amount: u64) -> Result<(), String> {
    ic_cdk::println!("Starting borrow function");
    let params = ExecuteBorrowParams {
        asset,
        amount: amount as u128,
    };
    ic_cdk::println!("Parameters for execute_borrow: {:?}", params);

    match borrow::execute_borrow(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_borrow function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_borrow: {:?}", e);
            Err(e)
        }
    }
}

// Function to get the user data based on the principal
#[query]
fn get_user_data(user: String) -> Result<UserData, String> {
    let user_principal = Principal::from_text(user.to_string())
        .map_err(|_| "Invalid user canister ID".to_string())?;

    read_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| {
                format!(
                    "User not found for principal: {}",
                    user_principal.to_string()
                )
            })
    })
}

// Get names of all assets of the reserve
#[query]
pub fn get_all_assets() -> Vec<String> {
    read_state(|state| {
        let mut asset_names = Vec::new();
        let iter = state.reserve_list.iter();
        for (key, _) in iter {
            asset_names.push(key.clone());
        }
        asset_names
    })
}

#[query]
pub fn get_asset_principal(asset_name: String) -> Result<Principal, String> {
    read_state(|state| match state.reserve_list.get(&asset_name) {
        Some(principal) => Ok(principal),
        None => Err(format!("No principal found for asset: {}", asset_name)),
    })
}

// Get all users
#[query]
fn get_all_users() -> Vec<(Principal, UserData)> {
    read_state(|state| {
        state
            .user_profile
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    })
}

// Initialize user if not found
#[update]
fn check_user(user: String) -> Result<String, String> {
    let user_principal =
        Principal::from_text(&user).map_err(|_| "Invalid user canister ID".to_string())?;

    let user_data = mutate_state(|state| {
        let user_index = &mut state.user_profile;
        match user_index.get(&user_principal) {
            Some(_) => Ok("User available".to_string()),
            None => {
                let default_user_data = UserData::default();
                user_index.insert(user_principal.clone(), Candid(default_user_data));
                Ok("User added".to_string())
            }
        }
    });

    user_data
}

// Repays debt of the user
#[update]
async fn repay(asset: String, amount: u128, on_behalf: Option<String>) -> Result<(), String> {
    ic_cdk::println!("Starting repay function");
    let params = ExecuteRepayParams {
        asset,
        amount: amount as u128,
        on_behalf_of: on_behalf,
    };
    ic_cdk::println!("Parameters for execute_repay: {:?}", params);
    match borrow::execute_repay(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_repay function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_repay: {:?}", e);
            Err(e)
        }
    }
}

// Withdraws amount from the collateral/supply
#[update]
pub async fn withdraw(
    asset: String,
    amount: u128,
    on_behalf: Option<String>,
    collateral: bool,
) -> Result<(), String> {
    ic_cdk::println!("Starting withdraw function");
    let params = ExecuteWithdrawParams {
        asset,
        amount: amount as u128,
        on_behalf_of: on_behalf,
        is_collateral: collateral,
    };
    ic_cdk::println!("Parameters for execute_withdraw: {:?}", params);
    match SupplyLogic::execute_withdraw(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_withdraw function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_withdraw: {:?}", e);
            Err(e)
        }
    }
}




fn update_user_reserve_state(user_reserve_data: &mut UserReserveData) -> Result<(), String> {
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if user_reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Ok(());
    }

    // Calculate liquidity index update based on supply rate
    if user_reserve_data.supply_rate != 0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            user_reserve_data.supply_rate,
            user_reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "Calculated cumulated liquidity interest: {} based on supply rate: {}",
            cumulated_liquidity_interest,
            user_reserve_data.supply_rate
        );

        user_reserve_data.liquidity_index = cumulated_liquidity_interest.scaled_mul(user_reserve_data.liquidity_index);
        ic_cdk::println!(
            "Updated liquidity index: {} for reserve",
            user_reserve_data.liquidity_index
        );
    }

    // Calculate debt index update based on borrow rate
    if user_reserve_data.variable_borrow_index != 0 {
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            user_reserve_data.borrow_rate,
            user_reserve_data.last_update_timestamp,
            current_time,
        );
        ic_cdk::println!(
            "Calculated cumulated borrow interest: {} based on borrow rate: {}",
            cumulated_borrow_interest,
            user_reserve_data.borrow_rate
        );

        user_reserve_data.variable_borrow_index = cumulated_borrow_interest.scaled_mul(user_reserve_data.variable_borrow_index);
        ic_cdk::println!(
            "Updated variable borrow index: {} for reserve",
            user_reserve_data.variable_borrow_index
        );
    }

    // Update last update timestamp
    user_reserve_data.last_update_timestamp = current_time;
    ic_cdk::println!(
        "Updated last update timestamp for reserve: {}",
        user_reserve_data.last_update_timestamp
    );

    Ok(())
}

#[update]
pub fn login() -> Result<(), String> {
    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {}", user_principal);

    // Fetch user data
    let user_data_result = mutate_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|user| user.0.clone())
            .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
    });

    let mut user_data = match user_data_result {
        Ok(data) => data,
        Err(err) => return Err(err),
    };

    // Ensure reserves exist for the user
    let reserves = user_data
        .reserves
        .as_mut()
        .ok_or_else(|| format!("Reserves not found for user {}", user_principal.to_string()))?;

    let current_timestamp = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp in login: {}", current_timestamp);

    let mut total_collateral = user_data.total_collateral.unwrap_or(0);
    ic_cdk::println!("Initial total collateral: {}", total_collateral);

    for (reserve_name, user_reserve_data) in reserves.iter_mut() {
        ic_cdk::println!("Processing reserve: {}", reserve_name);
        let prev_liq_index = user_reserve_data.liquidity_index.clone();
        update_user_reserve_state(user_reserve_data)?;

        let updated_balance = calculate_dynamic_balance(
            user_reserve_data.asset_supply,
            prev_liq_index,
            user_reserve_data.liquidity_index,
           
        );
        ic_cdk::println!(
            "Updated balance calculated using liquidity index {}: {}",
            user_reserve_data.liquidity_index,
            updated_balance
        );

        user_reserve_data.asset_supply = updated_balance;
        ic_cdk::println!(
            "Updated asset supply for reserve {}: {}",
            reserve_name,
            user_reserve_data.asset_supply
        );

        //TODO: calculate updated debt balance also like we did for asset_supply

    
        if user_reserve_data.asset_supply > 0 && user_reserve_data.is_collateral {
            let added_collateral = updated_balance - user_reserve_data.asset_supply;
            total_collateral += added_collateral;  //TODO: add the usd converted value here
            ic_cdk::println!(
                "Added to total collateral from reserve {}: {} (New total: {})",
                reserve_name,
                added_collateral,
                total_collateral
            );
        }

        //TODO update total_dept also with usd converted value of updated_debt_balance

        let user_position = UserPosition {
            total_collateral_value: total_collateral,
            total_borrowed_value: user_data.total_debt.unwrap(),
            liquidation_threshold: user_data.liquidation_threshold.unwrap(),
        };

  
        if user_reserve_data.asset_supply > 0 || user_reserve_data.asset_borrow > 0 {
            user_data.health_factor = Some(calculate_health_factor(&user_position));
            user_data.ltv = Some(calculate_ltv(&user_position));
            ic_cdk::println!(
                "Updated health factor: {}, Updated LTV: {}",
                user_data.health_factor.unwrap(),
                user_data.ltv.unwrap()
            );
        }
        //TODO check if we are updating it before while update state call then no need to update it again 
        user_reserve_data.last_update_timestamp = current_timestamp;
        ic_cdk::println!(
            "Updated last update timestamp for reserve {}: {}",
            reserve_name,
            user_reserve_data.last_update_timestamp
        );
    }


    user_data.total_collateral = Some(total_collateral);
    ic_cdk::println!("Final total collateral: {}", total_collateral);

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, declarations::storable::Candid(user_data));
    });
    ic_cdk::println!("User profile updated successfully for user: {}", user_principal);

    Ok(())
}


// #[update]
// pub fn login() -> Result<(), String> {
//     let user_principal = ic_cdk::caller();

//     // fetch user data.
//     let user_data_result = mutate_state(|state| {
//         state
//             .user_profile
//             .get(&user_principal)
//             .map(|user| user.0.clone())
//             .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
//     });

//     let mut user_data = match user_data_result {
//         Ok(data) => data,
//         Err(err) => return Err(err),
//     };
//     // Ensure reserves exist for the user
//     let reserves = user_data
//         .reserves
//         .as_mut()
//         .ok_or_else(|| format!("Reserves not found for user {}", user_principal.to_string()))?;

//     let current_timestamp = ic_cdk::api::time() / 1_000_000_000;

//     let mut total_collateral = user_data.total_collateral.unwrap_or(0);

//     for (reserve_name, reserve_data) in reserves.iter_mut() {
//         ic_cdk::println!("Processing reserve: {}", reserve_name);

//         // Update the liquidity index based on APY and time difference
//         let delta_time = current_timestamp - reserve_data.last_update_timestamp;
//         let apy = reserve_data.supply_rate; // Assuming supply_rate represents APY in basis points
//         ic_cdk::println!("to check the apy rate = {}", apy);
//         ic_cdk::println!("to check the time = {}", delta_time);
//         ic_cdk::println!("to check the current time stamp = {}", current_timestamp);

//         update_liquidity_index(reserve_data, apy, delta_time)?;

//         // Dynamically calculate the user's updated balance using the liquidity index
//         let updated_balance = calculate_dynamic_balance(
//             reserve_data.asset_supply,
//             reserve_data.liquidity_index,
//             reserve_data.variable_borrow_index, // Assuming this is the initial liquidity index
//         );

//         reserve_data.asset_supply = updated_balance;

//         // Update the user's total collateral based on the updated reserve balance
//         if reserve_data.asset_supply > 0 {
//             total_collateral += updated_balance - reserve_data.asset_supply;
//         }

//         let user_position = UserPosition {
//             total_collateral_value: total_collateral,
//             total_borrowed_value: user_data.total_debt.unwrap(),
//             liquidation_threshold: user_data.liquidation_threshold.unwrap(),
//         };

//         if reserve_data.asset_supply > 0 || reserve_data.asset_borrow > 0 {
//             user_data.health_factor = Some(calculate_health_factor(&user_position));
//             user_data.ltv = Some(calculate_ltv(&user_position));
//         }

//         // Update the timestamp for this reserve
//         reserve_data.last_update_timestamp = current_timestamp;
//     }

//     // Update the user's total collateral value
//     user_data.total_collateral = Some(total_collateral);

//     // Update the user profile with the new state
//     mutate_state(|state| {
//         state
//             .user_profile
//             .insert(user_principal, declarations::storable::Candid(user_data));
//     });

//     Ok(())
// }

// fn update_liquidity_index(
//     reserve_data: &mut UserReserveData,
//     liquidity_rate: u128, // APY of the reserve in basis points (e.g., 5% = 500)
//     delta_time: u64,      // Time difference in seconds
// ) -> Result<(), String> {
//     // Convert the liquidity rate (APY) to per second rate
//     let liquidity_rate_per_second = liquidity_rate as u128 * 1_000_000_000 / (365 * 24 * 60 * 60);

//     // Update the liquidity index with the new value based on delta_time
//     reserve_data.liquidity_index =
//         reserve_data.liquidity_index * (1 + liquidity_rate_per_second * delta_time as u128);

//     Ok(())
// }

fn calculate_dynamic_balance(
    initial_deposit: u128,         // The initial deposit amount (asset_supply)
    prev_liquidity_index: u128, // The updated liquidity index
    new_liquidity_index: u128, // The liquidity index at the time of deposit
) -> u128 {
    // Calculate the dynamically updated balance using the liquidity index
    initial_deposit * new_liquidity_index / prev_liquidity_index
}

// //approve function that take input  - amount and asset name -> e.g "ckBTC " -> retrive its principal from reserve
//call approve transfer function -- function.rs
// backend canister as spender
//caller as from
//asset principal as ledger
//amount as amount

export_candid!();
