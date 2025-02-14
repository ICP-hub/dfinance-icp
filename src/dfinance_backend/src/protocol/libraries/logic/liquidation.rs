use ic_cdk::{api, update};
use candid::{Nat, Principal};
use crate::constants::errors::Error;
use crate::api::functions::get_balance;
use crate::api::state_handler::read_state;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::borrow::execute_repay;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::api::resource_manager::{acquire_lock, release_lock};
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::{get_cached_exchange_rate, get_reserve_data, user_normalized_supply};
use crate::protocol::libraries::logic::reserve::{self, burn_scaled, mint_scaled};
use crate::declarations::assets::{ExecuteLiquidationParams, ExecuteRepayParams, ReserveData};
use crate::{
    api::state_handler::mutate_state,
    declarations::assets::ExecuteSupplyParams,
    protocol::libraries::{logic::update::UpdateLogic, math::calculate::get_exchange_rates},
};


/// @title Execute Liquidation Function
/// @notice This function allows for the liquidation of a user's collateral in the event of an under-collateralized position or overdue debt. 
///         It performs necessary checks, updates the user's profile and collateral data, and ensures the asset is transferred to the platform’s reserve.
///         If any step fails, the function reverts the operation and ensures all resources are properly released.
///
/// @dev The function follows a structured workflow:
///      1. **Input validation**: Ensures the asset name is valid, the amount to be liquidated is greater than zero, and that the caller has permission to execute the liquidation.
///      2. **Collateral eligibility check**: Ensures the user’s collateral meets the criteria for liquidation (e.g., under-collateralized position, overdue debt).
///      3. **Lock acquisition**: Acquires a lock to ensure that only one liquidation operation can be processed at a time for a user.
///      4. **State mutation**: Updates the collateral, user profile, and reserve data, reflecting the liquidation event.
///      5. **Liquidation execution**: Transfers the collateral assets to the platform and adjusts the user’s debt balance accordingly.
///      6. **Rollback mechanism**: In case of failure during any step of the liquidation, the system rolls back all changes and reverts collateral adjustments.
///      7. **Debt update**: Ensures that the user’s debt balance is updated in accordance with the liquidated assets, maintaining the integrity of the user’s financial status.
///      8. **Collateral release**: Releases any locks or resources tied to the collateral, ensuring that the system remains in a consistent state.
/// 
/// @param params The parameters needed to execute the liquidation, including the asset name and the amount to be liquidated.
///               The structure of `ExecuteLiquidationParams` includes:
///               - `asset`: The name of the asset to be liquidated.
///               - `amount`: The amount of collateral to be liquidated.
///               - `userPrincipal`: The principal ID of the user whose collateral is being liquidated.
/// 
/// @return Result<Nat, Error> Returns the new collateral balance after liquidation, or an error code if any part of the liquidation fails.
/// 
/// @error Error::EmptyAsset If the asset name is empty.
/// @error Error::InvalidAssetLength If the asset name exceeds the maximum length.
/// @error Error::InvalidAmount If the liquidation amount is less than or equal to zero.
/// @error Error::NotEligibleForLiquidation If the user’s position is not eligible for liquidation based on the current rules.
/// @error Error::AnonymousPrincipal If the caller is an anonymous principal and is not authorized to execute the liquidation.
/// @error Error::LockAcquisitionFailed If the lock acquisition fails, preventing the liquidation process.
/// @error Error::NoCollateralFound If the user's collateral cannot be found or is insufficient to meet the liquidation criteria.
/// @error Error::LiquidationFailed If the liquidation operation fails during asset transfer or state update.
/// @error Error::ErrorRollBack If the rollback process fails, leaving the system in an inconsistent state.
/// @error Error::ErrorDebtUpdate If the system fails to properly update the user's debt after liquidation.
/// @error Error::CollateralReleaseFailed If the system fails to release resources or locks after the liquidation process.

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

        //let (mut reward_amount, mut reward_collateral) = (Nat::from(0u128), Nat::from(0u128));
        let mut earned_rewards = Nat::from(0u128);
        let reward_result: Result<Nat, Error> = to_get_reward_amount(
            params.amount.clone(),
            params.collateral_asset.clone(),
            params.debt_asset.clone(),
            collateral_reserve_data.clone(),
            user_principal.clone(),
            user_reserve_data.clone(),
        )
        .await;

        match reward_result {
            Ok(amount) => {
                earned_rewards = amount;
            }
            Err(err) => {
                println!("Error occurred: {:?}", err);
                return Err(err);
            }
        }
        ic_cdk::println!("reward amount: {:?}", params.reward_amount);
        ic_cdk::println!("earned_rewards: {:?}", earned_rewards);

        if params.reward_amount > earned_rewards {
            ic_cdk::println!("Reward amount is greater than earned rewards");
            return Err(Error::InvalidAmount);
        }

        // panic!("something went wrong"); 
        // ic_cdk::println!("reward_amount: {:?}", earned_rewards);


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


/// @title Get Reward Amount Function
/// @notice This function calculates the reward amount for a user based on their collateral and debt assets.
///         It performs necessary validations and computations to derive the final reward, considering the collateral balance,
///         asset exchange rates, liquidation bonuses, and collateral limits.
///         The function returns the calculated reward amount or an error if any of the steps fail.
///
/// @dev The function follows a structured workflow:
///      1. **Parse Inputs**: Parses and validates the input parameters, such as the asset names and amount.
///      2. **Fetch Balance**: Retrieves the user's collateral balance from the collateral asset's canister.
///      3. **Normalize Collateral**: Normalizes the user's collateral based on the liquidity index and normalized supply.
///      4. **Fetch Exchange Rates**: Retrieves the exchange rates for both collateral and debt assets in USD to compute their relative values.
///      5. **Calculate Collateral**: Computes the final collateral amount based on the provided amount, exchange rates, and liquidation bonus.
///      6. **Determine Max Collateral**: Compares the calculated collateral with the available collateral balance and sets the final maximum collateral.
///      7. **Return Result**: Returns the final calculated collateral amount or an error in case of failure.
///
/// @param amount The amount of debt to be considered for the reward calculation.
/// @param collateral_asset The name of the collateral asset.
/// @param debt_asset The name of the debt asset.
/// @param collateral_reserve_data The reserve data associated with the collateral asset, including liquidation bonuses.
/// @param user_principal The user's principal ID for identifying the user.
/// @param user_reserve_data The user's reserve data, including liquidity index.
///
/// @return Result<Nat, Error> Returns the maximum collateral amount available to the user after applying the liquidation bonus, or an error if any part of the process fails.
///
/// @error Error::EmailError If an error occurs while parsing the d_token_canister or during the collateral balance fetch.
/// @error Error::ExchangeRateError If there is an issue fetching the exchange rate for the assets.
/// @error Error::InvalidCollateralAmount If the calculated collateral amount is not valid or exceeds the available collateral balance.
/// @error Error::LiquidationError If any issue occurs during the liquidation process or calculation.

pub async fn to_get_reward_amount(
    amount: Nat,
    collateral_asset: String,
    debt_asset: String,
    collateral_reserve_data: ReserveData,
    user_principal: Principal,
    user_reserve_data: UserReserveData,
) -> Result<Nat, Error> {
    ic_cdk::println!("Starting to_get_reward_amount function");
    ic_cdk::println!("Received parameters: amount = {:?}, collateral_asset = {:?}, debt_asset = {:?}, user_principal = {:?}", amount, collateral_asset, debt_asset, user_principal);

    let d_token_canister =
        match Principal::from_text(collateral_reserve_data.d_token_canister.clone().unwrap()) {
            Ok(canister) => {
                ic_cdk::println!("Parsed d_token_canister: {:?}", canister);
                canister
            }
            Err(e) => {
                ic_cdk::println!("Error converting text to principal: {:?}", e);
                return Err(Error::EmailError);
            }
        };

    let mut collateral_balance = match get_balance(d_token_canister, user_principal).await {
        Ok(balance) => {
            ic_cdk::println!("Collateral balance fetched: {:?}", balance);
            balance
        }
        Err(e) => {
            ic_cdk::println!("Error fetching collateral balance: {:?}", e);
            return Err(e);
        }
    };

    ic_cdk::println!("user normalized = {}",user_normalized_supply(collateral_reserve_data.clone()).unwrap());
    ic_cdk::println!("liquidity index = {:?}",user_reserve_data);

    collateral_balance = (collateral_balance
        .scaled_mul(user_normalized_supply(collateral_reserve_data.clone()).unwrap()))
    .scaled_div(user_reserve_data.liquidity_index);

    ic_cdk::println!("Collateral balance normalized: {:?}", collateral_balance);

    ic_cdk::println!("Fetching cached exchange rates for debt and collateral assets");
    let debt_in_usd = match get_cached_exchange_rate(debt_asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&debt_asset) {
                ic_cdk::println!("Fetched debt asset exchange rate: {:?}", cached_price.price);
                Some(cached_price.price.clone())
            } else {
                ic_cdk::println!("No cached price found for debt asset: {:?}", debt_asset);
                None
            }
        }
        Err(err) => {
            ic_cdk::println!(
                "Error fetching exchange rate for debt asset {:?}: {:?}",
                debt_asset,
                err
            );
            None
        }
    };

    let collateral_in_usd = match get_cached_exchange_rate(collateral_asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&collateral_asset) {
                ic_cdk::println!(
                    "Fetched collateral asset exchange rate: {:?}",
                    cached_price.price
                );
                Some(cached_price.price.clone())
            } else {
                ic_cdk::println!(
                    "No cached price found for collateral asset: {:?}",
                    collateral_asset
                );
                None
            }
        }
        Err(err) => {
            ic_cdk::println!(
                "Error fetching exchange rate for collateral asset {:?}: {:?}",
                collateral_asset,
                err
            );
            None
        }
    };

    let mut collateral_amount = amount.clone();
    ic_cdk::println!("Initial collateral amount: {:?}", collateral_amount);

    if collateral_asset != debt_asset {
        ic_cdk::println!("Collateral and debt assets are different, fetching exchange rates");
        ic_cdk::println!("debt_in_usd: {:?}", debt_in_usd);
        ic_cdk::println!("collateral_in_usd: {:?}", collateral_in_usd);
        ic_cdk::println!("amount = {}", amount.clone());
        ic_cdk::println!(
            "amount * debt_in_usd: {:?}",
            amount.clone() * debt_in_usd.clone().unwrap()
        );
        ic_cdk::println!(
            "collateral_in_usd: {:?}",
            (amount.clone() * debt_in_usd.clone().unwrap()) / collateral_in_usd.clone().unwrap()
        );
        collateral_amount = (amount * debt_in_usd.unwrap()) / collateral_in_usd.unwrap()
    }
    ic_cdk::println!("Final collateral amount: {:?}", collateral_amount);
    ic_cdk::println!(
        "liquidation bonus: {:?}",
        collateral_reserve_data.configuration.liquidation_bonus
    );

    let final_collateral_amount = collateral_amount.clone()
        + collateral_amount.clone().scaled_mul(
            collateral_reserve_data
                .configuration
                .liquidation_bonus
                .clone()
                / Nat::from(100u128),
        );

    ic_cdk::println!("Calculated final collateral: {:?}", final_collateral_amount);

    let max_collateral;

    if final_collateral_amount > collateral_balance {
        max_collateral = collateral_balance;
        ic_cdk::println!("Max collateral set to balance: {:?}", max_collateral);

    } else {
        max_collateral = final_collateral_amount;
        ic_cdk::println!(
            "Max collateral set to calculated amount: {:?}",
            max_collateral
        );
    }

    Ok((max_collateral))
}
