use candid::Principal;
use ic_cdk::{caller, query};
use crate::{api::state_handler::{mutate_state, read_state}, constants::errors::Error, dynamic_canister::InitArgs};

/*
 * @title Caller Identity Validation
 * @dev Ensures that the caller is authenticated and not an anonymous principal.
 *      This function is used to restrict access to authorized users only.
 *
 * @returns `Ok(())` if the caller is authenticated.
 */

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
 */
#[ic_cdk::update]
pub fn add_tester(username: String, principal: Principal)->Result<(), Error> {
    let user_principal = ic_cdk::caller();
    if user_principal == Principal::anonymous()  {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }
    if !to_check_controller(){
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }
    mutate_state(|state| {
        state.tester_list.insert(username, principal)
    });
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
 */
#[ic_cdk::query]
pub fn check_is_tester()-> bool {

    let testers = match get_testers(){
        Ok(data)=>data,
        Err(error) => {
            ic_cdk::println!("Invalid Access {:?}", error);
            return false;
        }
    };
    let user = ic_cdk::caller();
    if testers.contains(&user){
        return true;
    }
    return false;
}