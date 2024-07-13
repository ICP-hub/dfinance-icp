use ic_cdk_macros::export_candid;
mod api;
mod constants;
mod declarations;
mod dynamic_canister;
mod guards;
mod implementations;
mod memory;
mod protocol;
mod state;
mod tests;
mod utils;

use candid::{Nat, Principal};
//export_candid is used to export the canister interface.
export_candid!();
