use api::state_handler::mutate_state;
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
use crate::declarations::assets::ReserveData;
use crate::declarations::assets::ExecuteSupplyParams;
use crate::implementations::reserve::initialize_reserve;
use crate::protocol::libraries::logic::supply::SupplyLogic;
use crate::protocol::libraries::logic::borrow;
use candid::Principal;
use ic_cdk::{init, query};
use ic_cdk_macros::update;

use crate::api::state_handler::read_state;
use candid::Nat;
use crate::protocol::libraries::types::datatypes::UserData;
#[init]
fn init() {
    // initialize_reserve();
    ic_cdk::println!("function called");

    let ledger_tokens = vec![
        // ("ckBTC", Principal::from_text("c2lt4-zmaaa-aaaaa-qaaiq-cai").unwrap()),
        ("ckETH", Principal::from_text("ctiya-peaaa-aaaaa-qaaja-cai").unwrap()),
    
    ];

    mutate_state(|state| {
        for (token_name, principal) in ledger_tokens {
            state.reserve_list.insert(token_name.to_string(), principal).unwrap();
        }
    });
}

#[update]
fn initialize_reserve_list(ledger_tokens: Vec<(String, Principal)>) -> Result<(), String> {
    ic_cdk::println!("Initialize reserve list function called");

    mutate_state(|state| {
        for (token_name, principal) in ledger_tokens {
            state.reserve_list.insert(token_name.to_string(), principal);
        }
        Ok(())
    })
}
// #[ic_cdk_macros::update]
// async fn initialize_reserve_call() -> Result<(), String> {
//     initialize_reserve().await
// }

#[update]
async fn deposit(
    asset: String,
    amount: u64,
    on_behalf_of: String,
    is_collateral: bool,
    referral_code: u16,

)-> Result<(), String> {
    ic_cdk::println!("Starting deposit function");
    let params = ExecuteSupplyParams {
        asset,
        amount: amount as u128,  
        on_behalf_of,
        is_collateral,
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

#[query]
fn get_user_data(user: String) -> Result<UserData, String> {
    let user_principal = Principal::from_text(user.to_string())
        .map_err(|_| "Invalid user canister ID".to_string())?;

    read_state(|state| {
        // let state = state.borrow();
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


export_candid!();
