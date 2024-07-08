use candid::Principal;
use ic_cdk::caller;


/// Check if the caller is not anonymous.
pub fn caller_is_not_anonymous() -> Result<(), String> {
    if caller() == Principal::anonymous() {
        Err("Anonymous caller not authorized.".to_string())
    } else {
        Ok(())
    }
}
