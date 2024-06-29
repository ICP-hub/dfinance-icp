// SPDX-License-Identifier: AGPL-3.0

use ic_cdk::export::Principal;
use ic_cdk::api;
use ic_cdk_macros::{query, update};
use std::cell::RefCell;

thread_local! {
    static IMPLEMENTATION: RefCell<Option<Principal>> = RefCell::new(None);
}

pub struct Proxy;

impl Proxy {
    // Returns the address of the implementation.
    //The _implementation function is an abstract internal function that returns the address of the implementation contract. This function must be defined in derived contracts.
    pub fn _implementation() -> Principal {
        IMPLEMENTATION.with(|impl_ref| *impl_ref.borrow()).expect("Implementation not set")
    }

    // Sets the address of the implementation.
    pub fn set_implementation(impl_address: Principal) {
        IMPLEMENTATION.with(|impl_ref| *impl_ref.borrow_mut() = Some(impl_address));
    }

    // Delegates execution to an implementation contract.
    //The _delegate function is an internal function that delegates execution to an implementation contract. It uses inline assembly to forward the call data to the implementation contract and handle the return data.
    pub fn _delegate(implementation: Principal) {
        let call_data = api::call::msg_arg_data();
        let (result,): (Vec<u8>,) = api::call::call(implementation, "delegate", (call_data,))
            .expect("Delegate call failed");

        api::call::reply((result,));
        //case 0 is not implemented
    }

    // Function that is run as the first thing in the fallback function.
    // Can be redefined in derived contracts to add functionality.
    pub fn _will_fallback() {
        // Placeholder for additional functionality in derived contracts
    }

    // Fallback implementation.
    // Extracted to enable manual triggering.
    //The _fallback function is an internal function that first calls _willFallback (which can be overridden in derived contracts to add functionality) and then calls _delegate with the address returned by _implementation.
    //The fallback function is an external function that will run if no other function in the contract matches the call data. 
    pub fn _fallback() {
        Self::_will_fallback();
        let implementation = Self::_implementation();
        Self::_delegate(implementation);
    }
}

// Fallback functions for query and update calls
// #[query]
// fn query_fallback() {
//     Proxy::_fallback();
// }

// #[update]
// fn update_fallback() {
//     Proxy::_fallback();
// }
