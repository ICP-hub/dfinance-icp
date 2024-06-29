// SPDX-License-Identifier: MIT

use ic_cdk::export::Principal;
use ic_cdk_macros::{init, update};
use std::cell::RefCell;
mod context;
use context::Context;

// Struct to hold the owner
thread_local! {
    static OWNER: RefCell<Option<Principal>> = RefCell::new(None);
}

// Event logging (Placeholder since ICP doesn't support events like Ethereum)
fn emit_ownership_transferred(previous_owner: Option<Principal>, new_owner: Principal) {
    ic_cdk::println!("OwnershipTransferred: {:?} -> {:?}", previous_owner, new_owner);
}

// Ownable struct inheriting from Context
pub struct Ownable;

impl Ownable {
    // Initializes the contract setting the deployer as the initial owner.
    #[init]
    fn init() {
        let msg_sender = Context::_msg_sender();
        OWNER.with(|owner| *owner.borrow_mut() = Some(msg_sender));
        emit_ownership_transferred(None, msg_sender);
    }

    // Returns the address of the current owner.
    pub fn owner() -> Option<Principal> {
        OWNER.with(|owner| *owner.borrow())
    }

    // Throws if called by any account other than the owner.
    pub fn only_owner() {
        let caller = Context::_msg_sender();
        let owner = Self::owner().expect("Ownable: contract is not initialized");
        assert_eq!(caller, owner, "Ownable: caller is not the owner");
    }

    // Leaves the contract without an owner.
    #[update]
    pub fn renounce_ownership() {
        Self::only_owner();
        let owner = Self::owner().expect("Ownable: contract is not initialized");
        emit_ownership_transferred(Some(owner), Principal::anonymous());
        OWNER.with(|owner| *owner.borrow_mut() = None);
    }

    // Transfers ownership of the contract to a new account (`newOwner`).
    #[update]
    pub fn transfer_ownership(new_owner: Principal) {
        Self::only_owner();
        assert!(new_owner != Principal::anonymous(), "Ownable: new owner is the zero address");
        let owner = Self::owner().expect("Ownable: contract is not initialized");
        emit_ownership_transferred(Some(owner), new_owner);
        OWNER.with(|owner| *owner.borrow_mut() = Some(new_owner));
    }
}

// // Example function to demonstrate usage
// #[update]
// fn example_function() {
//     Ownable::only_owner();
//     ic_cdk::println!("Function called by the owner");
// }
