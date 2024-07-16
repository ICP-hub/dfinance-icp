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
use crate::declarations::assets::ReserveData;
use crate::implementations::reserve::initialize_reserve;
use candid::{Nat, Principal};
use ic_cdk::init;
//export_candid is used to export the canister interface.

#[init]
fn init() {
    initialize_reserve();
    ic_cdk::println!("function called");
}
export_candid!();
