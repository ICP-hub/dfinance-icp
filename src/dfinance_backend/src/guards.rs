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


// Function to store a tester Principal
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


// Function to retrieve testers
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

// Function for checking caller is tester or not
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


