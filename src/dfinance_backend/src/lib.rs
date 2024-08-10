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
use crate::declarations::assets::ReserveData;
use crate::declarations::assets::ExecuteSupplyParams;
use crate::implementations::reserve::initialize_reserve;
use crate::protocol::libraries::logic::supply::SupplyLogic;
use candid::Principal;
use ic_cdk::{init, query};
use ic_cdk_macros::update;
use crate::api::state_handler::read_state;

#[init]
fn init() {
    initialize_reserve();
    ic_cdk::println!("function called");
}

#[update]
async fn deposit(
    asset: String,
    amount: u64,
    on_behalf_of: String,
    referral_code: u16,
)-> Result<(), String> {
    ic_cdk::println!("Starting deposit function");
    let params = ExecuteSupplyParams {
        asset,
        amount: amount as u128,  // Convert to u128 as required by ExecuteSupplyParams
        on_behalf_of,
        referral_code,
    };
    ic_cdk::println!("Parameters for execute_supply: {:?}", params);
    // SupplyLogic::execute_supply(params);
    // ic_cdk::println!("function called");
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

#[query]
fn get_reserve_data(asset: String) -> Result<ReserveData, String> {
    read_state(|state| {
        // let state = state.borrow();
        state.asset_index.get(&asset.to_string())
        .map(|reserve| reserve.0.clone())
        .ok_or_else(|| format!("Reserve not found for asset: {}", asset.to_string()))
    })
}


export_candid!();
