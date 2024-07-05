use ic_cdk_macros::update;
use ic_cdk::export::{candid::{CandidType, Deserialize, Principal}};
use serde::Serialize;
use std::vec::Vec;
use ic_cdk::api::call::call;

use ipool::IPool;
use iinitializablea_token::IInitializableAToken;
use iinitializable_debt_token::IInitializableDebtToken;
use data_types::{DataTypes, ReserveConfigurationMap};
use configurator_input_types::ConfiguratorInputTypes;

#[derive(CandidType, Serialize, Deserialize)]
pub struct ReserveInitializedEvent {
    asset: Principal,
    a_token: Principal,
    stable_debt_token: Principal,
    variable_debt_token: Principal,
    interest_rate_strategy_address: Principal,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct ATokenUpgradedEvent {
    asset: Principal,
    proxy: Principal,
    implementation: Principal,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct StableDebtTokenUpgradedEvent {
    asset: Principal,
    proxy: Principal,
    implementation: Principal,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct VariableDebtTokenUpgradedEvent {
    asset: Principal,
    proxy: Principal,
    implementation: Principal,
}

#[update]
async fn execute_init_reserve(pool: Principal, input: ConfiguratorInputTypes::InitReserveInput) {
    let a_token_proxy_address = _init_token_with_proxy(
        input.a_token_impl,
        &IInitializableAToken::initialize(
            pool,
            input.treasury,
            input.underlying_asset,
            input.incentives_controller,
            input.underlying_asset_decimals,
            input.a_token_name,
            input.a_token_symbol,
            input.params.clone(),
        ),
    ).await;

    let stable_debt_token_proxy_address = _init_token_with_proxy(
        input.stable_debt_token_impl,
        &IInitializableDebtToken::initialize(
            pool,
            input.underlying_asset,
            input.incentives_controller,
            input.underlying_asset_decimals,
            input.stable_debt_token_name,
            input.stable_debt_token_symbol,
            input.params.clone(),
        ),
    ).await;

    let variable_debt_token_proxy_address = _init_token_with_proxy(
        input.variable_debt_token_impl,
        &IInitializableDebtToken::initialize(
            pool,
            input.underlying_asset,
            input.incentives_controller,
            input.underlying_asset_decimals,
            input.variable_debt_token_name,
            input.variable_debt_token_symbol,
            input.params.clone(),
        ),
    ).await;

    call::<_, ()>(pool, "initReserve", (input.underlying_asset, a_token_proxy_address, stable_debt_token_proxy_address, variable_debt_token_proxy_address, input.interest_rate_strategy_address)).await.unwrap();

    let mut current_config = DataTypes::ReserveConfigurationMap { data: 0 };
    current_config.set_decimals(input.underlying_asset_decimals);
    current_config.set_active(true);
    current_config.set_paused(false);
    current_config.set_frozen(false);

    call::<_, ()>(pool, "setConfiguration", (input.underlying_asset, current_config)).await.unwrap();

    ic_cdk::api::print(format!("ReserveInitialized event: {:?}", ReserveInitializedEvent {
        asset: input.underlying_asset,
        a_token: a_token_proxy_address,
        stable_debt_token: stable_debt_token_proxy_address,
        variable_debt_token: variable_debt_token_proxy_address,
        interest_rate_strategy_address: input.interest_rate_strategy_address,
    }));
}

#[update]
async fn execute_update_a_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateATokenInput) {
    let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
    let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

    let encoded_call = IInitializableAToken::initialize(
        cached_pool,
        input.treasury,
        input.asset,
        input.incentives_controller,
        decimals,
        input.name,
        input.symbol,
        input.params.clone(),
    );

    _upgrade_token_implementation(reserve_data.a_token_address, input.implementation, &encoded_call).await;

    ic_cdk::api::print(format!("ATokenUpgraded event: {:?}", ATokenUpgradedEvent {
        asset: input.asset,
        proxy: reserve_data.a_token_address,
        implementation: input.implementation,
    }));
}

#[update]
async fn execute_update_stable_debt_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateDebtTokenInput) {
    let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
    let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

    let encoded_call = IInitializableDebtToken::initialize(
        cached_pool,
        input.asset,
        input.incentives_controller,
        decimals,
        input.name,
        input.symbol,
        input.params.clone(),
    );

    _upgrade_token_implementation(reserve_data.stable_debt_token_address, input.implementation, &encoded_call).await;

    ic_cdk::api::print(format!("StableDebtTokenUpgraded event: {:?}", StableDebtTokenUpgradedEvent {
        asset: input.asset,
        proxy: reserve_data.stable_debt_token_address,
        implementation: input.implementation,
    }));
}

#[update]
async fn execute_update_variable_debt_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateDebtTokenInput) {
    let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
    let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

    let encoded_call = IInitializableDebtToken::initialize(
        cached_pool,
        input.asset,
        input.incentives_controller,
        decimals,
        input.name,
        input.symbol,
        input.params.clone(),
    );

    _upgrade_token_implementation(reserve_data.variable_debt_token_address, input.implementation, &encoded_call).await;

    ic_cdk::api::print(format!("VariableDebtTokenUpgraded event: {:?}", VariableDebtTokenUpgradedEvent {
        asset: input.asset,
        proxy: reserve_data.variable_debt_token_address,
        implementation: input.implementation,
    }));
}

async fn _init_token_with_proxy(implementation: Principal, init_params: &impl Serialize) -> Principal {
    let proxy = InitializableImmutableAdminUpgradeabilityProxy::new(ic_cdk::id());
    proxy.initialize(implementation, init_params).await;
    proxy.get_principal()
}

async fn _upgrade_token_implementation(proxy_address: Principal, implementation: Principal, init_params: &impl Serialize) {
    let proxy = InitializableImmutableAdminUpgradeabilityProxy::from_principal(proxy_address);
    proxy.upgrade_to_and_call(implementation, init_params).await;
}


