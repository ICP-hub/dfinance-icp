pub mod api;
pub mod math;
mod memory;
mod state_handler;
mod types;
mod constants;
mod upgrade;
mod user;
mod liq_provider_info;

use state_handler::State;
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, export_candid, init, post_upgrade, pre_upgrade};
// use ic_cdk_macros::{query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use ic_cdk::api::call::CallResult;
use crate::types::*;



use ic_stable_structures::StableBTreeMap;
use math::*;
use memory::Memory;
use types::*;
thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::new());
}

// thread_local! {
//     static STATE: Arc<Mutex<State>> = Arc::new(Mutex::new(State::new()));
// }

pub fn with_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}

// pub fn with_state<R, F: FnOnce(&mut State) -> R>(f: F) -> R {
//     STATE.with(|state| {
//         let mut state = state.lock().unwrap();
//         f(&mut *state)
//     })
// }

// PreUpgrade and PostUpgrade for stable memory
#[pre_upgrade]
fn pre_upgrade() {
    upgrade::pre_upgrade();
}

#[post_upgrade]
fn post_upgrade() {
    upgrade::post_upgrade();
}

#[init]
fn init() {
    with_state(|state| {
        if state.launch_timestamp.is_none() {
            state.launch_timestamp = Some(time());
        }
    });
    ic_cdk::println!("init function runs ! ! !");
    start_monthly_task();
}

export_candid!();
