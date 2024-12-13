

use crate::declarations::assets::{ReserveConfiguration, ReserveData};
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use ic_cdk::api::time;
use std::collections::HashMap;

//pss all values by mul it by 10^8
pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    let ckbtc_principal = create_testtoken_canister("ckBTC", "ckBTC").await;
    let dckbtc = create_token_canister("dckBTC", "dckBTC").await;
    let debtckbtc = create_token_canister("debtckBTC", "debtckBTC").await;
    assets.insert(
        "ckBTC",
        (
            ckbtc_principal,
            ReserveData {
                asset_name: Some("ckBTC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                 //remove
                d_token_canister: Some(dckbtc.to_string()),
                debt_token_canister: Some(debtckbtc.to_string()),
                total_supply: Nat::from(0u128),
                total_borrowed: Nat::from(0u128),
                can_be_collateral: Some(true),
                // TODO: conversion to nat.
                liquidity_index: ScalingMath::to_scaled(Nat::from(1u128)),
                id: 1,
                accure_to_platform: Nat::from(0u128),
                //scale it
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(73u128)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(78u128)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(5u128)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(15u128)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

    let cketh_principal = create_testtoken_canister("ckETH", "ckETH").await;
    let dcketh = create_token_canister("dckETH", "dckETH").await;
    let debtcketh = create_token_canister("debtckETH", "debtckETH").await;
    assets.insert(
        "ckETH",
        (
            cketh_principal,
            ReserveData {
                asset_name: Some("ckETH".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(dcketh.to_string()),
                debt_token_canister: Some(debtcketh.to_string()),
                total_supply: Nat::from(0u128),
                total_borrowed: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(1u128)),
                id: 2,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(80u128)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(83u128)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(5u128)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(15u128)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

    let ckusdc_principal = create_testtoken_canister("ckUSDC", "ckUSDC").await;
    let dckusdc = create_token_canister("dckUSDC", "dckUSDC").await;
    let debtckusdc = create_token_canister("debtckUSDC", "debtckUSDC").await;
    assets.insert(
        "ckUSDC",
        (
            ckusdc_principal,
            ReserveData {
                asset_name: Some("ckUSDC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(dckusdc.to_string()),
                debt_token_canister: Some(debtckusdc.to_string()),
                total_supply: Nat::from(0u128),
                total_borrowed: Nat::from(0u128),
                asset_supply:Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(1u128)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(75u128)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(78u128)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(5u128)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(15u128)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );
    let icp_principal = create_testtoken_canister("ICP", "ICP").await;
    let dicp = create_token_canister("dICP", "dICP").await;
    let debticp = create_token_canister("debtICP", "debtICP").await;

    assets.insert(
        "ICP",
        (
            icp_principal,
            ReserveData {
                asset_name: Some("ICP".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(dicp.to_string()),
                debt_token_canister: Some(debticp.to_string()),
                total_supply: Nat::from(0u128),
                total_borrowed: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(1u128)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(58u128)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(63u128)),
                    liquidation_bonus: Nat::from(0u128),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(15u128)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

    let ckusdt_principal = create_testtoken_canister("ckUSDT", "ckUSDT").await;
    let dusdt = create_token_canister("dckUSDT", "dckUSDT").await;
    let debtusdt = create_token_canister("debtckUSDT", "debtckUSDT").await;

    assets.insert(
        "ckUSDT",
        (
            ckusdt_principal,
            ReserveData {
                asset_name: Some("ckUSDT".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(dusdt.to_string()),
                debt_token_canister: Some(debtusdt.to_string()),
                total_supply: Nat::from(0u128),
                total_borrowed: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(1u128)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(75u128)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(78u128)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(45u128) / Nat::from(10u128)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(10000000000u128)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(15u128)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

    assets
}
