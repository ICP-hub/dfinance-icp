use crate::constants::errors::Error;
use candid::Principal;

use crate::get_controller;

pub fn default() -> Result<Principal, Error> {
    let default_var = match get_controller() {
        Ok(init_args) => init_args.controller_id,
        Err(e) => {
            return Err(e);
        }
    };

    Ok(default_var)
}
