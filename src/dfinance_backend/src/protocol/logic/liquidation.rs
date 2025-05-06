use crate::api::inter_canister::get_balance;
use crate::constants::constant_variables::constants::{ONE_VALUE, PERCENTAGE_FACTOR};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::protocol::libraries::user::{register_user, user_normalized_supply};
use crate::{debug, error, info, trace};
use crate::declarations::datatypes::{ReserveData, UserReserveData};
use crate::declarations::structs::{ExecuteLiquidationParams, ExecuteRepayParams};
use crate::guards::access_control::guard_principal_not_anonymous;
use crate::guards::api_limiter::request_limiter;
use crate::guards::locks_handler::CallerGuard;
use crate::protocol::libraries::reserve::{self, burn_scaled, mint_scaled, get_reserve_data};
use crate::protocol::libraries::update::{user_data, user_reserve};
use crate::protocol::logic::borrow::repay;
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::math_utils::ScalingMath;
use crate::stable_storage::storable::Candid;
use crate::{
    declarations::structs::ExecuteSupplyParams,
    protocol::libraries::update::UpdateLogic,
    stable_storage::state_handler::{mutate_state, read_state},
};
use candid::{Nat, Principal};
use ic_cdk::{api, update};
use crate::protocol::utils::log::{log_internal, LogLevel, LogFlusher};
use crate::stable_storage::state_handler::insert_certified_value;
use crate::protocol::utils::price::{calculate_transfer_fee, get_cached_exchange_rate};

/*
-------------------------------------
----------- LIQUIDATION LOGIC ------------
-------------------------------------
 */

/**
 * @title Execute Liquidation Function
 *
 * @notice This function enables the liquidation of a user's collateral when they have an under-collateralized position
 *         or overdue debt. It performs checks, updates user and collateral data, and transfers the collateral to the
 *         platform’s reserve. The function ensures all resources are released if any step fails, reverting the operation.
 *
 * @dev The function follows this structured workflow:
 *      1. **Input validation**: Verifies the asset name, checks that the amount is greater than zero,
 *         and ensures the caller has permission to execute the liquidation.
 *      2. **Collateral eligibility check**: Ensures the user’s collateral is eligible for liquidation
 *         (e.g., under-collateralized position or overdue debt).
 *      3. **Lock acquisition**: Acquires a lock to ensure that only one liquidation operation can proceed at a time for a user.
 *      4. **State mutation**: Updates collateral, user profile, and reserve data to reflect the liquidation event.
 *      5. **Liquidation execution**: Transfers the collateral assets to the platform’s reserve and adjusts the user’s debt balance.
 *      6. **Rollback mechanism**: In case of failure, the system reverts all changes and restores collateral data.
 *      7. **Debt update**: Updates the user’s debt balance in accordance with the liquidated assets.
 *      8. **Collateral release**: Releases any locks or resources tied to the collateral, ensuring the system remains in a consistent state.
 *
 * @functionality This function provides a critical operation for ensuring the platform maintains collateral integrity
 *               by enforcing liquidation when necessary to protect the system from excessive risk due to overdue debts
 *               or under-collateralized positions.
 *
 * @param params The parameters needed for the liquidation operation, including the asset name and the amount to be liquidated:
 *               - `asset`: The name of the collateral asset to be liquidated.
 *               - `amount`: The amount of collateral to be liquidated.
 *               - `userPrincipal`: The principal ID of the user whose collateral is being liquidated.
 *
 * @return Result<Nat, Error> Returns the updated collateral balance after liquidation or an error code if any operation fails.
 */

#[update]
pub async fn execute_liquidation(params: ExecuteLiquidationParams) -> Result<Nat, Error> {
    request_limiter()?;
    let liquidator_principal = api::caller();
    let _liquidator_guard = CallerGuard::lock_principal(liquidator_principal.clone())?;
    // guard for user
    guard_principal_not_anonymous(&params.on_behalf_of)?;

    // validations
    validate_asset_name(&params.debt_asset)?;
    validate_asset_name(&params.collateral_asset)?;
    validate_zero_value(&params.amount)?;
    validate_zero_value(&params.reward_amount)?;

    let platform_principal = ic_cdk::api::id();

    let user_principal = params.on_behalf_of;
    debug!("User Principal (Debt User): {}", user_principal.to_text());

    debug!(
        "amount liq = {}, reward liq = {}, User Principal (Debt User) = {}, debt_asset = {:?}, collateral_asset = {:?}",
        params.amount.clone(),
        params.reward_amount.clone(),
        params.on_behalf_of.to_text(),
        params.debt_asset,
        params.collateral_asset
    );
    
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(),
    };

    let repay_reserve_data = get_reserve_data(params.debt_asset.clone())?;

    let mut collateral_reserve_data = get_reserve_data(params.collateral_asset.clone())?;

    let mut user_account_data = user_data(user_principal)?;
    debug!("user account data: {:?}", user_account_data);

    // Check if the user has a reserve for the asset
    let mut user_reserve_data = user_reserve(&mut user_account_data, &params.collateral_asset)
    .and_then(|(_, reserve_data)| Some(reserve_data.clone()))
    .ok_or(Error::NoUserReserveDataFound)?;

    let transfer_token_fee = calculate_transfer_fee(&params.debt_asset, params.amount.clone())?;

    let (amount, liquidity_bonus) = to_get_reward_amount(
        params.amount.clone() - transfer_token_fee.clone(),
        params.collateral_asset.clone(),
        params.debt_asset.clone(),
        collateral_reserve_data.clone(),
        user_principal.clone(),
        user_reserve_data.clone(),
    )
    .await?;

    let earned_rewards = amount;
    let liquidation_bonus_amount = liquidity_bonus;
    debug!("reward amount: {:?}, earned_rewards: {:?}", params.reward_amount, earned_rewards);

    if params.reward_amount > earned_rewards
        && (params.reward_amount.clone() % earned_rewards) != Nat::from(ONE_VALUE)
    {
        error!("Reward amount is greater than earned rewards");
        return Err(Error::RewardIsHigher);
    }
    register_user()?;
    let mut liquidator_data = user_data(liquidator_principal)?;

    let dtoken_canister = read_state(|state| {
        state
            .asset_index
            .get(&params.collateral_asset.to_string())
            .and_then(|reserve_data| reserve_data.d_token_canister.clone())
    })
    .ok_or_else(|| Error::NoCanisterIdFound)?;

    let collateral_dtoken_principal = dtoken_canister;

    let reward_amount: Nat = params.reward_amount.clone();

    let mut collateral_reserve_cache = reserve::cache(&collateral_reserve_data);
    debug!(
        "collateral reserve cache fetched successfully: {:?}",
        collateral_reserve_cache
    );

    reserve::update_state(&mut collateral_reserve_data, &mut collateral_reserve_cache)?;
    info!("Reserve state updated successfully");

    reserve::update_interest_rates(
        &mut collateral_reserve_data,
        &mut collateral_reserve_cache,
        zero_nat_value(),
        zero_nat_value(),
    )
    .await?;
    info!("Interest rates updated successfully");

    ValidationLogic::validate_liquidation(
        params.debt_asset.clone(),
        params.amount.clone() - transfer_token_fee.clone(),
        reward_amount.clone(),
        liquidator_principal,
        user_principal,
        repay_reserve_data,
    )
    .await?;
    info!("liquidation validation successful"); //info

    let _user_guard = CallerGuard::lock_principal(user_principal.clone())?;

    burn_scaled(
        &mut collateral_reserve_data,
        &mut user_reserve_data,
        reward_amount.clone(),
        collateral_reserve_cache.next_liquidity_index.clone(),
        user_principal,
        collateral_dtoken_principal,
        platform_principal,
        true,
    )
    .await?;
    info!("burn scaled successfully");

    let liquidation_fee_percentage = collateral_reserve_data
        .configuration
        .liquidation_protocol_fee
        .clone();

    let protocol_fee_amount =
        liquidation_bonus_amount.scaled_mul(liquidation_fee_percentage.clone() / Nat::from(100u128));
        debug!(
            "liquidation fee percentage: {:?}, protocol fee amount: {:?}",
            liquidation_fee_percentage,
            protocol_fee_amount
        );
        

    if reward_amount.clone() < protocol_fee_amount.clone() {
        error!("protocol fee amount is greater than reward amount");
        return Err(Error::LiquidationProtocolfeeIsHigher);
    }

    let supply_param = ExecuteSupplyParams {
        asset: params.collateral_asset.to_string(),
        amount: reward_amount.clone() - protocol_fee_amount.clone(),
        is_collateral: true,
    };

    if let Err(err) = UpdateLogic::update_user_data_supply(
        liquidator_principal,
        &collateral_reserve_cache,
        supply_param,
        &mut collateral_reserve_data,
    )
    .await
    {
        mint_scaled(
            &mut collateral_reserve_data,
            &mut user_reserve_data,
            reward_amount,
            collateral_reserve_cache.next_liquidity_index,
            user_principal,
            collateral_dtoken_principal,
            platform_principal,
            true,
        )
        .await?;
        error!("Error in minting scaled: {:?}", err);
        return Err(err);
    }

    mutate_state(|state| {
        state.asset_index.insert(
            params.collateral_asset.clone(),
            Candid(collateral_reserve_data.clone()),
        )
    });

    match user_account_data.reserves.as_mut() {
        Some(reserves) => {
            if let Some((_, reserve_data)) = reserves
                .iter_mut()
                .find(|(asset, _)| asset == &params.collateral_asset)
            {
                *reserve_data = user_reserve_data.clone();
            } else {
                reserves.push((params.collateral_asset.clone(), user_reserve_data.clone()));
            }
        }
        None => {
            user_account_data.reserves = Some(vec![(
                params.collateral_asset.clone(),
                user_reserve_data.clone(),
            )]);
        }
    }

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_account_data.clone()));
    });
    insert_certified_value(user_principal.to_string(), user_account_data.clone());

    let params_repay = ExecuteRepayParams {
        asset: params.debt_asset.clone(),
        amount: params.amount.clone(),
        on_behalf_of: Some(user_principal),
    };

    let repay_response = repay(params_repay).await;

    match repay_response {
        Ok(_) => {
            info!("execute repay called successfully");
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

                    match liquidator_data.reserves.as_mut() {
                        Some(reserves) => match reserves
                            .iter_mut()
                            .find(|(asset, _)| asset == &params.collateral_asset)
                        {
                            Some((_, reserve_data)) => reserve_data,
                            None => {
                                error!(
                                    "Failed to find the collateral asset after insertion."
                                );
                                return Err(e);
                            }
                        },
                        None => {
                            error!("Reserves are unexpectedly None after insertion.");
                            return Err(e);
                        }
                    }
                }
            };

            burn_scaled(
                &mut collateral_reserve_data,
                &mut liquidator_reserve_data,
                reward_amount.clone(),
                collateral_reserve_cache.next_liquidity_index.clone(),
                liquidator_principal,
                collateral_dtoken_principal,
                platform_principal,
                true,
            )
            .await?;

            mint_scaled(
                &mut collateral_reserve_data,
                &mut user_reserve_data,
                reward_amount.clone() - protocol_fee_amount.clone(),
                collateral_reserve_cache.next_liquidity_index,
                user_principal,
                collateral_dtoken_principal,
                platform_principal,
                true,
            )
            .await?;

            mutate_state(|state| {
                state.asset_index.insert(
                    params.collateral_asset.clone(),
                    Candid(collateral_reserve_data.clone()),
                )
            });

            return Err(e);
        }
    }
}

/**
 * @title Get Reward Amount Function
 *
 * @notice This function calculates the reward amount for a user based on their collateral and debt assets.
 *         It performs necessary validations and computations to derive the final reward, considering the collateral balance,
 *         asset exchange rates, liquidation bonuses, and collateral limits. The function returns the calculated reward amount
 *         or an error if any of the steps fail.
 *
 * @dev The function follows this structured workflow:
 *      1. **Parse Inputs**: Parses and validates the input parameters, such as the asset names and amount.
 *      2. **Fetch Balance**: Retrieves the user's collateral balance from the collateral asset's canister.
 *      3. **Normalize Collateral**: Normalizes the user's collateral based on the liquidity index and normalized supply.
 *      4. **Fetch Exchange Rates**: Retrieves the exchange rates for both collateral and debt assets in USD
 *         to compute their relative values.
 *      5. **Calculate Collateral**: Computes the final collateral amount based on the provided amount, exchange rates,
 *         and liquidation bonus.
 *      6. **Determine Max Collateral**: Compares the calculated collateral with the available collateral balance and
 *         sets the final maximum collateral.
 *      7. **Return Result**: Returns the final calculated collateral amount or an error in case of failure.
 *
 * @functionality This function provides an essential calculation for determining the reward amount available to the user
 *               based on their collateral and debt assets, ensuring that the platform can accurately calculate rewards and
 *               adjust user balances accordingly.
 *
 * @param amount The amount of debt to be considered for the reward calculation.
 * @param collateral_asset The name of the collateral asset.
 * @param debt_asset The name of the debt asset.
 * @param collateral_reserve_data The reserve data associated with the collateral asset, including liquidation bonuses.
 * @param user_principal The user's principal ID for identifying the user.
 * @param user_reserve_data The user's reserve data, including liquidity index.
 *
 * @return Result<Nat, Error> Returns the maximum collateral amount available to the user after applying the liquidation bonus,
 *         or an error if any part of the process fails.
 */
pub async fn to_get_reward_amount(
    amount: Nat,
    collateral_asset: String,
    debt_asset: String,
    collateral_reserve_data: ReserveData,
    user_principal: Principal,
    user_reserve_data: UserReserveData,
) -> Result<(Nat, Nat), Error> {
    trace!("Starting to_get_reward_amount function");

    let d_token_canister = collateral_reserve_data.d_token_canister.clone().ok_or_else(|| {
        error!("No d token canister ID found.");
        Error::NoCanisterIdFound
    })?;

    let mut collateral_balance = get_balance(d_token_canister, user_principal).await?;
    let norm_supply = user_normalized_supply(collateral_reserve_data.clone())?;
    collateral_balance = (collateral_balance
        .scaled_mul(norm_supply))
    .scaled_div(user_reserve_data.liquidity_index);

    let debt_price = get_cached_exchange_rate(debt_asset.clone())?;

    let collateral_price = get_cached_exchange_rate(collateral_asset.clone())?;

    let mut collateral_amount = amount.clone();
    debug!("Collateral balance and Initial collateral amount  {:?} ,{:?}", collateral_balance, collateral_amount);

    if collateral_asset != debt_asset {
        if debt_price == zero_nat_value() || collateral_price == zero_nat_value() {
            error!("Invalid exchange rate for either collateral_asset or debt asset");
            return Err(Error::ErrorPriceCache);
        }
        collateral_amount = (amount * debt_price) / collateral_price
    }

    let liquidation_bonus_amount = collateral_amount.clone().scaled_mul(
        collateral_reserve_data
            .configuration
            .liquidation_bonus
            .clone()
            / Nat::from(PERCENTAGE_FACTOR),
    );

    let final_collateral_amount = collateral_amount + liquidation_bonus_amount.clone();

    debug!("Calculated final collateral: {:?}", final_collateral_amount);

    let max_collateral;

    if final_collateral_amount > collateral_balance {
        max_collateral = collateral_balance;
        debug!("Max collateral set to balance: {:?}", max_collateral);
    } else {
        max_collateral = final_collateral_amount;
        debug!(
            "Max collateral set to calculated amount: {:?}",
            max_collateral
        );
    }

    Ok((max_collateral, liquidation_bonus_amount))
}
