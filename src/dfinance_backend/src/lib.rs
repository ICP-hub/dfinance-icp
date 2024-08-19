use declarations::assets::ExecuteBorrowParams;
use ic_cdk_macros::export_candid;

mod api;
mod constants;
mod declarations;
mod dynamic_canister;
mod guards;
mod implementations;
mod memory;
mod protocol;
mod state;
mod tests;
mod utils;
use crate::api::state_handler::read_state;
use crate::declarations::assets::ExecuteSupplyParams;
use crate::declarations::assets::ReserveData;
use crate::implementations::reserve::initialize_reserve;
use crate::protocol::libraries::logic::borrow;
use crate::protocol::libraries::logic::supply::SupplyLogic;
use crate::protocol::libraries::types::datatypes::UserData;
use candid::Nat;
use candid::Principal;
use ic_cdk::{init, query};
use ic_cdk_macros::update;
#[init]
fn init() {
    initialize_reserve();
    ic_cdk::println!("function called");
}

// Function to call the execute_supply logic
#[update]
async fn deposit(
    asset: String,
    amount: u64,
    on_behalf_of: Principal,
    referral_code: u16,
) -> Result<(), String> {
    ic_cdk::println!("Starting deposit function");
    let params = ExecuteSupplyParams {
        asset,
        amount: amount as u128,
        on_behalf_of,
        referral_code,
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
async fn borrow(
    asset: String,
    amount: u64,
    user: String,
    on_behalf_of: String,
    interest_rate: Nat,
) -> Result<(), String> {
    ic_cdk::println!("Starting borrow function");
    let params = ExecuteBorrowParams {
        asset,
        user,
        on_behalf_of,
        amount: amount as u128,
        interest_rate,
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
export_candid!();
