pub mod api;
pub mod dependencies;
pub mod interfaces;
pub mod protocol;
pub mod provide_liquidity;

use crate::protocol::libraries::math::*;

use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, export_candid, init, post_upgrade, pre_upgrade};
use state_handler::*;
use crate::types::*;

use serde::{Deserialize, Serialize};
use std::cell::RefCell;

use ic_stable_structures::{
    memory_manager::{MemoryManager, VirtualMemory},
    DefaultMemoryImpl,
};

pub type VMem = VirtualMemory<DefaultMemoryImpl>;
thread_local! {


    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
    RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));


    static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State {

            users:Users::init(mm.borrow().get(USER_MEMORY_ID)),
            total_deposits:TotalDeposit::init(mm.borrow().get(TOTAL_DEPOSIT_MEMORY_ID)),
            current_phase:CurrentPhase::init(mm.borrow().get(CURRENT_PHASE_MEMORY_ID), 1).expect("Failed to initialize current phase"),
            launch_timestamp:LaunchTimestamp::init(mm.borrow().get(LAUNCH_TIMESTAMP_MEMORY_ID), Some(ic_cdk::api::time())).expect("Failed to initialize launch timestamp"),
            monthly_data:MonthlyDataMap::init(mm.borrow().get(MONTHLY_DATA_MEMORY_ID)),


        })
    );
}

pub fn with_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}

#[init]
fn init() {
    ic_cdk::println!("init function runs ! ! !");
    start_monthly_task();
}

export_candid!();
