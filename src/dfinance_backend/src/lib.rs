pub mod api;
mod memory;
mod types;
mod upgrade;
mod user;
use candid::Principal;
use ic_cdk::{caller, export_candid, post_upgrade, pre_upgrade};
use ic_cdk_macros::{query, update};
use ic_stable_structures::StableBTreeMap;
use memory::Memory;
use serde::{Deserialize, Serialize};
use std::{cell::RefCell, collections::HashMap};
use types::*;

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::new());
}

#[derive(Serialize, Deserialize)]
pub struct State {
    users: HashMap<Principal, User>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
        }
    }
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
