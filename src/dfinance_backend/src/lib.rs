pub mod api;
pub mod math;
mod memory;
mod state_handler;
mod types;
mod upgrade;
mod user;
use candid::Principal;
use ic_cdk::{caller, export_candid, post_upgrade, pre_upgrade};
use ic_cdk_macros::{query, update};
use ic_stable_structures::StableBTreeMap;
use math::lending_borrowing::*;
use memory::Memory;
use serde::{Deserialize, Serialize};
use state_handler::State;
use std::cell::RefCell;
use types::*;

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::new());
}

pub fn with_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}

// PreUpgrade and PostUpgrade for stable memory
#[pre_upgrade]
fn pre_upgrade() {
    upgrade::pre_upgrade();
}

#[post_upgrade]
fn post_upgrade() {
    upgrade::post_upgrade();
}

export_candid!();
