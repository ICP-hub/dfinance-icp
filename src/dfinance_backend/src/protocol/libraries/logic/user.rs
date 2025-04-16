use super::update::user_data;
use crate::api::functions::{asset_transfer, asset_transfer_from, get_balance, request_limiter};
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::MIN_BORROW;
use crate::declarations::assets::AssetData;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::update::user_reserve;
use crate::protocol::libraries::math::math_utils::get_max_value;
use crate::protocol::libraries::types::datatypes::{UserAccountData, UserData};
use crate::{
    api::state_handler::mutate_state,
    get_cached_exchange_rate, get_reserve_data,
    protocol::libraries::{math::math_utils::ScalingMath, types::datatypes::UserReserveData},
    user_normalized_debt, user_normalized_supply,
};
use crate::guards::{check_is_tester, to_check_controller};
use crate::{get_all_users, reserve_ledger_canister_id};
use candid::{Nat, Principal};
use futures::stream::{self, StreamExt};
use ic_cdk::{api, update};
use crate::constants::constant_variables::constants::{
    ZERO_VALUE, PERCENTAGE_FACTOR, SCALING_FACTOR, HEALTH_FACTOR_BARRIER
};


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
    if let Some(principal) = on_behalf {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }

    ic_cdk::println!("to check the on behalf = {:?}", on_behalf);
    ic_cdk::println!("to check the on behalf = {:?}", on_behalf);

    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            if user_principal != ic_cdk::caller() {
                return Err(Error::InvalidUser);
            }
            user_principal
        }
    };
    ic_cdk::println!("Principal of the user: {:?}", user_principal);

    let max = get_max_value();

    let user_data_result = user_data(user_principal);
    ic_cdk::println!("Fetching user data...");

    let user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User data found");
            data
        }
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

    if user_data.reserves.is_none() {
        ic_cdk::println!("No reserves found for the user.");
        return Ok((
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            max,
            Nat::from(ZERO_VALUE),
            false,
        ));
    }

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;
    ic_cdk::println!("User reserves found");

    let mut total_collateral = Nat::from(ZERO_VALUE);
    let mut total_debt = Nat::from(ZERO_VALUE);
    let mut avg_ltv = Nat::from(ZERO_VALUE);
    let mut avg_liquidation_threshold = Nat::from(ZERO_VALUE);
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = Nat::from(ZERO_VALUE);

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        ic_cdk::println!("Processing reserve: {:?}", reserve_name);
        if !user_reserve_data.is_using_as_collateral_or_borrow {
            ic_cdk::println!("no supply no borrow, skipping..... {:?}", reserve_name);
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
                ic_cdk::println!("Reserve data found for asset");
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {:?}", e);
                return Err(e);
            }
        };

        let rate = match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
            Ok(price) => price,
            Err(e) => {
                ic_cdk::println!("Failed to fetch exchange rate");
                return Err(e);
            }
        };
        ic_cdk::println!("asset price = {}",rate);

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            ic_cdk::println!("Reserve '{}' is collateral.", user_reserve_data.reserve);

            let user_balance_in_base_currency = get_user_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await;

            let user_balance = match user_balance_in_base_currency {
                Ok(data) => {
                    ic_cdk::println!("user_balance_in_base_currency: {:?}", data);
                    data
                }
                Err(e) => {
                    return Err(e);
                }
            };

            ic_cdk::println!(
                "User balance in usd for collateral reserve '{}': {}",
                user_reserve_data.reserve,
                user_balance
            );

            total_collateral += user_balance.clone();
            ic_cdk::println!("Total collateral so far: {}", total_collateral);

            if reserve_data.configuration.ltv != Nat::from(ZERO_VALUE) {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
                ic_cdk::println!("Average LTV updated to: {}", avg_ltv);
            } else {
                has_zero_ltv_collateral = true;
                ic_cdk::println!(
                    "Reserve '{}' has zero LTV collateral.",
                    user_reserve_data.reserve
                );
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);
            ic_cdk::println!(
                "Average liquidation threshold updated to: {}",
                avg_liquidation_threshold
            );

            available_borrow +=
                user_balance.scaled_mul(reserve_data.configuration.ltv) / Nat::from(PERCENTAGE_FACTOR);
            ic_cdk::println!(
                "available borrow after adding collateral of {} = {}",
                reserve_name,
                available_borrow
            );
        }

        if user_reserve_data.is_borrowed {
            ic_cdk::println!("Reserve '{}' is borrowed.", user_reserve_data.reserve);

            let user_debt_in_base_currency = get_user_debt_in_base_currency(
                user_principal,
                &user_reserve_data,
                asset_price.clone(),
            )
            .await;

            let user_debt = match user_debt_in_base_currency {
                Ok(data) => {
                    ic_cdk::println!("user_debt_in_base_currency:{} : {:?}", reserve_name, data);
                    data
                }
                Err(e) => {
                    return Err(e);
                }
            };

            total_debt += user_debt.clone();
            ic_cdk::println!("Total debt for borrowed reserves {}", total_debt.clone());
        }
    }
    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = Nat::from(ZERO_VALUE);
    } else {
        available_borrow -= total_debt.clone();
    }

    ic_cdk::println!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != Nat::from(ZERO_VALUE) {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        Nat::from(ZERO_VALUE)
    };
    ic_cdk::println!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != Nat::from(ZERO_VALUE) {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        Nat::from(ZERO_VALUE)
    };
    ic_cdk::println!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == Nat::from(ZERO_VALUE) {
        ic_cdk::println!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };
    ic_cdk::println!("Calculated Final Health Factor: {}", health_factor);

    ic_cdk::println!("Final avaiable borrow = {}", available_borrow);

    ic_cdk::println!(
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
    if let Some(principal) = on_behalf {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }

    ic_cdk::println!("to check the on behalf = {:?}", on_behalf);
    
    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            if user_principal != ic_cdk::caller() {
                return Err(Error::InvalidUser);
            }
            user_principal
        }
    };

    let dtoken_balance = dtoken_balance.unwrap_or_default();
    let debt_token_balance = debt_token_balance.unwrap_or_default();
    ic_cdk::println!("dtoken_balance: {:?}",dtoken_balance);
    ic_cdk::println!("debt_token_balance: {:?}",debt_token_balance);
    ic_cdk::println!("Principal of the user: {:?}", user_principal);

    let max = get_max_value();

    let user_data_result = user_data(user_principal);
    ic_cdk::println!("Fetching user data...");

    let user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User data found");
            data
        }
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

    if user_data.reserves.is_none() {
        ic_cdk::println!("No reserves found for the user.");
        return Ok((
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            Nat::from(ZERO_VALUE),
            max,
            Nat::from(ZERO_VALUE),
            false,
        ));
    }

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;
    ic_cdk::println!("User reserves found");

    let mut total_collateral = Nat::from(ZERO_VALUE);
    let mut total_debt = Nat::from(ZERO_VALUE);
    let mut avg_ltv = Nat::from(ZERO_VALUE);
    let mut avg_liquidation_threshold = Nat::from(ZERO_VALUE);
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = Nat::from(ZERO_VALUE);

    for (reserve_name, user_reserve_data) in user_data_reserves.iter() {
        ic_cdk::println!("Processing reserve: {:?}", reserve_name);
        if !user_reserve_data.is_using_as_collateral_or_borrow {
            ic_cdk::println!("no supply no borrow, skipping..... {:?}", reserve_name);
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
                ic_cdk::println!("Reserve data found for asset");
                data
            }
            Err(e) => {
                ic_cdk::println!("Error: {:?}", e);
                return Err(e);
            }
        };

        let rate = match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
            Ok(price) => price,
            Err(e) => {
                ic_cdk::println!("Failed to fetch exchange rate");
                return Err(e);
            }
        };
        ic_cdk::println!("asset price = {}",rate);

        let asset_price = rate;
        if user_reserve_data.is_collateral {
            ic_cdk::println!("Reserve '{}' is collateral.", user_reserve_data.reserve);

            
            let balance: Nat = dtoken_balance.iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(Nat::from(ZERO_VALUE));
                
            let user_balance_in_base_currency = get_user_asset_balance_in_base_currency(
                user_principal,
                &user_reserve_data,
                balance.clone(),
                asset_price.clone()
            )
            .await;

            let user_balance = match user_balance_in_base_currency {
                Ok(data) => {
                    ic_cdk::println!("user_balance_in_base_currency: {:?}", data);
                    data
                }
                Err(e) => {
                    return Err(e);
                }
            };

            ic_cdk::println!(
                "User balance in usd for collateral reserve '{}': {}",
                user_reserve_data.reserve,
                user_balance
            );

            total_collateral += user_balance.clone();
            ic_cdk::println!("Total collateral so far: {}", total_collateral);

            if reserve_data.configuration.ltv != Nat::from(ZERO_VALUE) {
                avg_ltv += user_balance
                    .clone()
                    .scaled_mul(reserve_data.configuration.ltv.clone());
                ic_cdk::println!("Average LTV updated to: {}", avg_ltv);
            } else {
                has_zero_ltv_collateral = true;
                ic_cdk::println!(
                    "Reserve '{}' has zero LTV collateral.",
                    user_reserve_data.reserve
                );
            }

            avg_liquidation_threshold += user_balance
                .clone()
                .scaled_mul(reserve_data.configuration.liquidation_threshold);
            ic_cdk::println!(
                "Average liquidation threshold updated to: {}",
                avg_liquidation_threshold
            );

            available_borrow +=
                user_balance.scaled_mul(reserve_data.configuration.ltv) / Nat::from(PERCENTAGE_FACTOR);
            ic_cdk::println!(
                "available borrow after adding collateral of {} = {}",
                reserve_name,
                available_borrow
            );
        }

        if user_reserve_data.is_borrowed {
            ic_cdk::println!("Reserve '{}' is borrowed.", user_reserve_data.reserve);

            let rate = match get_cached_exchange_rate(user_reserve_data.reserve.clone()) {
                Ok(price) => price,
                Err(e) => {
                    ic_cdk::println!("Failed to fetch exchange rate");
                    return Err(e);
                }
            };
            ic_cdk::println!("asset price = {}",rate);

            let asset_price = rate;

            let balance: Nat = debt_token_balance.iter()
                .find(|asset| asset.name == user_reserve_data.reserve)
                .map(|asset| asset.balance.clone())
                .unwrap_or(Nat::from(ZERO_VALUE));

            
            let user_debt_in_base_currency = get_user_asset_debt_in_base_currency(
                user_principal,
                &user_reserve_data,
                balance.clone(),
                asset_price.clone()
            )
            .await;

            let user_debt = match user_debt_in_base_currency {
                Ok(data) => {
                    ic_cdk::println!("user_debt_in_base_currency:{} : {:?}", reserve_name, data);
                    data
                }
                Err(e) => {
                    return Err(e);
                }
            };

            total_debt += user_debt.clone();
            ic_cdk::println!("Total debt for borrowed reserves {}", total_debt.clone());
        }
    }
    if available_borrow < total_debt.clone() || available_borrow < Nat::from(MIN_BORROW) {
        available_borrow = Nat::from(ZERO_VALUE);
    } else {
        available_borrow -= total_debt.clone();
    }

    ic_cdk::println!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != Nat::from(ZERO_VALUE) {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        Nat::from(ZERO_VALUE)
    };
    ic_cdk::println!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != Nat::from(ZERO_VALUE) {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        Nat::from(ZERO_VALUE)
    };
    ic_cdk::println!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == Nat::from(ZERO_VALUE) {
        ic_cdk::println!("Health factor: No debt, setting to MAX.");
        max
    } else {
        (total_collateral.clone() * avg_liquidation_threshold.clone()) / total_debt.clone()
    };
    ic_cdk::println!("Calculated Final Health Factor: {}", health_factor);

    ic_cdk::println!("Final avaiable borrow = {}", available_borrow);

    ic_cdk::println!(
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
    ic_cdk::println!("Calculating user balance in base currency...");
    ic_cdk::println!("User principal: {:?}", user_principal);
    ic_cdk::println!("Reserve: {:?}", reserve.reserve);
    ic_cdk::println!("Asset price: {}", asset_price);

    let asset_reserve_result = get_reserve_data(reserve.reserve.clone());
    let asset_reserve = match asset_reserve_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    let d_token_canister_principal: Principal =
        Principal::from_text(asset_reserve.d_token_canister.clone().unwrap()).unwrap();

    let balance_result = get_balance(d_token_canister_principal, user_principal).await; // fetch from d token balance of user
    let user_scaled_balance = match balance_result {
        Ok(data) => {
            ic_cdk::println!("get balance data : {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };
    ic_cdk::println!(
        "Fetched balance from DToken canister: {:?}",
        user_scaled_balance
    );
    // let user_scaled_balance = reserve.d_token_balance.clone();
    let normalized_supply_result = user_normalized_supply(asset_reserve);
    let normalized_supply = match normalized_supply_result {
        Ok(data) => {
            ic_cdk::println!("normalized supply : {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };
    ic_cdk::println!("user balance normailized supply = {:?}", normalized_supply);
    ic_cdk::println!("user liq index {}", reserve.liquidity_index.clone());
    let user_scaled = if reserve.liquidity_index != Nat::from(ZERO_VALUE) {
        user_scaled_balance.clone().scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };
    
    ic_cdk::println!("user_scaled = {}", user_scaled);
    let user_scaled_balanced_normalized = user_scaled.scaled_mul(normalized_supply);
    ic_cdk::println!(
        "user_scaled_balanced_normalized = {}",
        user_scaled_balanced_normalized
    );
    // Ask : get normailse incone function does not exist.
    ic_cdk::println!(
        "last of the base currency  = {}",
        user_scaled_balanced_normalized
            .clone()
            .scaled_mul(asset_price.clone())
    );
    Ok(user_scaled_balanced_normalized
        .clone()
        .scaled_mul(asset_price.clone()))
}

/*
 * @title Get User Asset Balance in Base Currency
 * @functionality Calculates a user’s balance for a specific asset, converted to base currency (e.g., USD).
 *
 * @notice Computes the base currency equivalent of a user-supplied asset balance using normalization and asset pricing.
 *
 * @dev Applies liquidity index and normalization factors to the raw user balance, then multiplies by the asset price.
 * @functionality Used when user asset balance is already known (e.g., from dToken or storage), avoiding extra canister calls.
 *
 * @param user_principal The principal of the user whose balance is being calculated.
 * @functionality Used for logging and possible tracking in async operations.
 *
 * @param reserve The reserve data associated with the user's asset.
 * @functionality Contains the liquidity index and asset reserve reference for normalization.
 *
 * @param user_balance The already known balance of the user (e.g., dToken balance).
 * @functionality Input directly instead of fetching via canister, for efficiency in batch operations or caching.
 *
 * @param asset_price The price of the asset in the base currency.
 * @functionality Converts the normalized token balance into a base currency value.
 *
 * @return The user's asset balance in base currency.
 * @functionality Returns a single `Nat` representing the asset’s value in base currency after normalization and price adjustment.
 */

pub async fn get_user_asset_balance_in_base_currency(
    user_principal: Principal,
    reserve: &UserReserveData,
    user_balance: Nat,
    asset_price:Nat,
) -> Result<Nat, Error> {
    ic_cdk::println!("Calculating user balance in base currency...");
    ic_cdk::println!("User principal: {:?}", user_principal);
    ic_cdk::println!("Reserve: {:?}", reserve.reserve);
    ic_cdk::println!("Asset price: {}", user_balance);

    let asset_reserve_result = get_reserve_data(reserve.reserve.clone());
    let asset_reserve = match asset_reserve_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    let user_scaled_balance = user_balance.clone();
    let normalized_supply_result = user_normalized_supply(asset_reserve);
    let normalized_supply = match normalized_supply_result {
        Ok(data) => {
            ic_cdk::println!("normalized supply : {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };
    ic_cdk::println!("user balance normailized supply = {:?}", normalized_supply);
    ic_cdk::println!("user liq index {}", reserve.liquidity_index.clone());
    let user_scaled = if reserve.liquidity_index != Nat::from(ZERO_VALUE) {
        user_scaled_balance.clone().scaled_div(reserve.liquidity_index.clone())
    } else {
        user_scaled_balance.clone()
    };
    
    ic_cdk::println!("user_scaled = {}", user_scaled);
    let user_scaled_balanced_normalized = user_scaled.scaled_mul(normalized_supply);
    ic_cdk::println!(
        "user_scaled_balanced_normalized = {}",
        user_scaled_balanced_normalized
    );
    ic_cdk::println!(
        "last of the base currency  = {}",
        user_scaled_balanced_normalized
            .clone()
            .scaled_mul(asset_price.clone())
    );
    Ok(user_scaled_balanced_normalized
        .clone()
        .scaled_mul(asset_price.clone()))
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
    ic_cdk::println!("Calculating user balance in debt currency...");
    ic_cdk::println!("User principal: {:?}", user_principal);
    ic_cdk::println!("Reserve data: {:?}", reserve.reserve);
    ic_cdk::println!("Asset price: {}", asset_price);

    let asset_reserve_result = get_reserve_data(reserve.reserve.clone());
    let asset_reserve = match asset_reserve_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    ic_cdk::println!("Fetching debt token canister principal from reserve...");
    let debt_token_canister_principal =
        Principal::from_text(asset_reserve.debt_token_canister.clone().unwrap()).unwrap();

    ic_cdk::println!("Fetching balance of user...");
    let balance_result = get_balance(debt_token_canister_principal, user_principal).await; // fetch from d token balance of user

    let mut user_variable_debt = match balance_result {
        Ok(data) => {
            ic_cdk::println!("get balance data : {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };
    let user_normailzed_debt_result = user_normalized_debt(asset_reserve);
    let user_normailzed_debt = match user_normailzed_debt_result {
        Ok(data) => {
            ic_cdk::println!("noralize debt: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    if user_variable_debt != Nat::from(ZERO_VALUE) {
        user_variable_debt = user_variable_debt.scaled_div(reserve.variable_borrow_index.clone());
        user_variable_debt = user_variable_debt.scaled_mul(user_normailzed_debt);
        ic_cdk::println!(
            "User variable debt after normalization: {}",
            user_variable_debt
        );
    }

    let result = user_variable_debt.scaled_mul(asset_price);
    ic_cdk::println!("Final user debt in base currency: {}", result);
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
    user_principal: Principal,
    reserve: &UserReserveData,
    user_balance: Nat,
    asset_price:Nat
) -> Result<Nat, Error> {
    ic_cdk::println!("Calculating user balance in debt currency...");
    ic_cdk::println!("User principal: {:?}", user_principal);
    ic_cdk::println!("Reserve data: {:?}", reserve.reserve);
    ic_cdk::println!("Asset price: {}", asset_price);
    

    let asset_reserve_result = get_reserve_data(reserve.reserve.clone());
    let asset_reserve = match asset_reserve_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };
   
    let mut user_variable_debt = user_balance.clone();
    let user_normailzed_debt_result = user_normalized_debt(asset_reserve);
    let user_normailzed_debt = match user_normailzed_debt_result {
        Ok(data) => {
            ic_cdk::println!("noralize debt: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    if user_variable_debt != Nat::from(ZERO_VALUE) {
        user_variable_debt = user_variable_debt.scaled_div(reserve.variable_borrow_index.clone());
        user_variable_debt = user_variable_debt.scaled_mul(user_normailzed_debt);
        ic_cdk::println!(
            "User variable debt after normalization: {}",
            user_variable_debt
        );
    }

    let result = user_variable_debt.scaled_mul(asset_price);
    ic_cdk::println!("Final user debt in base currency: {}", result);
    Ok(result)
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
    let total_users = vector_user_data.len();
    ic_cdk::println!("Total users: {}", total_users);

    let mut liq_list = Vec::new();
    let cycles_start = Nat::from(api::canister_balance128());
    ic_cdk::println!("cycles start = {:?}", cycles_start);

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        ic_cdk::println!("Processing page: {}", page + 1);

        let page_liq_list = stream::iter(users_to_process)
            .map(|(user_principal, user_data)| async move {
                ic_cdk::println!("Processing user: {:?}", user_principal);
                match calculate_user_account_data(Some(user_principal)).await {
                    Ok(user_account_data_tuple) => {
                        ic_cdk::println!(
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
                        if user_account_data.health_factor.clone()/Nat::from(PERCENTAGE_FACTOR) < Nat::from(HEALTH_FACTOR_BARRIER) {
                            ic_cdk::println!(
                                "Low health factor user: {:?}, Health Factor: {:?}",
                                user_principal, user_account_data.health_factor
                            );
                            Some((user_principal, user_account_data, user_data))
                        } else {
                            None
                        }
                    }
                    Err(err) => {
                        ic_cdk::println!("Failed to fetch data for {:?}: {:?}", user_principal, err);
                        None
                    }
                }
            })
            .buffered(100) // Process 100 users concurrently to prevent overload
            .collect::<Vec<_>>()
            .await;

        liq_list.extend(page_liq_list.into_iter().flatten());
        let cycles_end = Nat::from(api::canister_balance128());
        ic_cdk::println!("cycles middle = {:?}", cycles_end);
    }

    let cycles_end = Nat::from(api::canister_balance128());
    ic_cdk::println!("cycles end = {:?}", cycles_end);

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
#[update]
fn register_user() -> Result<String, Error> {
    ic_cdk::println!("function is register running");

    let user_principal: Principal = ic_cdk::api::caller();
    ic_cdk::println!("user principal register = {} ", user_principal);

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    if let Err(e) = request_limiter("register_user") {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }

    let user_data = mutate_state(|state| {
        let user_index = &mut state.user_profile;
        match user_index.get(&user_principal) {
            Some(_) => Ok("User available".to_string()),
            None => {
                let mut default_user_data = UserData::default();
                let user_count = user_index.len(); //user_id is starting from 1
                let new_user_id = (user_count + 1).to_string();
                default_user_data.user_id = Some(new_user_id);
                user_index.insert(user_principal.clone(), Candid(default_user_data));
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
#[update]
pub async fn create_user_reserve_with_low_health(
    asset_supply: String,
    asset_borrow: String,
    supply_tokens: Nat,
    borrow_tokens: Nat,
) -> Result<UserData, Error> {
    ic_cdk::println!(
        "Creating user reserve with low health factor for supply asset: {} and borrow asset: {}",
        asset_supply,
        asset_borrow
    );

    if !check_is_tester() {
        ic_cdk::println!("Invalid User");
        return Err(Error::InvalidUser);
    }

    if asset_supply.trim().is_empty() || asset_borrow.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_supply.len() > 7 || asset_borrow.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if supply_tokens <= Nat::from(ZERO_VALUE) || borrow_tokens <= Nat::from(ZERO_VALUE) {
        ic_cdk::println!("Supply and Borrow amounts must be greater than zero");
        return Err(Error::InvalidAmount);
    }

    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

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

    if asset_supply == asset_borrow {
        let mut user_reserve = user_reserve(&mut user_data, &asset_supply);
        let mut user_reserve_data = if let Some((_, reserve_data)) = user_reserve {
            reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
            reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
            reserve_data.d_token_balance += supply_tokens.clone();
            reserve_data.debt_token_blance += borrow_tokens.clone();
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.is_collateral = true;
            reserve_data.is_borrowed = true;
        };
    } else {
        let mut supply_user_reserve = user_reserve(&mut user_data, &asset_supply);
        let mut user_reserve_data = if let Some((_, reserve_data)) = supply_user_reserve {
            reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
            reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
            reserve_data.d_token_balance += supply_tokens.clone();
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.is_collateral = true;
        };

        let mut borrow_user_reserve = user_reserve(&mut user_data, &asset_borrow);
        let mut user_reserve_data = if let Some((_, reserve_data)) = borrow_user_reserve {
            reserve_data.liquidity_index = Nat::from(SCALING_FACTOR);
            reserve_data.variable_borrow_index = Nat::from(SCALING_FACTOR);
            reserve_data.debt_token_blance += borrow_tokens.clone();
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.is_borrowed = true;
        };
    };

    let dtoken_principal =
        Principal::from_text(supply_reserve_data.d_token_canister.clone().unwrap()).unwrap();
    let debt_token_principal =
        Principal::from_text(borrow_reserve_data.debt_token_canister.clone().unwrap()).unwrap();

    match asset_transfer(
        user_principal,
        dtoken_principal, //dtoken
        platform_principal,
        supply_tokens.clone(),
    )
    .await
    {
        Ok(data) => {
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
        }
        Err(err) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
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
            println!(
                "Asset transfer from user to backend canister executed successfully = {:?}",
                new_balance
            );
        }
        Err(e) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", e);
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
            ic_cdk::println!("Dtoken transfer from backend to user executed successfully");
        }
        Err(err) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", err);
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
            ic_cdk::println!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                new_balance
            );
        }
        Err(e) => {
            ic_cdk::println!("Error: Minting failed. Error: {:?}", e);
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

    ic_cdk::println!("user data success = {:?}", user_data);

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

    let user_principal = ic_cdk::caller();
    
    if user_principal == Principal::anonymous()
        || !to_check_controller()
    {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::ErrorNotController);
    }

    let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;
    let total_users = vector_user_data.len();
    ic_cdk::println!("Total users: {}", total_users);

    let mut liq_list = Vec::new();
    let cycles_start = Nat::from(api::canister_balance128());
    ic_cdk::println!("cycles start = {:?}", cycles_start);

    for page in 0..total_pages {
        let users_to_process = vector_user_data
            .iter()
            .skip(page * page_size)
            .take(page_size)
            .cloned()
            .collect::<Vec<_>>();

        ic_cdk::println!("Processing page: {}", page + 1);

        let page_liq_list = stream::iter(users_to_process)
            .map(|(user_principal, user_data)| async move {
                ic_cdk::println!("Processing user: {:?}", user_principal);
                match calculate_user_account_data(Some(user_principal)).await {
                    Ok(user_account_data_tuple) => {
                        ic_cdk::println!(
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
                        ic_cdk::println!("Failed to fetch data for {:?}: {:?}", user_principal, err);
                        None
                    }
                }
            })
            .buffered(100)
            .collect::<Vec<_>>()
            .await;

        liq_list.extend(page_liq_list.into_iter().flatten());

        let cycles_end = Nat::from(api::canister_balance128());
        ic_cdk::println!("cycles middle = {:?}", cycles_end);
    }

    let cycles_end = Nat::from(api::canister_balance128());
    ic_cdk::println!("cycles end = {:?}", cycles_end);

    Ok(liq_list)
}