use super::interest_variables::constants::{
    CKBTC_BORROW_CAP, CKBTC_LIQUIDATION_BONUS, CKBTC_LIQUIDATION_THRESHOLD, CKBTC_LIQUIDITY_INDEX,
    CKBTC_LTV, CKBTC_RESERVE_FACTOR, CKBTC_SUPPLY_CAP, CKETH_BORROW_CAP, CKETH_LIQUIDATION_BONUS,
    CKETH_LIQUIDATION_THRESHOLD, CKETH_LIQUIDITY_INDEX, CKETH_LTV, CKETH_RESERVE_FACTOR,
    CKETH_SUPPLY_CAP, CKUSDC_BORROW_CAP, CKUSDC_LIQUIDATION_BONUS, CKUSDC_LIQUIDATION_THRESHOLD,
    CKUSDC_LIQUIDITY_INDEX, CKUSDC_LTV, CKUSDC_RESERVE_FACTOR, CKUSDC_SUPPLY_CAP,
    CKUSDT_BORROW_CAP, CKUSDT_LIQUIDATION_BONUS_1, CKUSDT_LIQUIDATION_BONUS_2,
    CKUSDT_LIQUIDATION_THRESHOLD, CKUSDT_LIQUIDITY_INDEX, CKUSDT_LTV, CKUSDT_RESERVE_FACTOR,
    CKUSDT_SUPPLY_CAP, ICP_BORROW_CAP, ICP_LIQUIDATION_BONUS, ICP_LIQUIDATION_THRESHOLD,
    ICP_LIQUIDITY_INDEX, ICP_LTV, ICP_RESERVE_FACTOR, ICP_SUPPLY_CAP,
};
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::assets::{ReserveConfiguration, ReserveData};
use crate::declarations::storable::Candid;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::update;
use std::collections::HashMap;

#[update]
pub async fn initialize(token_name: String, mut reserve_data: ReserveData) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() || !ic_cdk::api::is_controller(&ic_cdk::api::caller()) {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let token_canister_id = match create_testtoken_canister(token_name.clone(), token_name.clone()).await {
        Ok(principal) => principal,
        Err(e) => return Err(e),
    };
    let d_token_name = format!("d{}", token_name.clone()); 
    let debt_token_name = format!("debt{}", token_name.clone()); 

    // Modify the reserve_data here
    reserve_data.asset_name = Some(token_name.clone());
    reserve_data.d_token_canister = match create_token_canister(d_token_name.clone(), d_token_name).await {
        Ok(principal) => Some(principal.to_string()),
        Err(e) => return Err(e),
    };
    reserve_data.debt_token_canister = match create_token_canister(debt_token_name.clone(), debt_token_name).await {
        Ok(principal) => Some(principal.to_string()),
        Err(e) => return Err(e),
    };

    mutate_state(|state| {
        state.reserve_list.insert(token_name.clone(), token_canister_id);
        let reserve_data_e = &mut state.asset_index;

        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
        ic_cdk::println!("Reserve for {} initialized successfully", token_name);
    });

    Ok(())
}

#[update]
pub async fn initialize_canister() -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous()
        || !ic_cdk::api::is_controller(&ic_cdk::api::caller())
    {
        ic_cdk::println!("principal are not allowed");
        return Err(Error::InvalidPrincipal);
    }

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
           
            let principal =  create_testtoken_canister(name.to_string(), symbol.to_string()).await;
            let testtoken_canister_principal = match principal {
                Ok(principal) => principal,
                Err(e) => {
                    return Err(e);
                }
            };
            testtoken_canister_principal
        } else {
            let principal = create_token_canister(name.to_string(), symbol.to_string()).await;
            let token_canister_principal = match principal {
                Ok(principal) => principal,
                Err(e) => {
                    return Err(e);
                }
            };
            token_canister_principal
        };
        canister_list.push((name.to_string(), principal));
    }

    ic_cdk::println!("canister list = {:?}", canister_list);

    mutate_state(|state| {
        for (name, principal) in canister_list {
            state.canister_list.insert(name, principal);
        }
    });
    Ok(())
}

pub async fn query_token_type_id(asset: String) -> Option<Principal> {
    ic_cdk::println!("Querying canister ID for asset: {}", asset);

    read_state(|state| {
        state.canister_list.get(&asset).map(|principal| {
            ic_cdk::println!("Found principal: {:?}", principal);
            principal.clone()
        })
    })
}

pub async fn get_asset_data() -> HashMap<&'static str, (Principal, ReserveData)> {
    let mut assets = HashMap::new();

    assets.insert( 
        "ckBTC",
        (
            query_token_type_id("ckBTC".to_string()).await.unwrap(),
            ReserveData {
                asset_name: Some("ckBTC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckBTC".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckBTC".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(CKBTC_LIQUIDITY_INDEX)),
                id: 1,
                accure_to_platform: Nat::from(0u128),
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(CKBTC_LTV)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(
                        CKBTC_LIQUIDATION_THRESHOLD,
                    )),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(CKBTC_LIQUIDATION_BONUS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(CKBTC_BORROW_CAP)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(CKBTC_SUPPLY_CAP)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(CKBTC_RESERVE_FACTOR)),
                },
                debt_index: Nat::from(0u128),
            },
        ),
    );

    assets.insert(
        "ckETH",
        (
            query_token_type_id("ckETH".to_string()).await.unwrap(),
            ReserveData {
                asset_name: Some("ckETH".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckETH".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckETH".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(CKETH_LIQUIDITY_INDEX)),
                id: 2,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(CKETH_LTV)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(
                        CKETH_LIQUIDATION_THRESHOLD,
                    )),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(CKETH_LIQUIDATION_BONUS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(CKETH_BORROW_CAP)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(CKETH_SUPPLY_CAP)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(CKETH_RESERVE_FACTOR)),
                },
                debt_index: Nat::from(0u128),
            },
        ),
    );

    assets.insert(
        "ckUSDC",
        (
            query_token_type_id("ckUSDC".to_string()).await.unwrap(),
            ReserveData {
                asset_name: Some("ckUSDC".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckUSDC".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckUSDC".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(CKUSDC_LIQUIDITY_INDEX)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(CKUSDC_LTV)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(
                        CKUSDC_LIQUIDATION_THRESHOLD,
                    )),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(CKUSDC_LIQUIDATION_BONUS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(CKUSDC_BORROW_CAP)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(CKUSDC_SUPPLY_CAP)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(CKUSDC_RESERVE_FACTOR)),
                },
                debt_index: Nat::from(0u128),
            },
        ),
    );

    assets.insert(
        "ICP",
        (
            query_token_type_id("ICP".to_string()).await.unwrap(),
            ReserveData {
                asset_name: Some("ICP".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dICP".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtICP".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(ICP_LIQUIDITY_INDEX)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(ICP_LTV)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(
                        ICP_LIQUIDATION_THRESHOLD,
                    )),
                    liquidation_bonus: ScalingMath::to_scaled(Nat::from(ICP_LIQUIDATION_BONUS)),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(ICP_BORROW_CAP)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(ICP_SUPPLY_CAP)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(ICP_RESERVE_FACTOR)),
                },
                debt_index: Nat::from(0u128),
            },
        ),
    );

    assets.insert(
        "ckUSDT",
        (
            query_token_type_id("ckUSDT".to_string()).await.unwrap(),
            ReserveData {
                asset_name: Some("ckUSDT".to_string()),
                last_update_timestamp: time(),
                current_liquidity_rate: Nat::from(0u128),
                borrow_rate: Nat::from(0u128),
                accure_to_platform: Nat::from(0u128),
                d_token_canister: Some(
                    query_token_type_id("dckUSDT".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                debt_token_canister: Some(
                    query_token_type_id("debtckUSDT".to_string())
                        .await
                        .unwrap()
                        .to_string(),
                ),
                asset_supply: Nat::from(0u128),
                asset_borrow: Nat::from(0u128),
                can_be_collateral: Some(true),
                liquidity_index: ScalingMath::to_scaled(Nat::from(CKUSDT_LIQUIDITY_INDEX)),
                id: 3,
                configuration: ReserveConfiguration {
                    ltv: ScalingMath::to_scaled(Nat::from(CKUSDT_LTV)),
                    liquidation_threshold: ScalingMath::to_scaled(Nat::from(
                        CKUSDT_LIQUIDATION_THRESHOLD,
                    )),
                    liquidation_bonus: ScalingMath::to_scaled(
                        Nat::from(CKUSDT_LIQUIDATION_BONUS_1)
                            / Nat::from(CKUSDT_LIQUIDATION_BONUS_2),
                    ),
                    borrowing_enabled: true,
                    frozen: false,
                    active: true,
                    paused: false,
                    borrow_cap: ScalingMath::to_scaled(Nat::from(CKUSDT_BORROW_CAP)),
                    supply_cap: ScalingMath::to_scaled(Nat::from(CKUSDT_SUPPLY_CAP)),
                    liquidation_protocol_fee: Nat::from(0u128),
                    reserve_factor: ScalingMath::to_scaled(Nat::from(CKUSDT_RESERVE_FACTOR)),
                },
                debt_index: Nat::from(0u128),
            },
        ),
    );

    assets
}
