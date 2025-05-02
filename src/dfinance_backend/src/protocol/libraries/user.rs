use super::update::user_data;
use crate::api::inter_canister::{asset_transfer, asset_transfer_from, get_balance};
use crate::api::query::{
    get_all_users, reserve_ledger_canister_id, user_normalized_debt, user_normalized_supply,
};
use crate::api::query::{get_cached_exchange_rate, get_reserve_data};
use crate::constants::constant_variables::constants::{
    HEALTH_FACTOR_BARRIER, PERCENTAGE_FACTOR, SCALING_FACTOR,
};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::MIN_BORROW;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::datatypes::{UserData, UserReserveData};
use crate::declarations::structs::{AssetData, UserAccountData};
use crate::guards::access_control::{guard_admin_only, guard_prevent_anonymous};
#[cfg(feature = "testnet")]
use crate::guards::access_control::check_is_tester;
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::protocol::utils::math_utils::{current_timestamp, get_max_value};
use crate::stable_storage::storable::Candid;
use crate::{debug, error, info, trace};
use crate::{
    protocol::utils::math_utils::ScalingMath,
    stable_storage::state_handler::{mutate_state, read_state},
};
use candid::{Nat, Principal};
use futures::stream::{self, StreamExt};
use ic_cdk::{api, update};
//TODO once the certified query or update usage decided, remove extra functions from this file
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
 */
pub async fn calculate_user_account_data(
    on_behalf: Option<Principal>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    trace!("calling calculate user account data");
    // prevent anonymous user
    if on_behalf == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }

    // prevent anonymous caller
    guard_prevent_anonymous()?;

    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            user_principal
        }
    };
    debug!("Principal of the user: {:?}", user_principal);

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

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;

    let mut total_collateral = zero_nat_value();
    let mut total_debt = zero_nat_value();
    let mut avg_ltv = zero_nat_value();
    let mut avg_liquidation_threshold = zero_nat_value();
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = zero_nat_value();

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        debug!("Processing reserve: {:?}", reserve_name);

        if !user_reserve_data.is_using_as_collateral_or_borrow {
            debug!("no supply no borrow, skipping..... {:?}", reserve_name);
            continue;
        }

        let reserve_data = read_state(|state| {
            state
                .asset_index
                .get(&reserve_name.to_string())
                .map(|reserve| reserve.0)
        })
        .ok_or_else(|| Error::NoReserveDataFound)?;

        let rate = get_cached_exchange_rate(user_reserve_data.reserve.clone())?;
        debug!("asset price = {}", rate);

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            debug!("Reserve '{}' is collateral.", user_reserve_data.reserve);

            let user_balance = get_user_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await?;
            info!("get user balance in base currency called");

            debug!(
                "User balance in usd for collateral reserve '{}': {}",
                user_reserve_data.reserve, user_balance
            );

            total_collateral += user_balance.clone();
            debug!("Total collateral so far: {}", total_collateral);

            if reserve_data.configuration.ltv != zero_nat_value() {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
                debug!("Average LTV updated to: {}", avg_ltv);
            } else {
                has_zero_ltv_collateral = true;
                debug!(
                    "Reserve '{}' has zero LTV collateral.",
                    user_reserve_data.reserve
                );
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);
            debug!(
                "Average liquidation threshold updated to: {}",
                avg_liquidation_threshold
            );

            available_borrow += user_balance.scaled_mul(reserve_data.configuration.ltv)
                / Nat::from(PERCENTAGE_FACTOR);
            debug!(
                "available borrow after adding collateral of {} = {}",
                reserve_name, available_borrow
            );
        }

        if user_reserve_data.is_borrowed {
            debug!("Reserve '{}' is borrowed.", user_reserve_data.reserve);

            let user_debt = get_user_debt_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await?;
            info!("get user debt in base currency called");
            debug!("User debt {}", user_debt);

            total_debt += user_debt.clone();
            debug!("Total debt for borrowed reserves {}", total_debt.clone());
        }
    }

    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = zero_nat_value();
    } else {
        available_borrow -= total_debt.clone();
    }

    debug!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != zero_nat_value() {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };
    debug!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != zero_nat_value() {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };
    debug!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == zero_nat_value() {
        debug!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };
    debug!("Calculated Final Health Factor: {}", health_factor);

    debug!("Final avaiable borrow = {}", available_borrow);

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
    // prevent anonymous user
    if on_behalf == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }

    // prevent anonymous caller
    guard_prevent_anonymous()?;

    debug!("to check the on behalf = {:?}", on_behalf);

    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            user_principal
        }
    };

    let dtoken_balance = dtoken_balance.unwrap_or_default();
    let debt_token_balance = debt_token_balance.unwrap_or_default();
    debug!("dtoken_balance: {:?}", dtoken_balance);
    debug!("debt_token_balance: {:?}", debt_token_balance);
    debug!("Principal of the user: {:?}", user_principal);

    let max = get_max_value();

    let user_data_result = user_data(user_principal);
    debug!("Fetching user data...");

    let user_data = match user_data_result {
        Ok(data) => {
            debug!("User data found");
            data
        }
        Err(e) => {
            error!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

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

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;
    debug!("User reserves found");

    let mut total_collateral = zero_nat_value();
    let mut total_debt = zero_nat_value();
    let mut avg_ltv = zero_nat_value();
    let mut avg_liquidation_threshold = zero_nat_value();
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = zero_nat_value();

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        debug!("Processing reserve: {:?}", reserve_name);
        if !user_reserve_data.is_using_as_collateral_or_borrow {
            debug!("no supply no borrow, skipping..... {:?}", reserve_name);
            continue;
        }
        let reserve_data_result = mutate_state(|state| {
            let asset_index = &mut state.asset_index;
            asset_index
                .get(&reserve_name.to_string().clone())
                .map(|reserve| reserve.0.clone())
                .ok_or_else(|| Error::NoReserveDataFound)
        });

        let reserve_data = match reserve_data_result {
            Ok(data) => {
                debug!("Reserve data found for asset");
                data
            }
            Err(e) => {
                error!("Error: {:?}", e);
                return Err(e);
            }
        };

        let rate = match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
            Ok(price) => price,
            Err(e) => {
                error!("Failed to fetch exchange rate");
                return Err(e);
            }
        };
        debug!("asset price = {}", rate);

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            debug!("Reserve '{}' is collateral.", user_reserve_data.reserve);

            let balance: Nat = dtoken_balance
                .iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(zero_nat_value());

            let user_balance_in_base_currency = get_user_asset_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                balance.clone(),
                asset_price.clone(),
            )
            .await;

            let user_balance = match user_balance_in_base_currency {
                Ok(data) => {
                    debug!("user_balance_in_base_currency: {:?}", data);
                    data
                }
                Err(e) => {
                    return Err(e);
                }
            };

            debug!(
                "User balance in usd for collateral reserve '{}': {}",
                user_reserve_data.reserve, user_balance
            );

            total_collateral += user_balance.clone();
            debug!("Total collateral so far: {}", total_collateral);

            if reserve_data.configuration.ltv != zero_nat_value() {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
                debug!("Average LTV updated to: {}", avg_ltv);
            } else {
                has_zero_ltv_collateral = true;
                debug!(
                    "Reserve '{}' has zero LTV collateral.",
                    user_reserve_data.reserve
                );
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);
            debug!(
                "Average liquidation threshold updated to: {}",
                avg_liquidation_threshold
            );

            available_borrow += user_balance.scaled_mul(reserve_data.configuration.ltv)
                / Nat::from(PERCENTAGE_FACTOR);
            debug!(
                "available borrow after adding collateral of {} = {}",
                reserve_name, available_borrow
            );
        }

        if user_reserve_data.is_borrowed {
            debug!("Reserve '{}' is borrowed.", user_reserve_data.reserve);

            let rate = match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
                Ok(price) => price,
                Err(e) => {
                    error!("Failed to fetch exchange rate");
                    return Err(e);
                }
            };
            debug!("asset price = {}", rate);

            let asset_price = rate;

            let balance: Nat = debt_token_balance
                .iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(zero_nat_value());

            // let user_debt_in_base_currency = get_user_asset_debt_in_base_currency(
            //     user_principal,
            //     &user_reserve_data,
            //     balance.clone(),
            //     asset_price.clone(),
            // )
            // .await;
            let user_debt = get_user_asset_debt_in_base_currency(
                &user_reserve_data,
                balance.clone(),
                asset_price.clone(),
            )
            .await?;
            debug!("user_debt_in_base_currency: {:?}", user_debt);

            total_debt += user_debt.clone();
            debug!("Total debt for borrowed reserves {}", total_debt.clone());
        }
    }
    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = zero_nat_value();
    } else {
        available_borrow -= total_debt.clone();
    }

    debug!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != zero_nat_value() {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };
    debug!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != zero_nat_value() {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        zero_nat_value()
    };
    debug!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == zero_nat_value() {
        debug!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };
    debug!("Calculated Final Health Factor: {}", health_factor);

    debug!("Final avaiable borrow = {}", available_borrow);

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
 * @return The user's balance in base currency.
 * @functionality Returns a single `Nat` representing the USD-equivalent value of the user's position.
 */

pub async fn get_user_balance_in_base_currency(
    user_principal: Principal,
    reserve: &UserReserveData,
    asset_price: Nat,
) -> Result<Nat, Error> {
    trace!("Calculating user balance in base currency...");
    debug!("User principal: {:?}", user_principal);
    debug!("Reserve: {:?}", reserve.reserve);
    debug!("Asset price: {}", asset_price);

    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let d_token_canister_principal: Principal = asset_reserve.d_token_canister.clone().unwrap();

    let user_scaled_balance = get_balance(d_token_canister_principal, user_principal).await?;

    debug!(
        "Fetched balance from DToken canister: {:?}",
        user_scaled_balance
    );

    let normalized_supply = user_normalized_supply(asset_reserve)?;

    debug!("user balance normailized supply = {:?}", normalized_supply);
    debug!("user liq index {}", reserve.liquidity_index.clone());
    let user_scaled = if reserve.liquidity_index != zero_nat_value() {
        user_scaled_balance
            .clone()
            .scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };

    debug!("user_scaled = {}", user_scaled);
    let user_scaled_balanced_normalized = user_scaled.scaled_mul(normalized_supply);
    debug!(
        "user_scaled_balanced_normalized = {}",
        user_scaled_balanced_normalized
    );
    //TODO: Ask : get normalize income function does not exist.
    Ok(user_scaled_balanced_normalized.scaled_mul(asset_price))
}

pub async fn get_user_asset_balance_in_base_currency(
    user_principal: Principal,
    reserve: &UserReserveData,
    user_balance: Nat,
    asset_price: Nat,
) -> Result<Nat, Error> {
    trace!("Calculating user asset balance in base currency...");
    debug!("User principal: {:?}", user_principal);
    debug!("Reserve: {:?}", reserve.reserve);
    debug!("User balance: {}", user_balance);
    debug!("Asset price : {}", asset_price);

    let asset_reserve = get_reserve_data(reserve.reserve.clone())?;

    let user_scaled_balance = user_balance.clone();

    let normalized_supply = user_normalized_supply(asset_reserve)?;
    debug!("user balance normailized supply = {:?}", normalized_supply);

    debug!("user liq index {}", reserve.liquidity_index.clone());
    let user_scaled = if reserve.liquidity_index != zero_nat_value() {
        user_scaled_balance
            .clone()
            .scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };

    debug!("user_scaled = {}", user_scaled);
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
        debug!(
            "User variable debt after normalization: {}",
            user_variable_debt
        );
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
    let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;

    // let total_users = vector_user_data.len();
    // debug!("Total users: {}", total_users);

    let mut liq_list = Vec::new();
    let cycles_start = Nat::from(api::canister_balance128());
    debug!("cycles start = {:?}", cycles_start);

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        debug!("Processing page: {}", page + 1);

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

                        // Fetch the user's health factor scaled by 100 and 10^8,
                        // unscale it by 100
                        // then compare it with the health factor limit (scaled to 10^8).
                        // This helps determine if the user's position is still safe or needs liquidation.
                        if user_account_data.health_factor.clone() / Nat::from(PERCENTAGE_FACTOR)
                            < Nat::from(HEALTH_FACTOR_BARRIER)
                        {
                            debug!(
                                "Low health factor user: {:?}, Health Factor: {:?}",
                                user_principal, user_account_data.health_factor
                            );
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
        let cycles_end = Nat::from(api::canister_balance128());
        debug!("cycles middle = {:?}", cycles_end);
    }

    let cycles_end = Nat::from(api::canister_balance128());
    debug!("cycles end = {:?}", cycles_end);

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
//TODO remove register user, create user state when he supply something, infact inside update_user_supply(change these functions name as well in update.rs) , in faucet use seperate memory for storing user_faucet_detail(only for testnet)
// response: now we will gonna use this no need to remove but we can changes its name.
pub fn register_user() -> Result<String, Error> {
    // prevent anonymous registrations
    guard_prevent_anonymous()?;

    let user_principal: Principal = ic_cdk::api::caller();

    let user_data = mutate_state(|state| {
        // let user_index = &mut state.user_profile;
        match state.user_profile.get(&user_principal) {
            Some(_) => Ok("User available".to_string()),
            None => {
                state
                    .user_profile
                    .insert(user_principal.clone(), Candid(UserData::default()));
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
    trace!("Creating user reserve with low health factor...");
    // prevent anonymous access
    guard_prevent_anonymous()?;
    validate_asset_name(&asset_supply)?;
    validate_asset_name(&asset_borrow)?;
    validate_zero_value(&supply_tokens)?;
    validate_zero_value(&borrow_tokens)?;

    debug!(
        "Creating user reserve with low health factor for supply asset: {} and borrow asset: {}",
        asset_supply, asset_borrow
    );

    if !check_is_tester() {
        error!("Invalid User");
        return Err(Error::InvalidUser);
    }

    let user_principal = ic_cdk::caller();
    debug!("User principal: {:?}", user_principal.to_text());
    register_user()?;
    info!("User registered successfully");

    let platform_principal = ic_cdk::api::id();
    debug!("Platform principal: {:?}", platform_principal);

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
        let mut supply_reserve_data = mutate_state(|state| {
            state
                .asset_index
                .get(&asset_supply)
                .map(|reserve| reserve.0.clone())
                .ok_or(Error::NoReserveDataFound)
        })?;

        supply_reserve_data.asset_supply += supply_tokens.clone();
        supply_reserve_data.debt_index = Nat::from(SCALING_FACTOR);

        let mut borrow_reserve_data = mutate_state(|state| {
            state
                .asset_index
                .get(&asset_borrow)
                .map(|reserve| reserve.0.clone())
                .ok_or(Error::NoReserveDataFound)
        })?;

        borrow_reserve_data.asset_borrow += borrow_tokens.clone();
        borrow_reserve_data.debt_index = Nat::from(SCALING_FACTOR);

        (supply_reserve_data, borrow_reserve_data)
    };

    let supply_asset_ledger_canister_id = reserve_ledger_canister_id(asset_supply.clone())?;
    let debt_asset_ledger_canister_id = reserve_ledger_canister_id(asset_borrow.clone())?;

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
        supply_tokens,
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
            error!("Error: Asset transfer from user to backend canister: {:?}", e);
            return Err(Error::ErrorMintTokens);
        }
    }
    //borrow

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
        Ok(new_balance) => {
            info!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                new_balance
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

    debug!("user data success = {:?}", user_data);

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

    let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;
    let total_users = vector_user_data.len();
    debug!("Total users: {}", total_users);

    let mut liq_list = Vec::new();
    let cycles_start = Nat::from(api::canister_balance128());
    debug!("cycles start = {:?}", cycles_start);

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        debug!("Processing page: {}", page + 1);

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

        let cycles_end = Nat::from(api::canister_balance128());
        debug!("cycles middle = {:?}", cycles_end);
    }

    let cycles_end = Nat::from(api::canister_balance128());
    debug!("cycles end = {:?}", cycles_end);

    Ok(liq_list)
}
