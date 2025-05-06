use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::{constants::errors::Error, guards::api_limiter::request_limiter};
use crate::declarations::structs::ExecuteRepayParams;
use crate::guards::access_control::{guard_admin_only, guard_principal_not_anonymous};

use crate::guards::locks_handler::CallerGuard;
use crate::protocol::logic::borrow::repay;
use crate::stable_storage::state_handler::mutate_state;
use candid::{Principal, Nat};
use ic_cdk::update;
use crate::stable_storage::state_handler::insert_certified_value;

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
    // only the admin can access this function.
    guard_admin_only()?;

    // Validate non-empty canister name
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

    if params.on_behalf_of == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }

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