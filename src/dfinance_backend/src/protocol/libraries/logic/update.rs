use crate::{
    api::state_handler::{mutate_state, read_state},
    declarations::{
        assets::{
            ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
        },
        storable::Candid,
    },
    protocol::libraries::{
        math::calculate::{calculate_average_threshold, calculate_health_factor, calculate_ltv, get_exchange_rates, UserPosition},
        types::datatypes::UserReserveData,
    },
};
use candid::Principal;
use ic_xrc_types::Asset;
use crate::declarations::assets::ReserveData;

pub struct UpdateLogic;

impl UpdateLogic {
    // ------------- Update user data function for supply -------------
    pub async fn update_user_data_supply(
        user_principal: Principal,
        params: ExecuteSupplyParams,
        reserve: &ReserveData,
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
        let asset_rate_result = get_exchange_rates(reserve.asset_name.clone().expect("REASON"), 1.0).await;

       
      
        let user_prof = user_data.clone();
        let ckbtc_to_usd_rate = 60554.70f64;
        let amount_in_usd = (params.amount as f64) * ckbtc_to_usd_rate;

        user_data.total_collateral =
            Some(user_data.total_collateral.unwrap_or(0.0) + amount_in_usd);
        ic_cdk::println!(
            "Converted ckBTC amount: {} to ICP amount: {} with rate: {}",
            params.amount,
            amount_in_usd,
            ckbtc_to_usd_rate
        );
        user_data.net_worth = Some(user_data.net_worth.unwrap_or(0.0) + amount_in_usd);

        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0.0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0.0),
            liquidation_threshold: 0.8,
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
        
        // Calculate average threshold
        let user_thrs = calculate_average_threshold(params.amount as f64, reserve, user_prof);
        ic_cdk::println!("user_thr {:?}", user_thrs);

        user_data.liquidation_threshold = Some(user_thrs);

        if let Some((_, reserve_data)) = user_reserve {
            // If Reserve data exists, it will update asset supply
            match asset_rate_result {
                Ok((rate, _)) => {
                    // Assign the `f64` rate to `reserve_data.asset_price_when_supplied`
                    reserve_data.asset_price_when_supplied = rate;
                }
                Err(e) => {
                    
                    ic_cdk::println!("Failed to get asset rate: {}", e);
                    
                    reserve_data.asset_price_when_supplied = 0.0; // Default value in case of an error
                }
            }
            reserve_data.supply_rate = reserve.current_liquidity_rate; 
            reserve_data.asset_supply += params.amount as f64;
            ic_cdk::println!(
                "Updated asset supply for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // Reserve data does not exist, create a new one
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                asset_supply: params.amount as f64,
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
        let ckbtc_to_icp_rate = 7_240f64;
        ic_cdk::println!("ckBTC to ICP conversion rate: {}", ckbtc_to_icp_rate);

        // Convert the supplied amount (in ckBTC) to ICP
        let amount_in_icp = (params.amount as f64) * ckbtc_to_icp_rate;
        user_data.total_debt = Some(user_data.total_debt.unwrap_or(0.0) + amount_in_icp);

        let user_position = UserPosition {
            total_collateral_value: user_data.total_collateral.unwrap_or(0.0),
            total_borrowed_value: user_data.total_debt.unwrap_or(0.0), // Assuming total_debt is stored in user_data
            liquidation_threshold: 0.8, // Set to the desired liquidation threshold (80%)
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

        if let Some((_, reserve_data)) = user_reserve {
            // If Reserve data exists, it updates asset supply
            let asset_rate_result = get_exchange_rates(params.asset.clone(), 1.0).await;

            match asset_rate_result {
                Ok((rate, _)) => {
                    // Assign the `f64` rate to `reserve_data.asset_price_when_supplied`
                    reserve_data.asset_price_when_supplied = rate;
                }
                Err(e) => {
                    
                    ic_cdk::println!("Failed to get asset rate: {}", e);
                    
                    reserve_data.asset_price_when_supplied = 0.0; // Default value in case of an error
                }
            }
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
            reserve_data.borrow_rate=asset_reserve_data.borrow_rate;
            reserve_data.asset_borrow += params.amount as f64;
            ic_cdk::println!(
                "Updated asset borrow for existing reserve: {:?}",
                reserve_data
            );
        } else {
            // If Reserve data does not exist, it creates a new one
            let new_reserve = UserReserveData {
                reserve: params.asset.clone(),
                asset_borrow: params.amount as f64,
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
            if reserve_data.asset_supply >= params.amount as f64 {
                reserve_data.asset_supply -= params.amount as f64;
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
            if reserve_data.asset_borrow >= params.amount as f64 {
                reserve_data.asset_borrow -= params.amount as f64;
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
