use crate::api::functions::get_balance;
use crate::api::resource_manager::{acquire_lock, release_lock};
use crate::api::state_handler::read_state;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::assets::{ExecuteLiquidationParams, ExecuteRepayParams, ReserveData};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::borrow::execute_repay;
use crate::protocol::libraries::logic::reserve::{self, burn_scaled, mint_scaled};
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::{
    api::state_handler::mutate_state,
    declarations::assets::ExecuteSupplyParams,
    protocol::libraries::{logic::update::UpdateLogic, math::calculate::get_exchange_rates},
};
use crate::{get_cached_exchange_rate, get_reserve_data};
use candid::{Nat, Principal};
use ic_cdk::{api, update};

#[update]
pub async fn execute_liquidation(params: ExecuteLiquidationParams) -> Result<Nat, Error> {
    if params.debt_asset.trim().is_empty() && params.collateral_asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if params.debt_asset.len() > 7 && params.collateral_asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if params.amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if params.on_behalf_of == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    let platform_principal = ic_cdk::api::id();

    ic_cdk::println!("amount liq = {}", params.amount.clone());
    ic_cdk::println!("reward liq = {}", params.reward_amount.clone());

    let user_principal = params.on_behalf_of;
    ic_cdk::println!("User Principal (Debt User): {}", user_principal);

    let liquidator_principal = api::caller();
    ic_cdk::println!("Liquidator Principal: {}", liquidator_principal);

    if liquidator_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let user_key = params.on_behalf_of;
    // Acquire lock for the target user
    if let Err(e) = acquire_lock(&user_key) {
        ic_cdk::println!("Lock acquisition failed: {:?}", e);
        return Err(Error::LockAcquisitionFailed);
    };

    // Ensure lock is released after the operation
    //let release_user_lock = || release_lock(&user_key);
    let result = async {
        ic_cdk::println!(
            "params debt_asset and collateral_asset {:?} {:?}",
            params.debt_asset,
            params.collateral_asset
        );
        ic_cdk::println!("liquidation amount = {}", params.amount.clone());

        let reserve_data_result = get_reserve_data(params.debt_asset.clone());

        let repay_reserve_data = match reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {:?}", e);
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        };

        let collateral_reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&params.collateral_asset.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let mut collateral_reserve_data = match collateral_reserve_data_result {
            Ok(data) => {
                ic_cdk::println!("Reserve data found for asset: {:?}", data);
                data
            }
            Err(e) => {
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                ic_cdk::println!("Error: {:?}", e);
                return Err(e);
            }
        };

        //let (mut reward_amount, mut reward_collateral) = (Nat::from(0u128), Nat::from(0u128));
        let mut earned_rewards = Nat::from(0u128);

        let reward_result: Result<(Nat, Nat), Error> = to_get_reward_amount(
            params.amount.clone(),
            params.collateral_asset.clone(),
            params.debt_asset.clone(),
            collateral_reserve_data.clone(),
            user_principal.clone(),
        )
        .await;

        match reward_result {
            Ok((amount, _collateral)) => {
                earned_rewards = amount;
            }
            Err(err) => {
                println!("Error occurred: {:?}", err);
                return Err(err);
            }
        }

        ic_cdk::println!("earned_rewards: {:?}", earned_rewards);

        if params.reward_amount > earned_rewards {
            ic_cdk::println!("Reward amount is greater than earned rewards");
            return Err(Error::InvalidAmount);
        }

        ic_cdk::println!("reward_amount: {:?}", earned_rewards);

        let user_data_result = user_data(user_principal);
        let mut user_account_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found in update_user_data_supply");
                data
            }
            Err(e) => {
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                ic_cdk::println!("Error fetching user data: {:?}", e);
                return Err(e);
            }
        };

        // Check if the user has a reserve for the asset
        let mut user_reserve_result =
            user_reserve(&mut user_account_data, &params.collateral_asset);
        let mut user_reserve_data = match user_reserve_result.as_mut() {
            Some((_, reserve_data)) => reserve_data,
            None => {
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
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
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                ic_cdk::println!("Error fetching user data: {:?}", e);
                return Err(e);
            }
        };

        let dtoken_canister = read_state(|state| {
            let asset_index = &state.asset_index;
            asset_index
                .get(&params.collateral_asset.to_string().clone())
                .and_then(|reserve_data| reserve_data.d_token_canister.clone())
                .ok_or_else(|| Error::NoCanisterIdFound)
        })?;

        let collateral_dtoken_principal = Principal::from_text(dtoken_canister)
            .map_err(|_| Error::ConversionErrorFromTextToPrincipal)?;

        //TODO make constant name as base currency = "USD"
        let mut collateral_amount = params.amount.clone();
        if params.collateral_asset != params.debt_asset {
            let debt_in_usd = get_exchange_rates(
                params.debt_asset.clone(),
                Some(params.collateral_asset.clone()),
                params.amount.clone(),
            )
            .await;
            match debt_in_usd {
                Ok((amount_in_usd, _timestamp)) => {
                    // Extracted the amount in USD
                    collateral_amount = amount_in_usd.clone();
                    ic_cdk::println!("debt amount in USD: {:?}", amount_in_usd);
                }
                Err(e) => {
                    // Release the lock
                    if let Err(e) = release_lock(&user_key) {
                        ic_cdk::println!("Failed to release lock: {:?}", e);
                    }
                    ic_cdk::println!("Error getting exchange rate: {:?}", e);
                    return Err(e);
                }
            }
        }
        ic_cdk::println!("Collateral amount rate: {}", collateral_amount);

        // let bonus = collateral_amount.clone().scaled_mul(
        //     collateral_reserve_data
        //         .configuration
        //         .liquidation_bonus
        //         .clone()
        //         / Nat::from(100u128),
        // ) / Nat::from(SCALING_FACTOR);
        // ic_cdk::println!("bonus: {}", bonus);
        let reward_amount: Nat = params.reward_amount.clone();
        ic_cdk::println!("reward_amount: {}", reward_amount);

        let supply_param = ExecuteSupplyParams {
            asset: params.collateral_asset.to_string(),
            amount: reward_amount.clone(),
            is_collateral: true,
        };

        let mut collateral_reserve_cache = reserve::cache(&collateral_reserve_data);
        reserve::update_state(&mut collateral_reserve_data, &mut collateral_reserve_cache);
        if let Err(e) = reserve::update_interest_rates(
            &mut collateral_reserve_data,
            &mut collateral_reserve_cache,
            Nat::from(0u128),
            Nat::from(0u128),
        )
        .await
        {
            // Release the lock
            if let Err(e) = release_lock(&user_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            ic_cdk::println!("Failed to update interest rates: {:?}", e);
            return Err(e);
        };
        ic_cdk::println!(
            "Reserve cache fetched successfully: {:?}",
            collateral_reserve_cache
        );

        ic_cdk::println!("reward amount validation: {:?}", reward_amount);

        if let Err(e) = ValidationLogic::validate_liquidation(
            params.debt_asset.clone(),
            params.amount.clone(),
            reward_amount.clone(),
            liquidator_principal,
            user_principal,
            repay_reserve_data,
        )
        .await
        {
            // Release the lock
            if let Err(e) = release_lock(&user_key) {
                ic_cdk::println!("Failed to release lock: {:?}", e);
            }
            ic_cdk::println!("liquidation validation failed: {:?}", e);
            return Err(e);
        };

        ic_cdk::println!("liquidation validation successful");

        ic_cdk::println!("burn reward amount: {:?}", reward_amount);

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
        .await;
        match burn_scaled_result {
            Ok(()) => {
                ic_cdk::println!("Burning dToken successfully completed");
            }
            Err(e) => {
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
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
                    Err(_) => {
                        // Release the lock
                        if let Err(e) = release_lock(&user_key) {
                            ic_cdk::println!("Failed to release lock: {:?}", e);
                        }
                        return Err(Error::ErrorRollBack);
                    }
                };
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        }
        mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index.insert(
                params.collateral_asset.clone(),
                Candid(collateral_reserve_data.clone()),
            );
        });

        let params_repay = ExecuteRepayParams {
            asset: params.debt_asset.clone(),
            amount: params.amount.clone(),
            on_behalf_of: Some(user_principal),
        };

        let repay_response = execute_repay(params_repay).await;

        match repay_response {
            Ok(_) => {
                ic_cdk::println!("Repayment successful");
                Ok(params.amount)
            }
            Err(e) => {
                let mut liquidator_collateral_reserve =
                    user_reserve(&mut liquidator_data, &params.collateral_asset);
                let mut liquidator_reserve_data = match liquidator_collateral_reserve.as_mut() {
                    Some((_, reserve_data)) => reserve_data,
                    None => {
                        let new_reserve = UserReserveData {
                            reserve: params.collateral_asset.clone(),
                            ..Default::default()
                        };

                        if let Some(ref mut reserves) = liquidator_data.reserves {
                            reserves.push((params.collateral_asset.clone(), new_reserve));
                        } else {
                            liquidator_data.reserves =
                                Some(vec![(params.collateral_asset.clone(), new_reserve)]);
                        }
                        &mut liquidator_data
                            .reserves
                            .as_mut()
                            .unwrap()
                            .iter_mut()
                            .find(|(asset, _)| asset == &params.collateral_asset)
                            .unwrap()
                            .1
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
                    Err(_) => {
                        // Release the lock
                        if let Err(e) = release_lock(&user_key) {
                            ic_cdk::println!("Failed to release lock: {:?}", e);
                        }
                        return Err(Error::ErrorRollBack);
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
                    Err(_) => {
                        // Release the lock
                        if let Err(e) = release_lock(&user_key) {
                            ic_cdk::println!("Failed to release lock: {:?}", e);
                        }
                        return Err(Error::ErrorRollBack);
                    }
                };
                mutate_state(|state| {
                    let asset_index = &mut state.asset_index;
                    asset_index.insert(
                        params.collateral_asset.clone(),
                        Candid(collateral_reserve_data.clone()),
                    );
                });
                // Release the lock
                if let Err(e) = release_lock(&user_key) {
                    ic_cdk::println!("Failed to release lock: {:?}", e);
                }
                return Err(e);
            }
        }
    }
    .await;

    // Release the lock
    if let Err(e) = release_lock(&user_key) {
        ic_cdk::println!("Failed to release lock: {:?}", e);
        return Err(e);
    }
    result
}

pub async fn to_get_reward_amount(
    amount: Nat,
    collateral_asset: String,
    debt_asset: String,
    collateral_reserve_data: ReserveData,
    user_principal: Principal,
) -> Result<(Nat, Nat), Error> {
    ic_cdk::println!("Starting to_get_reward_amount function");

    let d_token_canister =
        match Principal::from_text(collateral_reserve_data.d_token_canister.clone().unwrap()) {
            Ok(canister) => canister,
            Err(e) => {
                ic_cdk::println!("Error converting text to principal: {:?}", e);
                return Err(Error::EmailError);
            }
        };

    let collateral_balance = match get_balance(d_token_canister, user_principal).await {
        Ok(balance) => {
            ic_cdk::println!("Collateral balance fetched: {:?}", balance);
            balance
        }
        Err(e) => {
            ic_cdk::println!("Error fetching collateral balance: {:?}", e);
            return Err(e);
        }
    };

    let mut collateral_amount = amount.clone();
    if collateral_asset != debt_asset {
        let debt_in_usd = get_exchange_rates(
            debt_asset.clone(),
            Some(collateral_asset.clone()),
            amount.clone(),
        )
        .await;
        match debt_in_usd {
            Ok((converted_amount, _timestamp)) => {
                // Extracted the amount in USD
                collateral_amount = converted_amount.clone();
                ic_cdk::println!("converted amount: {:?}", converted_amount);
            }
            Err(e) => {
                ic_cdk::println!("Error getting exchange rate: {:?}", e);
                return Err(e);
            }
        }
    }
    ic_cdk::println!("Collateral amount rate: {}", collateral_amount);

    let final_collateral_amount = collateral_amount.clone()
        + collateral_amount.clone().scaled_mul(
            collateral_reserve_data
                .configuration
                .liquidation_bonus
                .clone()
                / Nat::from(100u128),
        );

    ic_cdk::println!(
        "Collateral amount calculated: {:?}",
        final_collateral_amount
    );

    let general_liquidity_bonus = (Nat::from(100u128)
        + collateral_reserve_data.configuration.liquidation_bonus)
        * Nat::from(100u128);

    ic_cdk::println!("General liquidity bonus: {:?}", general_liquidity_bonus);

    let max_collateral;
    let max_debt_to_liq;

    let debt_in_usd = match get_cached_exchange_rate(debt_asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&debt_asset) {
                let amount = cached_price.price.clone();
                Some(amount)
            } else {
                ic_cdk::println!("No cached price found for {}", debt_asset);
                None
            }
        }
        Err(err) => {
            ic_cdk::println!("Error fetching exchange rate for {}: {:?}", debt_asset, err);
            None
        }
    };

    let collateral_in_usd = match get_cached_exchange_rate(collateral_asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&collateral_asset) {
                let amount = cached_price.price.clone();
                ic_cdk::println!(
                    "Fetched exchange rate for {}: {:?}",
                    collateral_asset,
                    amount
                );
                Some(amount)
            } else {
                ic_cdk::println!("No cached price found for {}", collateral_asset);
                None
            }
        }
        Err(err) => {
            ic_cdk::println!(
                "Error fetching exchange rate for {}: {:?}",
                collateral_asset,
                err
            );
            None
        }
    };

    if final_collateral_amount > collateral_balance {
        max_collateral = collateral_balance;
        ic_cdk::println!("Max collateral set to balance: {:?}", max_collateral);

        let calculated_value = ((collateral_amount.scaled_mul(collateral_in_usd.unwrap()))
            / debt_in_usd.unwrap())
            * (Nat::from(1000u128) / general_liquidity_bonus);

        max_debt_to_liq = calculated_value
    } else {
        max_collateral = final_collateral_amount;
        max_debt_to_liq = collateral_amount.clone();
        ic_cdk::println!(
            "Max collateral set to calculated amount: {:?}",
            max_collateral
        );
        ic_cdk::println!(
            "Max debt to liquidate set to provided amount: {:?}",
            max_debt_to_liq
        );
    }

    ic_cdk::println!(
        "Returning final values: max_collateral = {:?}, max_debt_to_liq = {:?}",
        max_collateral,
        max_debt_to_liq
    );

    Ok((max_collateral, max_debt_to_liq)) // Correct return statement
}
