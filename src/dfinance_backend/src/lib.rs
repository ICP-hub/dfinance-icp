use crate::constants::errors::Error;
use api::functions::get_balance;
use api::functions::reset_faucet_usage;
use candid::Nat;
use candid::Principal;
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use ic_cdk_macros::update;
use protocol::libraries::logic::update::user_data;
use protocol::libraries::logic::update::user_reserve;
use protocol::libraries::logic::user;
use protocol::libraries::logic::user::calculate_user_account_data;
use protocol::libraries::math::calculate::PriceCache;
use protocol::libraries::math::math_utils;
use protocol::libraries::math::math_utils::ScalingMath;
mod api;
mod constants;
pub mod declarations;
mod dynamic_canister;
mod guards;
mod implementations;
mod memory;
mod protocol;
mod state;
use crate::api::state_handler::{mutate_state, read_state};
use crate::declarations::assets::ReserveData;
use crate::declarations::assets::{
    ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,ExecuteLiquidationParams
};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::types::datatypes::UserData;
use ic_cdk_timers::set_timer_interval;
use std::time::Duration;

const ONE_DAY: Duration = Duration::from_secs(86400);

#[init]
pub async fn init() {
    ic_cdk::println!("function called");
    schedule_midnight_task().await;
}

// Function to fetch the reserve-data based on the asset
#[query]
fn get_reserve_data(asset: String) -> Result<ReserveData, Error> {
    read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })
}

// Function to get the user data based on the principal
#[query]
fn get_user_data(user: Principal) -> Result<UserData, Error> {
    if user == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    read_state(|state| {
        state
            .user_profile
            .get(&user)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::UserNotFound)
    })
}

// Get names of all assets of the reserve
#[query]
pub fn get_all_assets() -> Vec<String> {
    read_state(|state| {
        let mut asset_names = Vec::new();
        let iter = state.reserve_list.iter();
        for (key, _) in iter {
            asset_names.push(key.clone());
        }
        asset_names
    })
}

#[query]
pub fn get_asset_principal(asset_name: String) -> Result<Principal, Error> {
    if asset_name.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_name.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }
    read_state(|state| match state.reserve_list.get(&asset_name) {
        Some(principal) => Ok(principal),
        None => {
            return Err(Error::NotFoundAssetPrincipal);
        }
    })
}

// Get all users
#[query]
pub async fn get_all_users() -> Vec<(Principal, UserData)> {
    read_state(|state| {
        state
            .user_profile
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    })
}

// Initialize user if not found
#[update]
fn register_user() -> Result<String, Error> {
    ic_cdk::println!("function is register running");

    let user_principal: Principal = ic_cdk::api::caller();
    ic_cdk::println!("user principal register = {} ", user_principal);

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
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

#[query]
pub async fn user_position(asset_name: String) -> Result<(Nat, Nat), Error> {
    if asset_name.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_name.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {}", user_principal);

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let user_data_result = read_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|user| user.0.clone())
            .ok_or_else(|| Error::UserNotFound)
    });

    let user_data = match user_data_result {
        Ok(data) => data,
        Err(err) => return Err(err),
    };

    let user_reserve_data = user_data
        .reserves
        .as_ref()
        .and_then(|reserves| reserves.iter().find(|(name, _)| name == &asset_name))
        .map(|(_, reserve_data)| reserve_data)
        .ok_or_else(|| Error::NoUserReserveDataFound)?;

    let prev_liq_index = user_reserve_data.liquidity_index.clone();
    let prev_borrow_index = user_reserve_data.variable_borrow_index.clone();

    let updated_asset_supply = if user_reserve_data.asset_supply > Nat::from(0u128) {
        calculate_dynamic_balance(
            user_reserve_data.asset_supply.clone(),
            prev_liq_index,
            user_reserve_data.liquidity_index.clone(),
        )
    } else {
        Nat::from(0u128)
    };

    let updated_asset_borrow = if user_reserve_data.asset_borrow > Nat::from(0u128) {
        calculate_dynamic_balance(
            user_reserve_data.asset_borrow.clone(),
            prev_borrow_index,
            user_reserve_data.variable_borrow_index.clone(),
        )
    } else {
        Nat::from(0u128)
    };

    ic_cdk::println!(
        "For asset {}: Updated asset supply = {}, Updated asset borrow = {}",
        asset_name,
        updated_asset_supply,
        updated_asset_borrow
    );

    Ok((updated_asset_supply, updated_asset_borrow))
}

#[query]
pub fn get_cached_exchange_rate(base_asset_symbol: String) -> Result<PriceCache, Error> {
    if base_asset_symbol.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if base_asset_symbol.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }
    let base_asset = match base_asset_symbol.as_str() {
        "ckBTC" => "btc",
        "ckETH" => "eth",
        "ckUSDC" => "usdc",
        "ckUSDT" => "usdt",
        _ => base_asset_symbol.as_str(),
    };

    ic_cdk::println!("base asset = {}", base_asset);

    ic_cdk::println!("base asset symbol =  {}", base_asset_symbol);
    // Fetching price-cache data
    let price_cache_result = read_state(|state| {
        let price_cache_data = &state.price_cache_list;
        price_cache_data
            .get(&base_asset.to_string())
            .map(|price_cache| price_cache.0)
            .ok_or_else(|| Error::NoPriceCache)
    });

    // Handling price-cache data result
    match price_cache_result {
        Ok(data) => {
            ic_cdk::println!("price cache found: {:?}", data);
            Ok(data)
        }
        Err(e) => {
            ic_cdk::println!("price cache not found = {:?}", e);
            return Err(e);
        }
    }
}

fn calculate_dynamic_balance(
    initial_deposit: Nat,
    prev_liquidity_index: Nat,
    new_liquidity_index: Nat,
) -> Nat {
    if prev_liquidity_index == Nat::from(0u128) {
        return Nat::from(0u128);
    }
    initial_deposit * (new_liquidity_index / prev_liquidity_index)
}

#[update]
pub async fn get_asset_supply(
    asset_name: String,
    on_behalf: Option<Principal>,
) -> Result<Nat, Error> {
    if asset_name.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_name.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if let Some(principal) = on_behalf {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }
    ic_cdk::println!("Entering get_asset_supply function");

    ic_cdk::println!("Asset name received: {}", asset_name);

    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => ic_cdk::caller(),
    };

    if user_principal ==  Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    ic_cdk::println!("User principal: {:?}", user_principal.to_string());

    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {:?}", e);
            return Err(e);
        }
    };

    ic_cdk::println!("Fetching user reserve data for asset: {}", asset_name);
    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            ic_cdk::println!(
                "Error: User reserve data not found for asset while get asset supply returing 0: {}",
                asset_name
            );
            return Ok(Nat::from(0u128));
        }
    };

    let asset_reserve = match get_reserve_data(asset_name.clone()) {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error fetching asset reserve data: {:?}", e);
            return Err(e);
        }
    };

    ic_cdk::println!("Asset reserve data fetched successfully");

    let d_token_canister_principal =
        match Principal::from_text(asset_reserve.d_token_canister.clone().unwrap()) {
            Ok(principal) => principal,
            Err(e) => {
                ic_cdk::println!("Error parsing DToken canister principal: {}", e);
                return Err(Error::ErrorParsingPrincipal);
            }
        };

    let balance_result = get_balance(d_token_canister_principal, user_principal).await;
    let get_balance_value = match balance_result {
        Ok(bal) => bal,
        Err(e) => {
            return Err(e);
        }
    };

    ic_cdk::println!(
        "Fetched balance from DToken canister: {:?}",
        get_balance_value
    );

    if get_balance_value == Nat::from(0u128) {
        ic_cdk::println!("balance 0, returnin....");
        return Ok(Nat::from(0u128));
    }

    let (_, user_reserve) = user_reserve_data;

    let normalized_supply_data = match user_normalized_supply(asset_reserve) {
        Ok(data) => {
            ic_cdk::println!("Successfully fetched normalized supply data: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error from the normalized supply function: {:?}", e);
            return Err(e);
        }
    };

    let result = (normalized_supply_data.scaled_div(user_reserve.liquidity_index.clone()))
    .scaled_mul(get_balance_value);
    ic_cdk::println!("Final calculated asset supply: {}", result);

    Ok(result)
}

#[update]
pub async fn get_asset_debt(
    asset_name: String,
    on_behalf: Option<Principal>,
) -> Result<Nat, Error> {
    if asset_name.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset_name.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if let Some(principal) = on_behalf {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }
    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => ic_cdk::caller(),
    };

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error: {:?}", e);
            return Err(e);
        }
    };

    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            return Ok(Nat::from(0u128));
        }
    };
    let (_, user_reserve) = user_reserve_data;
    if !user_reserve.is_borrowed {
        return Ok(Nat::from(0u128));
    }

    let asset_reserve = match get_reserve_data(asset_name.clone()) {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error fetching asset reserve data: {:?}", e);
            return Err(e);
        }
    };

    let debt_token_canister_principal =
        match Principal::from_text(asset_reserve.debt_token_canister.clone().unwrap()) {
            Ok(principal) => principal,
            Err(e) => {
                ic_cdk::println!("Error parsing DebtToken canister principal: {}", e);
                return Err(Error::ErrorParsingPrincipal);
            }
        };
    ic_cdk::println!("Entering into get_balance function");
    let balance_result = get_balance(debt_token_canister_principal, user_principal).await;
    let get_balance_value = match balance_result {
        Ok(bal) => bal,
        Err(e) => {
            return Err(e);
        }
    };

    ic_cdk::println!(
        "Fetched balance from DebtToken canister: {:?}",
        get_balance_value
    );

    let normalized_debt_data = match user_normalized_debt(asset_reserve.clone()) {
        Ok(data) => data,
        Err(e) => {
            return Err(e);
        }
    };

    ic_cdk::println!(
        "Values in normalized debt data = {:?}",
        normalized_debt_data
    );

    Ok((normalized_debt_data.scaled_div(user_reserve.variable_borrow_index.clone())).scaled_mul(get_balance_value))
}


#[query]
pub fn user_normalized_supply(reserve_data: ReserveData) -> Result<Nat, Error> {

    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Ok(reserve_data.liquidity_index);
    } else {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            reserve_data.current_liquidity_rate,
            reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "previoys liquidity index: {} for reserve",
            reserve_data.liquidity_index
        );
        //  user_reserve_data.liquidity_index =
        return Ok(cumulated_liquidity_interest.scaled_mul(reserve_data.liquidity_index));
    }
}

//FRONTEND - userbalance(debttoken)*usernormalizedebt/userreserve.debtindex -> to get asset_debt of user for perticular asset
#[query]
pub fn user_normalized_debt(reserve_data: ReserveData) -> Result<Nat, Error> {

    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Ok(reserve_data.debt_index);
    }
    //instead of userreservedata use value from reservedata
    else {
        ic_cdk::println!(
            "Previous borrow index & rate: {:?} {:?}",
            reserve_data.debt_index,
            reserve_data.borrow_rate
        );
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            reserve_data.borrow_rate.clone(),
            reserve_data.last_update_timestamp,
            current_time,
        );
        ic_cdk::println!(
            "Calculated cumulated borrow interest: {} based on borrow rate: {} and and new debt index {}",
            cumulated_borrow_interest,
            reserve_data.borrow_rate, //take it from reserve of asset
            cumulated_borrow_interest.clone().scaled_mul(reserve_data.debt_index.clone())
        );
        return Ok(cumulated_borrow_interest.scaled_mul(reserve_data.debt_index));
    }
}

// this function is for check which i will remove later.
#[update]
async fn get_user_account_data(
    on_behalf: Option<Principal>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    ic_cdk::println!("error in user = {:?}", on_behalf);
    let result = calculate_user_account_data(on_behalf).await;
    result
}

pub async fn schedule_midnight_task() {
    let _timer_id = set_timer_interval(time_until_midnight(), || {
        ic_cdk::spawn(async {
            let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;

            for (user_principal, _) in vector_user_data {
                if let Err(_) = reset_faucet_usage(user_principal).await {
                }
            }
        });
    });
}

fn time_until_midnight() -> Duration {
    let now = ic_cdk::api::time();
    let nanos_since_midnight = now % ONE_DAY.as_nanos() as u64;
    Duration::from_nanos(ONE_DAY.as_nanos() as u64 - nanos_since_midnight)
}

#[ic_cdk::post_upgrade]
pub async fn post_upgrade() {
    schedule_midnight_task().await;
}

export_candid!();

//BUG 1. Total collateral and total debt -> updated according to  price of asset
//2. Available borrow in real time
//3. Burn function repay
// 4. cal of liq_index and borrow index of user
//5. Optimization
//6. accuare_to_treasury for fees
//7. liq_bot -> discuss about node or timer
//8. frontend -> cal h.f , dont show negative apy, remove tofix
