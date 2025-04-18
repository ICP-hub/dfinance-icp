use crate::stable_storage::state_handler::read_state;
use crate::constants::errors::Error;
use crate::declarations::structs::TransferFromResult;
use crate::guards::access_control::to_check_controller;
use crate::protocol::utils::math_utils::current_timestamp;
use candid::{decode_one, encode_args};
use candid::{Nat, Principal};
use ic_cdk::api;
use ic_cdk::{query, update};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::{icrc1::transfer::TransferArg, icrc2::transfer_from::TransferFromArgs};
use crate::guards::access_control::{guard_prevent_anonymous,};
use std::cell::RefCell;
use std::collections::{HashMap, VecDeque};
use crate::guards::locks::CallerGuard;

thread_local! {
    static RATE_LIMITER: RefCell<HashMap<Principal, VecDeque<u64>>> = RefCell::new(HashMap::new());
}


#[query]
pub fn call_tracker(caller: Principal) -> Result<usize, Error> {
    // let caller = ic_cdk::api::caller();

    if caller == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let now = current_timestamp();

    let is_blocked = RATE_LIMITER.with(|map| {
        let map = map.borrow();
        let maybe_queue = map.get(&caller);

        // ask vaiahav what
        match maybe_queue {
            Some(queue) => {
                let valid_count = queue.iter().filter(|&&t| now - t <= WINDOW_SIZE).count();
                ic_cdk::println!("Valid count: {:?}", valid_count);
                valid_count
            }
            None => 0, // No calls logged = not blocked
        }
    });

    Ok(is_blocked)
}

// TODO: need to chaange this comments a bit later.
/*
 * @title Check Function Block Status
 * @notice Checks if the caller is blocked from using a specific function.
 * @dev Compares current timestamp with block expiration time to determine if block is active.
 * @functionality User verification functionality that allows users to check if they're currently blocked from using specific functions
 *
 * # Parameters
 * - `function_name` - The name of the function to check.
 *
 * # Returns
 * - `Ok(bool)` - True if blocked, false otherwise.
 * - `Err(Error)` - If the caller is an anonymous principal.
 */
#[query]
pub fn is_user_blocked() -> Result<bool, Error> {
    guard_prevent_anonymous()?;
    let caller = ic_cdk::api::caller();
    let now = current_timestamp();

    let is_blocked = RATE_LIMITER.with(|map| {
        let map = map.borrow();
        let maybe_queue = map.get(&caller);

        // ask vaiahav what
        match maybe_queue {
            Some(queue) => {
                let valid_count = queue.iter().filter(|&&t| now - t <= WINDOW_SIZE).count();
                ic_cdk::println!("Valid count: {:?}", valid_count);
                valid_count >= LIMIT
            }
            None => false, // No calls logged = not blocked
        }
    });

    Ok(is_blocked)
}
/*
 * @title Inspect Incoming Messages
 * @notice Inspects incoming messages to check if the caller is blocked from using the requested function.
 * @dev Executed before message processing to reject blocked requests early in the execution flow.
 * @functionality Security pre-processing functionality that validates all incoming calls before execution to enforce rate limiting
 *
 * # Note
 * This function is called by the Internet Computer before processing each incoming message,
 * allowing early rejection of requests from blocked users.
 * */
#[ic_cdk::inspect_message]
pub fn inspect_message() {
    let caller = ic_cdk::caller();
    let now = current_timestamp();

    let allowed = RATE_LIMITER.with(|map| {
        let map = map.borrow();
        let maybe_queue = map.get(&caller);

        match maybe_queue {
            Some(queue) => {
                // Count how many calls are within the sliding window
                let valid_count = queue.iter().filter(|&&t| now - t <= WINDOW_SIZE).count();
                valid_count < LIMIT
            }
            None => true, // No history = allow
        }
    });

    if !allowed {
        ic_cdk::api::call::reject("Rate limit exceeded: Too many requests in short time.");
    } else {
        ic_cdk::api::call::accept_message();
    }
}

const LIMIT: usize = 5; // Max requests allowed
const WINDOW_SIZE: u64 = 60; // In seconds

#[update]
pub fn request_limiter() -> Result<(), Error> {
    guard_prevent_anonymous()?;
    let caller = ic_cdk::api::caller();
    let now = current_timestamp();

    let allowed = RATE_LIMITER.with(|map| {
        let mut map = map.borrow_mut();
        let queue = map.entry(caller).or_insert_with(VecDeque::new);

        // Remove old timestamps outside the window
        while let Some(&front) = queue.front() {
            if now - front > WINDOW_SIZE {
                queue.pop_front();
            } else {
                break;
            }
        }

        if queue.len() < LIMIT {
            queue.push_back(now);
            true
        } else {
            false
        }
    });

    if allowed {
        Ok(())
    } else {
        return Err(Error::RateLimitExceeded);
    }
}

/*
 * @title Check Function Block Status
 * @notice Checks if the caller is blocked from using a specific function.
 * @dev Compares current timestamp with block expiration time to determine if block is active.
 * @functionality User verification functionality that allows users to check if they're currently blocked from using specific functions
 *
 * # Parameters
 * - `function_name` - The name of the function to check.
 *
 * # Returns
 * - `Ok(bool)` - True if blocked, false otherwise.
 * - `Err(Error)` - If the caller is an anonymous principal.
 */
#[query]
pub fn is_function_blocked(function_name: String) -> Result<bool, Error> {
    let caller_id = ic_cdk::caller();
    let current_time_stamp = current_timestamp();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    Ok(read_state(|state| {
        state
            .restrict_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(&function_name).cloned())
            .map(|details| details.blocked_time > current_time_stamp)
            .unwrap_or(false)
    }))
}