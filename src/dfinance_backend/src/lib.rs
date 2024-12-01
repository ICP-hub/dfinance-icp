use api::functions::get_balance;
use api::functions::update_balance;
use candid::encode_args;
use candid::Nat;
use candid::Principal;
use declarations::assets::{
    ExecuteBorrowParams, ExecuteRepayParams, ExecuteSupplyParams, ExecuteWithdrawParams,
};
use declarations::transfer::ApproveResult;
use ic_cdk::{init, query};
use ic_cdk_macros::export_candid;
use ic_cdk_macros::update;
use icrc_ledger_types::icrc1::account::Account;
use protocol::libraries::logic::update::user_data;
use protocol::libraries::logic::update::user_reserve;
use protocol::libraries::logic::user::nat_to_u128;
use protocol::libraries::logic::user::GenericLogic;
use protocol::libraries::math::calculate::calculate_health_factor;
use protocol::libraries::math::calculate::calculate_ltv;
use protocol::libraries::math::calculate::get_exchange_rates;
use protocol::libraries::math::calculate::PriceCache;
use protocol::libraries::math::calculate::UserPosition;
use protocol::libraries::math::math_utils;
use protocol::libraries::math::math_utils::ScalingMath;
use protocol::libraries::types::datatypes::UserReserveData;
use serde::de::value::Error;
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
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::borrow;
use crate::protocol::libraries::logic::supply::SupplyLogic;
use crate::protocol::libraries::types::datatypes::UserData;

#[init]
fn init() {
    // initialize_reserve();
    ic_cdk::println!("function called");
}

// Function to call the execute_supply logic
#[update]
async fn supply(asset: String, amount: u64, is_collateral: bool) -> Result<(), String> {
    ic_cdk::println!("Starting deposit function");
    let params = ExecuteSupplyParams {
        asset,
        amount: amount as u128,
        is_collateral,
    };
    ic_cdk::println!("Parameters for execute_supply: {:?}", params);
    match SupplyLogic::execute_supply(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_supply function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_supply: {:?}", e);
            Err(e)
        }
    }
}

// #[update]
// async fn liquidation_call(
//     asset: String,
//     collateral_asset: String,
//     amount: u64,
//     on_behalf_of: String,
// ) -> Result<(), String> {
//     match LiquidationLogic::execute_liquidation(
//         asset,
//         collateral_asset,
//         amount as u128,
//         on_behalf_of,
//     )
//     .await
//     {
//         Ok(_) => {
//             ic_cdk::println!("execute_liquidation function called successfully");
//             Ok(())
//         }
//         Err(e) => {
//             ic_cdk::println!("Error calling execute_liquidation: {:?}", e);
//             Err(e)
//         }
//     }
// }

// Function to fetch the reserve-data based on the asset
#[query]
fn get_reserve_data(asset: String) -> Result<ReserveData, String> {
    read_state(|state| {
        state
            .asset_index
            .get(&asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", asset.to_string()))
    })
}

// Function to call the execute_borrow logic
#[update]
async fn borrow(asset: String, amount: u64) -> Result<(), String> {
    ic_cdk::println!("Starting borrow function");
    let params = ExecuteBorrowParams {
        asset,
        amount: amount as u128,
    };
    ic_cdk::println!("Parameters for execute_borrow: {:?}", params);

    match borrow::execute_borrow(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_borrow function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_borrow: {:?}", e);
            Err(e)
        }
    }
}

// Function to get the user data based on the principal
#[query]
fn get_user_data(user: String) -> Result<UserData, String> {
    let user_principal = Principal::from_text(user.to_string())
        .map_err(|_| "Invalid user canister ID".to_string())?;

    read_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| {
                format!(
                    "User not found for principal: {}",
                    user_principal.to_string()
                )
            })
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
pub fn get_asset_principal(asset_name: String) -> Result<Principal, String> {
    read_state(|state| match state.reserve_list.get(&asset_name) {
        Some(principal) => Ok(principal),
        None => Err(format!("No principal found for asset: {}", asset_name)),
    })
}

// Get all users
#[query]
fn get_all_users() -> Vec<(Principal, UserData)> {
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
fn check_user(user: String) -> Result<String, String> {
    let user_principal =
        Principal::from_text(&user).map_err(|_| "Invalid user canister ID".to_string())?;

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

// Repays debt of the user
#[update]
async fn repay(asset: String, amount: u128, on_behalf: Option<String>) -> Result<(), String> {
    ic_cdk::println!("Starting repay function");
    let params = ExecuteRepayParams {
        asset,
        amount: amount as u128,
        on_behalf_of: on_behalf,
    };
    ic_cdk::println!("Parameters for execute_repay: {:?}", params);
    match borrow::execute_repay(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_repay function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_repay: {:?}", e);
            Err(e)
        }
    }
}

// Withdraws amount from the collateral/supply
#[update]
pub async fn withdraw(
    asset: String,
    amount: u128,
    on_behalf: Option<String>,
    collateral: bool,
) -> Result<(), String> {
    ic_cdk::println!("Starting withdraw function");
    let params = ExecuteWithdrawParams {
        asset,
        amount: amount as u128,
        on_behalf_of: on_behalf,
        is_collateral: collateral,
    };
    ic_cdk::println!("Parameters for execute_withdraw: {:?}", params);
    match SupplyLogic::execute_withdraw(params).await {
        Ok(_) => {
            ic_cdk::println!("execute_withdraw function called successfully");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Error calling execute_withdraw: {:?}", e);
            Err(e)
        }
    }
}
//TODO: seperate this function in two functions one for liq_index called as user_normalized_supply and another for debt_index called as user_normalized_debt
fn update_user_reserve_state(user_reserve_data: &mut UserReserveData) -> Result<(), String> {
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if user_reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Ok(());
    }

    // Calculate liquidity index update based on supply rate
    if user_reserve_data.supply_rate != 0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            user_reserve_data.supply_rate,
            user_reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "Calculated cumulated liquidity interest: {} based on supply rate: {}",
            cumulated_liquidity_interest,
            user_reserve_data.supply_rate
        );

        user_reserve_data.liquidity_index =
            cumulated_liquidity_interest.scaled_mul(user_reserve_data.liquidity_index);
        ic_cdk::println!(
            "Updated liquidity index: {} for reserve",
            user_reserve_data.liquidity_index
        );
    }

    // Calculate debt index update based on borrow rate
    if user_reserve_data.variable_borrow_index != 0 {
        ic_cdk::println!(
            "prev borrow index & rate {:?} {:?}",
            user_reserve_data.variable_borrow_index,
            user_reserve_data.borrow_rate
        );
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            (user_reserve_data.borrow_rate / 100) as u128,
            user_reserve_data.last_update_timestamp,
            current_time,
        );
        ic_cdk::println!(
            "Calculated cumulated borrow interest: {} based on borrow rate: {}",
            cumulated_borrow_interest,
            user_reserve_data.borrow_rate //take it from reserve of asset
        );

        user_reserve_data.variable_borrow_index =
            cumulated_borrow_interest.scaled_mul(user_reserve_data.variable_borrow_index);
        ic_cdk::println!(
            "Updated variable borrow index: {} for reserve",
            user_reserve_data.variable_borrow_index
        );
    }

    // Update last update timestamp
    user_reserve_data.last_update_timestamp = current_time;
    ic_cdk::println!(
        "Updated last update timestamp for reserve: {}",
        user_reserve_data.last_update_timestamp
    );

    Ok(())
}

#[update]
pub async fn login() -> Result<(), String> {
    let user_principal = ic_cdk::caller();
    let canister_id: Principal = ic_cdk::api::id();

    ic_cdk::println!("User principal: {}", user_principal);

    let mut user_total_collateral: u128 = 0;
    let mut user_total_debt: u128 = 0;
    let mut avg_ltv: u128 = 0;
    // let mut avg_liquidation_threshold: u128 = 0;
    let mut health_factor: u128 = 0;
    // let mut available_borrow: u128 = 0;
    //let mut has_zero_ltv_collateral: bool = false;

    let user_data_result: Result<(u128, u128, u128, u128, u128, u128, bool), String> =
        GenericLogic::calculate_user_account_data().await;

    match user_data_result {
        Ok((
            t_collateral,
            t_debt,
            ltv,
            liquidation_threshold,
            h_factor,
            a_borrow,
            zero_ltv_collateral,
        )) => {
            // Assign the values to the previously declared variables
            user_total_collateral = t_collateral;
            user_total_debt = t_debt;
            avg_ltv = ltv;
            // avg_liquidation_threshold = liquidation_threshold;
            health_factor = h_factor;
            // available_borrow = a_borrow;
            // has_zero_ltv_collateral = zero_ltv_collateral;

            // Use the values
            println!("Total Collateral: {}", user_total_collateral);
            // println!("Total Debt: {}", total_debt);
            println!("Average LTV: {}", avg_ltv);
            // println!(
            //     "Average Liquidation Threshold: {}",
            //     avg_liquidation_threshold
            // );
            println!("Health Factor: {}", health_factor);
            //println!("Available Borrow: {}", available_borrow);
            // println!("Has Zero LTV Collateral: {}", has_zero_ltv_collateral);
        }
        Err(e) => {
            // Handle the error case
            panic!("Error: {}", e);
        }
    }
    ic_cdk::println!("result of calculate user data = {:?}", user_data_result);
    // Fetch user data
    let user_data_result = mutate_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|user| user.0.clone())
            .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
    });

    let mut user_data = match user_data_result {
        Ok(data) => data,
        Err(err) => return Err(err),
    };

    // Ensure reserves exist for the user
    let reserves = user_data
        .reserves
        .as_mut()
        .ok_or_else(|| format!("Reserves not found for user {}", user_principal.to_string()))?;

    let current_timestamp = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp in login: {}", current_timestamp);

    let mut total_collateral = user_total_collateral;
    ic_cdk::println!("Initial total collateral: {}", total_collateral);

    let mut total_debt = user_total_debt;
    ic_cdk::println!("Initial total debt: {}", total_debt);

    for (reserve_name, user_reserve_data) in reserves.iter_mut() {
        ic_cdk::println!("Processing reserve: {}", reserve_name);
        ic_cdk::println!(
            "last timestamp of asset = {}",
            user_reserve_data.last_update_timestamp
        );
        let prev_liq_index = user_reserve_data.liquidity_index.clone();
        let prev_borrow_index = user_reserve_data.variable_borrow_index.clone();
        // get dtoken and debttoken canister from reserve data using asset name

        let reserve_data_result = get_reserve_data(reserve_name.to_string());

        // Handle the result
        let reserve_data = match reserve_data_result {
            Ok(data) => data,
            Err(err) => {
                ic_cdk::println!("Error fetching reserve data: {}", err);
                continue;
            }
        };

        // Retrieve the dtoken and debttoken canisters from the reserve data
        let dtoken_canister = Principal::from_text(reserve_data.d_token_canister.unwrap()).unwrap();
        let debttoken_canister =
            Principal::from_text(reserve_data.debt_token_canister.unwrap()).unwrap();

        ic_cdk::println!("dToken Canister: {}", dtoken_canister);
        ic_cdk::println!("DebtToken Canister: {}", debttoken_canister);

        update_user_reserve_state(user_reserve_data)?;

        let updated_balance = calculate_dynamic_balance(
            user_reserve_data.asset_supply,
            prev_liq_index,
            user_reserve_data.liquidity_index,
        );

        ic_cdk::println!("login updated supply balance = {}", updated_balance);

        // let user_argument = Account {
        //     owner: user_principal,
        //     subaccount: None,
        // };

        // let nat_updated_balance = Nat::from(updated_balance);
        // let encoded_args = encode_args((user_argument, nat_updated_balance)).unwrap();

        ic_cdk::println!("asset supply = {}", user_reserve_data.asset_supply);
        ic_cdk::println!(
            "Updated balance calculated using liquidity index {}: {}",
            user_reserve_data.liquidity_index,
            updated_balance
        );

        if user_reserve_data.asset_supply > 0 && user_reserve_data.is_collateral {
            let added_collateral = updated_balance - user_reserve_data.asset_supply;
            ic_cdk::println!("added collateral =  {}", added_collateral);

            let mut usd_amount: Option<u128> = None;
            let added_collateral_amount_to_usd =
                get_exchange_rates(user_reserve_data.reserve.clone(), None, added_collateral).await;

            ic_cdk::println!(
                "added collateral amount usd = {:?}",
                added_collateral_amount_to_usd
            );

            match added_collateral_amount_to_usd {
                Ok((amount, _timestamp)) => {
                    ic_cdk::println!("amount  = {}", amount);
                    usd_amount = Some(amount);
                }
                Err(err) => {
                    println!("getting error in the conversion {}", err);
                }
            }

            ic_cdk::println!("usd amount = {:?}", usd_amount);
            total_collateral += usd_amount.unwrap();
            ic_cdk::println!(
                "Added to total collateral from reserve {}: {} (New total: {})",
                reserve_name,
                added_collateral,
                total_collateral
            );
        }

        user_reserve_data.asset_supply = updated_balance;
        ic_cdk::println!(
            "Updated asset supply for reserve {}: {}",
            reserve_name,
            user_reserve_data.asset_supply
        );
        //  let nat_updated_balance = Nat::from(updated_balance);
        let d_token_result = update_balance(dtoken_canister, user_principal, updated_balance);
        match d_token_result.await {
            Ok(balance) => {
                ic_cdk::println!("Updated dToken balance successfully: {}", balance);
            }
            Err(err) => {
                ic_cdk::println!("Failed to update dToken balance: {}", err);
            }
        }

        if user_reserve_data.asset_borrow != 0 {
            let borrow_updated_balance = calculate_dynamic_balance(
                user_reserve_data.asset_borrow,
                prev_borrow_index,
                user_reserve_data.variable_borrow_index,
            );
            ic_cdk::println!("asset borrow = {}", user_reserve_data.asset_borrow);
            ic_cdk::println!(
                "Updated borrow balance calculated using liquidity index {}: {}",
                user_reserve_data.variable_borrow_index,
                borrow_updated_balance
            );

            if user_reserve_data.asset_borrow > 0 && user_reserve_data.is_borrowed {
                let added_borrowed = borrow_updated_balance - user_reserve_data.asset_borrow;

                let mut usd_amount: Option<u128> = None;
                match get_exchange_rates(user_reserve_data.reserve.clone(), None, added_borrowed)
                    .await
                {
                    Ok((amount, _timestamp)) => {
                        usd_amount = Some(amount);
                    }
                    Err(err) => {
                        println!("getting error in the conversion {}", err);
                    }
                }

                total_debt += usd_amount.unwrap();
                ic_cdk::println!(
                    "Added to total debt from reserve {}: {} (New total: {})",
                    reserve_name,
                    usd_amount.unwrap(),
                    total_debt
                );
            }

            user_reserve_data.asset_borrow = borrow_updated_balance;
            ic_cdk::println!(
                "Updated asset borrow for reserve {}: {}",
                reserve_name,
                user_reserve_data.asset_borrow
            );
            let debt_token_result =
                update_balance(debttoken_canister, user_principal, borrow_updated_balance);
            match debt_token_result.await {
                Ok(balance) => {
                    ic_cdk::println!("Updated debtToken balance successfully: {}", balance);
                }
                Err(err) => {
                    ic_cdk::println!("Failed to update debtToken balance: {}", err);
                }
            }
        }

        let user_position = UserPosition {
            total_collateral_value: total_collateral,
            total_borrowed_value: user_data.total_debt.unwrap(),
            liquidation_threshold: user_data.liquidation_threshold.unwrap(),
        };

        ic_cdk::println!("login user position = {:?}", user_position);

        if user_reserve_data.asset_supply > 0 || user_reserve_data.asset_borrow > 0 {
            user_data.health_factor = Some(calculate_health_factor(&user_position));
            user_data.ltv = Some(calculate_ltv(&user_position));
            ic_cdk::println!(
                "Updated health factor: {}, Updated LTV: {}",
                user_data.health_factor.unwrap(),
                user_data.ltv.unwrap()
            );
        }
    }
    //before cal health factor

    user_data.total_collateral = Some(total_collateral);
    ic_cdk::println!("Final total collateral: {}", total_collateral);
    user_data.total_debt = Some(total_debt);
    ic_cdk::println!("final total debt: {}", total_debt);

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, declarations::storable::Candid(user_data));
    });
    ic_cdk::println!(
        "User profile updated successfully for user: {}",
        user_principal
    );

    Ok(())
}

#[query]
pub async fn user_position(asset_name: String) -> Result<(u128, u128), String> {
    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {}", user_principal);

    let user_data_result = read_state(|state| {
        state
            .user_profile
            .get(&user_principal)
            .map(|user| user.0.clone())
            .ok_or_else(|| format!("User not found: {}", user_principal.to_string()))
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
        .ok_or_else(|| format!("Reserve not found for asset: {}", asset_name))?;

    let prev_liq_index = user_reserve_data.liquidity_index.clone();
    let prev_borrow_index = user_reserve_data.variable_borrow_index.clone();

    let updated_asset_supply = if user_reserve_data.asset_supply > 0 {
        calculate_dynamic_balance(
            user_reserve_data.asset_supply,
            prev_liq_index,
            user_reserve_data.liquidity_index,
        )
    } else {
        0
    };

    let updated_asset_borrow = if user_reserve_data.asset_borrow > 0 {
        calculate_dynamic_balance(
            user_reserve_data.asset_borrow,
            prev_borrow_index,
            user_reserve_data.variable_borrow_index,
        )
    } else {
        0
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
pub fn get_cached_exchange_rate(base_asset_symbol: String) -> Result<PriceCache, String> {
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
            .ok_or_else(|| format!("price cache not found: {}", base_asset.to_string()))
    });

    // Handling price-cache data result
    match price_cache_result {
        Ok(data) => {
            ic_cdk::println!("price cache found: {:?}", data);
            Ok(data)
        }
        Err(e) => {
            ic_cdk::println!("price cache not found = {:?}", e);
            Err("No cached exchange rate available; please perform an update call.".to_string())
        }
    }
}

fn calculate_dynamic_balance(
    initial_deposit: u128,
    prev_liquidity_index: u128,
    new_liquidity_index: u128,
) -> u128 {
    if prev_liquidity_index == 0 {
        return 0;
    }
    initial_deposit * (new_liquidity_index / prev_liquidity_index)
}

// TODO: need to make a function by getting the asset name and then get user reserve data then call this below function and return the value of it. it will be a query function.
#[query]
pub async fn get_asset_supply(asset_name: String) -> Result<u128, String> {
    ic_cdk::println!("Entering get_asset_supply function");
    
    // Log the asset name being passed
    ic_cdk::println!("Asset name received: {}", asset_name);
    
    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {:?}", user_principal);

    let user_data_result = user_data(user_principal);
    ic_cdk::println!("Fetching user data for principal: {:?}", user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error fetching user data: {}", e);
            return Err("User not found".to_string());
        }
    };

    ic_cdk::println!("Fetching user reserve data for asset: {}", asset_name);
    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            ic_cdk::println!("Error: User reserve data not found for asset: {}", asset_name);
            return Err("User reserve data not found".to_string());
        }
    };

    ic_cdk::println!("Fetching asset reserve data for asset: {}", asset_name);
    let asset_reserve = match get_reserve_data(asset_name.clone()) {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error fetching asset reserve data: {}", e);
            return Err("Error fetching asset reserve data".to_string());
        }
    };

    ic_cdk::println!("Asset reserve data fetched successfully");

    let d_token_canister_principal = match Principal::from_text(asset_reserve.d_token_canister.unwrap()) {
        Ok(principal) => principal,
        Err(e) => {
            ic_cdk::println!("Error parsing DToken canister principal: {}", e);
            return Err("Error parsing DToken canister principal".to_string());
        }
    };

    ic_cdk::println!(
        "DToken canister principal parsed successfully: {:?}",
        d_token_canister_principal
    );

    ic_cdk::println!("Fetching balance from DToken canister for user: {:?}", user_principal);
    let get_balance_value: Nat = get_balance(d_token_canister_principal, user_principal).await;

    ic_cdk::println!(
        "Fetched balance from DToken canister: {:?}",
        get_balance_value
    );

    let nat_convert_value: u128 = match nat_to_u128(get_balance_value) {
        Ok(amount) => {
            ic_cdk::println!("Successfully converted Nat to u128: {}", amount);
            amount
        }
        Err(e) => {
            ic_cdk::println!("Error converting Nat to u128: {}", e);
            return Err("Error converting Nat to u128".to_string());
        }
    };

    ic_cdk::println!("Fetching normalized supply data for user reserve: {:?}", user_reserve_data);
    let (_, user_reserve) = user_reserve_data;

    let normalized_supply_data = match user_normalized_supply(user_reserve.clone()) {
        Ok(data) => {
            ic_cdk::println!("Successfully fetched normalized supply data: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error from the normalized supply function: {}", e);
            return Err("Error from the normalized supply function".to_string());
        }
    };

    ic_cdk::println!(
        "Normalized supply data fetched successfully: {:?}",
        normalized_supply_data
    );

    let result = normalized_supply_data.scaled_mul(nat_convert_value);
    ic_cdk::println!("Final calculated asset supply: {}", result);

    Ok(result)
}

#[query]
pub async fn get_asset_debt(asset_name: String) -> Result<u128, String> {
    let user_principal = ic_cdk::caller();
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {}", e);
            return Err("User not found".to_string());
        }
    };

    let user_reserve_data = match user_reserve(&mut user_data, &asset_name) {
        Some(data) => data,
        None => {
            return Err("User reserve data not found".to_string());
        }
    };

    let asset_reserve = match get_reserve_data(asset_name.clone()) {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error fetching asset reserve data: {}", e);
            return Err("Error fetching asset reserve data".to_string());
        }
    };

    let debt_token_canister_principal =
        match Principal::from_text(asset_reserve.debt_token_canister.unwrap()) {
            Ok(principal) => principal,
            Err(e) => {
                ic_cdk::println!("Error parsing DToken canister principal: {}", e);
                return Err("Error parsing DToken canister principal".to_string());
            }
        };

    ic_cdk::println!(
        "DToken canister principal: {:?}",
        debt_token_canister_principal
    );

    let get_balance_value: Nat = get_balance(debt_token_canister_principal, user_principal).await;

    ic_cdk::println!(
        "Fetched balance from DToken canister: {:?}",
        get_balance_value
    );

    let nat_convert_value: u128 = match nat_to_u128(get_balance_value) {
        Ok(amount) => {
            ic_cdk::println!("User scaled balance: {}", amount);
            amount
        }
        Err(e) => {
            ic_cdk::println!("Error converting Nat to u128: {}", e);
            return Err("Error converting Nat to u128".to_string());
        }
    };

    let (_, user_reserve) = user_reserve_data;

    let normalized_debt_data = match user_normalized_debt(user_reserve.clone()) {
        Ok(data) => data,
        Err(e) => {
            ic_cdk::println!("Error from the normalized supply function: {}", e);
            return Err("Error from the normalized supply function".to_string());
        }
    };

    ic_cdk::println!(
        "Values in normalized supply data = {:?}",
        normalized_debt_data
    );

    Ok(normalized_debt_data.scaled_mul(nat_convert_value))
}

#[query]
pub fn user_normalized_supply(user_reserve_data: UserReserveData) -> Result<u128, String> {
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if user_reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Err("No update needed as timestamps match.".to_string());
    }

    if user_reserve_data.supply_rate != 0 {
        let cumulated_liquidity_interest = math_utils::calculate_linear_interest(
            user_reserve_data.supply_rate,
            user_reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "Calculated cumulated liquidity interest: {} based on supply rate: {}",
            cumulated_liquidity_interest,
            user_reserve_data.supply_rate
        );

        ic_cdk::println!(
            "Updated liquidity index: {} for reserve",
            user_reserve_data.liquidity_index
        );
        //  user_reserve_data.liquidity_index =
        return Ok(cumulated_liquidity_interest.scaled_mul(user_reserve_data.liquidity_index));
    }
    Ok(user_reserve_data.liquidity_index)
}

#[query]
pub fn user_normalized_debt(user_reserve_data: UserReserveData) -> Result<u128, String> {
    let current_time = ic_cdk::api::time() / 1_000_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if user_reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Err("No update needed as timestamps match.".to_string());
    }

    if user_reserve_data.variable_borrow_index != 0 {
        ic_cdk::println!(
            "Previous borrow index & rate: {:?} {:?}",
            user_reserve_data.variable_borrow_index,
            user_reserve_data.borrow_rate
        );
        let cumulated_borrow_interest = math_utils::calculate_compounded_interest(
            (user_reserve_data.borrow_rate / 100) as u128,
            user_reserve_data.last_update_timestamp,
            current_time,
        );
        ic_cdk::println!(
            "Calculated cumulated borrow interest: {} based on borrow rate: {}",
            cumulated_borrow_interest,
            user_reserve_data.borrow_rate //take it from reserve of asset
        );

        ic_cdk::println!(
            "Updated variable borrow index: {} for reserve",
            user_reserve_data.variable_borrow_index
        );
        return Ok(cumulated_borrow_interest.scaled_mul(user_reserve_data.variable_borrow_index));
    }

    Ok(user_reserve_data.variable_borrow_index)
}

// this function is for check which i will remove later.
#[update]
async fn get_user_account_data() -> Result<(u128, u128, u128, u128, u128,u128, bool), String>
{
    let result = GenericLogic::calculate_user_account_data().await;

    result
}

    result
}
export_candid!();

//TODO validation on toggle collateral and faucet

//BUG 1. Total collateral and total debt -> updated according to  price of asset
//2. Available borrow in real time
//3. Burn function repay
// 4. cal of liq_index and borrow index of user
//5. Optimization
//6. accuare_to_treasury for fees
//7. liq_bot -> discuss about node or timer
//8. frontend -> cal h.f , dont show negative apy, remove tofix
