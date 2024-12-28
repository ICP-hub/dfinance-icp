use candid::Principal;
use ic_cdk::caller;
use crate::constants::errors::Error;


/// Check if the caller is not anonymous.
pub fn caller_is_not_anonymous() -> Result<(), Error> {
    if caller() == Principal::anonymous() {
        Err(Error::AnonymousPrincipal)
    } else {
        Ok(())
    }
}

