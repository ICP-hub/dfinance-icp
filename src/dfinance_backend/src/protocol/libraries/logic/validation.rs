// use crate::api::functions::{get_balance, get_fees};
// use crate::api::state_handler::mutate_state;
// use crate::constants::errors::Error;
// use crate::declarations::assets::ReserveData;
// use crate::protocol::libraries::math::calculate::{
//     cal_average_threshold, calculate_health_factor, calculate_ltv, UserPosition,
// };
// use candid::Principal;
// use core::panic;

// pub struct ValidationLogic;

// impl ValidationLogic {
//     // -------------------------------------
//     // -------------- SUPPLY ---------------
//     // -------------------------------------

//     pub async fn validate_supply(
//         reserve: &ReserveData,
//         amount: u128,
//         user: Principal,
//         ledger_canister: Principal,
//     ) {
//         // validating amount
//         let user_balance = get_balance(ledger_canister, user).await;
//         ic_cdk::println!("User balance: {:?}", user_balance);

//         let transfer_fees = get_fees(ledger_canister).await;
//         ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

//         let final_amount = amount + transfer_fees;
//         ic_cdk::println!("final_amount : {:?}", final_amount);

//         if amount == 0 {
//             panic!("{:?}", Error::InvalidAmount);
//         }

//         if final_amount > user_balance {
//             panic!("{:?}", Error::MaxAmount);
//         }

//         // validating reserve states
//         let (is_active, is_frozen, is_paused) = (
//             reserve.configuration.active,
//             reserve.configuration.frozen,
//             reserve.configuration.paused,
//         );

//         if !is_active {
//             panic!("{:?}", Error::ReserveInactive);
//         }
//         if is_paused {
//             panic!("{:?}", Error::ReservePaused);
//         }
//         if is_frozen {
//             panic!("{:?}", Error::ReserveFrozen);
//         }
//         ic_cdk::println!("is_active : {:?}", is_active);
//         ic_cdk::println!("is_paused : {:?}", is_paused);
//         ic_cdk::println!("is_frozen : {:?}", is_frozen);

//         // Validating supply cap limit
//         let supply_cap = reserve.configuration.supply_cap;
//         ic_cdk::println!("supply_cap : {:?}", supply_cap);

//         let final_total_supply = final_amount + reserve.total_supply as u128; //usd
//         ic_cdk::println!("final_total_supply : {:?}", final_total_supply);

//         if final_total_supply >= supply_cap {
//             panic!("{:?}", Error::SupplyCapExceeded);
//         }
//     }

//     // -------------------------------------
//     // ------------- WITHDRAW --------------
//     // -------------------------------------

// //     pub async fn validate_withdraw(
// //         reserve: &ReserveData,
// //         amount: u128,
// //         user: Principal,
// //         ledger_canister: Principal,
// //     ) {
// //         // validating amount
// //         let transfer_fees = get_fees(ledger_canister).await;
// //         ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

// //         let final_amount = amount + transfer_fees;
// //         ic_cdk::println!("final_amount : {:?}", final_amount);

// //         if amount == 0 {
// //             panic!("{:?}", Error::InvalidAmount);
// //         }

// //         // Fetch user data
// //         let user_data_result = mutate_state(|state| {
// //             let user_profile_data = &mut state.user_profile;
// //             user_profile_data
// //                 .get(&user)
// //                 .map(|user| user.0.clone())
// //                 .ok_or_else(|| format!("User not found: {}", user.to_string()))
// //         });

// //         // Handle user data result
// //         let mut user_data = match user_data_result {
// //             Ok(data) => {
// //                 ic_cdk::println!("User found: {:?}", data);
// //                 data
// //             }
// //             Err(e) => {
// //                 ic_cdk::println!("Error: {}", e);
// //                 panic!("{:?}", e);
// //             }
// //         };

// //         let user_reserve = match user_data.reserves {
// //             Some(ref mut reserves) => reserves
// //                 .iter_mut()
// //                 .find(|(asset_name, _)| *asset_name == *reserve.asset_name.as_ref().unwrap()),
// //             None => None,
// //         };

// //         let mut user_current_supply = 0.0;

// //         if let Some((_, reserve_data)) = user_reserve {
// //             // If Reserve data exists
// //             user_current_supply = reserve_data.asset_supply;
// //         }

// //         if final_amount > user_current_supply as u128 {
// //             panic!("{:?}", Error::WithdrawMoreThanSupply);
// //         }

// //         // validating reserve states
// //         let (is_active, is_frozen, is_paused) = (
// //             reserve.configuration.active,
// //             reserve.configuration.frozen,
// //             reserve.configuration.paused,
// //         );

// //         if !is_active {
// //             panic!("{:?}", Error::ReserveInactive);
// //         }
// //         if is_paused {
// //             panic!("{:?}", Error::ReservePaused);
// //         }
// //         if is_frozen {
// //             panic!("{:?}", Error::ReserveFrozen);
// //         }
// //         ic_cdk::println!("is_active : {:?}", is_active);
// //         ic_cdk::println!("is_paused : {:?}", is_paused);
// //         ic_cdk::println!("is_frozen : {:?}", is_frozen);

// //         let user_total_debt = user_data.total_debt.unwrap_or(0.0);

// //         // Calculating next total debt
// //         let next_total_debt = amount as f64 + user_total_debt;
// //         ic_cdk::println!("Next total debt: {}", next_total_debt);

// //         // Calculating user liquidation threshold
// //         // let user_thrs = calculate_average_threshold(amount as f64, reserve, user_data.clone());
// //         let user_thrs = cal_average_threshold(
// //             usd_amount,
// //             0.0,
// //             reserve.configuration.liquidation_threshold,
// //             user_data.total_collateral.unwrap_or(0.0),
// //             user_data.liquidation_threshold.unwrap_or(0.0),
// //         );
// //         ic_cdk::println!("user_thr {:?}", user_thrs);

// //         let user_position = UserPosition {
// //             total_collateral_value: user_data.total_collateral.unwrap(),
// //             total_borrowed_value: next_total_debt,
// //             liquidation_threshold: user_thrs,
// //         };

// //         // Calculating LTV
// //         let ltv = calculate_ltv(&user_position);
// //         ic_cdk::println!("LTV {:?}", ltv);
// //         ic_cdk::println!(
// //             "user liq threshold {:?}",
// //             user_data.liquidation_threshold.unwrap()
// //         );

// //         if ltv >= user_data.liquidation_threshold.unwrap() {
// //             panic!("{:?}", Error::LTVGreaterThanThreshold);
// //         }

// //         // Calculating health factor
// //         let health_factor = calculate_health_factor(&user_position);

// //         if health_factor < 1.0 {
// //             panic!("{:?}", Error::HealthFactorLess);
// //         }
// //     }

// //     // --------------------------------------
// //     // --------------- BORROW ---------------
// //     // --------------------------------------

 

// //     // --------------------------------------
// //     // ---------------- REPAY ---------------
// //     // --------------------------------------

// //     pub async fn validate_repay(
// //         reserve: &ReserveData,
// //         amount: u128,
// //         user: Principal,
// //         ledger_canister: Principal,
// //     ) {
// //         // validating amount
// //         let transfer_fees = get_fees(ledger_canister).await;
// //         ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

// //         let final_amount = amount + transfer_fees;
// //         ic_cdk::println!("final_amount : {:?}", final_amount);

// //         if amount == 0 {
// //             panic!("{:?}", Error::InvalidAmount);
// //         }

// //         // Fetch user data
// //         let user_data_result = mutate_state(|state| {
// //             let user_profile_data = &mut state.user_profile;
// //             user_profile_data
// //                 .get(&user)
// //                 .map(|user| user.0.clone())
// //                 .ok_or_else(|| format!("User not found: {}", user.to_string()))
// //         });

// //         // Handle user data result
// //         let mut user_data = match user_data_result {
// //             Ok(data) => {
// //                 ic_cdk::println!("User found: {:?}", data);
// //                 data
// //             }
// //             Err(e) => {
// //                 ic_cdk::println!("Error: {}", e);
// //                 panic!("{:?}", e);
// //             }
// //         };

// //         let user_reserve = match user_data.reserves {
// //             Some(ref mut reserves) => reserves
// //                 .iter_mut()
// //                 .find(|(asset_name, _)| *asset_name == *reserve.asset_name.as_ref().unwrap()),
// //             None => None,
// //         };

// //         let mut user_current_debt = 0.0;

// //         if let Some((_, reserve_data)) = user_reserve {
// //             // If Reserve data exists
// //             user_current_debt = reserve_data.asset_borrow;
// //         }

// //         if final_amount > user_current_debt as u128 {
// //             panic!("{:?}", Error::RepayMoreThanDebt);
// //         }

// //         // validating reserve states
// //         let (is_active, is_frozen, is_paused) = (
// //             reserve.configuration.active,
// //             reserve.configuration.frozen,
// //             reserve.configuration.paused,
// //         );

// //         if !is_active {
// //             panic!("{:?}", Error::ReserveInactive);
// //         }
// //         if is_paused {
// //             panic!("{:?}", Error::ReservePaused);
// //         }
// //         if is_frozen {
// //             panic!("{:?}", Error::ReserveFrozen);
// //         }
// //         ic_cdk::println!("is_active : {:?}", is_active);
// //         ic_cdk::println!("is_paused : {:?}", is_paused);
// //         ic_cdk::println!("is_frozen : {:?}", is_frozen);
// //     }

// //     // --------------------------------------
// //     // ---------------- LIQUIDATION ---------------
// //     // --------------------------------------

// //     pub async fn validate_liquidation(repay_asset: String, amount: f64, liquidator: Principal) {
// //         let repay_ledger_canister_id = mutate_state(|state| {
// //             let reserve_list = &state.reserve_list;
// //             reserve_list
// //                 .get(&repay_asset.to_string().clone())
// //                 .map(|principal| principal.clone())
// //                 .ok_or_else(|| format!("No canister ID found for asset: {}", repay_asset))
// //         })
// //         .unwrap();

// //         let user_balance = get_balance(repay_ledger_canister_id, liquidator).await;
// //         ic_cdk::println!("User balance: {:?}", user_balance);

// //         let transfer_fees = get_fees(repay_ledger_canister_id).await;
// //         ic_cdk::println!("transfer_fees : {:?}", transfer_fees);

// //         let final_amount = amount as u128 + transfer_fees;
// //         ic_cdk::println!("final_amount : {:?}", final_amount);

// //         if amount == 0.0 {
// //             panic!("{:?}", Error::InvalidAmount);
// //         }

// //         if final_amount > user_balance {
// //             panic!("{:?}", Error::MaxAmount);
// //         }

// //         // Getting reserve data
// //         // Reads the reserve data from the asset
// //         let reserve_data_result = mutate_state(|state| {
// //             let asset_index = &mut state.asset_index;
// //             asset_index
// //                 .get(&repay_asset.to_string().clone())
// //                 .map(|reserve| reserve.0.clone())
// //                 .ok_or_else(|| format!("Reserve not found for asset: {}", repay_asset.to_string()))
// //         });

// //         let reserve_data = match reserve_data_result {
// //             Ok(data) => {
// //                 ic_cdk::println!("Reserve data found for asset: {:?}", data);
// //                 data
// //             }
// //             Err(e) => {
// //                 ic_cdk::println!("Error: {}", e);
// //                 panic!("{:?}", e);
// //             }
// //         };

// //         // validating reserve states
// //         let (is_active, is_frozen, is_paused) = (
// //             reserve_data.configuration.active,
// //             reserve_data.configuration.frozen,
// //             reserve_data.configuration.paused,
// //         );

// //         if !is_active {
// //             panic!("{:?}", Error::ReserveInactive);
// //         }
// //         if is_paused {
// //             panic!("{:?}", Error::ReservePaused);
// //         }
// //         if is_frozen {
// //             panic!("{:?}", Error::ReserveFrozen);
// //         }
// //         ic_cdk::println!("is_active : {:?}", is_active);
// //         ic_cdk::println!("is_paused : {:?}", is_paused);
// //         ic_cdk::println!("is_frozen : {:?}", is_frozen);
// //     }
// }
