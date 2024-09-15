use crate::{
    api::state_handler::mutate_state,
    declarations::{assets::ReserveData, storable::Candid},
    protocol::configuration::reserve_configuration::ReserveConfiguration,
};

use crate::get_all_assets;
use ic_cdk::update;
//constant - asset_data.rs - (assetname, canisterid, reservedata) e.g. ckbtc, "", re
//import asset_data in this file
//
// reserve_list 
// mutate_state(|state| {
//     for (token_name, principal) in ledger_tokens {
//         state.reserve_list.insert(token_name.to_string(), principal);
//     }
//     Ok(())
// })
#[update]
pub fn initialize_reserve() {
    let caller_id = ic_cdk::api::caller();
    ic_cdk::println!("Caller ID: {:?}", caller_id.to_string());
    if !ic_cdk::api::is_controller(&ic_cdk::api::caller()) {
        ic_cdk::trap("Unauthorized: Only canister controllers can call this function");
    }
    let asset_names = get_all_assets();

    for (index, asset_name) in asset_names.iter().enumerate() {
        // Assign different values for each asset
        let (
            ltv,
            liquidation_threshold,
            liquidation_bonus,
            borrow_cap,
            supply_cap,
            borrow_rate,
            dtoken_id,
            debttoken_id,
            can_be_collateral,
        ) = match asset_name.as_str() {
            "ckBTC" => (
                75,
                80,
                5,
                100000,
                100000,
                8.25,
                "c5kvi-uuaaa-aaaaa-qaaia-cai",
                "cuj6u-c4aaa-aaaaa-qaajq-cai",
                true,
            ), //asset_address
            "ckEth" => (60, 70, 10, 50000, 70000, 7.50, "", "", false),
            _ => (70, 75, 5, 80000, 90000, 7.00, "", "", true),
        };

        let config = ReserveConfiguration::initialize(
            ltv,
            liquidation_threshold,
            liquidation_bonus,
            true,  // active
            false, // frozen
            true,  // borrowing_enabled
            false, // paused
            borrow_cap,
            supply_cap,
            100, // Liquidation protocol fee
        );

        let data = ReserveData {
            asset_name: Some(asset_name.clone()),
            last_update_timestamp: ic_cdk::api::time(),
            current_liquidity_rate: 0,
            borrow_rate: Some(borrow_rate),
            supply_rate_apr: Some(8.25),
            d_token_canister: Some(dtoken_id.to_string()),
            debt_token_canister: Some(debttoken_id.to_string()),
            total_supply: Some(0.0),
            can_be_collateral: Some(can_be_collateral),
            accrued_to_treasury: 0, //remove
            liquidity_index: 1,
            id: 1,
            configuration: config,
            //total debt, total borrowed
        };

        mutate_state(|state| {
            let reserve_data = &mut state.asset_index;

            reserve_data.insert(asset_name.clone(), Candid(data));
            ic_cdk::println!("Reserve for {} initialized successfully", asset_name);
        });
    }
}
