use crate::api::state_handler::{mutate_state, read_state};
use crate::declarations::assets::{ReserveConfiguration, ReserveData};
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::{query, update};
use std::collections::HashMap;

#[update]
pub async fn initialize_canister() {
    // Define a list of tokens with their names, symbols, and whether to use `create_testtoken_canister`
    let tokens = vec![
        ("ckBTC", "ckBTC", true),    // Use `create_testtoken_canister` for `ckBTC`
        ("dckBTC", "dckBTC", false), // Use `create_token_canister` for `dckBTC`
        ("debtckBTC", "debtckBTC", false), // Use `create_token_canister` for `debtckBTC`
        ("ckETH", "ckETH", true),    // Use `create_testtoken_canister` for `ckETH`
        ("dckETH", "dckETH", false), // Use `create_token_canister` for `dckETH`
        ("debtckETH", "debtckETH", false), // Use `create_token_canister` for `debtckETH`
        ("ckUSDC", "ckUSDC", true),  // Use `create_testtoken_canister` for `ckUSDC`
        ("dckUSDC", "dckUSDC", false), // Use `create_token_canister` for `dckUSDC`
        ("debtckUSDC", "debtckUSDC", false), // Use `create_token_canister` for `debtckUSDC`
        ("ICP", "ICP", true),        // Use `create_testtoken_canister` for `ICP`
        ("dICP", "dICP", false),     // Use `create_token_canister` for `dICP`
        ("debtICP", "debtICP", false), // Use `create_token_canister` for `debtICP`
        ("ckUSDT", "ckUSDT", true),  // Use `create_testtoken_canister` for `ckUSDT`
        ("dckUSDT", "dckUSDT", false), // Use `create_token_canister` for `dckUSDT`
        ("debtckUSDT", "debtckUSDT", false), // Use `create_token_canister` for `debtckUSDT`
    ];

    // Initialize an empty vector to store the created canister principals
    let mut canister_list = vec![];

    // Loop through the tokens, create their canisters, and store the principals
    for (name, symbol, is_testtoken) in tokens {
        let principal = if is_testtoken {
            create_testtoken_canister(name, symbol).await
        } else {
            create_token_canister(name, symbol).await
        };
        canister_list.push((name.to_string(), principal));
    }

    ic_cdk::println!("canister list = {:?}", canister_list);

    // Insert the created canisters into the state
    mutate_state(|state| {
        for (name, principal) in canister_list {
            state.canister_list.insert(name, principal);
        }
    });
}

pub async fn query_token_type_id(asset: String) -> Principal {
    // Print the asset being queried for debugging purposes
    ic_cdk::println!("Querying canister ID for asset: {}", asset);
    
    // Fetch the canister id for the given asset and return only the Principal
    read_state(|state| {
        state
            .canister_list
            .get(&asset) // Fetch the principal for the asset
            .map(|principal| {
                // Print the principal value that was found
                ic_cdk::println!("Found principal: {:?}", principal);
                principal.clone() // Clone the principal if found
            })
            .unwrap_or_else(|| {
                // Print an error message if the asset is not found
                ic_cdk::println!("Error: No canister ID found for asset: {}", asset);
                panic!("No canister ID found for asset: {}", asset)
            })
        // Panic if not found
    })
}


//pss all values by mul it by 10^8
pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    // let ckbtc_principal = create_testtoken_canister("ckBTC", "ckBTC").await;
    // let dckbtc = create_token_canister("dckBTC", "dckBTC").await;
    // let debtckbtc = create_token_canister("debtckBTC", "debtckBTC").await;
    assets.insert(
        "ckBTC",
        (
            query_token_type_id("ckBTC".to_string()).await,
            ReserveData {
                asset_name: Some("ckBTC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                //remove
                d_token_canister: Some(query_token_type_id("dckBTC".to_string()).await.to_string()),
                debt_token_canister: Some(
                    query_token_type_id("debtckBTC".to_string())
                        .await
                        .to_string(),
                ),
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

    // let cketh_principal = create_testtoken_canister("ckETH", "ckETH").await;
    // let dcketh = create_token_canister("dckETH", "dckETH").await;
    // let debtcketh = create_token_canister("debtckETH", "debtckETH").await;
    assets.insert(
        "ckETH",
        (
            query_token_type_id("ckETH".to_string()).await,
            ReserveData {
                asset_name: Some("ckETH".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(query_token_type_id("dckETH".to_string()).await.to_string()),
                debt_token_canister: Some(
                    query_token_type_id("debtckETH".to_string())
                        .await
                        .to_string(),
                ),
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

    // let ckusdc_principal = create_testtoken_canister("ckUSDC", "ckUSDC").await;
    // let dckusdc = create_token_canister("dckUSDC", "dckUSDC").await;
    // let debtckusdc = create_token_canister("debtckUSDC", "debtckUSDC").await;
    assets.insert(
        "ckUSDC",
        (
            query_token_type_id("ckUSDC".to_string()).await,
            ReserveData {
                asset_name: Some("ckUSDC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckUSDC".to_string()).await.to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckUSDC".to_string())
                        .await
                        .to_string(),
                ),
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
    // let icp_principal = create_testtoken_canister("ICP", "ICP").await;
    // let dicp = create_token_canister("dICP", "dICP").await;
    // let debticp = create_token_canister("debtICP", "debtICP").await;

    assets.insert(
        "ICP",
        (
            query_token_type_id("ICP".to_string()).await,
            ReserveData {
                asset_name: Some("ICP".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(query_token_type_id("dICP".to_string()).await.to_string()),
                debt_token_canister: Some(
                    query_token_type_id("debtICP".to_string()).await.to_string(),
                ),
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

    // let ckusdt_principal = create_testtoken_canister("ckUSDT", "ckUSDT").await;
    // let dusdt = create_token_canister("dckUSDT", "dckUSDT").await;
    // let debtusdt = create_token_canister("debtckUSDT", "debtckUSDT").await;

    assets.insert(
        "ckUSDT",
        (
            query_token_type_id("ckUSDT".to_string()).await,
            ReserveData {
                asset_name: Some("ckUSDT".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckUSDT".to_string()).await.to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckUSDT".to_string())
                        .await
                        .to_string(),
                ),
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
                    liquidation_bonus: ScalingMath::to_scaled(
                        Nat::from(45u128) / Nat::from(10u128),
                    ),
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
