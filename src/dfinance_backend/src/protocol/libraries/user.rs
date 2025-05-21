use super::update::{user_data, user_reserve};
use crate::api::inter_canister::{asset_transfer, asset_transfer_from, get_balance};
use crate::constants::constant_variables::constants::MIN_BORROW;
use crate::constants::constant_variables::constants::{
    HEALTH_FACTOR_BARRIER, PERCENTAGE_FACTOR, SCALING_FACTOR,
};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::datatypes::{ReserveData, UserData, UserReserveData};
use crate::declarations::structs::{AssetData, UserAccountData};
#[cfg(feature = "testnet")]
use crate::guards::access_control::check_is_tester;
use crate::guards::access_control::guard_principal_not_anonymous;
use crate::guards::access_control::{guard_admin_only, guard_prevent_anonymous};
use crate::protocol::libraries::reserve::get_asset_principal;
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::protocol::utils::math_utils::{
    calculate_compounded_interest, calculate_linear_interest, current_timestamp, get_max_value,
};
use crate::protocol::utils::price::{get_cached_exchange_rate, update_token_price};
use crate::stable_storage::state_handler::insert_certified_value;
use crate::stable_storage::storable::Candid;
use crate::{debug, error, info, trace};
use crate::{
    protocol::libraries::reserve::get_reserve_data,
    protocol::utils::math_utils::ScalingMath,
    stable_storage::state_handler::{mutate_state, read_state},
};
use candid::{Nat, Principal};
use futures::stream::{self, StreamExt};
use ic_cdk::update;

/*
 * @title User Account Data Calculation
 * @functionality User account metric calculation logic.
 *
 * @notice Computes account metrics like total collateral, debt, LTV, and health factor.
 * @functionality Helps determine user’s borrowing power and risk exposure.
 *
 * @dev Aggregates user reserves, fetches exchange rates, and determines borrowing capacity.
 * @functionality Performs weighted calculations based on user reserve data and asset configuration.
 *
 * @param on_behalf (Optional) The principal of the user whose account data is being calculated.
 * @functionality Allows calculating data for a different user (e.g., by admin).
 *
 * @return A tuple containing:
 *   - Total collateral
 *   - Total debt
 *   - Average LTV
 *   - Liquidation threshold
 *   - Health factor
 *   - Available borrow
 *   - Has zero-LTV collateral (bool)
 * @functionality Returns all relevant account status metrics for lending/borrowing logic.
 *
 * @formula avg_ltv = Σ(collateral_i_usd * ltv_i) / total_collateral_usd
 * @formula avg_liquidation_threshold = Σ(collateral_i_usd * threshold_i) / total_collateral_usd
 * @formula health_factor = (total_collateral_usd * avg_liquidation_threshold) / total_debt_usd  (or MAX if debt is 0)
 * @formula available_borrow_usd = max(0, Σ(collateral_i_usd * ltv_i / 100%) - total_debt_usd) (adjust for MIN_BORROW)
 *          (where _i denotes values for each collateral asset, Σ denotes summation)
 *          (total_collateral_usd = Σ collateral_i_usd)
 *          (total_debt_usd = Σ debt_i_usd)
 */
pub async fn calculate_user_account_data(
    on_behalf: Option<Principal>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    // trace!("calling calculate user account data");

    if on_behalf == Some(Principal::anonymous()) {
        error!("Anonymous principal detected.");
        return Err(Error::AnonymousPrincipal);
    }

    guard_prevent_anonymous()?;

    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            user_principal
        }
    };


    let max = get_max_value();

    let user_data = user_data(user_principal)?;

    if user_data.reserves.is_none() {
        info!("No reserves found for the user.");
        return Ok((
            zero_nat_value(),
            zero_nat_value(),
            zero_nat_value(),
            zero_nat_value(),
            max,
            zero_nat_value(),
            false,
        ));
    }

    let user_data_reserves = user_data.reserves.as_ref().ok_or_else(|| {
        error!("User data reserves not found.");
        Error::NoUserReserveDataFound
    })?;

    let mut total_collateral = zero_nat_value();
    let mut total_debt = zero_nat_value();
    let mut avg_ltv = zero_nat_value();
    let mut avg_liquidation_threshold = zero_nat_value();
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = zero_nat_value();

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        if !user_reserve_data.is_using_as_collateral_or_borrow {
            continue;
        }

        let reserve_data = get_reserve_data(reserve_name.clone())?;

        let rate = get_cached_exchange_rate(user_reserve_data.reserve.clone())?;

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            debug!("Reserve '{}' is collateral.", user_reserve_data.reserve);

            let user_balance = get_user_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await?;
            debug!("user balance in account data = {}", user_balance);

            // info!("get user balance in base currency called");

            total_collateral += user_balance.clone();

            if reserve_data.configuration.ltv != zero_nat_value() {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
            } else {
                has_zero_ltv_collateral = true;
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);

            available_borrow += user_balance.scaled_mul(reserve_data.configuration.ltv)
                / Nat::from(PERCENTAGE_FACTOR);
        }

        if user_reserve_data.is_borrowed {
            let user_debt = get_user_debt_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await?;
            // info!("get user debt in base currency called");

            total_debt += user_debt.clone();
        }
    }

    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = zero_nat_value();
    } else {
        available_borrow -= total_debt.clone();
    }

    avg_ltv = if total_collateral != zero_nat_value() {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };

    avg_liquidation_threshold = if total_collateral != zero_nat_value() {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };

    let health_factor = if total_debt == zero_nat_value() {
        debug!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };

    debug!(
            "Final calculated values: total_collateral = {}, total_debt = {}, avg_ltv = {}, avg_liquidation_threshold = {}, health_factor = {}, has_zero_ltv_collateral = {}, available_borrow = {}",
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral,
            available_borrow
        );

    Ok((
        total_collateral,
        total_debt,
        avg_ltv,
        avg_liquidation_threshold,
        health_factor,
        available_borrow,
        has_zero_ltv_collateral,
    ))
}

/*
 * @title User Account Data Calculation
 * @functionality Calculates the user's financial metrics for lending and borrowing.
 *
 * @notice Computes account metrics like total collateral, debt, LTV, and health factor.
 * @functionality Provides a risk and capacity snapshot for a given or calling user.
 *
 * @dev Aggregates user reserves, fetches exchange rates, and determines borrowing capacity.
 * @functionality Performs dynamic calculations using live user data and asset configurations.
 *
 * @param on_behalf (Optional) The principal of the user whose account data is being calculated.
 * @functionality Allows an admin or proxy to calculate metrics for another user.
 *
 * @return A tuple containing:
 *   - Total collateral
 *   - Total debt
 *   - Average LTV
 *   - Liquidation threshold
 *   - Health factor
 *   - Available borrow
 *   - Has zero-LTV collateral (bool)
 * @functionality Returns core metrics used in the lending protocol to assess borrowing limits and liquidation risk.
 */

pub async fn calculate_user_asset_data(
    on_behalf: Option<Principal>,
    dtoken_balance: Option<Vec<AssetData>>,
    debt_token_balance: Option<Vec<AssetData>>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            user_principal
        }
    };

    let dtoken_balance = dtoken_balance.unwrap_or_default();
    let debt_token_balance = debt_token_balance.unwrap_or_default();

    let max = get_max_value();

    let user_data = user_data(user_principal)?;

    if user_data.reserves.is_none() {
        debug!("No reserves found for the user.");
        return Ok((
            zero_nat_value(),
            zero_nat_value(),
            zero_nat_value(),
            zero_nat_value(),
            max,
            zero_nat_value(),
            false,
        ));
    }

    let user_data_reserves = user_data.reserves.as_ref().ok_or_else(|| {
        error!("User data reserves not found.");
        Error::NoUserReserveDataFound
    })?;
    let mut total_collateral = zero_nat_value();
    let mut total_debt = zero_nat_value();
    let mut avg_ltv = zero_nat_value();
    let mut avg_liquidation_threshold = zero_nat_value();
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = zero_nat_value();

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        if !user_reserve_data.is_using_as_collateral_or_borrow {
            continue;
        }

        let reserve_data = get_reserve_data(reserve_name.clone())?;

        let rate = get_cached_exchange_rate(user_reserve_data.reserve.clone())?;

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            let balance: Nat = dtoken_balance
                .iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(zero_nat_value());

            let user_balance = get_user_asset_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                balance.clone(),
                asset_price.clone(),
            )
            .await?;

            total_collateral += user_balance.clone();

            if reserve_data.configuration.ltv != zero_nat_value() {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
            } else {
                has_zero_ltv_collateral = true;
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);

            available_borrow += user_balance.scaled_mul(reserve_data.configuration.ltv)
                / Nat::from(PERCENTAGE_FACTOR);
            debug!(
                "available borrow after adding collateral of {} = {}",
                reserve_name, available_borrow
            );
        }

        if user_reserve_data.is_borrowed {
            let rate = get_cached_exchange_rate(user_reserve_data.reserve.clone())?;

            let asset_price = rate;

            let balance: Nat = debt_token_balance
                .iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(zero_nat_value());

            let user_debt = get_user_asset_debt_in_base_currency(
                &user_reserve_data,
                balance.clone(),
                asset_price.clone(),
            )
            .await?;

            total_debt += user_debt.clone();
        }
    }
    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = zero_nat_value();
    } else {
        available_borrow -= total_debt.clone();
    }

    avg_ltv = if total_collateral != zero_nat_value() {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };

    avg_liquidation_threshold = if total_collateral != zero_nat_value() {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };

    let health_factor = if total_debt == zero_nat_value() {
        debug!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };

    debug!(
            "Final calculated values: total_collateral = {}, total_debt = {}, avg_ltv = {}, avg_liquidation_threshold = {}, health_factor = {}, has_zero_ltv_collateral = {}, available_borrow = {}",
            total_collateral,
            total_debt,
            avg_ltv,
            avg_liquidation_threshold,
            health_factor,
            has_zero_ltv_collateral,
            available_borrow
        );

    Ok((
        total_collateral,
        total_debt,
        avg_ltv,
        avg_liquidation_threshold,
        health_factor,
        available_borrow,
        has_zero_ltv_collateral,
    ))
}

/*
 * @title Get User Balance in Base Currency
 * @functionality Calculates the user's total asset balance expressed in a base currency like USD.
 *
 * @notice Computes the user's total balance in the base currency (USD equivalent).
 * @functionality Useful for showing portfolio value or computing risk thresholds.
 *
 * @dev Fetches the user's scaled balance, applies normalization, and multiplies by the asset's exchange rate.
 * @functionality Leverages dToken balance, reserve data, and asset price for accurate computation.
 *
 * @param user_principal The principal of the user whose balance is being calculated.
 * @functionality Used to identify the user and retrieve their balance from the dToken canister.
 *
 * @param reserve The reserve data associated with the user's asset.
 * @functionality Provides configuration like liquidity index and reserve ID for normalization.
 *
 * @param asset_price The price of the asset in the base currency.
 * @functionality Used to convert normalized token balance into base currency value.
 *
 *
 * @return The user's balance in base currency.
 * @functionality Returns a single `Nat` representing the USD-equivalent value of the user's position.
 */

pub async fn get_user_balance_in_base_currency(
    user_principal: Principal,
    reserve: &UserReserveData,
    asset_price: Nat,
) -> Result<Nat, Error> {
    // trace!("Calculating user balance in base currency...");
    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let d_token_canister_principal: Principal = asset_reserve.d_token_canister.clone().unwrap();

    let user_scaled_balance = get_balance(d_token_canister_principal, user_principal).await?;

    let normalized_supply = user_normalized_supply(asset_reserve)?;
    let user_scaled = if reserve.liquidity_index != zero_nat_value() {
        user_scaled_balance
            .clone()
            .scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };

    let user_scaled_balanced_normalized = user_scaled.scaled_mul(normalized_supply);
    let result  = user_scaled_balanced_normalized.scaled_mul(asset_price);
    debug!(
        "Final user balance in base currency = {}", result
    );
    Ok(result)
}

/**
 * @title Get User Asset Balance in Base Currency
 * @dev Calculates the user's asset balance normalized to a base currency value.
 * @param _user_principal The principal of the user whose balance is being calculated.
 * @param reserve The reserve data associated with the asset.
 * @param user_balance The user's raw asset balance.
 * @param asset_price The current price of the asset in the base currency.
 * @returns The user's asset balance converted into the base currency, or an error if reserve data is not available.
 *
 * @functionality Normalizes and scales the user's asset balance using the liquidity index and reserve's normalized supply, then converts it into the base currency using the asset price.
 */
pub async fn get_user_asset_balance_in_base_currency(
    _user_principal: Principal,
    reserve: &UserReserveData,
    user_balance: Nat,
    asset_price: Nat,
) -> Result<Nat, Error> {
    trace!("Calculating user asset balance in base currency...");

    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let user_scaled_balance = user_balance.clone();

    let normalized_supply = user_normalized_supply(asset_reserve)?;

    let user_scaled = if reserve.liquidity_index != zero_nat_value() {
        user_scaled_balance
            .clone()
            .scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };

    let user_scaled_balanced_normalized = user_scaled.scaled_mul(normalized_supply);
    debug!(
        "user_scaled_balanced_normalized = {}",
        user_scaled_balanced_normalized
    );
    Ok(user_scaled_balanced_normalized.scaled_mul(asset_price))
}

/*
 * @title Get User Debt in Base Currency
 * @functionality Calculates a user’s total outstanding debt in the base currency (e.g., USD).
 *
 * @notice Computes the user's normalized debt and converts it to base currency using the asset's price.
 *
 * @dev Retrieves the debt token balance from the relevant canister, applies variable borrow index and normalization,
 *      then multiplies the result by the asset's exchange rate to determine the debt value in base currency.
 *
 * @param user_principal The principal of the user whose debt is being calculated.
 * @functionality Used to identify the user's account when querying the debt token canister.
 *
 * @param reserve The reserve data associated with the user's asset.
 * @functionality Provides access to debt token canister and indexes used in debt normalization.
 *
 * @param asset_price The price of the asset in the base currency.
 * @functionality Converts the user's normalized debt into its base currency equivalent.
 *
 * @return The user's debt in base currency.
 * @functionality Returns a single `Nat` representing the debt after applying index-based normalization and price adjustment.
 */

pub async fn get_user_debt_in_base_currency(
    user_principal: Principal,
    reserve: &UserReserveData,
    asset_price: Nat,
) -> Result<Nat, Error> {
    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let debt_token_canister_principal = asset_reserve.debt_token_canister.clone().unwrap();

    let mut user_variable_debt = get_balance(debt_token_canister_principal, user_principal).await?;

    let user_normailzed_debt = user_normalized_debt(asset_reserve)?;

    if user_variable_debt != zero_nat_value() {
        user_variable_debt = user_variable_debt.scaled_div(reserve.variable_borrow_index.clone());
        user_variable_debt = user_variable_debt.scaled_mul(user_normailzed_debt);
    }

    let result = user_variable_debt.scaled_mul(asset_price);
    debug!("Final user debt in base currency: {}", result);
    Ok(result)
}

/*
 * @title Get User Asset Debt in Base Currency
 * @functionality Calculates a user's outstanding debt for a specific asset, expressed in the base currency (e.g., USD).
 *
 * @notice Computes the user's variable debt balance, applies normalization using indexes,
 *         and converts the result to base currency using the asset's current price.
 *
 * @dev Uses the user's raw balance (provided as `user_balance`), divides it by the current variable borrow index to get the scaled value,
 *      multiplies it by the normalized debt factor retrieved from the reserve data, and finally multiplies the result by the asset's price.
 *
 * @param user_principal The principal of the user whose debt is being calculated.
 * @functionality Identifies the user within the system (used mainly for logging or future extensions).
 *
 * @param reserve The user reserve data for the specific asset.
 * @functionality Provides access to the reserve ID and current variable borrow index for normalization.
 *
 * @param user_balance The raw debt balance (variable debt) of the user for the asset.
 * @functionality Serves as the base value to normalize and convert into base currency.
 *
 * @param asset_price The price of the asset in the base currency.
 * @functionality Used to compute the equivalent debt in base currency by multiplying with the normalized debt.
 *
 * @return Result<Nat, Error> The user's debt in base currency or an error if reserve data is invalid.
 * @functionality Returns a `Nat` representing the total normalized debt in base currency after applying all adjustments.
 */

pub async fn get_user_asset_debt_in_base_currency(
    reserve: &UserReserveData,
    user_balance: Nat,
    asset_price: Nat,
) -> Result<Nat, Error> {
    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let mut user_variable_debt = user_balance.clone();

    let user_normailzed_debt = user_normalized_debt(asset_reserve)?;

    if user_variable_debt != zero_nat_value() {
        user_variable_debt = user_variable_debt.scaled_div(reserve.variable_borrow_index.clone());
        user_variable_debt = user_variable_debt.scaled_mul(user_normailzed_debt);
        debug!(
            "User variable debt after normalization: {}",
            user_variable_debt
        );
    }
    Ok(user_variable_debt.scaled_mul(asset_price))
}

/*
 * @title Get Users Eligible for Liquidation
 * @notice Identifies users with a health factor below the liquidation threshold.
 *
 * @dev Uses concurrency for improved efficiency by fetching users in batches.
 *
 * @functionality This function fetches user data in batches and calculates their health factors to determine whether they are eligible for liquidation.
 *                It processes users concurrently using the `stream::iter` method and filters out users with health factors below the defined threshold.
 *
 * @param total_pages The total number of pages to fetch users from.
 * @functionality Defines how many pages of users will be processed in parallel, optimizing efficiency.
 *
 * @param page_size The number of users per page.
 * @functionality Specifies how many users will be processed per page for each batch, allowing concurrency control.
 *
 * @return A vector of tuples containing (Principal, UserAccountData, UserData).
 * @functionality Returns a list of users who are eligible for liquidation, based on their health factor,
 *                along with their account data and associated user data.
 */

#[update]
pub async fn get_liquidation_users_concurrent(
    total_pages: usize,
    page_size: usize,
) -> Vec<(Principal, UserAccountData, UserData)> {
    let vector_user_data = get_all_users().await;

    let mut liq_list = Vec::new();

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        // debug!("Processing page: {}", page + 1);

        // Concurrent processing of users in the current page
        let page_liq_list = stream::iter(users_to_process)
            .map(|(user_principal, user_data)| async move {
                match calculate_user_account_data(Some(user_principal)).await {
                    Ok(user_account_data_tuple) => {
                        let user_account_data = UserAccountData {
                            collateral: user_account_data_tuple.0,
                            debt: user_account_data_tuple.1,
                            ltv: user_account_data_tuple.2,
                            liquidation_threshold: user_account_data_tuple.3,
                            health_factor: user_account_data_tuple.4,
                            available_borrow: user_account_data_tuple.5,
                            has_zero_ltv_collateral: user_account_data_tuple.6,
                        };

                        // Fetch the user's health factor scaled by 100 and 10^8,
                        // unscale it by 100
                        // then compare it with the health factor limit (scaled to 10^8).
                        // This helps determine if the user's position is still safe or needs liquidation.
                        if user_account_data.health_factor.clone() / Nat::from(PERCENTAGE_FACTOR)
                            < Nat::from(HEALTH_FACTOR_BARRIER)
                        {
                            Some((user_principal, user_account_data, user_data))
                        } else {
                            None
                        }
                    }
                    Err(err) => {
                        error!("Failed to fetch data for {:?}: {:?}", user_principal, err);
                        None
                    }
                }
            })
            .buffered(100) // Process 100 users concurrently to prevent overload
            .collect::<Vec<_>>()
            .await;

        liq_list.extend(page_liq_list.into_iter().flatten());
    }
    liq_list
}

/*
 * @title Register User
 * @dev Registers a new user if they do not already exist.
 * @functionality This function checks if the user is anonymous or if the request exceeds the rate limit.
 *                If valid, it registers the user by inserting their profile into the state, or returns an error
 *                if the user already exists.
 *
 * @returns A string message indicating success or failure.
 */
pub fn register_user() -> Result<String, Error> {
    guard_prevent_anonymous()?;

    let user_principal: Principal = ic_cdk::api::caller();

    let user_data = mutate_state(|state| {
        match state.user_profile.get(&user_principal) {
            Some(_) => Ok("User available".to_string()),
            None => {
                let mut new_user_data = UserData::default();
                let user_count = state.user_profile.len(); //user_id is starting from 1
                let new_user_id = (user_count + 1).to_string();
                new_user_data.user_id = Some(new_user_id);

                state
                    .user_profile
                    .insert(user_principal.clone(), Candid(new_user_data.clone()));

                // Insert the user data into the certified storage
                insert_certified_value(user_principal.to_string(), new_user_data);
                Ok("User added".to_string())
            }
        }
    });

    user_data
}

/*
 * @title Create User Reserve With Low Health (For Testing Purpose - Pocket IC)
 * @notice Identifies users with a health factor below the liquidation threshold,
 *         enabling liquidation testing for Pocket IC.
 *
 * @functionality This function is specifically designed for testing purposes in Pocket IC,
 *                simulating a scenario where a user has a low health factor, potentially
 *                triggering liquidation. It registers a user's supply and borrow assets,
 *                validates the data, performs necessary token transfers, and updates the
 *                user’s reserve data and state.
 *
 * @dev This function has been designed specifically for testing purposes in Pocket IC
 *      by identifying users who fall below the threshold required for liquidation.
 *
 * @param asset_supply The asset being supplied by the user (e.g., collateral asset).
 * @param asset_borrow The asset being borrowed by the user.
 * @param supply_tokens The number of supply tokens the user wants to add to the reserve.
 * @param borrow_tokens The number of borrow tokens the user wants to take out from the reserve.
 *
 * @return Result<UserData, Error>:
 *         - Ok(UserData): The successfully updated user data, containing their reserve information.
 *         - Err(Error): An error if any validation or process fails, such as invalid input data or
 *           failed token transfers.
 */
#[cfg(feature = "testnet")]
#[update]
pub async fn create_user_reserve_with_low_health(
    asset_supply: String,
    asset_borrow: String,
    supply_tokens: Nat,
    borrow_tokens: Nat,
) -> Result<UserData, Error> {
    use crate::api::inter_canister::get_transfer_fee;

    trace!("Creating user reserve with low health factor...");
    if !check_is_tester() {
        error!("Invalid User");
        return Err(Error::InvalidUser);
    }
    // prevent anonymous access
    guard_prevent_anonymous()?;
    validate_asset_name(&asset_supply)?;
    validate_asset_name(&asset_borrow)?;
    validate_zero_value(&supply_tokens)?;
    validate_zero_value(&borrow_tokens)?;

    let user_principal = ic_cdk::caller();

    register_user()?;
    info!("User registered successfully");

    let platform_principal = ic_cdk::api::id();

    let (supply_reserve_data, borrow_reserve_data) = if asset_supply == asset_borrow {
        let mut reserve_data = mutate_state(|state| {
            state
                .asset_index
                .get(&asset_supply)
                .map(|reserve| reserve.0.clone())
                .ok_or(Error::NoReserveDataFound)
        })?;

        reserve_data.asset_supply += supply_tokens.clone();
        reserve_data.asset_borrow += borrow_tokens.clone();
        reserve_data.debt_index = Nat::from(SCALING_FACTOR);
        (reserve_data.clone(), reserve_data)
    } else {
        let mut supply_reserve_data = get_reserve_data(asset_supply.clone())?;

        supply_reserve_data.asset_supply += supply_tokens.clone();
        supply_reserve_data.debt_index = Nat::from(SCALING_FACTOR);

        let mut borrow_reserve_data = get_reserve_data(asset_borrow.clone())?;

        borrow_reserve_data.asset_borrow += borrow_tokens.clone();
        borrow_reserve_data.debt_index = Nat::from(SCALING_FACTOR);

        (supply_reserve_data, borrow_reserve_data)
    };

    let supply_asset_ledger_canister_id = get_asset_principal(asset_supply.clone())?;
    let debt_asset_ledger_canister_id = get_asset_principal(asset_borrow.clone())?;

    let mut user_data = user_data(user_principal)?;

    // If asset_supply == asset_borrow
    if asset_supply == asset_borrow {
        let reserve_key = asset_supply.clone();
        let user_reserve_entry = user_data
            .reserves
            .get_or_insert(vec![])
            .iter_mut()
            .find(|(asset, _)| asset == &reserve_key);

        match user_reserve_entry {
            Some((_, reserve_data)) => {
                reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
                reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
                reserve_data.d_token_balance += supply_tokens.clone();
                reserve_data.debt_token_blance += borrow_tokens.clone();
                reserve_data.is_using_as_collateral_or_borrow = true;
                reserve_data.is_collateral = true;
                reserve_data.is_borrowed = true;
                reserve_data.can_be_collateral = true;
            }
            None => {
                user_data.reserves.get_or_insert(vec![]).push((
                    reserve_key,
                    UserReserveData {
                        reserve: asset_supply.clone(),
                        last_update_timestamp: current_timestamp(),
                        liquidity_index: Nat::from(SCALING_FACTOR),
                        variable_borrow_index: Nat::from(SCALING_FACTOR),
                        d_token_balance: supply_tokens.clone(),
                        debt_token_blance: borrow_tokens.clone(),
                        is_using_as_collateral_or_borrow: true,
                        is_collateral: true,
                        is_borrowed: true,
                        can_be_collateral: true,
                    },
                ));
            }
        }
    } else {
        // For supply asset
        let supply_key = asset_supply.clone();
        let supply_entry = user_data
            .reserves
            .get_or_insert(vec![])
            .iter_mut()
            .find(|(asset, _)| asset == &supply_key);

        match supply_entry {
            Some((_, reserve_data)) => {
                reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
                reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
                reserve_data.d_token_balance += supply_tokens.clone();
                reserve_data.is_using_as_collateral_or_borrow = true;
                reserve_data.is_collateral = true;
            }
            None => {
                user_data.reserves.get_or_insert(vec![]).push((
                    supply_key,
                    UserReserveData {
                        reserve: asset_supply.clone(),
                        last_update_timestamp: current_timestamp(),
                        liquidity_index: Nat::from(SCALING_FACTOR),
                        variable_borrow_index: Nat::from(SCALING_FACTOR),
                        d_token_balance: supply_tokens.clone(),
                        debt_token_blance: Nat::from(0u32),
                        is_using_as_collateral_or_borrow: true,
                        is_collateral: true,
                        is_borrowed: false,
                        can_be_collateral: true,
                    },
                ));
            }
        }

        // For borrow asset
        let borrow_key = asset_borrow.clone();
        let borrow_entry = user_data
            .reserves
            .get_or_insert(vec![])
            .iter_mut()
            .find(|(asset, _)| asset == &borrow_key);

        match borrow_entry {
            Some((_, reserve_data)) => {
                reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
                reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
                reserve_data.debt_token_blance += borrow_tokens.clone();
                reserve_data.is_using_as_collateral_or_borrow = true;
                reserve_data.is_borrowed = true;
            }
            None => {
                user_data.reserves.get_or_insert(vec![]).push((
                    borrow_key,
                    UserReserveData {
                        reserve: asset_borrow.clone(),
                        last_update_timestamp: current_timestamp(),
                        liquidity_index: Nat::from(SCALING_FACTOR),
                        variable_borrow_index: Nat::from(SCALING_FACTOR),
                        d_token_balance: Nat::from(0u32),
                        debt_token_blance: borrow_tokens.clone(),
                        is_using_as_collateral_or_borrow: true,
                        is_collateral: false,
                        is_borrowed: true,
                        can_be_collateral: false,
                    },
                ));
            }
        }
    }

    let dtoken_principal = supply_reserve_data.d_token_canister.clone().unwrap();
    let debt_token_principal = borrow_reserve_data.debt_token_canister.clone().unwrap();

    match asset_transfer(
        user_principal,
        dtoken_principal, //dtoken
        platform_principal,
        supply_tokens.clone(),
    )
    .await
    {
        Ok(data) => {
            info!(
                "Dtoken transfer from backend to user executed successfully = {:?}",
                data
            );
        }
        Err(err) => {
            error!("Error: Dtoken transfer from backend to user: {:?}", err);
            return Err(Error::ErrorMintTokens);
        }
    }

    match asset_transfer_from(
        supply_asset_ledger_canister_id, //ledger
        user_principal,
        platform_principal,
        supply_tokens-get_transfer_fee(supply_asset_ledger_canister_id).await?,
    )
    .await
    {
        Ok(new_balance) => {
            info!(
                "Asset transfer from user to backend canister executed successfully = {:?}",
                new_balance
            );
        }
        Err(e) => {
            error!(
                "Error: Asset transfer from user to backend canister: {:?}",
                e
            );
            return Err(Error::ErrorMintTokens);
        }
    }

    match asset_transfer(
        user_principal,
        debt_token_principal, //debttoken
        platform_principal,
        borrow_tokens.clone(),
    )
    .await
    {
        Ok(_) => {
            info!("Dtoken transfer from backend to user executed successfully");
        }
        Err(err) => {
            error!("Error: Dtoken transfer from backend to user: {:?}", err);
            return Err(Error::ErrorMintTokens);
        }
    }

    match asset_transfer_from(
        debt_asset_ledger_canister_id,
        platform_principal,
        user_principal,
        borrow_tokens,
    )
    .await
    {
        Ok(block_index) => {
            info!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                block_index
            );
        }
        Err(e) => {
            error!("Error: Asset transfer from backend to user: {:?}", e);
            return Err(Error::ErrorRollBack);
        }
    }

    mutate_state(|state| {
        state
            .asset_index
            .insert(asset_supply.clone(), Candid(supply_reserve_data.clone()));
        if asset_supply != asset_borrow {
            state
                .asset_index
                .insert(asset_borrow.clone(), Candid(borrow_reserve_data.clone()));
        }
    });

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });
    insert_certified_value(user_principal.to_string(), user_data.clone());

    Ok(user_data)
}

/*
 * @title Get All Users List
 * @notice Fetches a list of all users' account data and user data.
 *
 * @dev This function paginates through the list of users and returns a batch of user data in pages.
 *      It is designed for efficient retrieval of all user information in a paginated manner to avoid
 *      excessive gas usage for large datasets. The function fetches the user data and account data
 *      concurrently in batches.
 *
 * @param total_pages The total number of pages to fetch users from.
 * @param page_size The number of users per page.
 *
 * @functionality This function handles pagination and concurrency for retrieving user data.
 *                It processes the users in batches of a specified size and ensures that the user
 *                data is fetched and returned in a structured format. If there are issues during the
 *                retrieval or data processing, it returns an appropriate error.
 *
 * @return Result<Vec<(Principal, UserAccountData, UserData)>, Error>:
 *         - Ok(Vec): A vector containing tuples of user principal, user account data, and user data.
 *         - Err(Error): An error if the retrieval or processing fails.
 */
#[update]
pub async fn get_all_user_list(
    total_pages: usize,
    page_size: usize,
) -> Result<Vec<(Principal, UserAccountData, UserData)>, Error> {
    guard_admin_only()?;

    let vector_user_data = get_all_users().await;
    let total_users = vector_user_data.len();
    debug!("Total users: {}", total_users);

    let mut liq_list = Vec::new();

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        let page_liq_list = stream::iter(users_to_process)
            .map(|(user_principal, user_data)| async move {
                debug!("Processing user: {:?}", user_principal);
                match calculate_user_account_data(Some(user_principal)).await {
                    Ok(user_account_data_tuple) => {
                        debug!(
                            "User {:?} data: {:?}",
                            user_principal, user_account_data_tuple
                        );
                        let user_account_data = UserAccountData {
                            collateral: user_account_data_tuple.0,
                            debt: user_account_data_tuple.1,
                            ltv: user_account_data_tuple.2,
                            liquidation_threshold: user_account_data_tuple.3,
                            health_factor: user_account_data_tuple.4,
                            available_borrow: user_account_data_tuple.5,
                            has_zero_ltv_collateral: user_account_data_tuple.6,
                        };

                        Some((user_principal, user_account_data, user_data))
                    }
                    Err(err) => {
                        error!("Failed to fetch data for {:?}: {:?}", user_principal, err);
                        None
                    }
                }
            })
            .buffered(100)
            .collect::<Vec<_>>()
            .await;

        liq_list.extend(page_liq_list.into_iter().flatten());
    }

    Ok(liq_list)
}

/*
 * @title Get All Users
 * @dev Retrieves a list of all registered users along with their data.
 * @returns A vector of tuples containing user principals and their data.
 * @functionality This function returns a list of all registered users and their respective data.
 */
pub async fn get_all_users() -> Vec<(Principal, UserData)> {
    let res = read_state(|state| {
        state
            .user_profile
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });

    res
}

/*
 * @title Get Asset Debt
 * @dev Retrieves the total debt for a given asset.
 * @param asset_name The name of the asset.
 * @param on_behalf (Optional) The principal requesting the asset debt.
 * @returns The total debt as `Nat`.
 * @functionality This function calculates and returns the total debt for a given asset, taking into account the user’s borrow status and balance.
 */

pub async fn get_asset_debt(
    asset_name: String,
    on_behalf: Option<Principal>,
) -> Result<Nat, Error> {
    if let Some(principal) = on_behalf {
        guard_principal_not_anonymous(&principal)?;
    }
    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => ic_cdk::caller(),
    };

    guard_principal_not_anonymous(&user_principal)?;

    let mut user_data = user_data(user_principal)?;

    debug!("user data = {:?}", user_data);
    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            error!(
                "Error: User reserve data not found for asset while get asset debt returing 0: {}",
                asset_name
            );
            return Ok(zero_nat_value());
        }
    };
    let (_, user_reserve) = user_reserve_data;
    if !user_reserve.is_borrowed {
        debug!("User has no debt for asset: {}", asset_name);
        return Ok(zero_nat_value());
    }

    let asset_reserve = get_reserve_data(asset_name.clone())?;

    let debt_token_canister_principal =
        asset_reserve.debt_token_canister.clone().ok_or_else(|| {
            error!("No debt token canister ID found.");
            Error::NoCanisterIdFound
        })?;

    let get_balance_value = get_balance(debt_token_canister_principal, user_principal).await?;

    let normalized_debt_data = user_normalized_debt(asset_reserve.clone())?;
    debug!(
        "Values in normalized debt data and get balance value {:?}, {:?}",
        normalized_debt_data, get_balance_value
    );

    Ok(
        (normalized_debt_data.scaled_div(user_reserve.variable_borrow_index.clone()))
            .scaled_mul(get_balance_value),
    )
}

pub fn user_normalized_supply(reserve_data: ReserveData) -> Result<Nat, Error> {
    trace!("calling user_normalized_supply");
    guard_prevent_anonymous()?;

    let current_time = current_timestamp();
    debug!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        debug!("No update needed as timestamps match.");
        return Ok(reserve_data.liquidity_index);
    } else {
        let cumulated_liquidity_interest = calculate_linear_interest(
            reserve_data.current_liquidity_rate,
            reserve_data.last_update_timestamp,
        );
        info!("calculate linear interest called successfully inside user normalized supply");

        debug!(
            "previoys liquidity index: {} for reserve",
            reserve_data.liquidity_index
        );

        return Ok(cumulated_liquidity_interest.scaled_mul(reserve_data.liquidity_index));
    }
}

pub fn user_normalized_debt(reserve_data: ReserveData) -> Result<Nat, Error> {
    trace!("calling user_normalized_debt");
    guard_prevent_anonymous()?;

    let current_time = current_timestamp();
    debug!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        debug!("No update needed as timestamps match.");
        return Ok(reserve_data.debt_index);
    } else {
        debug!(
            "Previous borrow index & rate: {:?} {:?}",
            reserve_data.debt_index, reserve_data.borrow_rate
        );
        let cumulated_borrow_interest = calculate_compounded_interest(
            reserve_data.borrow_rate.clone(),
            reserve_data.last_update_timestamp,
            current_time,
        );
        info!("calculate compounded interest called successfully inside user normalized debt");
        debug!(
            "Calculated cumulated borrow interest: {} based on borrow rate: {} and and new debt index {}",
            cumulated_borrow_interest,
            reserve_data.borrow_rate, //take it from reserve of asset
            cumulated_borrow_interest.clone().scaled_mul(reserve_data.debt_index.clone())
        );
        return Ok(cumulated_borrow_interest.scaled_mul(reserve_data.debt_index));
    }
}


/*
 * @title Check Transfer Eligibility
 * @dev Determines whether a user is allowed to transfer a specified amount of a particular asset.
 * @param user The Principal of the user initiating the transfer.
 * @param asset_name The name of the asset (typically prefixed with 'd').
 * @param amount The amount of the asset to be transferred.
 * @returns A boolean value indicating whether the transfer is allowed.
 * @functionality This function checks if the transfer is allowed by verifying if the user's 
 *                post-transfer health factor remains above the required threshold. 
 *                It updates the token price, retrieves collateral and debt data, computes 
 *                adjusted collateral, and recalculates the health factor before deciding.
 */
#[update]
pub async fn is_transfer_allowed(user: Principal, asset_name: String, amount: Nat) -> bool {

    // Remove 'd' prefix to get the base asset name
    let base_asset = asset_name.trim_start_matches('d').to_string();

    let _ = update_token_price(base_asset.clone()).await;

    let (total_collateral, total_debt, _avg_ltv, liquidation_threshold, _health_factor) =
        match calculate_user_account_data(Some(user)).await {
            Ok((
                t_collateral,
                t_debt,
                ltv,
                liquidation_threshold,
                h_factor,
                _a_borrow,
                _zero_ltv_collateral,
            )) => (t_collateral, t_debt, ltv, liquidation_threshold, h_factor),
            Err(e) => {
                error!("Failed to calculate user account data: {:?}", e);
                return false;
            }
        };


    let rate = match get_cached_exchange_rate(base_asset.clone()) {
        Ok(rate) => rate,
        Err(_) => {
            return false;
        }
    };

    let usd_withdrawal = amount.clone().scaled_mul(rate.clone());
    debug!("USD withdrawal value: {}", usd_withdrawal);

    if total_collateral < usd_withdrawal {
        error!(
            "Insufficient collateral. Collateral: {}, Requested Withdrawal: {}",
            total_collateral, usd_withdrawal
        );
        return false;
    }

    let adjusted_collateral = total_collateral.clone() - usd_withdrawal.clone();
    debug!("adjusted collateral = {:?}", adjusted_collateral);

    // Allow transfer if there's no outstanding debt
    if total_debt == Nat::from(0u128) {
        return true;
    }

    let reserve = match get_reserve_data(base_asset) {
        Ok(data) => data,
        Err(_) => return false,
    };

    //calculating the liquidation threshold
    let avliq = liquidation_threshold
        .clone()
        .scaled_mul(total_collateral.clone());

    let mut templiq =
        avliq - usd_withdrawal.scaled_mul(reserve.configuration.liquidation_threshold.clone());
    templiq = templiq.scaled_div(adjusted_collateral.clone());

    let mut new_health_factor =
        adjusted_collateral.scaled_mul(templiq / Nat::from(PERCENTAGE_FACTOR));
    new_health_factor = new_health_factor.scaled_div(total_debt);

    debug!(
        "New health factor: {} | Required minimum: {}",
        new_health_factor, SCALING_FACTOR
    );

    // Determine whether transfer is allowed based on health factor
    let allowed = new_health_factor >= Nat::from(SCALING_FACTOR);

    allowed
}
