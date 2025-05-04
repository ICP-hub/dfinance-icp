use crate::constants::constant_variables::constants::MAIN_CONTROLLER;
use crate::debug;
use crate::declarations::datatypes::AssetInfo;
use crate::declarations::datatypes::FaucetReserves;
use crate::declarations::datatypes::InitArgs;
use crate::declarations::datatypes::ReserveData;
use crate::constants::errors::Error;
use crate::error;
use crate::guards::access_control::guard_admin_only;
use crate::guards::access_control::guard_prevent_anonymous;
use crate::guards::access_control::guard_principal_not_anonymous;
use crate::info;
use crate::protocol::utils::math_utils::current_timestamp;
use crate::trace;
use super::inter_canister::get_balance;
use crate::constants::data_types::zero_nat_value;
use crate::constants::interest_variables::constants::TOKEN_TRANSFER_FEE;
use crate::constants::validators::validate_asset_name;
use crate::declarations::datatypes::{PriceCache, UserData};
use crate::declarations::structs::AssetData;
use ic_cdk::query;
use crate::protocol::libraries::update::user_data;
use crate::protocol::libraries::update::user_reserve;
use crate::protocol::libraries::user::calculate_user_asset_data;
use crate::protocol::utils::math_utils;
use crate::protocol::utils::math_utils::ScalingMath;
use crate::stable_storage::state_handler::read_state;
use crate::stable_storage::storable::Candid;
use candid::Nat;
use candid::Principal;
use ic_cdk::api;
use crate::protocol::utils::log::{log_internal, LogLevel};  
use crate::stable_storage::state_handler::get_certificate_witness;
use crate::declarations::datatypes::Certificate;

/*
 * @title Get Reserve Data
 * @dev Fetches the reserve data for a specific asset.
 * @param asset The asset name.
 * @returns The reserve data if found.
 *  @functionality Retrieve Reserve Data for a Specified Asset
 */

 pub fn get_reserve_data(asset: String) -> Result<ReserveData, Error> {
    read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })
}

#[query]
pub fn get_reserve_data_certified(asset: String) -> Result<(ReserveData,Certificate), Error> {
    validate_asset_name(&asset.clone())?;
    let reserved_data = get_reserve_data(asset.clone())?;
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
    let certificate = get_certificate_witness(user.to_string());
    return Ok((user_data, certificate));
}

/*
 * @title Get User Faucet Data
 * @dev Retrieves the faucet data for a given user.
 * @param user The principal of the user.
 * @returns The faucet reserves if found.
 *
 * @functionality Retrieve User Faucet Data for a Specified Principal
 */
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

    let certificate = get_certificate_witness(user.to_string());
    return Ok((user_faucet_data, certificate));
}


/*
 * @title Get All Assets
 * @dev Retrieves a list of all asset names available in the reserve.
 * @returns A vector containing asset names.
 *
 * @functionality Retrieve a List of All Available Assets in the Reserve
 */
// #[query]
// pub fn get_all_assets() -> Vec<AssetInfo> {
//     read_state(|state| {
//         state.asset_records
//              .iter()
//              .map(|(_, asset)| asset.0.clone()) // .0 to unwrap Candid<AssetInfo>
//              .collect()
//      })
   
// }
#[query]
pub fn get_all_assets_certified() -> (Vec<AssetInfo>, Certificate) {
    read_state(|state| {
        let assets: Vec<AssetInfo> = state.asset_records
            .iter()
            .map(|(_, asset)| asset.0.clone())
            .collect();

        // Generate the certificate from the certified map
        let cert = get_certificate_witness("all_assets".to_string());

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
    // asset name validator
    validate_asset_name(&asset_name)?;

    let asset_principal = read_state(|state| {state.reserve_list.get(&asset_name).ok_or_else(|| Error::NotFoundAssetPrincipal)})?;
    let cert = get_certificate_witness("asset_principal".to_string());
    Ok((asset_principal, cert))
}


pub fn get_asset_principal(asset_name: String) -> Result<(Principal), Error> {
    // asset name validator
    validate_asset_name(&asset_name)?;

    let asset_principal = read_state(|state| {state.reserve_list.get(&asset_name).ok_or_else(|| Error::NotFoundAssetPrincipal)})?;
    
    Ok((asset_principal))
}
/*
 * @title Get All Users
 * @dev Retrieves a list of all registered users along with their data.
 * @returns A vector of tuples containing user principals and their data.
 * @functionality This function returns a list of all registered users and their respective data.
 */
#[query]  
pub async fn get_all_users() -> (Vec<(Principal, UserData)>) {
    let res =read_state(|state| {
        state
            .user_profile
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    }); 
    
    res
}
#[query]
pub async fn get_all_users_certified() -> (Vec<(Principal, UserData)>, Certificate) {
    let res =read_state(|state| {
        state
            .user_profile
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    }); 
    let cert = get_certificate_witness("all_users".to_string());

    (res, cert)
}
/*
 * @title Get All Faucet
 * @dev Retrieves a list of all users with their faucet reserves.
 * @returns A vector of tuples containing user principals and their faucet reserves.
 * @functionality This function returns a list of all users and their respective faucet reserves.
 */
pub async fn get_all_faucet() -> (Vec<(Principal, FaucetReserves)>, Certificate) {
    let res = read_state(|state| {
        state
            .faucet_data
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });
    let cer = get_certificate_witness("all_faucet".to_string());
    (res, cer)

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
    let cert = get_certificate_witness("price_cache".to_string());
    
    Ok((res, cert)) 
}



pub fn get_cached_exchange_rate(base_asset_symbol: String) -> Result<Nat, Error> {
    trace!("calling get_cached_exchange_rate");
    // asset validator
    validate_asset_name(&base_asset_symbol)?;
    
    let base_asset = match base_asset_symbol.as_str() {
        "ckBTC" => "btc",
        "ckETH" => "eth",
        "ckUSDC" => "usdc",
        "ckUSDT" => "usdt",
        _ => base_asset_symbol.as_str(),
    };

    debug!("base asset and base_asset_symbol {}, {}", base_asset , base_asset_symbol);
    
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
 * @title User Normalized Supply
 * @dev Calculates the normalized supply of a user for a given reserve.
 * @param reserve_data The reserve data containing liquidity index and rate.
 * @returns The normalized supply as `Nat`.
 * @functionality This function computes the normalized supply of a user based on the reserve's liquidity rate and index, adjusting for interest accumulation.
 */
#[query]
pub fn user_normalized_supply_certified(reserve_data: ReserveData) -> Result<(Nat, Certificate), Error> {
    let cert = get_certificate_witness("user_normalized_supply".to_string());
    let res = user_normalized_supply(reserve_data.clone())?;
    Ok((res, cert))
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
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
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

/*
 * @title User Normalized Debt
 * @dev Computes the normalized debt of a user for a given reserve.
 * @param reserve_data The reserve data containing debt index and borrow rate.
 * @returns The normalized debt as `Nat`.
 * @functionality This function calculates the normalized debt of a user based on the reserve's debt index and borrow rate, adjusting for interest over time.
 */
#[query]
pub fn user_normalized_debt_certified(reserve_data: ReserveData) -> Result<(Nat, Certificate), Error> {
    let cert = get_certificate_witness("user_normalized_debt".to_string());
    let res = user_normalized_debt(reserve_data.clone())?;
    Ok((res, cert))
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
            reserve_data.debt_index,
            reserve_data.borrow_rate
        );
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
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
 * @title Get Total Users
 * @dev Retrieves the total number of registered users.
 * @returns The total user count as `usize`.
 * @functionality This function returns the total number of users that are currently registered in the system.
 */
#[query] 
pub fn get_total_users() -> (usize, Certificate) {
    let res =read_state(|state| state.user_profile.len().try_into().unwrap());
    
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

    let result = calculate_user_asset_data(on_behalf, dtoken_balance, debt_token_balance).await?;
    let cert = get_certificate_witness("user_account_data".to_string());
    info!("calculated user asset data called successfully inide get user account data");
    debug!("get_user_account_data result: {:?}", result);
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
    let cert = get_certificate_witness("transfer_fee".to_string());

    let asset_price = match get_cached_exchange_rate(asset_name.clone()) {
        Ok(price) => price,
        Err(e) => {
            error!("Failed to fetch cache exchange rate");
            return Err(e);
        }
    };

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
    read_state(|state| {
        state
            .canister_list
            .get(&canister_name)
            .ok_or(Error::NoCanisterIdFound) // Return error if not found
    })
    
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
//Controller for creating dynamic dtoken and debt token canisters
//TODO: change its file location
pub fn get_controller() -> Result<InitArgs, Error> {
    read_state(|state| {
        state
            .meta_data
            .get(&MAIN_CONTROLLER.to_string()) // use the appropriate string key
            .map(|candid_val| candid_val.0.clone()) // extract InitArgs from Candid wrapper
            .ok_or(Error::ControllerNotFound)
    })
    .map_err(|_| Error::ErrorNotController)
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
 * @title Get Asset Supply
 * @dev Fetches the total asset supply for a given asset.
 * @param asset_name The asset name.
 * @param on_behalf (Optional) The principal requesting the asset supply.
 * @returns The total asset supply as `Nat`.
 * @functionality This function fetches the total supply of a given asset and handles calculations related to user reserves and balance.
 */
//TODO i had commented out this code logic as it was not being called, we will check its usecase later
//response (jyotirmay): i think we can check this function when we will be dealing with the logic it can happen that we need it somehow.
// pub async fn get_asset_supply(
//     asset_name: String,
//     on_behalf: Option<Principal>,
// ) -> Result<Nat, Error> {
//     guard_prevent_anonymous()?;
//     validate_asset_name(&asset_name)?;

//     if on_behalf == Some(Principal::anonymous()) {
//         return Err(Error::AnonymousPrincipal);
//     }

//     let user_principal = match on_behalf {
//         Some(principal_str) => principal_str,
//         None => ic_cdk::caller(),
//     };
//     debug!("User principal: {:?}", user_principal.to_string());

//     let user_data_result = user_data(user_principal);

//     let mut user_data = match user_data_result {
//         Ok(data) => data,
//         Err(e) => {
//             debug!("Error fetching user data: {:?}", e);
//             return Err(e);
//         }
//     };

//     debug!("Fetching user reserve data for asset: {}", asset_name);
//     let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
//         Some(data) => data,
//         None => {
//             debug!(
//                 "Error: User reserve data not found for asset while get asset supply returing 0: {}",
//                 asset_name
//             );
//             return Ok(zero_nat_value());
//         }
//     };

//     let asset_reserve = match get_reserve_data(asset_name.clone()) {
//         Ok(data) => data,
//         Err(e) => {
//             debug!("Error fetching asset reserve data: {:?}", e);
//             return Err(e);
//         }
//     };

//     debug!("Asset reserve data fetched successfully");

    // let d_token_canister_principal = match asset_reserve.d_token_canister.clone() {
    //     Some(principal) => principal,
    //     None => {
    //         return Err(Error::ErrorParsingPrincipal);
    //     }
    // };

//     let balance_result = get_balance(d_token_canister_principal, user_principal).await;
//     let get_balance_value = match balance_result {
//         Ok(bal) => bal,
//         Err(e) => {
//             return Err(e);
//         }
//     };

//     debug!(
//         "Fetched balance from DToken canister: {:?}",
//         get_balance_value
//     );

//     if get_balance_value == zero_nat_value() {
//         debug!("balance 0, returnin....");
//         return Ok(zero_nat_value());
//     }

//     let (_, user_reserve) = user_reserve_data;

//     let normalized_supply_data = match user_normalized_supply(asset_reserve) {
//         Ok(data) => {
//             debug!("Successfully fetched normalized supply data: {:?}", data);
//             data
//         }
//         Err(e) => {
//             debug!("Error from the normalized supply function: {:?}", e);
//             return Err(e);
//         }
//     };
//     debug!(
//         "result in asset supply {} {} {}",
//         normalized_supply_data,
//         user_reserve.liquidity_index,
//         get_balance_value
//     );
//     let result = (normalized_supply_data
//         .clone()
//         .scaled_div(user_reserve.liquidity_index.clone()))
//     .scaled_mul(get_balance_value.clone());
//     debug!("Final calculated asset supply: {}", result);

//     Ok(result)
// }

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
    // input validator
    // validate_asset_name(&asset_name)?;

    if let Some(principal) = on_behalf {
        // Check if the user is anonymous
        guard_principal_not_anonymous(&principal)?;
        // if principal == Principal::anonymous() {
        //     ic_cdk::println!("Anonymous principals are not allowed");
        //     return Err(Error::AnonymousPrincipal);
        // }
    }
    let user_principal = match on_behalf {
        Some(principal_str) => principal_str,
        None => ic_cdk::caller(),
    };

    guard_principal_not_anonymous(&user_principal)?;

    // if user_principal == Principal::anonymous() {
    //     ic_cdk::println!("Anonymous principals are not allowed");
    //     return Err(Error::AnonymousPrincipal);
    // }

    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => data,
        Err(e) => {
            error!("Error: {:?}", e);
            return Err(e);
        }
    };
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

    let asset_reserve = match get_reserve_data(asset_name.clone()) {
        Ok(data) => data,
        Err(e) => {
            error!("Error fetching asset reserve data: {:?}", e);
            return Err(e);
        }
    };

    let debt_token_canister_principal = match asset_reserve.debt_token_canister.clone() {
        Some(principal) => principal,
        None => {
            error!("Error: parsing principal");
            return Err(Error::ErrorParsingPrincipal);
        }
    };

    let balance_result = get_balance(debt_token_canister_principal, user_principal).await;
    let get_balance_value = match balance_result {
        Ok(bal) => bal,
        Err(e) => {
            error!("Error fetching balance from DebtToken canister: {:?}", e);
            return Err(e);
        }
    };

    debug!(
        "Fetched balance from DebtToken canister: {:?}",
        get_balance_value
    );

    let normalized_debt_data = match user_normalized_debt(asset_reserve.clone()) {
        Ok(data) => data,
        Err(e) => {
            error!("Error fetching normalized debt data: {:?}", e);
            return Err(e);
        }
    };

    debug!(
        "Values in normalized debt data = {:?}",
        normalized_debt_data
    );

    Ok(
        (normalized_debt_data.scaled_div(user_reserve.variable_borrow_index.clone()))
            .scaled_mul(get_balance_value),
    )
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
    // only the admin can access this function.
    guard_admin_only()?;
    let cert = get_certificate_witness("cycle_checker".to_string());
    Ok((Nat::from(api::canister_balance128()), cert))
}

//TODO: assigned to vicky isme saare query function toh nhi h kuch internal functions bhi pade hai
