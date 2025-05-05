use crate::constants::errors::Error;
use candid::Principal;
use std::cell::RefCell;
use std::collections::BTreeSet;

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State{pending_requests: BTreeSet::new()});
}

#[derive(Default)]
pub struct State {
    pub pending_requests: BTreeSet<Principal>,
}

pub struct CallerGuard {
    pub principal: Principal,
}

impl CallerGuard {
    pub fn lock_principal(principal: Principal) -> Result<Self, Error> {
        STATE.with(|state| {
            let mut state = state.borrow_mut();

            if state.pending_requests.contains(&principal) {
                ic_cdk::println!(
                    "[CallerGuard::acquire] ⚠️ Request already in progress for principal: {:?}",
                    principal.to_text()
                );
                return Err(Error::LockOperationInProgess);
            }

            ic_cdk::println!(
                "[CallerGuard::acquire] ✅ Acquiring lock for principal: {:?}",
                principal.to_text()
            );

            state.pending_requests.insert(principal);
            Ok(Self { principal })
        })
    }
}

impl Drop for CallerGuard {
    fn drop(&mut self) {
        STATE.with(|state| {
            state.borrow_mut().pending_requests.remove(&self.principal);
            ic_cdk::println!(
                "[CallerGuard::drop] 🔓 Released lock for principal: {:?}",
                self.principal.to_text()
            );
        });
    }
}
