use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk_macros::*;
use std::cell::RefCell;
use std::collections::HashMap;
// mod protocol;
use crate::protocol::libraries::types::ConfiguratorInputTypes::InitReserveInput;
use protocol::libraries::logic::config_logic::ConfigLogic;
// mod errors;
// mod percentage_math;
// mod data_types;
// mod configurator_logic;
// mod configurator_input_types;

// use errors::Errors;
// use percentage_math::PercentageMath;
// use data_types::DataTypes;
// use configurator_logic::ConfiguratorLogic;
// use configurator_input_types::ConfiguratorInputTypes;

thread_local! {
    static ADDRESSES_PROVIDER: RefCell<Option<Principal>> = RefCell::new(None);
    static POOL: RefCell<Option<Principal>> = RefCell::new(None);
    static RESERVES: RefCell<HashMap<String, ReserveConfigurationMap>> = RefCell::new(HashMap::new());
}



#[init]
fn initialize(provider: Principal) {
    ADDRESSES_PROVIDER.with(|p| *p.borrow_mut() = Some(provider));
    // Initialize POOL with the pool address from the provider
    POOL.with(|p| *p.borrow_mut() = Some(get_pool_from_provider(provider)));
}

// #[update]
// fn init_reserves(input: Vec<InitReserveInput>) {
//     // Only allow asset listing or pool admins
//     // Check for admin permissions 

//     POOL.with(|p| {
//         if let Some(pool) = *p.borrow() {
//             for reserve_input in input {
//                 ConfigLogic::execute_init_reserve(pool, reserve_input);
//             }
//         }
//     });
// }

#[update]
async fn init_reserves(input: Vec<InitReserveInput>) {
    let caller = ic_cdk::caller();
    if !is_asset_listing_or_pool_admin(&caller) {
        ic_cdk::trap("Caller is not an asset listing or pool admin.");
    }
    protocol::libraries::logic::config_logic::POOL.with(|pool| {
        let pool = pool.borrow();
        for reserve in input {
            ConfigLogic::execute_init_reserve(&pool, reserve);
        }
    });
}
//is_asset_listing_or_pool_admin func -> acl_manager? 


#[update]
fn drop_reserve(asset: String) {
    // Only allow pool admin
    // Check for admin permissions here

    RESERVES.with(|reserves| {
        reserves.borrow_mut().remove(&asset);
    });

    emit_reserve_dropped(asset);
}

#[update]
fn update_a_token(input: UpdateATokenInput) {
    // Only allow pool admin
    // Check for admin permissions here

    POOL.with(|p| {
        if let Some(pool) = *p.borrow() {
            execute_update_a_token(pool, input);
        }
    });
}

#[update]
fn update_stable_debt_token(input: UpdateDebtTokenInput) {
    // Only allow pool admin
    // Check for admin permissions here

    POOL.with(|p| {
        if let Some(pool) = *p.borrow() {
            execute_update_stable_debt_token(pool, input);
        }
    });
}

#[update]
fn update_variable_debt_token(input: UpdateDebtTokenInput) {
    // Only allow pool admin
    // Check for admin permissions here

    POOL.with(|p| {
        if let Some(pool) = *p.borrow() {
            execute_update_variable_debt_token(pool, input);
        }
    });
}

fn get_pool_from_provider(provider: Principal) -> Principal {
    // Fetch the pool address from the provider
    // Placeholder function, implement as needed
    Principal::anonymous()
}


