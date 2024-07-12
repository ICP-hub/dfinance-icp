use crate::{api::deposit::transfer_from_ckbtc, constants::asset_address::CKBTC_LEDGER_ADDRESS};
use candid::{Nat, Principal};

// Function to handle deposits
#[ic_cdk_macros::update]
async fn deposit_ckbtc(amount: u64) -> Result<Nat, String> {
    let ledger_canister_id =
        Principal::from_text(CKBTC_LEDGER_ADDRESS).map_err(|e| e.to_string())?;

    ic_cdk::println!("ckbtc canister principal {}", ledger_canister_id);
    let user_principal = ic_cdk::api::caller();
    let platform_principal =
        Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").map_err(|e| e.to_string())?;
    ic_cdk::println!("platform canister principal {}", platform_principal);

    let amount_nat = Nat::from(amount);
    transfer_from_ckbtc(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat,
    )
    .await
}


















// #[ic_cdk_macros::update]
// async fn supply_ckbtc(amount: u128, on_behalf_of: Principal, referral_code: u16) -> Result<Nat, String> {
//     let params = ExecuteSupplyParams {
//         asset: Principal::from_text(CKBTC_LEDGER_ADDRESS).map_err(|e| e.to_string())?,
//         amount,
//         on_behalf_of,
//         referral_code,
//     };

//     execute_supply(
//         get_reserves().await,
//         get_reserves_list().await,
//         get_user_config(on_behalf_of).await,
//         params,
//     ).await;

//     Ok(Nat::from(amount))
// }

// async fn execute_supply(
//     mut reserves_data: HashMap<Principal, ReserveData>,
//     reserves_list: Vec<Principal>,
//     mut user_config: UserConfigurationMap,
//     params: ExecuteSupplyParams,
// ) {
//     let reserve = reserves_data
//         .get_mut(&params.asset)
//         .expect("Reserve not found");
//     let mut reserve_cache = reserve.cache();

//     reserve.update_state(&mut reserve_cache);

//     validate_supply(&reserve_cache, reserve, params.amount);

//     reserve.update_interest_rates(&mut reserve_cache, params.asset, params.amount, 0);

//     let user_principal = api::caller();
//     transfer_from_ckbtc(
//         params.asset,
//         user_principal,
//         reserve_cache.a_token_address, //not sure (let platform_principal = Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").map_err(|e| e.to_string())?;)
//         Nat::from(params.amount),
//     ).await.expect("Transfer failed");

//     let is_first_supply = mint_a_token(
//         reserve_cache.a_token_address,
//         user_principal,
//         params.on_behalf_of,
//         params.amount,
//         reserve_cache.next_liquidity_index,
//     ).await;

//     if is_first_supply {
//         if validate_automatic_use_as_collateral(
//             &reserves_data,
//             &reserves_list,
//             &user_config,
//             &reserve_cache.reserve_configuration,
//             reserve_cache.a_token_address,
//         ) {
//             user_config.set_using_as_collateral(params.asset, true);
//             emit_reserve_used_as_collateral_enabled(params.asset, params.on_behalf_of);
//         }
//     }

//     emit_supply(
//         params.asset,
//         user_principal,
//         params.on_behalf_of,
//         params.amount,
//         params.referral_code,
//     );
// }


// // #[ic_cdk_macros::update]
// // async fn supply(asset: Principal, amount: u128, on_behalf_of: Principal, referral_code: u16) {
// //     let params = ExecuteSupplyParams {
// //         asset,
// //         amount,
// //         on_behalf_of,
// //         referral_code,
// //     };

// //     execute_supply(
// //         get_reserves().await,
// //         get_reserves_list().await,
// //         get_user_config(on_behalf_of).await,
// //         params,
// //     )
// //     .await;
// // }

// // async fn execute_supply(
// //     mut reserves_data: HashMap<Principal, ReserveData>,
// //     reserves_list: Vec<Principal>,
// //     mut user_config: UserConfigurationMap,
// //     params: ExecuteSupplyParams,
// // ) {
// //     let reserve = reserves_data
// //         .get_mut(&params.asset)
// //         .expect("Reserve not found");
// //     let mut reserve_cache = reserve.cache();

// //     reserve.update_state(&mut reserve_cache);

// //     validate_supply(&reserve_cache, reserve, params.amount);

// //     reserve.update_interest_rates(&mut reserve_cache, params.asset, params.amount, 0);

// //     api::call::call(
// //         params.asset,
// //         "transfer_from",
// //         (api::caller(), reserve_cache.a_token_address, params.amount),
// //     )
// //     .await
// //     .expect("Transfer failed");

// //     let is_first_supply = mint_a_token(
// //         reserve_cache.a_token_address,
// //         api::caller(),
// //         params.on_behalf_of,
// //         params.amount,
// //         reserve_cache.next_liquidity_index,
// //     )
// //     .await;

// //     if is_first_supply {
// //         if validate_automatic_use_as_collateral(
// //             &reserves_data,
// //             &reserves_list,
// //             &user_config,
// //             &reserve_cache.reserve_configuration,
// //             reserve_cache.a_token_address,
// //         ) {
// //             user_config.set_using_as_collateral(params.asset, true);
// //             emit_reserve_used_as_collateral_enabled(params.asset, params.on_behalf_of);
// //         }
// //     }

// //     emit_supply(
// //         params.asset,
// //         api::caller(),
// //         params.on_behalf_of,
// //         params.amount,
// //         params.referral_code,
// //     );
// // }

