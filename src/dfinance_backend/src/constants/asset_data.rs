


use std::collections::HashMap;
use ic_cdk::api::time;
use candid::Principal;
use crate::declarations::assets::{ReserveData, ReserveConfiguration};
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::libraries::math::math_utils::ScalingMath;


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
            current_liquidity_rate: 0,
            borrow_rate: 0,
            supply_rate_apr: Some(0), //remove
            d_token_canister: Some(dckbtc.to_string()),
            debt_token_canister: Some(debtckbtc.to_string()),
            total_supply: 0,
            total_borrowed:0,
            can_be_collateral: Some(true),
            liquidity_index: ScalingMath::to_scaled(1),
            id: 1,
            //scale it
            configuration: ReserveConfiguration {
                ltv: ScalingMath::to_scaled(73), liquidation_threshold: ScalingMath::to_scaled(78), liquidation_bonus: ScalingMath::to_scaled(5), borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap: ScalingMath::to_scaled(10000000000), supply_cap: ScalingMath::to_scaled(10000000000), liquidation_protocol_fee:0,
                reserve_factor: ScalingMath::to_scaled(20)
            },
            debt_index: 0,
            userlist: None,
        }
    ));

    
    let cketh_principal= create_testtoken_canister("ckETH", "ckETH").await;
    let dcketh=create_token_canister("dckETH", "dckETH").await;
    let debtcketh=create_token_canister("debtckETH", "debtckETH").await;
    assets.insert("ckETH", (
        cketh_principal,
        ReserveData {
            asset_name: Some("ckETH".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: 0,
            supply_rate_apr: Some(0),
            d_token_canister: Some(dcketh.to_string()),
            debt_token_canister: Some(debtcketh.to_string()),
            total_supply: 0,
            total_borrowed:0,
            can_be_collateral: Some(true),
            liquidity_index:  ScalingMath::to_scaled(1),
            id: 2,
            configuration: ReserveConfiguration {
                ltv: ScalingMath::to_scaled(80), liquidation_threshold: ScalingMath::to_scaled(83), liquidation_bonus: ScalingMath::to_scaled(5), borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap: ScalingMath::to_scaled(10000000000), supply_cap: ScalingMath::to_scaled(10000000000), liquidation_protocol_fee:0,
                reserve_factor: ScalingMath::to_scaled(15)
            },
            debt_index: 0,
            userlist: None,
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
            current_liquidity_rate: 0,
            borrow_rate: 0,
            supply_rate_apr: Some(0),
            d_token_canister: Some(dckusdc.to_string()),
            debt_token_canister: Some(debtckusdc.to_string()),
            total_supply: 0,
            total_borrowed:0,
            can_be_collateral: Some(true),
            liquidity_index:  ScalingMath::to_scaled(1),
            id: 3,
            configuration: ReserveConfiguration{
                ltv: ScalingMath::to_scaled(75), liquidation_threshold: ScalingMath::to_scaled(78), liquidation_bonus: ScalingMath::to_scaled(5), borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap: ScalingMath::to_scaled(10000000000), supply_cap: ScalingMath::to_scaled(10000000000), liquidation_protocol_fee:0,
                reserve_factor: ScalingMath::to_scaled(10)
            },
            debt_index: 0,
            userlist: None,
        }
    ));
    let icp_principal = create_testtoken_canister("ICP", "ICP").await;;
    let dicp=create_token_canister("dICP", "dICP").await;
    let debticp=create_token_canister("debtICP", "debtICP").await;

    assets.insert("ICP", (
        icp_principal,
        ReserveData {
            asset_name: Some("ICP".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: 0,
            supply_rate_apr: Some(0),
            d_token_canister:  Some(dicp.to_string()),
            debt_token_canister:  Some(debticp.to_string()),
            total_supply: 0,
            total_borrowed:0,
            can_be_collateral: Some(true),
            liquidity_index:  ScalingMath::to_scaled(1),
            id: 3,
            configuration: ReserveConfiguration{
                ltv: ScalingMath::to_scaled(58), liquidation_threshold: ScalingMath::to_scaled(63), liquidation_bonus:0, borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap: ScalingMath::to_scaled(10000000000), supply_cap: ScalingMath::to_scaled(10000000000), liquidation_protocol_fee:0,
                reserve_factor: ScalingMath::to_scaled(20)
            },
            debt_index: 0,
            userlist: None,
        }
    ));

    let ckusdt_principal = create_testtoken_canister("ckUSDT", "ckUSDT").await;;
    let dusdt=create_token_canister("dckUSDT", "dckUSDT").await;
    let debtusdt=create_token_canister("debtckUSDT", "debtckUSDT").await;

    assets.insert("ckUSDT", (
        icp_principal,
        ReserveData {
            asset_name: Some("ckUSDT".to_string()),
            last_update_timestamp: time(),
            current_liquidity_rate: 0,
            borrow_rate: 0,
            supply_rate_apr: Some(0),
            d_token_canister:  Some(dicp.to_string()),
            debt_token_canister:  Some(debticp.to_string()),
            total_supply: 0,
            total_borrowed:0,
            can_be_collateral: Some(true),
            liquidity_index:  ScalingMath::to_scaled(1),
            id: 3,
            configuration: ReserveConfiguration{
                ltv: ScalingMath::to_scaled(75), liquidation_threshold: ScalingMath::to_scaled(78), liquidation_bonus:ScalingMath::to_scaled((45/10)), borrowing_enabled:true, frozen:false, active:true, paused:false, borrow_cap: ScalingMath::to_scaled(10000000000), supply_cap: ScalingMath::to_scaled(10000000000), liquidation_protocol_fee:0,
                reserve_factor: ScalingMath::to_scaled(10)
            },
            debt_index: 0,
            userlist: None,
        }
    ));
    // Add more assets as needed...

    assets
}


