use crate::{
    api::state_handler::{mutate_state, read_state}, declarations::{
        assets::{
            ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
        },
        storable::Candid,
    }, implementations::reserve, protocol::libraries::{
        math::{calculate::{cal_average_threshold, calculate_health_factor, calculate_ltv, get_exchange_rates, UserPosition}, math_utils::ScalingMath},
        types::datatypes::UserReserveData,
    }
};
use candid::Principal;
use ic_xrc_types::Asset;
use crate::declarations::assets::ReserveData;

pub struct UpdateLogic;

impl UpdateLogic {
    // ------------- Update user data function for supply -------------
    // pub async fn update_user_data_supply(
    //     user_principal: Principal,
    //     params: ExecuteSupplyParams,
    //     reserve: &ReserveData,
    // ) -> Result<(), String> {
    //     // Fetchs user data
    //     let user_data_result = mutate_state(|state| {
    //         let user_profile_data = &mut state.user_profile;
    //         user_profile_data
    //             .get(&user_principal)
    //             .map(|user| user.0.clone())
    //             .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
    //     });


    //     let mut user_data = match user_data_result {
    //         Ok(data) => {
    //             ic_cdk::println!("User found: {:?}", data);
    //             data
    //         }
    //         Err(e) => {
    //             ic_cdk::println!("Error: {}", e);
    //             return Err(e);
    //         }
    //     };
    //     let asset_rate_result = get_exchange_rates(reserve.asset_name.clone().expect("REASON"), 1.0).await;

       
      
    //     let user_prof = user_data.clone();
    //     let ckbtc_to_usd_rate = 60554.70f64;
    //     let amount_in_usd = (params.amount as f64) * ckbtc_to_usd_rate;

        
    //     ic_cdk::println!(
    //         "Converted ckBTC amount: {} to ICP amount: {} with rate: {}",
    //         params.amount,
    //         amount_in_usd,
    //         ckbtc_to_usd_rate
    //     );
    //     user_data.net_worth = Some(user_data.net_worth.unwrap_or(0.0) + amount_in_usd);
    //     let user_thrs = cal_average_threshold(amount_in_usd, reserve.configuration.liquidation_threshold, user_prof.total_collateral.unwrap_or(0.0), user_prof.liquidation_threshold.unwrap_or(0.0));
    //     ic_cdk::println!("user_thr {:?}", user_thrs);

    //     user_data.liquidation_threshold = Some(user_thrs);
    //     user_data.total_collateral =
    //         Some(user_data.total_collateral.unwrap_or(0.0) + amount_in_usd);

    //     let user_position = UserPosition {
    //         total_collateral_value: user_data.total_collateral.unwrap_or(0.0),
    //         total_borrowed_value: user_data.total_debt.unwrap_or(0.0),
    //         liquidation_threshold: user_thrs,
    //     };

    //     let health_factor = calculate_health_factor(&user_position);
    //     user_data.health_factor = Some(health_factor);

    //     ic_cdk::println!("Updated user health factor: {}", health_factor);

    //     let ltv = calculate_ltv(&user_position);
    //     user_data.ltv = Some(ltv);

    //     // Checks if the reserve data for the asset already exists in the user's reserves
    //     let user_reserve = match user_data.reserves {
    //         Some(ref mut reserves) => reserves
    //             .iter_mut()
    //             .find(|(asset_name, _)| *asset_name == params.asset),
    //         None => None,
    //     };
        
    //     // Calculate average threshold
    //     // let user_thrs = cal_average_threshold(amount_in_usd, reserve.configuration.liquidation_threshold, user_prof.total_collateral.unwrap_or(0.0), user_prof.liquidation_threshold.unwrap_or(0.0));
    //     // ic_cdk::println!("user_thr {:?}", user_thrs);

    //     // user_data.liquidation_threshold = Some(user_thrs);
    //     let mut usd_rate = 0.0;
    //     if let Some((_, reserve_data)) = user_reserve {
    //         // If Reserve data exists, it will update asset supply
    //         match asset_rate_result {
    //             Ok((rate, _)) => {
    //                 // Assign the `f64` rate to `reserve_data.asset_price_when_supplied`
    //                 usd_rate = rate;

    //             }
    //             Err(e) => {
                    
    //                 ic_cdk::println!("Failed to get asset rate: {}", e);
                    
    //                 reserve_data.asset_price_when_supplied = 0.0; // Default value in case of an error
    //             }
    //         }
    //         reserve_data.asset_price_when_supplied = usd_rate;
    //         reserve_data.supply_rate = reserve.current_liquidity_rate; 
    //         reserve_data.asset_supply += params.amount as f64;
    //         ic_cdk::println!(
    //             "Updated asset supply for existing reserve: {:?}",
    //             reserve_data
    //         );
    //     } else {
    //         // Reserve data does not exist, create a new one
    //         let new_reserve = UserReserveData {
    //             reserve: params.asset.clone(),
    //             asset_supply: params.amount as f64,
    //             supply_rate: reserve.current_liquidity_rate,

    //             asset_price_when_supplied: usd_rate,
    //             ..Default::default()
    //         };

    //         if let Some(ref mut reserves) = user_data.reserves {
    //             reserves.push((params.asset.clone(), new_reserve));
    //         } else {
    //             user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
    //         }

    //         ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
    //     }

    //     // Save the updated user data back to state
    //     mutate_state(|state| {
    //         state
    //             .user_profile
    //             .insert(user_principal, Candid(user_data.clone()));
    //     });

    //     ic_cdk::println!("User data updated successfully: {:?}", user_data);
    //     Ok(())
    // }

    pub async fn update_user_data_supply(
        user_principal: Principal,
        params: ExecuteSupplyParams,
        reserve: &ReserveData,
        usd_amount: u128,
    ) -> Result<(), String> {
        // Fetch user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });
    
        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };
        
        // Get the exchange rate of the asset
        // let asset_rate_result = get_exchange_rates(reserve.asset_name.clone().expect("REASON"), 1.0).await;
        // let amount_in_usd = match exchange_rate_usd(params.asset.clone(), params.amount).await {
        //     Ok(value) => value,
        //     Err(e) => {
        //         ic_cdk::println!("Error fetching exchange rate: {:?}", e);
        //         return Err(format!("Failed to fetch exchange rate: {}", e));
        //     }
        // };
        // let ckbtc_to_usd_rate = 60554.70f64;
        // let amount_in_usd = (params.amount as f64) * ckbtc_to_usd_rate;
        // let unscaled_amount = params.amount/100000000;
        // let mut usd_rate = usd_amount/params.amount * 100000000; -- changes
        let mut usd_rate = usd_amount.scaled_div(params.amount);
        ic_cdk::println!(
            "Converted ckBTC amount: {} to USD amount: {} with rate: {}",
            params.amount.clone(),
            usd_amount,
            usd_rate 
        );
    
        // Update user's net worth and collateral
        user_data.net_worth = Some(user_data.net_worth.unwrap_or(0) + usd_amount);
        let user_thrs = cal_average_threshold(
            usd_amount,
            0,
            reserve.configuration.liquidation_threshold,
            user_data.total_collateral.unwrap_or(0),
            user_data.liquidation_threshold.unwrap_or(0),
        );
        ic_cdk::println!("User liquidation threshold: {:?}", user_thrs);
    
        user_data.liquidation_threshold = Some(user_thrs);
        user_data.total_collateral = Some(user_data.total_collateral.unwrap_or(0) + usd_amount);
    
        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0),
            liquidation_threshold: user_thrs,
        };
    
        // Calculate and update health factor
        let health_factor = calculate_health_factor(&user_position);
        user_data.health_factor = Some(health_factor);
        ic_cdk::println!("Updated user health factor: {}", health_factor);
    
        // Calculate and update loan-to-value (LTV)
        let ltv = calculate_ltv(&user_position);
        // let mut avg_ltv=0;
        // if reserve.configuration.ltv != 0 {
        //     avg_ltv = user_data.ltv.unwrap()+ (usd_amount.scaled_mul(reserve.configuration.ltv));
        // } else {
        // //    user_data.has_zero_ltv_collateral = true;
        // ic_cdk::println!("ltv {}", reserve.configuration.ltv);
        // }
        user_data.ltv = Some(ltv);
        // ic_cdk::println!("user updated ltv {}", user_data.ltv.unwrap().clone());
        // let available_borrow_for_asset = calculate_available_borrows(
        //     user_data.total_collateral.unwrap_or(0).clone(),
        //     user_data.total_debt.unwrap_or(0).clone(),
        //     reserve.configuration.ltv, 
        // );


        
        user_data.available_borrow = Some(user_data.available_borrow.unwrap() + (usd_amount.scaled_mul(reserve.configuration.ltv)));
        // Check if the user has a reserve for the asset
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| asset_name == &params.asset),
            None => None,
        };
    
        
        if let Some((_, reserve_data)) = user_reserve {
            // If Reserve data exists, update the asset supply and rates
            // match asset_rate_result {
            //     Ok((rate, _)) => {
            //         reserve_data.asset_price_when_supplied = rate;
            //         usd_rate = rate;
            //     }
            //     Err(e) => {
            //         ic_cdk::println!("Failed to get asset rate: {}", e);
            //         reserve_data.asset_price_when_supplied = 0.0; // Default in case of error
            //     }
            // }
    
            reserve_data.supply_rate = reserve.current_liquidity_rate.clone();
            reserve_data.asset_supply += params.amount;
            reserve_data.asset_price_when_supplied = usd_rate;
    
            ic_cdk::println!(
                "Updated asset supply for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // Create a new reserve if it does not exist
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                asset_supply: params.amount,
                supply_rate: reserve.current_liquidity_rate,
                asset_price_when_supplied: usd_rate,
                ..Default::default()
            };
    
            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((params.asset.clone(), new_reserve));
            } else {
                user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
            }
    
            ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
        }
    
        // Save the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });
    
        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }
    

    // ------------- Update user data function for borrow -------------
    pub async fn update_user_data_borrow(
        user_principal: Principal,
        params: ExecuteBorrowParams,
        usd_amount: u128,
    ) -> Result<(), String> {
        let asset_reserve = read_state(|state| {
            let asset_index = & state.asset_index;
            asset_index
                .get(&params.asset.to_string())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
        });
        
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };
      
        user_data.total_debt = Some(user_data.total_debt.unwrap_or(0) + usd_amount);

        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0),
            liquidation_threshold: user_data.liquidation_threshold.unwrap_or(0), 
        };
         
        let health_factor = calculate_health_factor(&user_position);
        user_data.health_factor = Some(health_factor);

        ic_cdk::println!("Updated user health factor: {}", health_factor);

        let ltv = calculate_ltv(&user_position);
        user_data.ltv = Some(ltv);
        
       
        
        // Checks if the reserve data for the asset already exists in the user's reserves
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == params.asset),
            None => None,
        };
        let asset_reserve_data = match asset_reserve {

            Ok(data) => {

                ic_cdk::println!("Reserve data found for asset: {:?}", data);

                data

            }

            Err(e) => {

                ic_cdk::println!("Error: {}", e);

                return Err(e);

            }

        };

        // let available_borrow_for_asset = calculate_available_borrows(
        //     user_data.total_collateral.unwrap_or(0).clone(),
        //     user_data.total_debt.unwrap_or(0).clone(),
        //     asset_reserve_data.configuration.ltv, 
        // );


        
        user_data.available_borrow = Some(user_data.available_borrow.unwrap() - usd_amount);

        //let usd_rate = (usd_amount/params.amount) * 100000000;
        let usd_rate = usd_amount.scaled_div(params.amount);
        if let Some((_, reserve_data)) = user_reserve {
            // If Reserve data exists, it updates asset supply
            // let asset_rate_result = get_exchange_rates(params.asset.clone(), 1.0).await;

            // match asset_rate_result {
            //     Ok((rate, _)) => {
            //         // Assign the `f64` rate to `reserve_data.asset_price_when_supplied`
            //         usd_rate = rate;
                    
            //     }
            //     Err(e) => {
                    
            //         ic_cdk::println!("Failed to get asset rate: {}", e);
                    
            //         reserve_data.asset_price_when_borrowed = 0; // Default value in case of an error
            //     }
            // }
           
            reserve_data.borrow_rate=asset_reserve_data.borrow_rate;
            reserve_data.asset_price_when_borrowed = usd_rate;

            reserve_data.asset_borrow += params.amount;
            ic_cdk::println!(
                "Updated asset borrow for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // If Reserve data does not exist, it creates a new one
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                borrow_rate: asset_reserve_data.current_liquidity_rate,

                asset_price_when_borrowed: usd_rate,
                asset_borrow: params.amount,
                ..Default::default()
            };

            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((params.asset.clone(), new_reserve));
            } else {
                user_data.reserves = Some(vec![(params.asset.clone(), new_reserve)]);
            }

            ic_cdk::println!("Added new reserve data for asset: {:?}", params.asset);
        }

        // Saves the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    // ------------- Update user data function for withdraw -------------
    pub async fn update_user_data_withdraw(
        user_principal: Principal,
        params: ExecuteWithdrawParams,
        reserve: &ReserveData,
        usd_amount: u128
    ) -> Result<(), String> {
        // Fetchs user data
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };

        // let ckbtc_to_usd_rate = 60554.70f64;
        // let amount_in_usd = (params.amount as f64) * ckbtc_to_usd_rate;
        // let user_thrs = cal_average_threshold(amount_in_usd, reserve.configuration.liquidation_threshold, user_prof.total_collateral.unwrap_or(0), user_prof.liquidation_threshold.unwrap_or(0));
        // ic_cdk::println!("user_thr {:?}", user_thrs);

        // user_data.liquidation_threshold = Some(user_thrs);
        user_data.net_worth = Some(user_data.net_worth.unwrap_or(0) - usd_amount);
        let user_thrs = cal_average_threshold(
            0,
            usd_amount.clone(),
            reserve.configuration.liquidation_threshold,
            user_data.total_collateral.unwrap_or(0),
            user_data.liquidation_threshold.unwrap_or(0),
        );
        ic_cdk::println!("User liquidation threshold: {:?}", user_thrs);
        user_data.liquidation_threshold = Some(user_thrs);
        if params.is_collateral {
        user_data.total_collateral =
            Some(user_data.total_collateral.unwrap_or(0) - usd_amount);
        }
        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0),
            liquidation_threshold: user_thrs,
        };

        let health_factor = calculate_health_factor(&user_position);
        user_data.health_factor = Some(health_factor);

        ic_cdk::println!("Updated user health factor: {}", health_factor);

        let ltv = calculate_ltv(&user_position);
        user_data.ltv = Some(ltv);
        
        // let available_borrow = calculate_available_borrows(
        //     user_data.total_collateral.unwrap_or(0).clone() - usd_amount,
        //     user_data.total_debt.unwrap_or(0).clone(),
        //     ltv.clone(), 
        // );


        
        // user_data.available_borrow = Some(available_borrow);

        user_data.available_borrow = Some(user_data.available_borrow.unwrap() - (usd_amount.scaled_mul(reserve.configuration.ltv)));

        // Checks if the reserve data for the asset already exists in the user's reserves
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == params.asset),
            None => None,
        };

        // If the reserve exists, it will subtract the withdrawal amount from the asset supply
        if let Some((_, reserve_data)) = user_reserve {
            // Ensures the user has enough supply to withdraw
            if reserve_data.asset_supply >= params.amount {
                reserve_data.asset_supply -= params.amount;
                ic_cdk::println!(
                    "Reduced asset supply for existing reserve: {:?}",
                    reserve_data
                );
            } else {
                ic_cdk::println!("Insufficient asset supply for withdrawal.");
                return Err(format!(
                    "Insufficient supply for withdrawal: requested {}, available {}",
                    params.amount, reserve_data.asset_supply
                ));
            }
        } else {
            // If Reserve data does not exist,it returns an error since we cannot withdraw what is not supplied
            ic_cdk::println!("Error: Reserve not found for asset: {:?}", params.asset);
            return Err(format!(
                "Cannot withdraw from a non-existing reserve for asset: {}",
                params.asset
            ));
        }

        // Saves the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }

    // ------------- Update user data function for repay -------------
    pub async fn update_user_data_repay(
        user_principal: Principal,
        params: ExecuteRepayParams,
        usd_amount: u128,
    ) -> Result<(), String> {
        let user_data_result = mutate_state(|state| {
            let user_profile_data = &mut state.user_profile;
            user_profile_data
                .get(&user_principal)
                .map(|user| user.0.clone())
                .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
        });

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {}", e);
                return Err(e);
            }
        };
        // let ckbtc_to_usd_rate = 60554.70f64;
        // ic_cdk::println!("ckBTC to ICP conversion rate: {}", ckbtc_to_usd_rate);

        // // Convert the supplied amount (in ckBTC) to ICP
        // let amount_in_usd = (params.amount as f64) * ckbtc_to_usd_rate;
        
        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0) - usd_amount.clone(),
            liquidation_threshold: user_data.liquidation_threshold.unwrap_or(0),
        };
        user_data.total_debt = Some(user_data.total_debt.unwrap_or(0) - usd_amount);
        let health_factor = calculate_health_factor(&user_position);
        user_data.health_factor = Some(health_factor);

        ic_cdk::println!("Updated user health factor: {}", health_factor);

        let ltv = calculate_ltv(&user_position);
        user_data.ltv = Some(ltv);
        // let available_borrow = calculate_available_borrows(
        //     user_data.total_collateral.unwrap_or(0).clone() ,
        //     user_data.total_debt.unwrap_or(0).clone() - usd_amount,
        //     ltv.clone(), 
        // );


        
        // user_data.available_borrow = Some(available_borrow);
        user_data.available_borrow = Some(user_data.available_borrow.unwrap() + usd_amount);

        // Checks if the reserve data for the asset already exists in the user's reserves
        let user_reserve = match user_data.reserves {
            Some(ref mut reserves) => reserves
                .iter_mut()
                .find(|(asset_name, _)| *asset_name == params.asset),
            None => None,
        };

        // If the reserve exists, it will subtract the repaid amount from the asset borrow
        if let Some((_, reserve_data)) = user_reserve {
            // Ensures the user has enough borrow to repay
            if reserve_data.asset_borrow >= params.amount  {
                reserve_data.asset_borrow -= params.amount;
                ic_cdk::println!(
                    "Reduced asset borrow for existing reserve: {:?}",
                    reserve_data
                );
            } else {
                ic_cdk::println!("Insufficient asset borrow for repay.");
                return Err(format!(
                    "Insufficient borrow for repay: requested {}, available {}",
                    params.amount, reserve_data.asset_borrow
                ));
            }
        } else {
            // If Reserve data does not exist, it returns an error since we cannot repay what is not borrowed
            ic_cdk::println!("Error: Reserve not found for asset: {:?}", params.asset);
            return Err(format!(
                "Cannot repay from a non-existing reserve for asset: {}",
                params.asset
            ));
        }

        // Saves the updated user data back to state
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("User data updated successfully: {:?}", user_data);
        Ok(())
    }
}

// fn calculate_available_borrows(
//     total_collateral_in_usd: u128,
//     total_debt_in_usd: u128,
//     ltv: u128, 
// ) -> u128 {

//     let available_borrows_in_usd = (total_collateral_in_usd * ltv/100) /100000000;
//     ic_cdk::println!("total_collateral_in_usd: {:?}", total_collateral_in_usd);
//     if available_borrows_in_usd < total_debt_in_usd {
//         return 0;
//     }

//     available_borrows_in_usd - total_debt_in_usd
// }
// fn calculate_available_borrows(
//     total_collateral_in_base_currency: u128,
//     total_debt_in_base_currency: u128,
//     ltv: u128,
// ) -> u128 {
//     // Define a function for multiplying by percentage
//     let user=ic_cdk::caller();

//     fn percent_mul(amount: u128, percentage: u128) -> u128 {
//         (amount * percentage) / 10000 // Assuming LTV is expressed in basis points (10000 = 100%)
//     }

//     let mut available_borrows_in_base_currency = percent_mul(total_collateral_in_base_currency, ltv);

//     if available_borrows_in_base_currency < total_debt_in_base_currency {
//         return 0;
//     }

//     available_borrows_in_base_currency -= total_debt_in_base_currency;
//     available_borrows_in_base_currency
// }