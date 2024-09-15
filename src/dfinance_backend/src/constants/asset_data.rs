use std::collections::HashMap;
use ic_cdk::api::time;
use candid::Principal;
use crate::declarations::assets::ReserveData;
use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;
use crate::constants::asset_address::{
    CKBTC_LEDGER_CANISTER, 
    CKETH_LEDGER_CANISTER, 
    DTOKEN_CANISTER, 
    DEBTTOKEN_CANISTER
};

// Convert canister address strings into Principal type
pub fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    // Reserve Data for ckBTC
    let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
    assets.insert("ckBTC", (
        ckbtc_principal,
        ReserveData {
            asset_name: Some("ckBTC".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: Some(8.25),
            supply_rate_apr: Some(8.25),
            d_token_canister: Some(DTOKEN_CANISTER.to_string()),
            debt_token_canister: Some(DEBTTOKEN_CANISTER.to_string()),
            total_supply: Some(0.0),
            can_be_collateral: Some(true),
            liquidity_index: 1,
            id: 1,
            configuration: ReserveConfiguration::initialize(
                75, 80, 5, true, false, true, false, 100000, 100000, 100
            ),
        }
    ));

    // Reserve Data for ckEth
    let cketh_principal = Principal::from_text(CKETH_LEDGER_CANISTER).unwrap();
    assets.insert("ckEth", (
        cketh_principal,
        ReserveData {
            asset_name: Some("ckEth".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: Some(7.50),
            supply_rate_apr: Some(7.50),
            d_token_canister: Some(DTOKEN_CANISTER.to_string()),
            debt_token_canister: Some(DEBTTOKEN_CANISTER.to_string()),
            total_supply: Some(0.0),
            can_be_collateral: Some(false),
            liquidity_index: 1,
            id: 2,
            configuration: ReserveConfiguration::initialize(
                60, 70, 10, true, false, true, false, 50000, 70000, 100
            ),
        }
    ));

    // Add more assets as needed...

    assets
}