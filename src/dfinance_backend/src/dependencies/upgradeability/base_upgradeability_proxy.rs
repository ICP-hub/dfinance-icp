// SPDX-License-Identifier: AGPL-3.0

use ic_cdk::export::Principal;
use ic_cdk_macros::update;
use std::cell::RefCell;

//how to import??
use crate::proxy::Proxy;
use crate::address::Address;

// Thread-local storage for the implementation address
thread_local! {
    static IMPLEMENTATION: RefCell<Option<Principal>> = RefCell::new(None);
}

// Define the BaseUpgradeabilityProxy struct
pub struct BaseUpgradeabilityProxy;

impl BaseUpgradeabilityProxy {
    // Event logging (Placeholder since ICP doesn't support events like Ethereum)
    fn emit_upgraded(implementation: Principal) {
        ic_cdk::println!("Upgraded to: {:?}", implementation);
    }

    // Returns the current implementation address
    pub fn _implementation() -> Principal {
        Proxy::_implementation()
    }

    // Upgrades the proxy to a new implementation
    pub fn _upgrade_to(new_implementation: Principal) {
        Self::_set_implementation(new_implementation);
        Self::emit_upgraded(new_implementation);
    }

    // Sets the implementation address of the proxy
    pub fn _set_implementation(new_implementation: Principal) {
        // Ensure the new implementation is a contract
        assert!(
            Address::is_contract(new_implementation),
            "Cannot set a proxy implementation to a non-contract address"
        );

        // Set the new implementation address using Proxy's method
        Proxy::set_implementation(new_implementation);
    }
}

// Example usage to demonstrate upgrading the implementation
// #[update]
// async fn upgrade(new_implementation: Principal) {
//     BaseUpgradeabilityProxy::_upgrade_to(new_implementation);
//     ic_cdk::println!("Proxy upgraded to new implementation: {:?}", new_implementation);
// }
