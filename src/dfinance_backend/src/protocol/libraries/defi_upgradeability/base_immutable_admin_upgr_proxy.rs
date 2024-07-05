// SPDX-License-Identifier: AGPL-3.0

use ic_cdk::export::Principal;
use ic_cdk_macros::update;
use std::cell::RefCell;

use crate::base_upgradeability_proxy::BaseUpgradeabilityProxy;
use crate::proxy::Proxy;
use crate::address::Address;

thread_local! {
    static ADMIN: RefCell<Option<Principal>> = RefCell::new(None);
}

pub struct BaseImmutableAdminUpgradeabilityProxy;

impl BaseImmutableAdminUpgradeabilityProxy {
    // Constructor equivalent
    pub fn new(admin: Principal) {
        ADMIN.with(|a| *a.borrow_mut() = Some(admin));
    }

    // Modifier equivalent to `ifAdmin`
    fn if_admin<F: FnOnce() -> R, R>(f: F) -> R {
        let caller = ic_cdk::api::caller();
        let admin = ADMIN.with(|a| *a.borrow()).expect("Admin not set");
        if caller == admin {
            f()
        } else {
            Self::_fallback();
            panic!("Fallback called by non-admin");
        }
    }

    // Return the admin address
    pub fn admin() -> Principal {
        Self::if_admin(|| ADMIN.with(|a| a.borrow().clone().expect("Admin not set")))
    }

    // Return the implementation address
    pub fn implementation() -> Principal {
        Self::if_admin(|| Proxy::_implementation())
    }

    // Upgrade the backing implementation of the proxy
    pub fn upgrade_to(new_implementation: Principal) {
        Self::if_admin(|| {
            BaseUpgradeabilityProxy::_upgrade_to(new_implementation);
        });
    }

    // Upgrade the backing implementation and call a function on the new implementation
    pub async fn upgrade_to_and_call(new_implementation: Principal, method: &str, args: Vec<u8>) {
        Self::if_admin(|| {
            BaseUpgradeabilityProxy::_upgrade_to(new_implementation);
            let result: Result<(), String> = ic_cdk::api::call::call(new_implementation, method, args)
                .await
                .map_err(|(code, msg)| format!("Delegate call failed: {:?}, {}", code, msg));
            result.expect("Delegate call failed");
        });
    }

    // Only fall back when the sender is not the admin
    pub fn _will_fallback() {
        let caller = ic_cdk::api::caller();
        let admin = ADMIN.with(|a| *a.borrow()).expect("Admin not set");
        if caller == admin {
            panic!("Cannot call fallback function from the proxy admin");
        }
        BaseUpgradeabilityProxy::_fallback();
    }

    pub fn _fallback() {
        Self::_will_fallback();
    }
}

// Example usage to demonstrate admin functionalities
#[update]
async fn upgrade(new_implementation: Principal) {
    BaseImmutableAdminUpgradeabilityProxy::upgrade_to(new_implementation);
    ic_cdk::println!("Proxy upgraded to new implementation: {:?}", new_implementation);
}

#[update]
async fn upgrade_and_call(new_implementation: Principal, method: String, args: Vec<u8>) {
    BaseImmutableAdminUpgradeabilityProxy::upgrade_to_and_call(new_implementation, &method, args).await;
    ic_cdk::println!("Proxy upgraded to new implementation: {:?} and called method: {}", new_implementation, method);
}
