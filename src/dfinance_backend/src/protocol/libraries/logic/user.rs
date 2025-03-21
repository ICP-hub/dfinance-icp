use super::update::user_data;
use crate::api::functions::{asset_transfer, asset_transfer_from, get_balance, request_limiter};
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::MIN_BORROW;
use crate::declarations::assets::{ExecuteRepayParams,AssetData};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::update::user_reserve;
use crate::protocol::libraries::types::datatypes::UserData;
use crate::{
    api::state_handler::mutate_state,
    get_cached_exchange_rate, get_reserve_data,
    protocol::libraries::{math::math_utils::ScalingMath, types::datatypes::UserReserveData},
    user_normalized_debt, user_normalized_supply,
};
use crate::guards::check_is_tester;
use crate::{get_all_users, reserve_ledger_canister_id};
use candid::{CandidType, Deserialize, Nat, Principal};
use futures::stream::{self, FuturesUnordered, StreamExt};
use ic_cdk::{api, query, update};


fn get_max_value() -> Nat {
    Nat::from(340_282_366_920_938_463_463_374_607_431_768_211_455u128)
}

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct UserConfig {
    pub collateral: bool,
    pub borrowing: bool,
}
/*
 * @title User Account Data Calculation
 * @notice Computes account metrics like total collateral, debt, LTV, and health factor.
 *
 * @dev Aggregates user reserves, fetches exchange rates, and determines borrowing capacity.
 *
 * @param on_behalf (Optional) The principal of the user whose account data is being calculated.
 *
 * @return A tuple containing:
 *   - Total collateral
 *   - Total debt
 *   - Average LTV
 *   - Liquidation threshold
 *   - Health factor
 *   - Available borrow
 *   - Has zero-LTV collateral (bool)
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
            Nat::from(0u128),
            Nat::from(0u128),
            Nat::from(0u128),
            Nat::from(0u128),
            max,
            Nat::from(0u128),
            false,
        ));
    }

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;
    ic_cdk::println!("User reserves found");

    let mut total_collateral = Nat::from(0u128);
    let mut total_debt = Nat::from(0u128);
    let mut avg_ltv = Nat::from(0u128);
    let mut avg_liquidation_threshold = Nat::from(0u128);
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = Nat::from(0u128);

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

            if reserve_data.configuration.ltv != Nat::from(0u128) {
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
                user_balance.scaled_mul(reserve_data.configuration.ltv) / Nat::from(100u128);
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
        available_borrow = Nat::from(0u128);
    } else {
        available_borrow -= total_debt.clone();
    }

    ic_cdk::println!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != Nat::from(0u128) {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        Nat::from(0u128)
    };
    ic_cdk::println!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != Nat::from(0u128) {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        Nat::from(0u128)
    };
    ic_cdk::println!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == Nat::from(0u128) {
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
 * @notice Computes account metrics like total collateral, debt, LTV, and health factor.
 *
 * @dev Aggregates user reserves, fetches exchange rates, and determines borrowing capacity.
 *
 * @param on_behalf (Optional) The principal of the user whose account data is being calculated.
 *
 * @return A tuple containing:
 *   - Total collateral
 *   - Total debt
 *   - Average LTV
 *   - Liquidation threshold
 *   - Health factor
 *   - Available borrow
 *   - Has zero-LTV collateral (bool)
 */

#[query]
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
            Nat::from(0u128),
            Nat::from(0u128),
            Nat::from(0u128),
            Nat::from(0u128),
            max,
            Nat::from(0u128),
            false,
        ));
    }

    let user_data_reserves = user_data
        .reserves
        .as_ref()
        .ok_or_else(|| Error::NoUserReserveDataFound)?;
    ic_cdk::println!("User reserves found");

    let mut total_collateral = Nat::from(0u128);
    let mut total_debt = Nat::from(0u128);
    let mut avg_ltv = Nat::from(0u128);
    let mut avg_liquidation_threshold = Nat::from(0u128);
    let mut has_zero_ltv_collateral = false;
    let mut available_borrow = Nat::from(0u128);

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
                .unwrap_or(Nat::from(0u128));
                
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

            if reserve_data.configuration.ltv != Nat::from(0u128) {
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
                user_balance.scaled_mul(reserve_data.configuration.ltv) / Nat::from(100u128);
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
                .unwrap_or(Nat::from(0u128));

            
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
        available_borrow = Nat::from(0u128);
    } else {
        available_borrow -= total_debt.clone();
    }

    ic_cdk::println!(
        "available borrow after subtracting debt = {}",
        available_borrow.clone()
    );
    avg_ltv = if total_collateral != Nat::from(0u128) {
        // weighted average.
        avg_ltv.scaled_div(total_collateral.clone())
    } else {
        Nat::from(0u128)
    };
    ic_cdk::println!("Final Avg LTV: {}", avg_ltv);

    avg_liquidation_threshold = if total_collateral != Nat::from(0u128) {
        avg_liquidation_threshold.scaled_div(total_collateral.clone())
    } else {
        Nat::from(0u128)
    };
    ic_cdk::println!(
        "Final Avg Liquidation Threshold: {}",
        avg_liquidation_threshold
    );

    let health_factor = if total_debt == Nat::from(0u128) {
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
 * @notice Computes the user's total balance in the base currency (USD equivalent).
 *
 * @dev Fetches the user's scaled balance, applies normalization, and multiplies by the asset's exchange rate.
 *
 * @param user_principal The principal of the user whose balance is being calculated.
 * @param reserve The reserve data associated with the user's asset.
 * @param asset_price The price of the asset in the base currency.
 *
 * @return The user's balance in base currency.
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
    let user_scaled = if reserve.liquidity_index != Nat::from(0u128) {
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
    let user_scaled = if reserve.liquidity_index != Nat::from(0u128) {
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
 * @title Get User Debt in Base Currency
 * @notice Computes the user's total outstanding debt in the base currency.
 *
 * @dev Fetches the user's debt balance, applies normalization, and multiplies by the asset's exchange rate.
 *
 * @param user_principal The principal of the user whose debt is being calculated.
 * @param reserve The reserve data associated with the user's asset.
 * @param asset_price The price of the asset in the base currency.
 *
 * @return The user's debt in base currency.
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
    // let mut user_variable_debt = reserve.debt_token_blance.clone();
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

    if user_variable_debt != Nat::from(0u128) {
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

    if user_variable_debt != Nat::from(0u128) {
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
 * @title User Account Data Structure
 * @notice Stores financial data such as collateral, debt, and risk factors.
 *
 * @dev Tracks users' financial health and determines potential liquidation status.
 */
#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UserAccountData {
    pub collateral: Nat,
    pub debt: Nat,
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub health_factor: Nat,
    pub available_borrow: Nat,
    pub has_zero_ltv_collateral: bool,
}

/*
 * @title Get Users Eligible for Liquidation
 * @notice Identifies users with a health factor below the liquidation threshold.
 *
 * @dev Uses concurrency for improved efficiency by fetching users in batches.
 *
 * @param total_pages The total number of pages to fetch users from.
 * @param page_size The number of users per page.
 *
 * @return A vector of tuples containing (Principal, UserAccountData, UserData).
 */
// #[update]
// pub async fn get_liquidation_users_concurrent(
//     total_pages: usize,
//     page_size: usize,
// ) -> Vec<(Principal, UserAccountData, UserData)> {
//     let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;
//     let total_users = vector_user_data.len();

//     let mut liq_list = Vec::new();

//     let page_futures = (0..total_pages).map(|page| {
//         let users_to_process = vector_user_data
//             .iter()
//             .skip(page * page_size)
//             .take(page_size)
//             .cloned()
//             .collect::<Vec<_>>();

//         async move {
//             let mut page_liq_list = Vec::new();

//             let mut tasks = users_to_process
//                 .into_iter()
//                 .map(|(user_principal, user_data)| async move {
//                     if let Ok(user_account_data) =
//                         calculate_user_account_data(Some(user_principal)).await
//                     {
//                         Some((user_principal, user_account_data, user_data))
//                     } else {
//                         None
//                     }
//                 })
//                 .collect::<FuturesUnordered<_>>();

//             while let Some(result) = tasks.next().await {
//                 if let Some((user_principal, user_account_data_tuple, user_data)) = result {
//                     let user_account_data = UserAccountData {
//                         collateral: user_account_data_tuple.0,
//                         debt: user_account_data_tuple.1,
//                         ltv: user_account_data_tuple.2,
//                         liquidation_threshold: user_account_data_tuple.3,
//                         health_factor: user_account_data_tuple.4,
//                         available_borrow: user_account_data_tuple.5,
//                         has_zero_ltv_collateral: user_account_data_tuple.6,
//                     };
//                     ic_cdk::println!("User: {:?}, Health Factor: {:?}", user_principal, user_account_data.health_factor);

//                     if user_account_data.health_factor < Nat::from(10000000000u128){
//                         page_liq_list.push((user_principal, user_account_data, user_data));
//                     }
                   
//                 }
//             }
//             page_liq_list
//         }
//     });

//     let results = futures::future::join_all(page_futures).await;

//     for result in results {
//         liq_list.extend(result);
//     }

//     liq_list
// }


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

                        if user_account_data.health_factor < Nat::from(10_000_000_000u128) {
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
            .buffered(100) // Process 50 users concurrently to prevent overload
            .collect::<Vec<_>>()
            .await;

        liq_list.extend(page_liq_list.into_iter().flatten());
        // ic_cdk::api::call::msg_cycles_available(); // Check available cycles to prevent cycle exhaustion
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
 * @returns A string message indicating success.
 */
#[update]
pub fn register_user() -> Result<String, Error> {
    ic_cdk::println!("function is register running");

    #[cfg(feature = "canbench-rs")]
    let user_principal = Principal::from_text("lona2-5tsnx-yhmi2-nidyd-foxvu-4fpvi-gfqn2-ufwlm-7rrqy-ulxua-2ae").unwrap();

    #[cfg(not(feature = "canbench-rs"))]
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
                let default_user_data = UserData::default();
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

    if supply_tokens <= Nat::from(0u128) || borrow_tokens <= Nat::from(0u128) {
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
        reserve_data.debt_index = Nat::from(100_000_000u128);
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
        supply_reserve_data.debt_index = Nat::from(100_000_000u128);

        let mut borrow_reserve_data = mutate_state(|state| {
            state
                .asset_index
                .get(&asset_borrow)
                .map(|reserve| reserve.0.clone())
                .ok_or(Error::NoReserveDataFound)
        })?;

        borrow_reserve_data.asset_borrow += borrow_tokens.clone();
        borrow_reserve_data.debt_index = Nat::from(100_000_000u128);

        (supply_reserve_data, borrow_reserve_data)
    };

    let supply_asset_ledger_canister_id = reserve_ledger_canister_id(asset_supply.clone())?;
    let debt_asset_ledger_canister_id = reserve_ledger_canister_id(asset_borrow.clone())?;

    let mut user_data = user_data(user_principal)?;

    if asset_supply == asset_borrow {
        let mut user_reserve = user_reserve(&mut user_data, &asset_supply);
        let mut user_reserve_data = if let Some((_, reserve_data)) = user_reserve {
            reserve_data.liquidity_index = Nat::from(100_000_000u128);
            reserve_data.variable_borrow_index = Nat::from(100_000_000u128);
            reserve_data.d_token_balance += supply_tokens.clone();
            reserve_data.debt_token_blance += borrow_tokens.clone();
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.is_collateral = true;
            reserve_data.is_borrowed = true;
        };
    } else {
        let mut supply_user_reserve = user_reserve(&mut user_data, &asset_supply);
        let mut user_reserve_data = if let Some((_, reserve_data)) = supply_user_reserve {
            reserve_data.liquidity_index = Nat::from(100_000_000u128);
            reserve_data.variable_borrow_index = Nat::from(100_000_000u128);
            reserve_data.d_token_balance += supply_tokens.clone();
            reserve_data.is_using_as_collateral_or_borrow = true;
            reserve_data.is_collateral = true;
        };

        let mut borrow_user_reserve = user_reserve(&mut user_data, &asset_borrow);
        let mut user_reserve_data = if let Some((_, reserve_data)) = borrow_user_reserve {
            reserve_data.liquidity_index = Nat::from(100_000_000u128);
            reserve_data.variable_borrow_index = Nat::from(100_000_000u128);
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