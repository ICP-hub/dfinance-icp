use candid::Principal;
use ic_cdk::caller;
use crate::constants::errors::Error;

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

