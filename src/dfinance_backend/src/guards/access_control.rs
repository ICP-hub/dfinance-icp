use crate::{
    constants::errors::Error,
    stable_storage::state_handler::{mutate_state, read_state},
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
    if ic_cdk::caller() == Principal::anonymous() || !to_check_controller() {
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
 *
 * @param name The name of the new admin to be added.
 * @param new_admin The `Principal` of the user to be added as an admin.
 *
 * @returns
 *      - `Ok(())`: If the admin is added successfully.
 *      - `Err(Error::AdminAlreadyExists)`: If the principal is already an admin.
 *
 * @functionality Admin Management - Add Admin
 */
#[update]
pub fn add_admin(name: String, new_admin_id: Principal) -> Result<String, Error> {
    guard_principal_not_anonymous(&new_admin_id)?;
    guard_admin_only()?;

    mutate_state(|state| {
        if state.admin_data.contains_key(&new_admin_id) {
            return Err(Error::AdminAlreadyExists);
        }

        state.admin_data.insert(new_admin_id, name);
        Ok("Admin added successfully".to_string())
    })
}

//TODO: we need to have a flag at the time of deployment of development.
#[update]
pub fn add_admin_test(name: String, new_admin_id: Principal) -> Result<String, Error> {
    ic_cdk::println!("add_admin_test");
    guard_principal_not_anonymous(&new_admin_id)?;
    guard_controller_only()?;

    mutate_state(|state| {
        if state.admin_data.contains_key(&new_admin_id) {
            return Err(Error::AdminAlreadyExists);
        }

        state.admin_data.insert(new_admin_id, name);
        Ok("Admin added successfully".to_string())
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
pub fn remove_admin(admin_to_remove: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&admin_to_remove)?;
    guard_admin_only()?; // Only an admin can remove another admin

    mutate_state(|state| {
        if state.admin_data.remove(&admin_to_remove).is_some() {
            Ok("Remove admin successfully".to_string())
        } else {
            Err(Error::AdminNotFound)
        }
    })
}

/*
 * @title Admin Access Guard
 * @notice Ensures that the caller is an authenticated and authorized admin.
 * @dev Verifies that the caller is not anonymous and exists in the admin data store.
 * @functionality Access control mechanism to restrict certain operations to admin users only.
 *
 * # Parameters
 * - None
 *
 * # Returns
 * - `Ok(())` - If the caller is a valid admin.
 * - `Err(Error)` - If the caller is anonymous or not listed as an admin.
 */
#[query]
pub fn guard_admin_only() -> Result<(), Error> {
    guard_prevent_anonymous()?;
    let principal = caller();

    read_state(|state| {
        if state.admin_data.contains_key(&principal) {
            Ok(())
        } else {
            Err(Error::UnauthorizedAccess)
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
pub fn add_developer(name: String, developer_id: Principal) -> Result<String, Error> {
    guard_principal_not_anonymous(&developer_id)?;
    guard_admin_only()?;

    mutate_state(|state| {
        if state.developer_data.contains_key(&developer_id) {
            return Err(Error::DeveloperAlreadyExists);
        }

        state.developer_data.insert(developer_id, name);
        Ok("Developer added successfully".to_string())
    })
}

/*
 * @title Remove Developer from the Project
 * @dev Removes a developer from the developer map based on their `Principal` ID. Only admins can remove developers.
 *      It checks if the caller is authorized and not anonymous. If the developer exists, they are removed from the state.
 *
 * @param developer_to_remove The `Principal` of the developer to be removed.
 *
 * @returns
 *      - `Ok("Remove developer successfully")`: If the developer is removed successfully.
 *      - `Err(Error::DeveloperNotFound)`: If the developer does not exist.
 *
 * @functionality Developer Role Management - Remove Developer
 */
#[update]
pub fn remove_developer(developer_to_remove: Principal) -> Result<String, Error> {
    guard_prevent_anonymous()?;
    guard_principal_not_anonymous(&developer_to_remove)?;
    guard_admin_only()?; // Only an admin can remove another admin

    mutate_state(|state| {
        if state.developer_data.remove(&developer_to_remove).is_some() {
            Ok("Remove developer successfully".to_string())
        } else {
            Err(Error::DeveloperNotFound)
        }
    })
}

/*
 * @title Developer Access Guard
 * @notice Ensures that the caller is an authenticated and authorized developer.
 * @dev Verifies that the caller is not anonymous and exists in the developer data store.
 * @functionality Access control mechanism to restrict certain operations to developer users only.
 *
 * # Parameters
 * - None
 *
 * # Returns
 * - `Ok(())` - If the caller is a valid developer.
 * - `Err(Error)` - If the caller is anonymous or not listed as a developer.
 */
//TODO: if we dont need it in the frontend then remove macro.
#[query]
pub fn guard_developer_only() -> Result<(), Error> {
    guard_prevent_anonymous()?;
    let principal = caller();

    read_state(|state| {
        if state.developer_data.contains_key(&principal) {
            Ok(())
        } else {
            Err(Error::UnauthorizedAccess)
        }
    })
}
