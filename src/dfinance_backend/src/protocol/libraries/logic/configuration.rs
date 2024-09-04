// use ic_cdk_macros::update;
// use candid::{CandidType, Deserialize, Principal};
// use serde::Serialize;
// use std::vec::Vec;
// use ic_cdk::api::call::call;


// // use pool::Pool;
// // use initializabled_token::InitializableDToken;
// // use initializable_debt_token::InitializableDebtToken;


// use crate::protocol::libraries::types::datatypes::InitReserveInput;


// #[derive(CandidType, Serialize, Deserialize, Debug)]
// pub struct ReserveInitialized {
//     asset: Principal,
//     d_token: Principal,
//     stable_debt_token: Principal,
//     variable_debt_token: Principal,
//     interest_rate_strategy_address: Principal,
// }

// #[derive(CandidType, Serialize, Deserialize)]
// pub struct DTokenUpgraded {
//     asset: Principal,
//     proxy: Principal,
//     implementation: Principal,
// }

// #[derive(CandidType, Serialize, Deserialize)]
// pub struct StableDebtTokenUpgraded {
//     asset: Principal,
//     proxy: Principal,
//     implementation: Principal,
// }

// #[derive(CandidType, Serialize, Deserialize)]
// pub struct VariableDebtTokenUpgraded {
//     asset: Principal,
//     proxy: Principal,
//     implementation: Principal,
// }

// #[update]
// async fn execute_init_reserve(pool: Principal, input: InitReserveInput) {
//     let d_token_proxy_address = _init_token_with_proxy(
//         input.d_token_impl,
//         &InitializableDToken::initialize(
//             pool,
//             input.treasury,
//             input.underlying_asset,
//             input.incentives_controller,
//             input.underlying_asset_decimals,
//             input.d_token_name,
//             input.d_token_symbol,
//             input.params.clone(),
//         ),
//     ).await;

//     let stable_debt_token_proxy_address = _init_token_with_proxy(
//         input.stable_debt_token_impl,
//         &InitializableDebtToken::initialize(
//             pool,
//             input.underlying_asset,
//             input.incentives_controller,
//             input.underlying_asset_decimals,
//             input.stable_debt_token_name,
//             input.stable_debt_token_symbol,
//             input.params.clone(),
//         ),
//     ).await;

//     let variable_debt_token_proxy_address = _init_token_with_proxy(
//         input.variable_debt_token_impl,
//         &InitializableDebtToken::initialize(
//             pool,
//             input.underlying_asset,
//             input.incentives_controller,
//             input.underlying_asset_decimals,
//             input.variable_debt_token_name,
//             input.variable_debt_token_symbol,
//             input.params.clone(),
//         ),
//     ).await;

//     call::<_, ()>(pool, "initReserve", (input.underlying_asset, d_token_proxy_address, stable_debt_token_proxy_address, variable_debt_token_proxy_address, input.interest_rate_strategy_address)).await.unwrap();

//     let mut current_config = DataTypes::ReserveConfigurationMap { data: 0 };
//     current_config.set_decimals(input.underlying_asset_decimals);
//     current_config.set_active(true);
//     current_config.set_paused(false);
//     current_config.set_frozen(false);

//     call::<_, ()>(pool, "setConfiguration", (input.underlying_asset, current_config)).await.unwrap();

//     print(format!("ReserveInitialized event: {:?}", ReserveInitialized {
//         asset: input.underlying_asset,
//         d_token: d_token_proxy_address,
//         stable_debt_token: stable_debt_token_proxy_address,
//         variable_debt_token: variable_debt_token_proxy_address,
//         interest_rate_strategy_address: input.interest_rate_strategy_address,
//     }));
// }

// // #[update]
// // async fn execute_update_d_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateDTokenInput) {
// //     let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
// //     let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

// //     let encoded_call = IInitializableDToken::initialize(
// //         cached_pool,
// //         input.treasury,
// //         input.asset,
// //         input.incentives_controller,
// //         decimals,
// //         input.name,
// //         input.symbol,
// //         input.params.clone(),
// //     );

// //     _upgrade_token_implementation(reserve_data.d_token_address, input.implementation, &encoded_call).await;

// //     ic_cdk::api::print(format!("DTokenUpgraded event: {:?}", DTokenUpgradedEvent {
// //         asset: input.asset,
// //         proxy: reserve_data.d_token_address,
// //         implementation: input.implementation,
// //     }));
// // }

// // #[update]
// // async fn execute_update_stable_debt_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateDebtTokenInput) {
// //     let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
// //     let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

// //     let encoded_call = IInitializableDebtToken::initialize(
// //         cached_pool,
// //         input.asset,
// //         input.incentives_controller,
// //         decimals,
// //         input.name,
// //         input.symbol,
// //         input.params.clone(),
// //     );

// //     _upgrade_token_implementation(reserve_data.stable_debt_token_address, input.implementation, &encoded_call).await;

// //     ic_cdk::api::print(format!("StableDebtTokenUpgraded event: {:?}", StableDebtTokenUpgradedEvent {
// //         asset: input.asset,
// //         proxy: reserve_data.stable_debt_token_address,
// //         implementation: input.implementation,
// //     }));
// // }

// // #[update]
// // async fn execute_update_variable_debt_token(cached_pool: Principal, input: ConfiguratorInputTypes::UpdateDebtTokenInput) {
// //     let reserve_data = call::<_, DataTypes::ReserveData>(cached_pool, "getReserveData", (input.asset,)).await.unwrap();
// //     let (_, _, _, decimals, _, _) = call::<_, (u8, u8, u8, u8, u8, u8)>(cached_pool, "getConfiguration", (input.asset,)).await.unwrap();

// //     let encoded_call = IInitializableDebtToken::initialize(
// //         cached_pool,
// //         input.asset,
// //         input.incentives_controller,
// //         decimals,
// //         input.name,
// //         input.symbol,
// //         input.params.clone(),
// //     );

// //     _upgrade_token_implementation(reserve_data.variable_debt_token_address, input.implementation, &encoded_call).await;

// //     ic_cdk::api::print(format!("VariableDebtTokenUpgraded event: {:?}", VariableDebtTokenUpgradedEvent {
// //         asset: input.asset,
// //         proxy: reserve_data.variable_debt_token_address,
// //         implementation: input.implementation,
// //     }));
// // }

// // async fn _init_token_with_proxy(implementation: Principal, init_params: &impl Serialize) -> Principal {
// //     let proxy = InitializableImmutableAdminUpgradeabilityProxy::new(ic_cdk::id());
// //     proxy.initialize(implementation, init_params).await;
// //     proxy.get_principal()
// // }

// // async fn _upgrade_token_implementation(proxy_address: Principal, implementation: Principal, init_params: &impl Serialize) {
// //     let proxy = InitializableImmutableAdminUpgradeabilityProxy::from_principal(proxy_address);
// //     proxy.upgrade_to_and_call(implementation, init_params).await;
// // }

