use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::LOG_CANISTER_NAME;
use crate::constants::errors::Error;
use crate::protocol::utils::log::{get_logs_in_batches, send_log_to_logs_canister};
use crate::stable_storage::state_handler::mutate_state;
use candid::Principal;
use std::cell::RefCell;
use std::collections::{BTreeSet, HashMap};

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

pub struct LogFlusher {
    pub user_key: String,
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

impl Drop for LogFlusher {
    fn drop(&mut self) {
        let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
            Ok(id) => id,
            Err(_) => return,
        };

        ic_cdk::println!("logs canister id = {:?}", logs_canister_id.to_text());

        let all_logs = get_logs_in_batches();
        ic_cdk::println!("lenght of logs = {:?}",all_logs.len());

        // This fires and ignores the result; runs asynchronously but not awaited.
        ic_cdk::spawn(async move {
            let result = send_log_to_logs_canister(all_logs.clone(), logs_canister_id).await;

            if result.is_ok() {
                ic_cdk::println!("✅ Batch logs sent successfully.");
                mutate_state(|state| {
                    for user_id in all_logs.keys() {
                        state.log_storage.remove(user_id);
                    }
                });
            } else {
                ic_cdk::println!("❌ Failed to send batch logs. Logs remain in memory.");
            }
        });
    }
}
