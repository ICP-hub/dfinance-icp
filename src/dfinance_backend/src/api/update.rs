use crate::constants::errors::Error;
use crate::guards::access_control::guard_admin_only;

use crate::stable_storage::state_handler::mutate_state;
use candid::Principal;
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

    mutate_state(|state| {
        state.canister_list.insert(canister_name.clone(), canister_id);
    });
    insert_certified_value(canister_name, canister_id);

    Ok(())
}

