use crate::api::state_handler::{mutate_state, read_state};
use crate::declarations::assets::{ReserveConfiguration, ReserveData};
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::update;
use std::collections::HashMap;

use super::interest_variables::constants::{EIGHTY_THREE_UNITS, EIGHTY_UNITS, FIFTEEN_UNITS, FIFTY_EIGHT, FIVE_UNITS, FOURTY_FIVE_UNITS, ONE_UNIT, SEVENTY_EIGHT_UNITS, SEVENTY_FIVE_UNITS, SEVENTY_THREE_UNITS, SIXTY_THREE, TEN_BILLION, TEN_UNITS};

#[update]
pub async fn initialize_canister() {
    let tokens = vec![
        ("ckBTC", "ckBTC", true),    
        ("dckBTC", "dckBTC", false), 
        ("debtckBTC", "debtckBTC", false),
        ("ckETH", "ckETH", true),    
        ("dckETH", "dckETH", false), 
        ("debtckETH", "debtckETH", false),
        ("ckUSDC", "ckUSDC", true),  
        ("dckUSDC", "dckUSDC", false), 
        ("debtckUSDC", "debtckUSDC", false), 
        ("ICP", "ICP", true),      
        ("dICP", "dICP", false),   
        ("debtICP", "debtICP", false), 
        ("ckUSDT", "ckUSDT", true),  
        ("dckUSDT", "dckUSDT", false), 
        ("debtckUSDT", "debtckUSDT", false), 
    ];

    let mut canister_list = vec![];

    for (name, symbol, is_testtoken) in tokens {
        let principal = if is_testtoken {
            create_testtoken_canister(name, symbol).await
        } else {
            create_token_canister(name, symbol).await
        };
        canister_list.push((name.to_string(), principal));
    }

    ic_cdk::println!("canister list = {:?}", canister_list);

    mutate_state(|state| {
        for (name, principal) in canister_list {
            state.canister_list.insert(name, principal);
        }
    });
}

// TODO: error handling and validations, remove panic need to do.
pub async fn query_token_type_id(asset: String) -> Principal {
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
    })
}

pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

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
                liquidity_index: ScalingMath::to_scaled(Nat::from(ONE_UNIT)),
                id: 1,
                accure_to_platform: Nat::from(0u128),
                //scale it
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(SEVENTY_THREE_UNITS)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(SEVENTY_EIGHT_UNITS)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(FIVE_UNITS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(FIFTEEN_UNITS)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

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
                liquidity_index: ScalingMath::to_scaled(Nat::from(ONE_UNIT)),
                id: 2,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(EIGHTY_UNITS)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(EIGHTY_THREE_UNITS)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(FIVE_UNITS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(FIFTEEN_UNITS)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

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
                liquidity_index: ScalingMath::to_scaled(Nat::from(ONE_UNIT)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(SEVENTY_FIVE_UNITS)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(SEVENTY_EIGHT_UNITS)),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(FIVE_UNITS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(FIFTEEN_UNITS)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

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
                liquidity_index: ScalingMath::to_scaled(Nat::from(ONE_UNIT)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(FIFTY_EIGHT)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(SIXTY_THREE)),
                    liquidation_bonus: Nat::from(0u128),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(FIFTEEN_UNITS)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

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
                liquidity_index: ScalingMath::to_scaled(Nat::from(ONE_UNIT)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(SEVENTY_FIVE_UNITS)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(SEVENTY_EIGHT_UNITS)),
                    liquidation_bonus: ScalingMath::to_scaled(
                        Nat::from(FOURTY_FIVE_UNITS) / Nat::from(TEN_UNITS),
                    ),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(TEN_BILLION)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(FIFTEEN_UNITS)),
                },
                debt_index: Nat::from(0u128),
                userlist: None,
            },
        ),
    );

    assets
}
