use crate::constants::errors::Error;
use crate::constants::asset_data::to_check_controller;
use api::functions::get_balance;
use api::functions::reset_faucet_usage;
use api::resource_manager::acquire_lock;
use api::resource_manager::LOCKS;
use candid::Nat;
use candid::Principal;
use declarations::assets::InitArgs;
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use ic_cdk_macros::update;
use protocol::libraries::logic::update::user_data;
use protocol::libraries::logic::update::user_reserve;
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
    ExecuteBorrowParams, ExecuteLiquidationParams, ExecuteRepayParams, ExecuteSupplyParams,
    ExecuteWithdrawParams,
};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::user::UserAccountData;
use crate::protocol::libraries::types::datatypes::UserData;
use ic_cdk_timers::set_timer_interval;
use std::time::Duration;

const ONE_DAY: Duration = Duration::from_secs(86400);

/*
 * @title Initialization Function
 * @dev Initializes the contract by setting the controller and scheduling a task.
 * @param args The principal ID of the controller.
 * @returns None
 */
#[init]
pub async fn init(args: Principal) {
    ic_cdk::println!("init function = {:?}", args);

    mutate_state(|state| {
        state.meta_data.insert(
            0,
            Candid(InitArgs {
                controller_id: args,
            }),
        );
    });

    ic_cdk::println!("function called");
    schedule_midnight_task().await;
}

/*
 * @title Get Controller Information
 * @dev Retrieves the controller ID from the state. The function looks for metadata 
 *      associated with a specific key and returns the `controller_id` from `InitArgs`
 *      if available. If no controller is found or an error occurs while reading the state, 
 *      an appropriate error is returned.
 *
 * @returns 
 *      - `Ok(InitArgs)`: Returns the `InitArgs` struct containing the `controller_id` of the controller.
 *      - `Err(Error::UserNotFound)`: If the controller metadata does not exist.
 *      - `Err(Error::ErrorNotController)`: If an error occurs during the state retrieval.
 */
pub fn get_controller() -> Result<InitArgs, Error> {

    match read_state(|state| {
        state
            .meta_data
            .get(&0)
            .ok_or_else(|| Error::UserNotFound)
    }) {
        Ok(va) => {
            Ok(va.0)
        },
        Err(_) => return Err(Error::ErrorNotController)
    }
}

/*
 * @title Get Reserve Data
 * @dev Fetches the reserve data for a specific asset.
 * @param asset The asset name.
 * @returns The reserve data if found.
 */
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

/*
 * @title Get User Data
 * @dev Retrieves user data for a given principal.
 * @param user The principal of the user.
 * @returns The user data if found.
 */
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

/*
 * @title Get All Assets
 * @dev Retrieves a list of all asset names available in the reserve.
 * @returns A vector containing asset names.
 */
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

/*
 * @title Get Reserve Ledger Canister ID
 * @dev Retrieves the principal ID of the canister handling a specific asset.
 * @param asset The asset name.
 * @returns The principal ID if found.
 */
pub fn reserve_ledger_canister_id(asset: String) -> Result<Principal, Error> {
    read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&asset) // No need for `to_string` or `clone` here
            .map(|principal| principal.clone()) // Copy the `Principal` directly
            .ok_or(Error::NoCanisterIdFound) // Return the error if the key is not found
    })
}

/*
 * @title Get Asset Principal
 * @dev Retrieves the principal ID associated with an asset.
 * @param asset_name The name of the asset.
 * @returns The principal ID if found.
 */
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

/*
 * @title Get All Users
 * @dev Retrieves a list of all registered users along with their data.
 * @returns A vector of tuples containing user principals and their data.
 */
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


/*
 * @title Get Cached Exchange Rate
 * @dev Retrieves the cached exchange rate for a given asset.
 * @param base_asset_symbol The symbol of the base asset.
 * @returns The cached exchange rate as `PriceCache`.
 */
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
            .map(|price_cache: Candid<PriceCache>| price_cache.0)
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


/*
 * @title Get Asset Supply
 * @dev Fetches the total asset supply for a given asset.
 * @param asset_name The asset name.
 * @param on_behalf (Optional) The principal requesting the asset supply.
 * @returns The total asset supply as `Nat`.
 */

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

    if user_principal == Principal::anonymous() {
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
    ic_cdk::println!(
        "result in asset supply {} {} {}",
        normalized_supply_data,
        user_reserve.liquidity_index,
        get_balance_value
    );
    let result = (normalized_supply_data
        .clone()
        .scaled_div(user_reserve.liquidity_index.clone()))
    .scaled_mul(get_balance_value.clone());
    ic_cdk::println!("Final calculated asset supply: {}", result);

    Ok(result)
}

/*
 * @title Get Asset Debt
 * @dev Retrieves the total debt for a given asset.
 * @param asset_name The name of the asset.
 * @param on_behalf (Optional) The principal requesting the asset debt.
 * @returns The total debt as `Nat`.
 */
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
    ic_cdk::println!("user data = {:?}", user_data);
    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            ic_cdk::println!(
                "Error: User reserve data not found for asset while get asset debt returing 0: {}",
                asset_name
            );
            return Ok(Nat::from(0u128));
        }
    };
    let (_, user_reserve) = user_reserve_data;
    if !user_reserve.is_borrowed {
        ic_cdk::println!("User has no debt for asset: {}", asset_name);
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

    Ok(
        (normalized_debt_data.scaled_div(user_reserve.variable_borrow_index.clone()))
            .scaled_mul(get_balance_value),
    )
}

/*
 * @title User Normalized Supply
 * @dev Calculates the normalized supply of a user for a given reserve.
 * @param reserve_data The reserve data containing liquidity index and rate.
 * @returns The normalized supply as `Nat`.
 */
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

/*
 * @title User Normalized Debt
 * @dev Computes the normalized debt of a user for a given reserve.
 * @param reserve_data The reserve data containing debt index and borrow rate.
 * @returns The normalized debt as `Nat`.
 */
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


/*
 * @title Get Lock Status
 * @dev Checks if the user has an active lock.
 * @returns `true` if the user has a lock, `false` otherwise.
 */
#[query]
async fn get_lock() -> Result<bool, Error> {
    let user_principal = ic_cdk::api::caller();
    ic_cdk::println!("user principal = {} ", user_principal);

    let result = LOCKS
        .lock()
        .map(|locks| locks.get(&user_principal).cloned().unwrap_or_else(|| false));

    match result {
        Ok(_) => Ok(result.unwrap()),
        Err(e) => Err(Error::LockAcquisitionFailed),
    }
}

/*
 * @title Get Total Users
 * @dev Retrieves the total number of registered users.
 * @returns The total user count as `usize`.
 */
#[query]
pub fn get_total_users() -> usize {
    read_state(|state| state.user_profile.len().try_into().unwrap())
}

/*
 * @title Add Tester (For Testing Purpose - Pocket IC)
 * @dev This function allows the current controller to add a new tester by associating 
 *      a username with a principal ID. It ensures that only controllers can add testers.
 *      The function checks if the caller is a valid user (not anonymous) and whether the 
 *      caller is a controller. If these conditions are met, the tester is added to the 
 *      `tester_list` in the state.
 * 
 * @param username The username of the tester to be added.
 * @param principal The principal ID of the tester to be added.
 * 
 * @returns 
 *      - `Ok(())`: If the tester was successfully added.
 *      - `Err(Error::AnonymousPrincipal)`: If the caller is an anonymous principal.
 *      - `Err(Error::ErrorNotController)`: If the caller is not a controller.
 */
#[ic_cdk::update]
pub fn add_tester(username: String, principal: Principal)->Result<(), Error> {
    let user_principal = ic_cdk::caller();
    if user_principal == Principal::anonymous()  {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    if !to_check_controller(){
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }
    mutate_state(|state| {
        state.tester_list.insert(username, principal)
    });
    return Ok(());
}

/*
 * @title Get Testers (For Testing Purpose - Pocket IC)
 * @dev This function retrieves the list of testers associated with the canister. It checks if the caller 
 *      is a valid user (not anonymous) and then fetches the list of testers from the state. The function 
 *      returns a vector of principal IDs representing the testers.
 * 
 * @returns 
 *      - `Ok(Vec<Principal>)`: A list of principal IDs for all testers.
 *      - `Err(Error::AnonymousPrincipal)`: If the caller is an anonymous principal.
 */
pub fn get_testers() -> Result<Vec<Principal>, Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    read_state(|state| {
        let mut testers = Vec::new();
        let iter = state.tester_list.iter();
        for (_, value) in iter {
            testers.push(value.clone());
        }
        Ok(testers)
    })
}

/*
 * @title Check if Caller is a Tester (For Testing Purpose - Pocket IC)
 * @dev This function checks if the caller is a registered tester. It retrieves the list of testers from 
 *      the state and compares the caller’s principal ID with the list. The function returns `true` if the 
 *      caller is a tester, and `false` otherwise. If there's an error fetching the testers list, the function 
 *      logs the error and returns `false`.
 * 
 * @returns 
 *      - `true`: If the caller is found in the list of testers.
 *      - `false`: If the caller is not a tester or if there is an error retrieving the tester list.
 */
#[ic_cdk::query]
pub fn check_is_tester()-> bool {

    let testers = match get_testers(){
        Ok(data)=>data,
        Err(error) => {
            ic_cdk::println!("Invalid Access {:?}", error);
            return false;
        }
    };
    let user = ic_cdk::caller();
    if testers.contains(&user){
        return true;
    }
    return false;
}



/*
 * @title Get User Account Data
 * @dev Fetches the user’s account data.
 * @param on_behalf (Optional) The principal requesting the data.
 * @returns A tuple containing user financial data.
 */
#[update]
async fn get_user_account_data(
    on_behalf: Option<Principal>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    ic_cdk::println!("error in user = {:?}", on_behalf);
    let result = calculate_user_account_data(on_behalf).await;
    result
}

/*
 * @title Schedule Midnight Task
 * @dev This function schedules a task to reset faucet usage at midnight.
 * @returns None
 */
pub async fn schedule_midnight_task() {
    let _timer_id = set_timer_interval(time_until_midnight(), || {
        ic_cdk::spawn(async {
            let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;

            for (user_principal, _) in vector_user_data {
                if let Err(_) = reset_faucet_usage(user_principal).await {}
            }
        });
    });
}

/*
 * @title Time Until Midnight
 * @dev Calculates the duration remaining until midnight (UTC).
 * @returns A `Duration` representing the time left until midnight.
 */
fn time_until_midnight() -> Duration {
    let now = ic_cdk::api::time();
    let nanos_since_midnight = now % ONE_DAY.as_nanos() as u64;
    Duration::from_nanos(ONE_DAY.as_nanos() as u64 - nanos_since_midnight)
}

/*
 * @title Post Upgrade Hook
 * @dev This function is automatically executed after an upgrade.
 * @notice Re-initializes scheduled tasks, such as the midnight reset.
 * @returns None (Executes `schedule_midnight_task` asynchronously).
 */
#[ic_cdk::post_upgrade]
pub async fn post_upgrade() {
    schedule_midnight_task().await;
}

export_candid!();



