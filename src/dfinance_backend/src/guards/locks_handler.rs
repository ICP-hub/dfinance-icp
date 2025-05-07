use crate::constants::errors::Error;
use crate::debug;
use candid::Principal;
use std::cell::RefCell;
use std::collections::BTreeSet;
use crate::protocol::utils::log::{log_internal, LogLevel};

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


/**
 * @title Lock Principal for Operation
 * @dev Acquires a lock for the given principal to prevent concurrent operations.
 * @param principal The principal for which the lock is to be acquired.
 * @returns An instance of `CallerGuard` if the lock is successfully acquired, or an error if a lock already exists.
 *
 * @functionality Ensures that only one operation is performed at a time for a given principal by tracking active requests.
 */
impl CallerGuard {
    pub fn lock_principal(principal: Principal) -> Result<Self, Error> {
        STATE.with(|state| {
            let mut state = state.borrow_mut();

            if state.pending_requests.contains(&principal) {
                debug!(
                    "[CallerGuard::acquire] ⚠️ Request already in progress for principal: {:?}",
                    principal.to_text()
                );
                return Err(Error::LockOperationInProgess);
            }

            debug!(
                "[CallerGuard::acquire] ✅ Acquiring lock for principal: {:?}",
                principal.to_text()
            );

            state.pending_requests.insert(principal);
            Ok(Self { principal })
        })
    }
}

/**
 * @title Release Principal Lock
 * @dev Automatically releases the lock for the associated principal when the `CallerGuard` instance is dropped.
 *
 * @functionality Ensures that once the operation is complete or the guard goes out of scope, the lock is removed to allow future operations for the principal.
 */
impl Drop for CallerGuard {
    fn drop(&mut self) {
        STATE.with(|state| {
            state.borrow_mut().pending_requests.remove(&self.principal);
            debug!(
                "[CallerGuard::drop] 🔓 Released lock for principal: {:?}",
                self.principal.to_text()
            );
        });
    }
}
