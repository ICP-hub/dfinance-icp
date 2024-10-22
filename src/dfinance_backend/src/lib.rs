use candid::types::principal;
use candid::Nat;
use candid::Principal;
use declarations::assets::{
    ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
};
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use ic_cdk_macros::update;
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
use crate::protocol::libraries::logic::liquidation::LiquidationLogic;
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


#[update]
async fn liquidation_call(
    asset: String,
    collateral_asset: String,
    amount: u64,
    on_behalf_of: String,
) -> Result<(), String> {
    match LiquidationLogic::execute_liquidation(
        asset,
        collateral_asset,
        amount as u128,
        on_behalf_of,
    )
    .await
    {
        Ok(_) => {
            ic_cdk::println!("execute_liquidation function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_liquidation: {:?}", e);
            Err(e)
        }
    }
}
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



//approve function that take input  - amount and asset name -> e.g "ckBTC " -> retrive its principal from reserve
//call approve transfer function -- function.rs
// backend canister as spender
//caller as from
//asset principal as ledger
//amount as amount


// fn login(user_id: u64, user_state: &UserState) {
  
//     let mut state = user_state.lock().unwrap();

//     if let Some(user) = state.get_mut(&user_id) {
   
//         println!("User {} logged in. Updating state...", user.username);
//         update_user_state(user);
//     } else {
//         // Handle case where user is not found
//         println!("User with ID {} not found", user_id);
//     }
// }


export_candid!();
