// use crate::api::state_handler::read_state;
// use crate::constants::errors::Error;
// use crate::declarations::assets::ExecuteRepayParams;
// use crate::protocol::libraries::logic::borrow::execute_repay;
// use crate::protocol::libraries::logic::reserve::{self, burn_scaled};
// use crate::protocol::libraries::logic::update::{user_data, user_reserve};
// use crate::protocol::libraries::logic::validation::ValidationLogic;
// use crate::{
//     api::{functions::asset_transfer, state_handler::mutate_state},
//     declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams},
//     protocol::libraries::{logic::update::UpdateLogic, math::calculate::get_exchange_rates},
// };
// use candid::{Nat, Principal};
// use ic_cdk::{api, update};

// // pub struct LiquidationLogic;

// // impl LiquidationLogic {
// #[update]
// pub async fn execute_liquidation(
//     debt_asset: String,
//     collateral_asset: String,
//     amount: Nat,
//     on_behalf_of: Principal,
// ) -> Result<Nat, Error> {
//     if debt_asset.trim().is_empty() && collateral_asset.trim().is_empty() {
//         ic_cdk::println!("Asset cannot be an empty string");
//         return Err(Error::EmptyAsset);
//     }

//     if debt_asset.len() > 7 && collateral_asset.len() > 7 {
//         ic_cdk::println!("Asset must have a maximum length of 7 characters");
//         return Err(Error::InvalidAssetLength);
//     }

//     if amount <= Nat::from(0u128) {
//         ic_cdk::println!("Amount cannot be zero");
//         return Err(Error::InvalidAmount);
//     }

//     if on_behalf_of == Principal::anonymous() {
//         ic_cdk::println!("Anonymous principals are not allowed");
//         return Err(Error::InvalidPrincipal);
//     }
//     let platform_principal = ic_cdk::api::id();

//     let user_principal = on_behalf_of;
//     ic_cdk::println!("User Principal (Debt User): {}", user_principal);

//     let liquidator_principal = api::caller();
//     ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

//     if liquidator_principal == Principal::anonymous() {
//         ic_cdk::println!("Anonymous principals are not allowed");
//         return Err(Error::InvalidPrincipal);
//     }
//     if liquidator_principal != ic_cdk::caller() {
//         return Err(Error::InvalidUser);
//     }

//     ic_cdk::println!(
//         "params debt_asset and collateral_asset {:?} {:?}",
//         debt_asset,
//         collateral_asset
//     );
//     ic_cdk::println!("liquidation amount = {}", amount);

//     let mut debt_in_usd = amount;
//     let debt_amount_to_usd = get_exchange_rates(debt_asset.clone(), None, amount).await;
//     match debt_amount_to_usd {
//         Ok((amount_in_usd, _timestamp)) => {
//             // Extracted the amount in USD
//             debt_in_usd = amount_in_usd;
//             ic_cdk::println!("debt amount in USD: {:?}", amount_in_usd);
//         }
//         Err(e) => {
//             // Handling the error
//             ic_cdk::println!("Error getting exchange rate: {:?}", e);
//         }
//     }
//     let collateral_reserve_data_result = mutate_state(|state| {
//         let asset_index = &mut state.asset_index;
//         asset_index
//             .get(&collateral_asset.to_string().clone())
//             .map(|reserve| reserve.0.clone())
//             .ok_or_else(|| Error::NoReserveDataFound)
//     });

//     let mut collateral_reserve_data = match collateral_reserve_data_result {
//         Ok(data) => {
//             ic_cdk::println!("Reserve data found for asset: {:?}", data);
//             data
//         }
//         Err(e) => {
//             ic_cdk::println!("Error: {}", e);
//             return Err(e);
//         }
//     };

//     let user_data_result = user_data(user_principal);
//     let mut user_account_data = match user_data_result {
//         Ok(data) => {
//             ic_cdk::println!("User found in update_user_data_supply");
//             data
//         }
//         Err(e) => {
//             ic_cdk::println!("Error fetching user data: {}", e);
//             return Err(e);
//         }
//     };

//     //TODO error handling
//     // Check if the user has a reserve for the asset
//     let mut user_reserve_result = user_reserve(&mut user_account_data, &collateral_asset);
//     let mut user_reserve_data = match user_reserve_result.as_mut() {
//         Some((_, reserve_data)) => reserve_data,
//         None => {
//             let error_msg = "No reserve found for the user".to_string();
//             ic_cdk::println!("{}", error_msg);
//             return Err(error_msg);
//         }
//     };

//     let liquidator_data_result = user_data(liquidator_principal);
//     let mut liquidator_data = match liquidator_data_result {
//         Ok(data) => {
//             ic_cdk::println!("User found in update_user_data_supply");
//             data
//         }
//         Err(e) => {
//             ic_cdk::println!("Error fetching user data: {}", e);
//             return Err(e);
//         }
//     };

//     let dtoken_canister = read_state(|state| {
//         let asset_index = &state.asset_index;
//         asset_index
//             .get(&collateral_asset.to_string().clone())
//             .and_then(|reserve_data| reserve_data.d_token_canister.clone())
//             .ok_or_else(|| Error::NoCanisterIdFound)
//     })?;

//     let collateral_dtoken_principal = Principal::from_text(dtoken_canister)
//         .map_err(|_| Error::ConversionErrorFromTextToPrincipal)?;

//     //TODO make constant name as base currency = "USD"
//     let collateral_amount = match get_exchange_rates(
//         "USD".to_string(),
//         Some(collateral_asset.clone()),
//         debt_in_usd.clone(),
//     )
//     .await
//     {
//         Ok((total_value, _time)) => {
//             // Store the total_value returned from the get_exchange_rates function
//             total_value
//         }
//         Err(e) => {
//             // Handle the error case
//             ic_cdk::println!("Error fetching exchange rate: {:?}", e);
//             Nat::from(0u128) // Or handle the error as appropriate for your logic
//         }
//     };
//     ic_cdk::println!("Collateral amount rate: {}", collateral_amount);

//     //TODO use scaled_mul
//     let bonus = collateral_amount.clone()
//         * (collateral_reserve_data
//             .configuration
//             .liquidation_bonus
//             .clone()
//             / Nat::from(100u128))
//         / Nat::from(100000000u128);
//     ic_cdk::println!("bonus: {}", bonus);
//     let reward_amount: Nat = collateral_amount.clone() + bonus.clone();
//     ic_cdk::println!("reward_amount: {}", reward_amount);

//     let supply_param = ExecuteSupplyParams {
//         asset: collateral_asset.to_string(),
//         amount: reward_amount.clone(),
//         is_collateral: true,
//     };

//     let mut collateral_reserve_cache = reserve::cache(&collateral_reserve_data);
//     reserve::update_state(&mut collateral_reserve_data, &mut collateral_reserve_cache);
//     let _ = reserve::update_interest_rates(
//         &mut collateral_reserve_data,
//         &mut collateral_reserve_cache,
//         Nat::from(0u128),
//         Nat::from(0u128),
//     )
//     .await;
//     ic_cdk::println!("Reserve cache fetched successfully: {:?}", collateral_reserve_cache);

//     if let Err(e) =   ValidationLogic::validate_liquidation(
//         debt_asset.clone(),
//         amount.clone(),
//         reward_amount.clone(),
//         liquidator_principal,
//         user_principal,
//         repay_reserve_data //yeh kya hai
//     )
//     .await {
//         ic_cdk::println!("liquidation validation failed: {:?}", e);
//         return Err(e);
//     };

//     let withdraw_param = ExecuteWithdrawParams {
//         asset: collateral_asset.to_string(),
//         is_collateral: true,
//         on_behalf_of: None, //TODO why none, user principal
//         amount: reward_amount,
//     };
//     // let user_withdraw_result = UpdateLogic::update_user_data_withdraw(
//     //     user_principal,
//     //     &collateral_reserve_cache,
//     //     withdraw_param,
//     //     &collateral_reserve_data,
//     // ).await;
//     let burn_scaled_result = burn_scaled(
//         &mut collateral_reserve_data,
//         &mut user_reserve_data,
//         reward_amount.clone(),
//         collateral_reserve_cache.next_liquidity_index,
//         user_principal,
//         collateral_dtoken_principal,
//         platform_principal,
//         true,
//     )
//     .await; //handle error
//     match burn_scaled_result {
//         Ok(()) => {
//             ic_cdk::println!("Burning dToken successfully completed");
//         }
//         Err(e) => {
//             panic!("Error in burning the dToken: {:?}", e);
//         }
//     };
//     let liquidator_mint_result = UpdateLogic::update_user_data_supply(
//         liquidator_principal,
//         &collateral_reserve_cache,
//         supply_param,
//         &mut collateral_reserve_data,
//     )
//     .await;
//     match liquidator_mint_result {
//         Ok(()) => {
//             ic_cdk::println!("Minting dtokens successfully");
//         }
//         Err(e) => {
//             let error_msg = format!("Error in minting the dtokens: {:?}", e);
//             ic_cdk::println!("{}", error_msg);
//             return Err(error_msg);
//             //mint back dtoken to user
//         }
//     }

//     let params_repay = ExecuteRepayParams {
//         asset: debt_asset.clone(),
//         amount: amount.clone(),
//         on_behalf_of: Some(user_principal),
//     };

//     let repay_response = execute_repay(params_repay).await;

//     match repay_response {
//         Ok(_) => ic_cdk::println!("Repayment successful"),
//         Err(e) => {
//             let mut liquidator_collateral_reserve =
//                 user_reserve(&mut liquidator_data, &collateral_asset);
//             let mut liquidator_reserve_data = match liquidator_collateral_reserve.as_mut() {
//                 Some((_, reserve_data)) => reserve_data,
//                 None => {
//                     //TODO no error needed, just create a new reserve
//                     let error_msg = "No reserve found for the user".to_string();
//                     ic_cdk::println!("{}", error_msg);
//                     return Err(error_msg);
//                 }
//             };
//             let rollback_dtoken_from_liquidator = burn_scaled(
//                 &mut collateral_reserve_data,
//                 &mut liquidator_reserve_data,
//                 reward_amount.clone(),
//                 collateral_reserve_cache.next_liquidity_index,
//                 liquidator_principal,
//                 collateral_dtoken_principal,
//                 platform_principal,
//                 true,
//             )
//             .await?;
//             let rollback_dtoken_to_user = mint_scaled(
//                 &mut collateral_reserve_data,
//                 &mut user_reserve_data,
//                 reward_amount,
//                 collateral_reserve_cache.next_liquidity_index,
//                 user_principal,
//                 collateral_dtoken_principal,
//                 platform_principal,
//                 true,
//             )
//             .await?;
//             //TODO store state
//             ic_cdk::trap(&format!("Repayment failed: {}", e));
//         } //TODO burn liquidator dtoken //TODO mint back the dtoken to user
//     }
// }
    // Burning dtoken
    // match asset_transfer(
    //     platform_principal,
    //     dtoken_canister_principal,
    //     user_principal,
    //     reward_amount.clone(),
    // )
    // .await
    // {
    //     Ok(balance) => {
    //         ic_cdk::println!(
    //             "Dtoken Asset transfer from user to backend canister executed successfully"
    //         );
    //         balance
    //     }
    //     Err(err) => {
    //         return Err(Error::ErrorBurnTokens);
    //     }
    // };
    // let usd_amount = 60812; //change it
    //                         // Minting dtoken
    // match asset_transfer(
    //     liquidator_principal,
    //     dtoken_canister_principal,
    //     platform_principal,
    //     reward_amount.clone(),
    // )
    // .await
    // {
    //     Ok(balance) => {
    //         ic_cdk::println!(
    //             "Dtoken Asset transfer from backend to liquidator executed successfully"
    //         );
    //         // let _ = UpdateLogic::update_user_data_withdraw(
    //         //     user_principal,
    //         //     &reserve_cache,
    //         //     withdraw_param,
    //         //     &reserve_data,
    //         // )
    //         // .await;
    //         // let _ = UpdateLogic::update_user_data_supply(
    //         //     liquidator_principal,
    //         //     &reserve_cache,
    //         //     supply_param,
    //         //     &mut reserve_data,
    //         //     //usd_amount,
    //         // )
    //         // .await;
    //         Ok(balance)
    //     }
    //     Err(_) => {
    //         if let Err(e) = asset_transfer(
    //             user_principal,
    //             dtoken_canister_principal,
    //             platform_principal,
    //             reward_amount.clone(),
    //         )
    //         .await
    //         {
    //             ic_cdk::println!("Error during asset transfer: {:?}", e);
    //         }
    //         return Err(Error::ErrorMintDTokens);
    //     }
    // }

//}



use crate::api::state_handler::read_state;
use crate::constants::errors::Error;
use crate::declarations::assets::ExecuteRepayParams;
use crate::declarations::storable::Candid;
use crate::get_reserve_data;
use crate::protocol::libraries::logic::borrow::execute_repay;
use crate::protocol::libraries::logic::reserve::{self, burn_scaled, mint_scaled};
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::{
    api::{functions::asset_transfer, state_handler::mutate_state},
    declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams},
    protocol::libraries::{logic::update::UpdateLogic, math::calculate::get_exchange_rates},
};
use candid::{Nat, Principal};
use ic_cdk::{api, update};

// pub struct LiquidationLogic;

// impl LiquidationLogic {
#[update]
pub async fn execute_liquidation(
    debt_asset: String,
    collateral_asset: String,
    amount: Nat,
    on_behalf_of: Principal,
) -> Result<Nat, Error> {
    if debt_asset.trim().is_empty() && collateral_asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if debt_asset.len() > 7 && collateral_asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if on_behalf_of == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }
    let platform_principal = ic_cdk::api::id();

    let user_principal = on_behalf_of;
    ic_cdk::println!("User Principal (Debt User): {}", user_principal);

    let liquidator_principal = api::caller();
    ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

    if liquidator_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    ic_cdk::println!(
        "params debt_asset and collateral_asset {:?} {:?}",
        debt_asset,
        collateral_asset
    );
    ic_cdk::println!("liquidation amount = {}", amount.clone());
    
    // let mut debt_in_usd = amount.clone();
    // let debt_amount_to_usd = get_exchange_rates(debt_asset.clone(), None, amount.clone()).await;
    // match debt_amount_to_usd {
    //     Ok((amount_in_usd, _timestamp)) => {
    //         // Extracted the amount in USD
    //         debt_in_usd = amount_in_usd;
    //         ic_cdk::println!("debt amount in USD: {:?}", debt_in_usd.clone());
    //     }
    //     Err(e) => {
    //         // Handling the error
    //         ic_cdk::println!("Error getting exchange rate: {:?}", e);
    //         return Err(e);
    //     }
    // }
    //icp -> usd -> ckUSDC
    //icp -> usd -> icp 
    //avoid usd-> token conversion, 
    let reserve_data_result = get_reserve_data(debt_asset.clone());

    let repay_reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {:?}", e);
            return Err(e);
        }
    };
    
    let collateral_reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&collateral_asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let mut collateral_reserve_data = match collateral_reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {:?}", e);
            return Err(e);
        }
    };

    let user_data_result = user_data(user_principal);
    let mut user_account_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found in update_user_data_supply");
            data
        }
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

    //TODO error handling
    // Check if the user has a reserve for the asset
    let mut user_reserve_result = user_reserve(&mut user_account_data, &collateral_asset);
    let mut user_reserve_data = match user_reserve_result.as_mut() {
        Some((_, reserve_data)) => reserve_data,
        None => {
            return Err(Error::NoUserReserveDataFound);
        }
    };

    let liquidator_data_result = user_data(liquidator_principal);
    let mut liquidator_data = match liquidator_data_result {
        Ok(data) => {
            ic_cdk::println!("User found in update_user_data_supply");
            data
        }
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

    let dtoken_canister = read_state(|state| {
        let asset_index = &state.asset_index;
        asset_index
            .get(&collateral_asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.d_token_canister.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let collateral_dtoken_principal = Principal::from_text(dtoken_canister)
        .map_err(|_| Error::ConversionErrorFromTextToPrincipal)?;
    
    //TODO make constant name as base currency = "USD"
    let mut collateral_amount = amount.clone();
    if collateral_asset != debt_asset {
        let debt_in_usd = get_exchange_rates(debt_asset.clone(), Some(collateral_asset.clone()), amount.clone()).await;
        match debt_in_usd {
            Ok((amount_in_usd, _timestamp)) => {
                // Extracted the amount in USD
                collateral_amount = amount_in_usd.clone();
                ic_cdk::println!("debt amount in USD: {:?}", amount_in_usd);
            }
            Err(e) => {
                // Handling the error
                ic_cdk::println!("Error getting exchange rate: {:?}", e);
                return Err(e);
            }
        }
    }
    // let collateral_amount = match get_exchange_rates(
    //     debt_asset.to_string(),
    //     Some(collateral_asset.clone()),
    //     debt_in_usd.clone(),
    // )
    // .await
    // {
    //     Ok((total_value, _time)) => {
    //         // Store the total_value returned from the get_exchange_rates function
    //         total_value
    //     }
    //     Err(e) => {
    //         // Handle the error case
    //         ic_cdk::println!("Error fetching exchange rate: {:?}", e);
    //         Nat::from(0u128) // Or handle the error as appropriate for your logic
    //     }
    // };
    ic_cdk::println!("Collateral amount rate: {}", collateral_amount);

    //TODO use scaled_mul
    let bonus = collateral_amount.clone()
        * (collateral_reserve_data
            .configuration
            .liquidation_bonus
            .clone()
            / Nat::from(100u128))
        / Nat::from(100000000u128);
    ic_cdk::println!("bonus: {}", bonus);
    let reward_amount: Nat = collateral_amount.clone() + bonus.clone();
    ic_cdk::println!("reward_amount: {}", reward_amount);

    let supply_param = ExecuteSupplyParams {
        asset: collateral_asset.to_string(),
        amount: reward_amount.clone(),
        is_collateral: true,
    };

    let mut collateral_reserve_cache = reserve::cache(&collateral_reserve_data);
    reserve::update_state(&mut collateral_reserve_data, &mut collateral_reserve_cache);
    let _ = reserve::update_interest_rates(
        &mut collateral_reserve_data,
        &mut collateral_reserve_cache,
        Nat::from(0u128),
        Nat::from(0u128),
    )
    .await;
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", collateral_reserve_cache);

    if let Err(e) =   ValidationLogic::validate_liquidation(
        debt_asset.clone(),
        amount.clone(),
        reward_amount.clone(),
        liquidator_principal,
        user_principal,
        repay_reserve_data //yeh kya hai
    )
    .await {
        ic_cdk::println!("liquidation validation failed: {:?}", e);
        return Err(e);
    };

    // let withdraw_param = ExecuteWithdrawParams {
    //     asset: collateral_asset.to_string(),
    //     is_collateral: true,
    //     on_behalf_of: None, //TODO why none, user principal
    //     amount: reward_amount.clone(),
    // };
    // let user_withdraw_result = UpdateLogic::update_user_data_withdraw(
    //     user_principal,
    //     &collateral_reserve_cache,
    //     withdraw_param,
    //     &collateral_reserve_data,
    // ).await;
    let burn_scaled_result = burn_scaled(
        &mut collateral_reserve_data,
        &mut user_reserve_data,
        reward_amount.clone(),
        collateral_reserve_cache.next_liquidity_index.clone(),
        user_principal,
        collateral_dtoken_principal,
        platform_principal,
        true,
    )
    .await; //handle error
    match burn_scaled_result {
        Ok(()) => {
            ic_cdk::println!("Burning dToken successfully completed");
        }
        Err(e) => {
            return Err(e);
        }
    };
    let liquidator_mint_result = UpdateLogic::update_user_data_supply(
        liquidator_principal,
        &collateral_reserve_cache,
        supply_param,
        &mut collateral_reserve_data,
    )
    .await;
    match liquidator_mint_result {
        Ok(()) => {
            ic_cdk::println!("Minting dtokens successfully");
        }
        Err(e) => {
            ic_cdk::println!("{:?}", e);
            return Err(e);
            //mint back dtoken to user
        }
    }
    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(collateral_asset.clone(), Candid(collateral_reserve_data.clone()));
    });

    let params_repay = ExecuteRepayParams {
        asset: debt_asset.clone(),
        amount: amount.clone(),
        on_behalf_of: Some(user_principal),
    };

    let repay_response = execute_repay(params_repay).await;

    match repay_response {
        Ok(_) => {
            ic_cdk::println!("Repayment successful");
            Ok(amount)
        },
        Err(e) => {
            let mut liquidator_collateral_reserve =
                user_reserve(&mut liquidator_data, &collateral_asset);
            let mut liquidator_reserve_data = match liquidator_collateral_reserve.as_mut() {
                Some((_, reserve_data)) => reserve_data,
                None => {
                    let new_reserve = UserReserveData {
                        reserve: collateral_asset.clone(),
                        ..Default::default()
                    };
        
                    if let Some(ref mut reserves) = liquidator_data.reserves {
                        reserves.push((collateral_asset.clone(), new_reserve));
                    } else {
                        liquidator_data.reserves = Some(vec![(collateral_asset.clone(), new_reserve)]);
                    }
                    &mut liquidator_data.reserves.as_mut().unwrap().iter_mut().find(|(asset, _)| asset == &collateral_asset).unwrap().1
                }
            };
            let rollback_dtoken_from_liquidator = burn_scaled(
                &mut collateral_reserve_data,
                &mut liquidator_reserve_data,
                reward_amount.clone(),
                collateral_reserve_cache.next_liquidity_index.clone(),
                liquidator_principal,
                collateral_dtoken_principal,
                platform_principal,
                true,
            )
            .await;
            match rollback_dtoken_from_liquidator {
                Ok(()) => {
                    ic_cdk::println!("Rolling back dtoken from liquidator successfully");
                }
                Err(e) => {
                    return Err(e);
                }
            };
            let rollback_dtoken_to_user = mint_scaled(
                &mut collateral_reserve_data,
                &mut user_reserve_data,
                reward_amount,
                collateral_reserve_cache.next_liquidity_index,
                user_principal,
                collateral_dtoken_principal,
                platform_principal,
                true,
            )
            .await;
            match rollback_dtoken_to_user {
                Ok(()) => {
                    ic_cdk::println!("Rolling back dtoken to user successfully");
                }
                Err(e) => {
                    return Err(e);
                }
            };
            //TODO store state
            return Err(e);
        } //TODO burn liquidator dtoken //TODO mint back the dtoken to user
    }
}