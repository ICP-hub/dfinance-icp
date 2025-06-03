use crate::{
    constants::{constant_variables::constants::ADMIN, errors::Error},
    stable_storage::{
        state_handler::{mutate_state, read_state},
        storable::Candid,
    },
};
use candid::Principal;
use ic_cdk::{caller, query, update};

/*
 * @title Guard Controller Only
 * @dev Ensures that the caller is a controller of the canister.
 *      This function is used to restrict access to authorized users only.
 *
 * @returns `Ok(())` if the caller is a controller, otherwise an error.
 *
 * @functionality Controller Permissions Check
 */
pub fn guard_controller_only() -> Result<(), Error> {
    let is_controller = to_check_controller();
    if ic_cdk::caller() == Principal::anonymous() || !is_controller {
        return Err(Error::ErrorNotController);
    } else {
        Ok(())
    }
}

/*
 * @title Guard Principal Not Anonymous
 * @dev Ensures that the principal is not anonymous.
 *      This function is used to restrict access to authorized users only.
 *
 * @param principal The principal to check.
 *
 * @returns `Ok(())` if the principal is not anonymous, otherwise an error.
 *
 * @functionality Principal Check
 */
pub fn guard_principal_not_anonymous(principal: &Principal) -> Result<(), Error> {
    if principal == &Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
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

/*
 * @title Guard Optional Principal Not Anonymous
 * @dev Ensures that the provided principal is not anonymous.
 *      This function is used to restrict access to authorized users only.
 *
 * @param on_behalf The optional principal to check.
 *
 * @returns `Ok(())` if the principal is not anonymous, otherwise an error.
 *
 * @functionality Optional Principal Check
 */
pub fn guard_optional_principal_not_anonymous(on_behalf: Option<Principal>) -> Result<(), Error> {
    if on_behalf == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }
    Ok(())
}

/*
 * @title Check Controller Permissions
 * @notice Checks if the caller is a controller of the canister.
 * @dev This function verifies whether the caller has administrative privileges.
 *
 * @return `true` if the caller is a controller, otherwise `false`.
 *
 * @functionality Controller Permissions Check
 */
#[query]
pub fn to_check_controller() -> bool {
    let res = ic_cdk::api::is_controller(&ic_cdk::api::caller());
    res
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
#[cfg(feature = "testnet")]
#[ic_cdk::update]
pub fn add_tester(username: String, principal: Principal) -> Result<(), Error> {
    guard_principal_not_anonymous(&principal)?;
    guard_admin_only()?;
    
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
#[cfg(feature = "testnet")]
pub fn get_testers() -> Result<Vec<Principal>, Error> {
    guard_prevent_anonymous()?;

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
#[cfg(feature = "testnet")]
#[ic_cdk::query]
pub fn check_is_tester() -> bool {
    let testers = match get_testers() {
        Ok(data) => data,
        Err(_) => {
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
 * @title Add User with Role
 * @dev This function adds a new user with a specified role to the access control list. It checks if the caller
 *      is an admin and if the user ID is not anonymous. If both conditions are met, it adds the user and their
 *      role to the state.
 *
 * @param user_id The `Principal` ID of the user to be added.
 * @param role The role to be assigned to the user.
 *
 * @returns
 *      - `Ok(())`: If the user was successfully added.
 *      - `Err(Error::AnonymousPrincipal)`: If the user ID is anonymous.
 *      - `Err(Error::InvalidRole)`: If the role is invalid or empty.
 *      - `Err(Error::RoleAlreadyExistsForUser)`: If the role already exists for the user.
 *
 * @functionality Add User with Role
 */
#[update]
pub fn add_user_with_role(user_id: Principal, role: String) -> Result<String, Error> {
    guard_principal_not_anonymous(&user_id)?;
    guard_admin_only()?;

    if role.trim().is_empty() {
        return Err(Error::InvalidRole);
    }

    mutate_state(|state| {
        let mut roles = match state.access_control.get(&user_id) {
            Some(Candid(existing)) => existing.clone(),
            None => Vec::new(),
        };

        if roles.contains(&role) {
            return Err(Error::RoleAlreadyExistsForUser);
        }

        roles.push(role);

        state.access_control.insert(user_id, Candid(roles));
        Ok("Role added successfully.".to_string())
    })
}

/*
 * @title Add Admin to the Canister (For Testing Purpose - Pocket IC)
 * @dev This function adds a new admin to the state if they do not already exist. Only existing admins can perform this action.
 *      It prevents anonymous calls, checks if the caller and new admin are not anonymous, and verifies the caller is an admin.
 *
 * @param role The role of the new admin to be added.
 * @param new_admin_id The `Principal` of the user to be added as an admin.
 *
 * @returns
 *      - `Ok(())`: If the admin is added successfully.
 *      - `Err(Error::AdminAlreadyExists)`: If the principal is already an admin.
 *
 * @functionality Admin Management - Add Admin
 */
#[update]
#[cfg(feature = "testnet")]
pub fn add_admin_test(role: String, new_admin_id: Principal) -> Result<String, Error> {
    guard_principal_not_anonymous(&new_admin_id)?;
    guard_controller_only()?;

    if role.trim().is_empty() {
        return Err(Error::InvalidRole);
    }

    mutate_state(|state| {
        let mut roles = match state.access_control.get(&new_admin_id) {
            Some(Candid(existing_roles)) => existing_roles.clone(),
            None => Vec::new(),
        };

        if roles.contains(&role) {
            return Err(Error::AdminAlreadyExists);
        }

        roles.push(role);
        state.access_control.insert(new_admin_id, Candid(roles));
        Ok("Admin added successfully".to_string())
    })
}


/*
 * @title Remove User Role
 * @dev This function removes a role from a user. It checks if the caller is an admin and if the user ID is not anonymous.
 *      If both conditions are met, it removes the specified role from the user's roles list in the state.
 *
 * @param user_id The `Principal` ID of the user whose role is to be removed.
 * @param role The role to be removed from the user.
 *
 * @returns
 *      - `Ok(())`: If the role was successfully removed.
 *      - `Err(Error::AnonymousPrincipal)`: If the user ID is anonymous.
 *      - `Err(Error::UserRoleNotFound)`: If the role was not found for the user.
 *
 * @functionality Remove User Role
 */
#[update]
pub fn remove_user_role(user_id: Principal, role: String) -> Result<String, Error> {
    guard_admin_only()?;
    guard_principal_not_anonymous(&user_id)?;

    mutate_state(|state| {
        let mut roles = match state.access_control.get(&user_id) {
            Some(Candid(existing)) => existing.clone(),
            None => return Err(Error::UserNotFound),
        };

        if !roles.contains(&role) {
            return Err(Error::UserRoleNotFound);
        }

        roles.retain(|r| r != &role);

        if roles.is_empty() {
            // If no roles left, remove the user entry completely
             state.access_control.remove(&user_id);
             Ok("Role removed, user entry deleted.".to_string())
        } else {
            // Otherwise, update the roles list
             state.access_control.insert(user_id, Candid(roles));
             Ok("Role removed successfully.".to_string())
        }
    })
}


/*
 * @title Guard Admin Only
 * @dev This function checks if the caller is an admin. It ensures that the caller is not anonymous and
 *      verifies their role in the access control list. If the caller is an admin, it returns `Ok(())`,
 *      otherwise it returns an error.
 *
 * @returns
 *      - `Ok(())`: If the caller is an admin.
 *      - `Err(Error::UnauthorizedAccess)`: If the caller is not an admin or is anonymous.
 *
 * @functionality Admin Access Control
 */
#[query]
pub fn guard_admin_only() -> Result<(), Error> {
    guard_prevent_anonymous()?;
    let principal = caller();

    read_state(|state| {
        match state.access_control.get(&principal) {
            Some(Candid(roles)) if roles.contains(&ADMIN.to_string()) => Ok(()),
            _ => Err(Error::UnauthorizedAccess),
        }
    })
}

/*
 * @title Get All Users with Roles
 * @dev This function retrieves all users and their associated roles from the access control list.
 *      It checks if the caller is an admin before proceeding to fetch the data.
 *
 * @returns
 *      - `Ok(Vec<(Principal, Vec<String>)>)`: A vector of tuples containing user principals and their roles.
 *      - `Err(Error::UnauthorizedAccess)`: If the caller is not an admin.
 *
 * @functionality Get All Users with Roles
 */
#[query]
pub fn get_all_users_with_roles() -> Result<Vec<(Principal, Vec<String>)>, Error> {
    guard_admin_only()?; 

    read_state(|state| {
        let mut result = Vec::new();

        for (principal, Candid(roles)) in state.access_control.iter() {
            result.push((principal, roles.clone()));
        }

        Ok(result)
    })
}

/*
 * @title Check if Caller is Authorized for Asset
 * @dev This function checks if the caller is authorized to access a specific asset.
 *      It retrieves the list of authorized callers for the asset from the state and compares
 *      it with the caller's principal ID.
 *
 * @param asset The asset for which authorization is being checked.
 *
 * @returns
 *      - `true`: If the caller is authorized for the asset.
 *      - `false`: If the caller is not authorized for the asset or if the asset does not exist.
 *
 * @functionality Asset Authorization Check
 */
pub fn is_caller_authorized_for_asset(asset: &String) -> bool {

    let caller = ic_cdk::api::caller();
    read_state(|state| {
        state
            .canister_list
            .get(asset)
            .map(|authorized_caller| authorized_caller == caller)
            .unwrap_or(false)
    })
}

