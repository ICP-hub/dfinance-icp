// use std::collections::HashMap;
// use ic_cdk::api::time;
// use candid::Principal;
// use crate::declarations::assets::ReserveData;
// use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
// use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;



// pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
//     let mut assets = HashMap::new();

    
//     let ckbtc_principal= create_testtoken_canister("ckBTC", "ckBTC").await;
//     // let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
//     let dckbtc=create_token_canister("dckBTC", "dckBTC").await;
//     let debtckbtc=create_token_canister("debtckBTC", "debtckBTC").await;
//     assets.insert("ckBTC", (
//         ckbtc_principal,
//         ReserveData {
//             asset_name: Some("ckBTC".to_string()),
//             last_update_timestamp: time(),
//             current_liquidity_rate: 0,
//             borrow_rate: Some(8.25),
//             supply_rate_apr: Some(8.25),
//             d_token_canister: Some(dckbtc.to_string()),
//             debt_token_canister: Some(debtckbtc.to_string()),
//             total_supply: Some(0.0),
//             can_be_collateral: Some(true),
//             liquidity_index: 1,
//             id: 1,
//             configuration: ReserveConfiguration::initialize(
//                 75, 80, 5, true, false, true, false, 100000, 100000, 100
//             ),
//         }
//     ));

    
//     // let cketh_principal = Principal::from_text(CKETH_LEDGER_CANISTER).unwrap();
//     let cketh_principal= create_testtoken_canister("ckETH", "ckETH").await;
//     // let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
//     let dcketh=create_token_canister("dckETH", "dckETH").await;
//     let debtcketh=create_token_canister("debtckETH", "debtckETH").await;
//     assets.insert("ckETH", (
//         cketh_principal,
//         ReserveData {
//             asset_name: Some("ckEth".to_string()),
//             last_update_timestamp: time(),
//             current_liquidity_rate: 0,
//             borrow_rate: Some(7.50),
//             supply_rate_apr: Some(7.50),
//             d_token_canister: Some(dcketh.to_string()),
//             debt_token_canister: Some(debtcketh.to_string()),
//             total_supply: Some(0.0),
//             can_be_collateral: Some(false),
//             liquidity_index: 1,
//             id: 2,
//             configuration: ReserveConfiguration::initialize(
//                 60, 70, 10, true, false, true, false, 50000, 70000, 100
//             ),
//         }
//     ));
    
//     let ckusdc_principal= create_testtoken_canister("ckUSDC", "ckUSDC").await;
//     // let ckbtc_principal = Principal::from_text(CKBTC_LEDGER_CANISTER).unwrap();
//     let dckusdc=create_token_canister("dckUSDC", "dckUSDC").await;
//     let debtckusdc=create_token_canister("debtckUSDC", "debtckUSDC").await;
//     assets.insert("ckUSDC", (
//         ckusdc_principal,
//         ReserveData {
//             asset_name: Some("ckUSDC".to_string()),
//             last_update_timestamp: time(),
//             current_liquidity_rate: 0,
//             borrow_rate: Some(8.25),
//             supply_rate_apr: Some(8.25),
//             d_token_canister: Some(dckusdc.to_string()),
//             debt_token_canister: Some(debtckusdc.to_string()),
//             total_supply: Some(0.0),
//             can_be_collateral: Some(true),
//             liquidity_index: 1,
//             id: 1,
//             configuration: ReserveConfiguration::initialize(
//                 75, 80, 5, true, false, true, false, 100000, 100000, 100
//             ),
//         }
//     ));

//     // Add more assets as needed...

//     assets
// }

use std::collections::HashMap;
use ic_cdk::api::time;
use candid::Principal;
use crate::declarations::assets::{ReserveData, ReserveConfiguration};
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};


//pss all values by mul it by 10^8
pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    
    let ckbtc_principal= create_testtoken_canister("ckBTC", "ckBTC").await;
    let dckbtc=create_token_canister("dckBTC", "dckBTC").await;
    let debtckbtc=create_token_canister("debtckBTC", "debtckBTC").await;
    assets.insert("ckBTC", (
        ckbtc_principal,
        ReserveData {
            asset_name: Some("ckBTC".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0.0,
            borrow_rate: 0.0,
            supply_rate_apr: Some(0.0),
            d_token_canister: Some(dckbtc.to_string()),
            debt_token_canister: Some(debtckbtc.to_string()),
            total_supply: 0.0,
            total_borrowed:0.0,
            can_be_collateral: Some(true),
            liquidity_index: 1.0,
            id: 1,
            configuration: ReserveConfiguration {
                ltv:75, liquidation_threshold:80, liquidation_bonus:5, borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap:100000, supply_cap:100000, liquidation_protocol_fee:0
            },
            debt_index: 0.0,
        }
    ));

    
    let cketh_principal= create_testtoken_canister("ckETH", "ckETH").await;
    let dcketh=create_token_canister("dckETH", "dckETH").await;
    let debtcketh=create_token_canister("debtckETH", "debtckETH").await;
    assets.insert("ckETH", (
        cketh_principal,
        ReserveData {
            asset_name: Some("ckEth".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0.0,
            borrow_rate: 0.0,
            supply_rate_apr: Some(0.0),
            d_token_canister: Some(dcketh.to_string()),
            debt_token_canister: Some(debtcketh.to_string()),
            total_supply: 0.0,
            total_borrowed:0.0,
            can_be_collateral: Some(false),
            liquidity_index: 1.0,
            id: 2,
            configuration: ReserveConfiguration {
                ltv:60, liquidation_threshold:70, liquidation_bonus:10, borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap:50000, supply_cap:70000, liquidation_protocol_fee:0
                
            },
            debt_index: 0.0,
        }
    ));
    
    let ckusdc_principal= create_testtoken_canister("ckUSDC", "ckUSDC").await;
    let dckusdc=create_token_canister("dckUSDC", "dckUSDC").await;
    let debtckusdc=create_token_canister("debtckUSDC", "debtckUSDC").await;
    assets.insert("ckUSDC", (
        ckusdc_principal,
        ReserveData {
            asset_name: Some("ckUSDC".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0.0,
            borrow_rate: 0.0,
            supply_rate_apr: Some(0.0),
            d_token_canister: Some(dckusdc.to_string()),
            debt_token_canister: Some(debtckusdc.to_string()),
            total_supply: 0.0,
            total_borrowed:0.0,
            can_be_collateral: Some(true),
            liquidity_index: 1.0,
            id: 3,
            configuration: ReserveConfiguration{
                ltv:75, liquidation_threshold:80, liquidation_bonus:5, borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap:100000, supply_cap:100000, liquidation_protocol_fee:0
                
            },
            debt_index: 0.0,
        }
    ));
    // assets.insert("ICP", (
    //     icp,
    //     ReserveData {
    //         asset_name: Some("ICP".to_string()),
    //         last_update_timestamp: time(),
    //         current_liquidity_rate: 0,
    //         borrow_rate: Some(8.25),
    //         supply_rate_apr: Some(8.25),
    //         d_token_canister: None,
    //         debt_token_canister: None,
    //         total_supply: Some(0.0),
    //         can_be_collateral: Some(true),
    //         liquidity_index: 1,
    //         id: 1,
    //         configuration: ReserveConfiguration{
    //             ltv:75, liquidation_threshold:80, liquidation_bonus:5, borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap:100000, supply_cap:100000, liquidation_protocol_fee:0
                
    //         },
    //     }
    // ));
    // Add more assets as needed...

    assets
}