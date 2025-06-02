use crate::constants::{
    errors::Error,
    validators::{validate_asset_name, validate_zero_value},
    constant_variables::constants::{TOKEN_BALANCE_EXHAUSTED_LIMIT, TOKEN_BALANCE_THRESHOLD_LIMIT}

};
use crate::guards::{
    api_limiter::request_limiter,
    access_control::{guard_admin_only, guard_optional_principal_not_anonymous, guard_principal_not_anonymous, guard_prevent_anonymous},
    locks_handler::CallerGuard
};
use crate::declarations::structs::{ExecuteRepayParams, TokenAlert};
use crate::protocol::{
    logic::borrow::repay,
    libraries::reserve::get_asset_principal
};
use crate::stable_storage::state_handler::{mutate_state, insert_certified_value};
use candid::{Principal, Nat};
use ic_cdk::update;
use crate::api::inter_canister::get_balance;

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
    guard_admin_only()?;

    if canister_name.trim().is_empty() {
        return Err(Error::EmptyAsset);
    }
    guard_principal_not_anonymous(&canister_id)?;

    mutate_state(|state| {
        state.canister_list.insert(canister_name.clone(), canister_id);
    });
    insert_certified_value(canister_name, canister_id);

    Ok(())
}


/*
 * @title Execute Repay
 * @dev Executes the repay function.
 * @param params The parameters for the repay function.
 * @returns Ok or Error.
 * @functionality Executes the repay function with the provided parameters.
 */
#[update]
pub async fn execute_repay(params: ExecuteRepayParams) -> Result<Nat, Error> {
    request_limiter()?;

    guard_optional_principal_not_anonymous(params.on_behalf_of)?;

    //lock the caller principal
    let _guard = CallerGuard::lock_principal(ic_cdk::caller())?;

    // Lock the on_behalf_of principal if `on_behalf_of` is provided
    let _guard2 = if let Some(ref on_behalf) = params.on_behalf_of {
        Some(CallerGuard::lock_principal(on_behalf.clone())?)
    } else {
        None
    };

    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

    let result = repay(params).await;
    result
}

/*
 * @title Token Balance Alert
 * @dev Checks the token balance of the backend canister for a specific asset and returns alert status.
 * @param asset_name The name of the asset to check balance for.
 * @returns Result<TokenAlert, Error> Returns a `TokenAlert` struct indicating whether the token balance is exhausted,
 *          in warning state, or an error if the operation fails.
 * @functionality Queries the balance of the backend canister for the specified asset and evaluates if the
 *                balance has reached predefined exhausted or warning thresholds, returning corresponding alert flags.
 */

#[update]
pub async fn token_balance_alert(asset_name: String) -> Result<TokenAlert, Error>{
    guard_prevent_anonymous()?;
    let asset_principal = get_asset_principal(asset_name.clone())?;
    let balance = get_balance(asset_principal.clone(), ic_cdk::api::id()).await?;
    
    let (is_exhausted, is_warning) = match balance.clone() {
        b if b <= Nat::from(TOKEN_BALANCE_EXHAUSTED_LIMIT) => (true, false),
        b if b < Nat::from(TOKEN_BALANCE_THRESHOLD_LIMIT) => (false, true),
        _ => (false, false),
    };

    Ok(TokenAlert{
        asset_name : asset_name.clone(),
        is_exhausted,
        is_warning,
    })
}