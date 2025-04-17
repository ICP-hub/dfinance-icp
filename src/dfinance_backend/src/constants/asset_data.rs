use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::storable::Candid;
use crate::declarations::structs::ReserveData;
use crate::dynamic_canister::{create_testtoken_canister, create_token_canister};
use crate::guards::guard_admin_only;
use crate::guards::to_check_controller;
use candid::{Nat, Principal};
use ic_cdk::api::time;
use ic_cdk::update;

/*
 * @title Reserve Initialization
 * @notice Provides functionalities for initializing reserves, modifying reserve configurations,
 *         and verifying controller permissions.
 * @dev This module handles the creation of token canisters, updating reserve parameters,
 *      and ensures only controllers can execute certain operations.
 *
 * # Parameters
 * @param token_name The name of the token to be initialized.
 * @param reserve_data The reserve data structure containing metadata and token-related details.
 *
 * # Returns
 * @return `Ok(())` on success.
 *
 * @functionality Initializes a reserve by creating its associated canisters and storing metadata.
 */
#[update]
pub async fn initialize(token_name: String, mut reserve_data: ReserveData) -> Result<(), Error> {
    // admin only access check
    guard_admin_only()?;

    if read_state(|state| state.reserve_list.contains_key(&token_name)) {
        return Err(Error::TokenAlreadyExist);
    }

    let token_canister_id =
        match create_testtoken_canister(token_name.clone(), token_name.clone()).await {
            Ok(principal) => principal,
            Err(e) => return Err(e),
        };

    let d_token_name = format!("d{}", token_name.clone());
    let debt_token_name = format!("debt{}", token_name.clone());

    reserve_data.asset_name = Some(token_name.clone());
    reserve_data.d_token_canister =
        match create_token_canister(d_token_name.clone(), d_token_name).await {
            Ok(principal) => Some(principal.to_string()),
            Err(e) => return Err(e),
        };
    reserve_data.debt_token_canister =
        match create_token_canister(debt_token_name.clone(), debt_token_name).await {
            Ok(principal) => Some(principal.to_string()),
            Err(e) => return Err(e),
        };

    reserve_data.last_update_timestamp = time();

    mutate_state(|state| {
        state
            .reserve_list
            .insert(token_name.clone(), token_canister_id);
        let reserve_data_e = &mut state.asset_index;

        reserve_data_e.insert(token_name.clone(), Candid(reserve_data));
        ic_cdk::println!("Reserve for {} initialized successfully", token_name);
    });

    Ok(())
}

/*
 * @title Reset Reserve Value
 * @notice Resets a specific variable in the reserve configuration.
 * @dev This function allows only the controller to modify key reserve parameters.
 *
 * # Parameters
 * @param asset_name The name of the asset whose reserve data is to be modified.
 * @param variable_name The specific variable to reset (e.g., "liquidity_index", "ltv").
 * @param reset_value The new value to set for the specified variable.
 *
 * # Returns
 * @return `Ok(())` on success.
 *
 * @functionality Modifies a specific parameter of an existing reserve configuration.
 */
#[update]
pub async fn reset_reserve_value(
    asset_name: String,
    variable_name: String,
    reset_value: Nat,
) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() || !to_check_controller() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let mut reserve_data = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&asset_name)
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })?;

    match variable_name.as_str() {
        "liquidity_index" => reserve_data.liquidity_index = reset_value,
        "ltv" => reserve_data.configuration.ltv = reset_value,
        "liquidation_threshold" => reserve_data.configuration.liquidation_threshold = reset_value,
        "liquidation_bonus" => reserve_data.configuration.liquidation_bonus = reset_value,
        "borrow_cap" => reserve_data.configuration.borrow_cap = reset_value,
        "supply_cap" => reserve_data.configuration.supply_cap = reset_value,
        "reserve_factor" => reserve_data.configuration.reserve_factor = reset_value,
        "liquidation_protocol_fee" => {
            reserve_data.configuration.liquidation_protocol_fee = reset_value
        }
        _ => return Err(Error::InvalidVariableName),
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(asset_name, Candid(reserve_data));
    });
    Ok(())
}
