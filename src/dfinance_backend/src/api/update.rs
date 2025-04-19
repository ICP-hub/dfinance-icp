use crate::constants::errors::Error;
use candid::Nat;
use candid::Principal;
use crate::constants::validators::validate_zero_value;
use crate::guards::access_control::to_check_controller;
use ic_cdk::update;
use crate::stable_storage::state_handler::mutate_state;
use crate::declarations::datatypes::SessionStorageData;
use crate::stable_storage::storable::Candid;


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

    validate_zero_value(&session_start)?;

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