use crate::{
    api::state_handler::mutate_state,
    declarations::{assets::ReserveData, storable::Candid},
    protocol::configuration::reserve_configuration::ReserveConfiguration,
};

use ic_cdk::update;
use crate::get_all_assets;
#[update]
pub fn initialize_reserve(){
    let asset_names = get_all_assets();
    for asset_name in asset_names {
    let config = ReserveConfiguration::initialize(
        75,    // ltv
        80,    // liquidation_threshold
        5,     // liquidation_bonus
        true,    // active
        false,   // frozen
        true,    // borrowing_enabled
        false,   // paused
        100000,  // borrow_cap
        100000,  // supply_cap
        100,     // liquidation_protocol_fee
    );


    let data = ReserveData {
        asset_name: Some(asset_name.clone()),
        last_update_timestamp: ic_cdk::api::time(),
        current_liquidity_rate: 0,
        borrow_rate: Some(8.25),
        supply_rate_apr: Some(8.25),
        d_token_canister: Some("by6od-j4aaa-aaaaa-qaadq-cai".to_string()),
        debt_token_canister: Some("b77ix-eeaaa-aaaaa-qaada-cai".to_string()),
        total_supply: Some(0.0),
        can_be_collateral: Some(true),
        accrued_to_treasury: 0,
        liquidity_index: 1,
        id: 1,
        configuration: config,
    };
  
    mutate_state(|state| {
        let reserve_data = &mut state.asset_index;
        
        reserve_data.insert(asset_name.clone(), Candid(data));
        ic_cdk::println!("Reserve for {} initialized successfully", asset_name);
    });
}
}

        
