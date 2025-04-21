use crate::api::update;
use crate::declarations::structs::{InitArgs, ReserveData};
use crate::stable_storage::storable::Candid;
use crate::{
    constants::errors::Error,
    stable_storage::state_handler::{mutate_state, read_state},
};
use candid::Principal;
use ic_cdk::{caller, query, update};
use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static DEVELOPERS: RefCell<HashMap<Principal, String>> = RefCell::new(HashMap::new());
    static SUPPORTS: RefCell<HashMap<Principal, String>> = RefCell::new(HashMap::new());
    static AUDITORS: RefCell<HashMap<Principal, String>> = RefCell::new(HashMap::new());
}

// guard to allow only app level controller
pub fn guard_controller_only() -> Result<(), Error> {
    if ic_cdk::caller() == Principal::anonymous() || !to_check_controller() {
        return Err(Error::ErrorNotController);
    } else {
        Ok(())
    }
}

pub fn guard_principal_not_anonymous(principal: &Principal) -> Result<(), Error> {
    if principal == &Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
    }
    Ok(())
}

pub fn guard_validate_reserve_status(reserve: &ReserveData) -> Result<(), Error> {
    if !reserve.configuration.active {
        return Err(Error::ReserveInactive);
    }
    if reserve.configuration.paused {
        return Err(Error::ReservePaused);
    }
    if reserve.configuration.frozen {
        return Err(Error::ReserveFrozen);
    }
    Ok(())
}

pub fn guard_admin_only() -> Result<(), Error> {
    if ic_cdk::caller() == Principal::anonymous() || !ic_cdk::api::is_controller(&ic_cdk::caller())
    {
        return Err(Error::UnauthorizedAccess);
    }

    Ok(())
}

/*
 * @title Caller Identity Validation
 * @dev Ensures that the caller is authenticated and not an anonymous principal.
 *      This function is used to restrict access to authorized users only.
 *
 * @returns `true` if the caller is authenticated.
 * @returns `false` if the caller is not authenticated.
 *
 * @functionality Caller Identity Validation
 */

pub fn guard_prevent_anonymous() -> Result<(), Error> {
    if ic_cdk::caller() == Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
    }
    Ok(())
}

pub fn caller_is_not_anonymous() -> Result<(), Error> {
    if caller() == Principal::anonymous() {
        Err(Error::AnonymousPrincipal)
    } else {
        Ok(())
    }
}

/*
 * @title Check Controller Permissions
 * @notice Checks if the caller is a controller of the canister.
 * @dev This function verifies whether the caller has administrative privileges.
 *
 * # Returns
 * @return `true` if the caller is a controller, otherwise `false`.
 *
 * @functionality Controller Permissions Check
 */
#[query]
pub fn to_check_controller() -> bool {
    ic_cdk::api::is_controller(&ic_cdk::api::caller())
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
 *
 * @functionality Add Tester
 */
#[ic_cdk::update]
pub fn add_tester(username: String, principal: Principal) -> Result<(), Error> {
    let user_principal = ic_cdk::caller();
    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    if !to_check_controller() {
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }
    mutate_state(|state| state.tester_list.insert(username, principal));
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
 *
 * @functionality Get Testers List
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
 *
 * @functionality Check if Caller is Tester
 */

#[ic_cdk::query]
pub fn check_is_tester() -> bool {
    let testers = match get_testers() {
        Ok(data) => data,
        Err(error) => {
            ic_cdk::println!("Invalid Access {:?}", error);
            return false;
        }
    };
    let user = ic_cdk::caller();
    if testers.contains(&user) {
        return true;
    }
    return false;
}

/*
 * @title Add Admin to the Canister
 * @dev This function adds a new admin to the state if they do not already exist. Only existing admins can perform this action.
 *      It prevents anonymous calls, checks if the caller and new admin are not anonymous, and verifies the caller is an admin.
 *      A unique key is assigned to the new admin, and the state is updated.
 *
 * @param new_admin The `Principal` of the user to be added as an admin.
 *
 * @returns
 *      - `Ok(())`: If the admin is added successfully.
 *      - `Err(Error::AdminAlreadyExists)`: If the principal is already an admin.
 *
 * @functionality Admin Management - Add Admin
 */
#[update]
pub fn add_admin(new_admin: Principal) -> Result<(), Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&new_admin)?;
    guard_admin_only()?;

    let caller_principal = ic_cdk::api::caller();
    ic_cdk::println!("Caller: {:?}", caller_principal);

    mutate_state(|state: &mut crate::stable_storage::state::State| {
        if state
            .meta_data
            .iter()
            .any(|(_, value)| value.0.controller_id == new_admin)
        {
            return Err(Error::AdminAlreadyExists);
        }

        // Generate next key for new admin
        let next_key = state
            .meta_data
            .iter()
            .map(|(k, _)| k)
            .max()
            .map(|k| k + 1)
            .unwrap_or(0);

        ic_cdk::println!("Next key for new admin: {:?}", next_key);

        // Add the new admin to the state
        state.meta_data.insert(
            next_key,
            Candid(InitArgs {
                controller_id: new_admin,
            }),
        );

        Ok(())
    })
}

/*
 * @title Remove Admin from the Canister
 * @dev This function removes an admin based on their `Principal` ID. Only existing admins can remove others.
 *      It ensures the caller is authorized and not anonymous. If the admin exists, they are removed from the state.
 *
 * @param admin_to_remove The `Principal` of the admin to be removed.
 *
 * @returns
 *      - `Ok(())`: If the admin is removed successfully.
 *      - `Err(Error::AdminNotFound)`: If the admin does not exist.
 *
 * @functionality Admin Management - Remove Admin
 */
#[update]
pub fn remove_admin(admin_to_remove: Principal) -> Result<(), Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&admin_to_remove)?;
    guard_admin_only()?;

    let caller_principal = ic_cdk::api::caller();
    ic_cdk::println!("Caller: {:?}", caller_principal);

    mutate_state(|state| {
        // Check if the admin exists and find the key
        if let Some(key) = state.meta_data.iter().find_map(|(key, value)| {
            if value.0.controller_id == admin_to_remove {
                Some(key)
            } else {
                None
            }
        }) {
            // Admin found, remove them
            state.meta_data.remove(&key);
            ic_cdk::println!("Admin with key {:?} removed.", key);
            Ok(())
        } else {
            Err(Error::AdminNotFound)
        }
    })
}

/*
 * @title Add Developer to the Project
 * @dev Registers a new developer by storing their name and `Principal` in the developer map. Only admins can add developers.
 *      It prevents adding duplicate entries and ensures proper authentication.
 *
 * @param name A `String` representing the developer's name.
 * @param principal The `Principal` ID of the developer.
 *
 * @returns
 *      - `Ok("Developer added successfully")`: If the developer is added.
 *      - `Err(Error::DeveloperAlreadyExists)`: If the principal is already a developer.
 *
 * @functionality Developer Role Management - Add Developer
 */
//TODO: ask do i need to have a guard for name as well.
#[update]
pub fn add_developer(name: String, principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    DEVELOPERS.with(|devs| {
        let mut map = devs.borrow_mut();
        if map.contains_key(&principal) {
            return Err(Error::DeveloperAlreadyExists);
        }
        map.insert(principal, name);
        Ok("Developer added successfully".to_string())
    })
}

/*
 * @title Add Support Member
 * @dev Adds a new support member by storing their name and `Principal` in the support map. Only admins are allowed to add.
 *      It validates uniqueness and identity before insertion.
 *
 * @param name A `String` representing the support member’s name.
 * @param principal The `Principal` of the support member.
 *
 * @returns
 *      - `Ok("Support added successfully")`: If the member is added successfully.
 *      - `Err(Error::SupportAlreadyExists)`: If the principal is already in the support map.
 *
 * @functionality Support Role Management - Add Support
 */
#[update]
pub fn add_support(name: String, principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    SUPPORTS.with(|supp| {
        let mut map = supp.borrow_mut();
        if map.contains_key(&principal) {
            return Err(Error::SupportAlreadyExists);
        }
        map.insert(principal, name);
        Ok("Support added successfully".to_string())
    })
}

/*
 * @title Add Auditor to the System
 * @dev This function registers a new auditor with a name and `Principal` ID. Only admins are authorized to use this function.
 *      Duplicate auditor entries are prevented, and access is validated.
 *
 * @param name A `String` with the auditor’s name.
 * @param principal The `Principal` of the auditor.
 *
 * @returns
 *      - `Ok("Auditor added successfully")`: If the auditor is successfully added.
 *      - `Err(Error::AuditorAlreadyExists)`: If the principal is already registered as an auditor.
 *
 * @functionality Auditor Role Management - Add Auditor
 */
#[update]
pub fn add_auditor(name: String, principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    AUDITORS.with(|aud| {
        let mut map = aud.borrow_mut();
        if map.contains_key(&principal) {
            return Err(Error::AuditorAlreadyExists);
        }
        map.insert(principal, name);
        Ok("Auditor added successfully".to_string())
    })
}

/*
 * @title Check if Caller is a Developer
 * @dev Verifies whether the caller is listed as a developer in the state.
 *      This function is useful for access control and feature gating.
 *
 * @returns
 *      - `Ok(true)`: If the caller is a developer.
 *      - `Ok(false)`: If the caller is not a developer.
 *
 * @functionality Role Validation - Developer
 */
#[query]
pub fn is_developer() -> Result<bool, Error> {
    guard_prevent_anonymous()?;
    let principal = caller();
    DEVELOPERS.with(|devs| Ok(devs.borrow().contains_key(&principal)))
}

/*
 * @title Check if Caller is a Support Member
 * @dev Checks whether the calling user is registered as a support member in the support map.
 *      Used to authorize support-level access.
 *
 * @returns
 *      - `Ok(true)`: If the caller is a support member.
 *      - `Ok(false)`: If the caller is not in the support role.
 *
 * @functionality Role Validation - Support
 */

#[query]
pub fn is_support() -> Result<bool, Error> {
    guard_prevent_anonymous()?;
    let principal = caller();
    SUPPORTS.with(|supp| Ok(supp.borrow().contains_key(&principal)))
}

/*
 * @title Check if Caller is an Auditor
 * @dev Determines if the caller is listed as an auditor. Ensures the caller is authenticated and prevents anonymous access.
 *
 * @returns
 *      - `Ok(true)`: If the caller is an auditor.
 *      - `Ok(false)`: If the caller is not listed as an auditor.
 *
 * @functionality Role Validation - Auditor
 */

#[query]
pub fn is_auditor() -> Result<bool, Error> {
    guard_prevent_anonymous()?;
    let principal = caller();
    AUDITORS.with(|aud| Ok(aud.borrow().contains_key(&principal)))
}

/*
 * @title Remove Developer from the Registry
 * @dev This function removes a developer from the state map using their `Principal` ID. Only admins can perform this operation.
 *
 * @param principal The `Principal` of the developer to remove.
 *
 * @returns
 *      - `Ok("Developer removed successfully")`: If the developer is removed.
 *      - `Err(Error::DeveloperNotFound)`: If the developer does not exist.
 *
 * @functionality Developer Role Management - Remove Developer
 */

#[update]
pub fn remove_developer(principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    DEVELOPERS.with(|devs| {
        let mut map = devs.borrow_mut();
        if map.remove(&principal).is_some() {
            Ok("Developer removed successfully".to_string())
        } else {
            Err(Error::DeveloperNotFound)
        }
    })
}

/*
 * @title Remove Support Member
 * @dev Removes a support user from the system by their `Principal`. The function ensures proper authorization before modification.
 *
 * @param principal The `Principal` of the support member.
 *
 * @returns
 *      - `Ok("Support removed successfully")`: If removal is successful.
 *      - `Err(Error::SupportNotFound)`: If the support user does not exist.
 *
 * @functionality Support Role Management - Remove Support
 */

#[update]
pub fn remove_support(principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    SUPPORTS.with(|supp| {
        let mut map = supp.borrow_mut();
        if map.remove(&principal).is_some() {
            Ok("Support removed successfully".to_string())
        } else {
            Err(Error::SupportNotFound)
        }
    })
}

/*
 * @title Remove Auditor
 * @dev Deletes an auditor from the state using their `Principal` ID. This action is restricted to admin users.
 *
 * @param principal The `Principal` of the auditor.
 *
 * @returns
 *      - `Ok("Auditor removed successfully")`: If the auditor is removed.
 *      - `Err(Error::AuditorNotFound)`: If no auditor was found for the given principal.
 *
 * @functionality Auditor Role Management - Remove Auditor
 */

#[update]
pub fn remove_auditor(principal: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;

    AUDITORS.with(|aud| {
        let mut map = aud.borrow_mut();
        if map.remove(&principal).is_some() {
            Ok("Auditor removed successfully".to_string())
        } else {
            Err(Error::AuditorNotFound)
        }
    })
}
