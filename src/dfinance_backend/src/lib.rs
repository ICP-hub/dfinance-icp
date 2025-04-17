use crate::constants::errors::Error;
use api::functions::get_balance;
use api::functions::reset_faucet_usage;
use api::resource_manager::LOCKS;
use candid::Nat;
use candid::Principal;
use constants::interest_variables::constants::TOKEN_TRANSFER_FEE;
use declarations::structs::AssetData;
use declarations::structs::InitArgs;
use guards::to_check_controller;
use ic_cdk::update;
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use protocol::libraries::logic::update::user_data;
use protocol::libraries::logic::update::user_reserve;
use protocol::libraries::logic::user::calculate_user_asset_data;
use protocol::libraries::math::math_utils;
use protocol::libraries::math::math_utils::ScalingMath;
use protocol::libraries::types::datatypes::PriceCache;
use protocol::libraries::types::datatypes::SessionStorageData;
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
use crate::declarations::structs::ReserveData;
use crate::declarations::structs::{
    ExecuteBorrowParams, ExecuteLiquidationParams, ExecuteRepayParams, ExecuteSupplyParams,
    ExecuteWithdrawParams,
};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::types::datatypes::{UserData, UserAccountData};
use ic_cdk_timers::{set_timer_interval, set_timer};
use std::time::Duration;
use constants::constant_variables::constants::{ONE_DAY, ZERO_VALUE};



/*
 * @title Initialization Function
 * @dev Initializes the contract by setting the controller and scheduling a task.
 * @param args The principal ID of the controller.
 * @returns None
 * 
 * @functionality Initialize Contract and Schedule Task
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
 *
 * @functionality Retrieve Controller Information
 */
pub fn get_controller() -> Result<InitArgs, Error> {
    match read_state(|state| state.meta_data.get(&0).ok_or_else(|| Error::UserNotFound)) {
        Ok(va) => Ok(va.0),
        Err(_) => return Err(Error::ErrorNotController),
    }
}

/*
 * @title Get Reserve Data
 * @dev Fetches the reserve data for a specific asset.
 * @param asset The asset name.
 * @returns The reserve data if found.
 *  @functionality Retrieve Reserve Data for a Specified Asset
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
 *
 * @functionality Retrieve User Data for a Specified Principal
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
 *
 * @functionality Retrieve a List of All Available Assets in the Reserve
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
 * @functionality This function retrieves the principal ID associated with the reserve ledger canister for a specific asset.
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
 * @functionality This function returns the principal ID linked to a particular asset.
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
 * @functionality This function returns a list of all registered users and their respective data.
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
 * @functionality This function fetches the cached exchange rate for a specified base asset symbol.
 */
#[query]
pub fn get_cached_exchange_rate(base_asset_symbol: String) -> Result<Nat, Error> {
    let trimmed_symbol = base_asset_symbol.trim();

    if trimmed_symbol.is_empty() {
        return Err(Error::EmptyAsset);
    }
    if trimmed_symbol.len() > 7 {
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
    ic_cdk::println!("base_asset_symbol {}", base_asset_symbol);

    read_state(|state| {
        state
            .price_cache_list
            .get(&base_asset.to_string())
            .map(|price_cache: Candid<PriceCache>| {
                price_cache
                    .0
                    .cache
                    .get(&base_asset_symbol)
                    .map(|p| p.price.clone())
            })
            .flatten()
            .ok_or(Error::NoPriceCache)
    })
}

/*
 * @title Get Asset Supply
 * @dev Fetches the total asset supply for a given asset.
 * @param asset_name The asset name.
 * @param on_behalf (Optional) The principal requesting the asset supply.
 * @returns The total asset supply as `Nat`.
 * @functionality This function fetches the total supply of a given asset and handles calculations related to user reserves and balance.
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
            return Ok(Nat::from(ZERO_VALUE));
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

    if get_balance_value == Nat::from(ZERO_VALUE) {
        ic_cdk::println!("balance 0, returnin....");
        return Ok(Nat::from(ZERO_VALUE));
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
 * @functionality This function calculates and returns the total debt for a given asset, taking into account the user’s borrow status and balance.
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
            return Ok(Nat::from(ZERO_VALUE));
        }
    };
    let (_, user_reserve) = user_reserve_data;
    if !user_reserve.is_borrowed {
        ic_cdk::println!("User has no debt for asset: {}", asset_name);
        return Ok(Nat::from(ZERO_VALUE));
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
 * @functionality This function computes the normalized supply of a user based on the reserve's liquidity rate and index, adjusting for interest accumulation.
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
        return Ok(cumulated_liquidity_interest.scaled_mul(reserve_data.liquidity_index));
    }
}

/*
 * @title User Normalized Debt
 * @dev Computes the normalized debt of a user for a given reserve.
 * @param reserve_data The reserve data containing debt index and borrow rate.
 * @returns The normalized debt as `Nat`.
 * @functionality This function calculates the normalized debt of a user based on the reserve's debt index and borrow rate, adjusting for interest over time.
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
    } else {
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
 * @functionality This function checks the user's lock status, determining if they have an active lock or not.
 */
#[query]
async fn get_lock() -> Result<bool, Error> {
    let user_principal = ic_cdk::api::caller();
    ic_cdk::println!("user principal = {} ", user_principal);

    if !to_check_controller() {
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }

    let result = LOCKS
        .lock()
        .map(|locks| locks.get(&user_principal).cloned().unwrap_or_else(|| false));

    match result {
        Ok(_) => Ok(result.unwrap()),
        Err(_e) => Err(Error::LockAcquisitionFailed),
    }
}

/*
 * @title Get Total Users
 * @dev Retrieves the total number of registered users.
 * @returns The total user count as `usize`.
 * @functionality This function returns the total number of users that are currently registered in the system.
 */
#[query]
pub fn get_total_users() -> usize {
    read_state(|state| state.user_profile.len().try_into().unwrap())
}

/*
 * @title Get User Account Data
 * @dev Fetches the user’s account data.
 * @param on_behalf (Optional) The principal requesting the data.
 * @returns A tuple containing user financial data.
 * @functionality This function retrieves and calculates the financial data of a user, including asset balances and debts.
 */
#[query]
async fn get_user_account_data(
    on_behalf: Option<Principal>,
    dtoken_balance: Option<Vec<AssetData>>,
    debt_token_balance: Option<Vec<AssetData>>,
) -> Result<(Nat, Nat, Nat, Nat, Nat, Nat, bool), Error> {
    ic_cdk::println!("error in user = {:?}", on_behalf);
    let result = calculate_user_asset_data(on_behalf, dtoken_balance, debt_token_balance).await;
    result
}

/*
 * @title Schedule Midnight Task
 * @dev This function schedules a task to reset faucet usage at midnight.
 * @returns None
 * @functionality Schedules a daily reset task at midnight for faucet usage.
 */
pub async fn schedule_midnight_task() {
    let initial_delay = time_until_midnight();
    
    
    set_timer(initial_delay, || {
        ic_cdk::spawn(async {

            run_midnight_reset().await;
    
            set_timer_interval(ONE_DAY, || {
                ic_cdk::spawn(async {
                    run_midnight_reset().await;
                });
            });
        });
    });
}

/*
 * @title Run Midnight Reset
 * @dev Resets faucet usage for all registered users at midnight (UTC).
 * @returns None
 * 
 * This function retrieves all user data and calls `reset_faucet_usage` for each user. 
 * Any errors encountered during the reset are silently ignored, but can be logged for debugging purposes.
 * @functionality Resets faucet usage for all users at midnight.
 */
async fn run_midnight_reset() {
    let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;
    for (user_principal, _) in vector_user_data {
        if let Err(_) = reset_faucet_usage(user_principal).await {
            ic_cdk::println!(
                "Error resetting faucet usage for user: {}",
                user_principal.to_string()
            );
        } else {
            ic_cdk::println!(
                "Successfully reset faucet usage for user: {}",
                user_principal.to_string()
            );
        }
    }
}

/*
 * @title Time Until Midnight
 * @dev Calculates the duration remaining until midnight (UTC).
 * @returns A `Duration` representing the time left until midnight.
 * @functionality Computes the remaining time until midnight (UTC).
 */
fn time_until_midnight() -> Duration {
    let now = ic_cdk::api::time();
    let nanos_since_midnight = now % ONE_DAY.as_nanos() as u64;
    let duration_until_midnight = ONE_DAY.as_nanos() as u64 - nanos_since_midnight;
    Duration::from_nanos(duration_until_midnight)
}

/*
 * @title Schedule after upgrade by admin
 * @dev This function will re-initialize the scheduled tasks, such as the midnight reset.
 * @notice Re-initializes scheduled tasks, such as the midnight reset.
 * @returns ok or Error.
 * @functionality Allows the admin to re-initialize scheduled tasks after an upgrade.
 */
#[update]
pub async fn admin_restart_reset_task() -> Result<(), Error> {
   
    if !to_check_controller() {
        return Err(Error::ErrorNotController);
    }
    schedule_midnight_task().await;
    return Ok(());
}

/*
 * @title Get Transfer Fee
 * @dev Retrieves the transfer fee for an asset based on its exchange rate.
 * @param asset_name The name of the asset.
 * @returns The transfer fee as `Nat`.
 * @functionality Calculates the transfer fee for a given asset based on its exchange rate.
 */
#[query]
pub async fn get_transfer_fee(asset_name: String) -> Result<Nat, Error> {

    let caller_id = ic_cdk::caller(); 
      
    if caller_id == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let asset_price = match get_cached_exchange_rate(asset_name.clone()) {
        Ok(price) => price,
        Err(e) => {
            ic_cdk::println!("Failed to fetch exchange rate");
            return Err(e);
        }
    };

    let transfer_token_fee = Nat::from(TOKEN_TRANSFER_FEE).scaled_div(asset_price);
    Ok(transfer_token_fee)
}

/*
 * @title Set Canister ID
 * @dev Allows an admin to associate a canister name with its principal ID.
 * @param canister_name The name of the canister.
 * @param canister_id The principal ID of the canister.
 * @returns Ok or Error.
 * @functionality Allows an admin to store a canister's principal ID by its name.
 */
#[update]
pub async fn set_canister_id(canister_name: String, canister_id: Principal) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous()
        || !to_check_controller()
    {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    mutate_state(|state| {
        state.canister_list.insert(canister_name, canister_id);
    });

    Ok(())
}

/*
 * @title Get Canister ID by Name
 * @dev Retrieves the principal ID associated with a given canister name.
 * @param canister_name The name of the canister.
 * @returns The principal ID of the canister or an error.
 * @functionality Retrieves the principal ID associated with a given canister name.
 */
#[query] //TODO: remove this later.
pub fn get_canister_id_by_name(canister_name: String) -> Result<Principal, Error> {
    read_state(|state| {
        state
            .canister_list
            .get(&canister_name)
            .ok_or(Error::NoCanisterIdFound) // Return error if not found
    })
}

/*
 * @title Store Session Data
 * @dev Stores the session information, including the connected wallet and session start time.
 * @param connected_wallet The wallet address.
 * @param session_start The session start time.
 * @returns Ok or Error.
 * @functionality Stores session data, including connected wallet and session start time.
 */
#[update]
// Function to store session data
pub fn store_session_data(connected_wallet: String, session_start: Nat) -> Result<(), Error> {
    let caller_id = ic_cdk::caller();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    if connected_wallet.len() > 15 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if session_start <= Nat::from(ZERO_VALUE) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    let session_data = SessionStorageData {
        connected_wallet,
        session_start,
    };

    // Save the updated request history
    mutate_state(|state| {
        state
            .session_details
            .insert(caller_id, Candid(session_data));
    });

    Ok(())
}

/*
 * @title Get Caller Session
 * @dev Retrieves the session data for the caller.
 * @returns The session data for the caller.
 * @functionality Retrieves the session data for the caller.
 */
#[query]
pub fn get_caller_session() -> Result<SessionStorageData, Error> {
    let caller_id = ic_cdk::caller();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    Ok(read_state(|state| {
        state
            .session_details
            .get(&caller_id)
            .map(|data| data.0.clone()) // Extract value
            .unwrap_or_else(|| SessionStorageData {
                // Default value
                connected_wallet: "".to_string(),
                session_start: Nat::from(ZERO_VALUE),
            })
    }))
}

/*
 * @title Store User Guide
 * @dev Stores whether the user has seen the user guide.
 * @returns Ok or Error.
 * @functionality Stores whether the user has seen the guide.
 */
#[update]
pub fn store_user_guide() -> Result<(), Error> {
    let caller_id = ic_cdk::caller();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    mutate_state(|state| {
        state.user_guide_data.insert(caller_id, true);
    });

    Ok(())
}

/*
 * @title Get User Guide
 * @dev Retrieves whether the user has seen the user guide.
 * @returns true if the user has seen the guide, false otherwise.
 * @functionality Retrieves whether the user has seen the guide.
 */
#[query]
pub fn get_user_guide() -> Result<bool, Error> {
    let caller_id = ic_cdk::caller();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    Ok(read_state(|state| {
        state.user_guide_data.get(&caller_id).unwrap_or(false)
    }))
}

export_candid!();
