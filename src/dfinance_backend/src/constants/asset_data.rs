use std::collections::HashMap;
use ic_cdk::api::time;
use candid::Principal;
use crate::declarations::assets::ReserveData;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;
use crate::constants::asset_address::{
    CKBTC_LEDGER_CANISTER, 
    CKETH_LEDGER_CANISTER, 
    DTOKEN_CANISTER, 
    DEBTTOKEN_CANISTER,
    DCKETH_CANISTER
};

// Convert canister address strings into Principal type
pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    // Reserve Data for ckBTC
    let ckbtc_principal= create_testtoken_canister("ckBTC", "ckBTC").await;
    // let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
    let dckbtc=create_token_canister("dckBTC", "dckBTC").await;
    let debtckbtc=create_token_canister("debtckBTC", "debtckBTC").await;
    assets.insert("ckBTC", (
        ckbtc_principal,
        ReserveData {
            asset_name: Some("ckBTC".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: Some(8.25),
            supply_rate_apr: Some(8.25),
            d_token_canister: Some(dckbtc.to_string()),
            debt_token_canister: Some(debtckbtc.to_string()),
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
    // let cketh_principal = Principal::from_text(CKETH_LEDGER_CANISTER).unwrap();
    let cketh_principal= create_testtoken_canister("ckETH", "ckETH").await;
    // let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
    let dcketh=create_token_canister("dckETH", "dckETH").await;
    let debtcketh=create_token_canister("debtckETH", "debtckETH").await;
    assets.insert("ckETH", (
        cketh_principal,
        ReserveData {
            asset_name: Some("ckEth".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: Some(7.50),
            supply_rate_apr: Some(7.50),
            d_token_canister: Some(dcketh.to_string()),
            debt_token_canister: Some(debtcketh.to_string()),
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