
use crate::declarations::datatypes::{AssetInfo,FaucetReserves, ReserveData};
use crate::constants::errors::Error;
use crate::error;
use crate::guards::access_control::{
    guard_admin_only,
    guard_prevent_anonymous,
    guard_principal_not_anonymous
};
use crate::info;
use crate::protocol::utils::{
        price::get_cached_exchange_rate,
        math_utils::ScalingMath
    };
use crate::trace;
use crate::constants::constant_variables::constants::{ALL_ASSETS, ALL_USERS, ASSET_PRINCIPAL, CYCLE_EXHAUSTED_LIMIT, CYCLE_THRESHOLD_LIMIT, TOKEN_TRANSFER_FEE};
use crate::constants::validators::validate_asset_name;
use crate::declarations::datatypes:: UserData;
use crate::declarations::structs::{AssetData, CycleAlert};
use ic_cdk::query;
use crate::protocol::libraries::user::{calculate_user_asset_data, get_all_users};
use crate::stable_storage::state_handler::read_state;
use candid::Nat;
use candid::Principal;
use ic_cdk::api;
use crate::protocol::utils::log::{log_internal, LogLevel};  
use crate::stable_storage::state_handler::get_certificate_witness;
use crate::declarations::datatypes::Certificate;
use crate::protocol::libraries::reserve::{get_reserve_data,get_asset_principal};
use crate::protocol::libraries::user::{user_normalized_debt, user_normalized_supply};


/**
 * @title Get Certified Reserve Data
 * @dev Retrieves the certified reserve data and its corresponding certificate for a given asset.
 * @param asset The name of the asset for which reserve data is to be retrieved.
 * @returns A tuple containing the reserve data and the certificate.
 *
 * @functionality Retrieves reserve data along with its certification for the specified asset.
 */
#[query]
pub fn get_reserve_data_certified(asset: String) -> Result<(ReserveData,Certificate), Error> {
    validate_asset_name(&asset.clone())?;
    let reserved_data = get_reserve_data(asset.clone())?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let certificate = get_certificate_witness(asset);
    return Ok((reserved_data,certificate));
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
fn get_user_data(user: Principal) -> Result<(UserData, Certificate), Error> {
    
    guard_principal_not_anonymous(&user)?;

    let user_data = read_state(|state| {
        state
            .user_profile
            .get(&user)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::UserNotFound)
    })?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let certificate = get_certificate_witness(user.to_string());
    return Ok((user_data, certificate));
}

/*
 * @title Get User Faucet Data (testnet only)
 * @dev Retrieves the faucet data for a given user.
 * @param user The principal of the user.
 * @returns The faucet reserves if found.
 *
 * @functionality Retrieve User Faucet Data for a Specified Principal
 */
#[cfg(feature = "testnet")]
#[query]
fn get_user_faucet_data(user: Principal) -> Result<(FaucetReserves, Certificate), Error> {

    guard_principal_not_anonymous(&user)?;

    let user_faucet_data = read_state(|state| {
        state
            .faucet_data
            .get(&user)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::UserNotFound)
    })?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let certificate = get_certificate_witness(user.to_string());
    return Ok((user_faucet_data, certificate));
}

/**
 * @title Get All Certified Assets
 * @dev Retrieves a list of all asset information along with a certificate for verification.
 * @returns A tuple containing a vector of asset information and the certificate.
 *
 * @functionality Retrieves all stored asset data with a certification for integrity verification.
 */
#[query]
pub fn get_all_assets_certified() -> (Vec<AssetInfo>, Certificate) {
    read_state(|state| {
        let assets: Vec<AssetInfo> = state.asset_records
            .iter()
            .map(|(_, asset)| asset.0.clone())
            .collect();

        // Generate the certificate from the certified map
        let cert = get_certificate_witness(ALL_ASSETS.to_string());

        (assets, cert)
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
pub fn get_asset_principal_certified(asset_name: String) -> Result<(Principal, Certificate), Error> {
    validate_asset_name(&asset_name)?;

    let asset_principal = get_asset_principal(asset_name.clone())?;
    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness(ASSET_PRINCIPAL.to_string());
    Ok((asset_principal, cert))
}

/**
 * @title Get All Certified Users
 * @dev Asynchronously retrieves all user data along with a certificate for verification.
 * @returns A tuple containing a vector of principal-user data pairs and the certificate.
 *
 * @functionality Retrieves all registered users and their associated data with certification for data authenticity.
 */
#[query]
pub async fn get_all_users_certified() -> (Vec<(Principal, UserData)>, Certificate) {
    let res = get_all_users().await;
    let cert = get_certificate_witness(ALL_USERS.to_string());

    (res, cert)
}


/*
 * @title Get Cached Exchange Rate
 * @dev Retrieves the cached exchange rate for a given asset.
 * @param base_asset_symbol The symbol of the base asset.
 * @returns The cached exchange rate as `PriceCache`.
 * @functionality This function fetches the cached exchange rate for a specified base asset symbol.
 */
#[query]
pub fn get_cached_exchange_rate_certified(base_asset_symbol: String) -> Result<(Nat, Certificate), Error> {
   
    let res = get_cached_exchange_rate(base_asset_symbol)?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("price_cache".to_string());
    
    Ok((res, cert)) 
}


/*
 * @title User Normalized Supply
 * @dev Calculates the normalized supply of a user for a given reserve.
 * @param reserve_data The reserve data containing liquidity index and rate.
 * @returns The normalized supply as `Nat`.
 * @functionality This function computes the normalized supply of a user based on the reserve's liquidity rate and index, adjusting for interest accumulation.
 */
#[query]
pub fn user_normalized_supply_certified(reserve_data: ReserveData) -> Result<(Nat, Certificate), Error> {

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("user_normalized_supply".to_string());
    let res = user_normalized_supply(reserve_data.clone())?;
    Ok((res, cert))
}


/*
 * @title User Normalized Debt
 * @dev Computes the normalized debt of a user for a given reserve.
 * @param reserve_data The reserve data containing debt index and borrow rate.
 * @returns The normalized debt as `Nat`.
 * @functionality This function calculates the normalized debt of a user based on the reserve's debt index and borrow rate, adjusting for interest over time.
 */
#[query]
pub fn user_normalized_debt_certified(reserve_data: ReserveData) -> Result<(Nat, Certificate), Error> {

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("user_normalized_debt".to_string());
    let res = user_normalized_debt(reserve_data.clone())?;
    Ok((res, cert))
}

/*
 * @title Get Total Users
 * @dev Retrieves the total number of registered users.
 * @returns The total user count as `usize`.
 * @functionality This function returns the total number of users that are currently registered in the system.
 */
#[query] 
pub fn get_total_users() -> (usize, Certificate) {
    let res =read_state(|state| state.user_profile.len().try_into().unwrap());
    
    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("total_users".to_string());
    (res, cert)
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
) -> Result<((Nat, Nat, Nat, Nat, Nat, Nat, bool),Certificate), Error> {

    if on_behalf == Some(Principal::anonymous()) {
        error!("Anonymous principal detected.");
        return Err(Error::AnonymousPrincipal);
    }

    guard_prevent_anonymous()?;

    let result = calculate_user_asset_data(on_behalf, dtoken_balance, debt_token_balance).await?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("user_account_data".to_string());
    info!("calculated user asset data called successfully inide get user account data");
    Ok((result, cert))
}

/*
 * @title Get Transfer Fee
 * @dev Retrieves the transfer fee for an asset based on its exchange rate.
 * @param asset_name The name of the asset.
 * @returns The transfer fee as `Nat`.
 * @functionality Calculates the transfer fee for a given asset based on its exchange rate.
 */
#[query]
pub async fn get_transfer_fee(asset_name: String) -> Result<(Nat, Certificate), Error> {
    trace!("calling get_transfer_fee");
    validate_asset_name(&asset_name)?;
    guard_prevent_anonymous()?;

    //Generates a Certificate with a CBOR-encoded witness for the given key.
    let cert = get_certificate_witness("transfer_fee".to_string());

    let asset_price =  get_cached_exchange_rate(asset_name.clone())?;

    let transfer_token_fee = Nat::from(TOKEN_TRANSFER_FEE).scaled_div(asset_price);
    Ok((transfer_token_fee, cert))
}

/*
 * @title Get Canister ID by Name
 * @dev Retrieves the principal ID associated with a given canister name.
 * @param canister_name The name of the canister.
 * @returns The principal ID of the canister or an error.
 * @functionality Retrieves the principal ID associated with a given canister name.
 */
#[query]
pub fn get_canister_id_by_name(canister_name: String) -> Result<Principal, Error> {
    guard_prevent_anonymous()?;
    read_state(|state| {
        state
            .canister_list
            .get(&canister_name)
            .ok_or(Error::NoCanisterIdFound)
    })
    
}


/*
 * @title Cycle Checker
 * @notice Retrieves the current cycle balance of the canister.
 * @dev Uses `canister_balance128` API to fetch the balance and return it as a `Nat`.
 * @functionality Canister monitoring functionality that allows checking the remaining computational resources
 *
 * # Returns
 * - `Nat` - The current cycle balance of the canister.
 */
#[query] //update
pub async fn cycle_checker() -> Result<(Nat, Certificate), Error> {
    guard_admin_only()?;
    let cert = get_certificate_witness("cycle_checker".to_string());
    Ok((Nat::from(api::canister_balance128()), cert))
}

#[query]
pub async fn cycle_alert()-> CycleAlert {
    
    let cycle = api::canister_balance128();
    let (is_exhausted, is_warning) = match cycle {
        c if c <= CYCLE_EXHAUSTED_LIMIT => (true, false),
        c if c < CYCLE_THRESHOLD_LIMIT => (false, true),
        _ => (false, false),
    };
    
    CycleAlert {
        is_exhausted: is_exhausted,
        is_warning: is_warning,
        current_cycle: Nat::from(cycle)
    }
}