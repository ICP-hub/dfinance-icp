// use ic_cdk::export::candid::{CandidType, Deserialize};
// use ic_cdk_macros::update;
// use serde::Serialize;
// use std::cell::RefCell;

// #[derive(Default, CandidType, Serialize, Deserialize)]
// struct VersionedInitializableState {
//     last_initialized_revision: u64,
//     initializing: bool,
// }

// thread_local! {
//     static STATE: RefCell<VersionedInitializableState> = RefCell::default();
// }

// pub trait VersionedInitializable {
//     fn get_revision(&self) -> u64;

//     fn is_constructor() -> bool {
//         // In Rust, we check if the function is called during the initial deployment
//         // by checking if the data certificate exists, simulating extcodesize check.
//         ic_cdk::api::data_certificate().is_none()
//     }

//     fn initialize(&self) {
//         let revision = self.get_revision();
//         STATE.with(|state| {
//             let mut state = state.borrow_mut();
//             assert!(
//                 state.initializing || Self::is_constructor() || revision > state.last_initialized_revision,
//                 "Contract instance has already been initialized"
//             );

//             let is_top_level_call = !state.initializing;
//             if is_top_level_call {
//                 state.initializing = true;
//                 state.last_initialized_revision = revision;
//             }

        

//             if is_top_level_call {
//                 state.initializing = false;
//             }
//         });
//     }
//     //In Rust, we don't need to reserve storage space like in Solidity because the memory layout is different.
// }

// // Example contract implementing the VersionedInitializable trait
// // pub struct MyContract;

// // impl VersionedInitializable for MyContract {
// //     fn get_revision(&self) -> u64 {
// //         1 // Return the revision number of the contract
// //     }
// // }

// // #[update]
// // fn initialize_contract() {
// //     let contract = MyContract;
// //     contract.initialize();
// // }

// // #[update]
// // fn get_last_initialized_revision() -> u64 {
// //     STATE.with(|state| state.borrow().last_initialized_revision)
// // }






//this is not needed in icp canister but if want we can use init() method
//ICP canisters are typically initialized once when they are deployed. The initialization logic can be placed in the init method, which is called automatically during the canister's deployment.
//Canisters on the ICP can be upgraded to new versions using the upgrade mechanism. During an upgrade, you can define specific logic to handle state migrations 
//The upgrade process can include a pre-upgrade hook (pre_upgrade) and a post-upgrade hook (post_upgrade) to manage state transitions and initialization for new versions.

use ic_cdk::export::candid::CandidType;
use ic_cdk::storage;
use serde::{Deserialize, Serialize};

// A State struct is used to manage the last initialized revision and the initializing flag.
#[derive(CandidType, Deserialize, Serialize, Default)]
struct State {
    last_initialized_revision: u64,
    initializing: bool,
}

#[init]
fn init() {
    let state = State {
        last_initialized_revision: 0,
        initializing: false,
    };
    storage::stable_save((state,)).unwrap();
}

// The initialize function checks if it can proceed with initialization based on the revision number and other conditions.
#[update]
fn initialize() {
    let mut state: State = storage::stable_restore().unwrap();

    let revision = get_revision();
    assert!(
        state.initializing || is_constructor() || revision > state.last_initialized_revision,
        "Contract instance has already been initialized"
    );

    let is_top_level_call = !state.initializing;
    if is_top_level_call {
        state.initializing = true;
        state.last_initialized_revision = revision;
    }

    // Initialization logic here

    if is_top_level_call {
        state.initializing = false;
    }

    storage::stable_save((state,)).unwrap();
}

fn get_revision() -> u64 {
    // Define your revision number here
    1
}

fn is_constructor() -> bool {
    // In ICP, you might check if the init method has been called
    // This is a placeholder logic, adjust as necessary for your use case
    let state: State = storage::stable_restore().unwrap();
    state.last_initialized_revision == 0
}
