use crate::constants::constant_variables::constants::{REQUEST_LIMIT, WINDOW_SIZE_VAR};
use crate::constants::errors::Error;
use crate::declarations::datatypes::Certificate;
use crate::protocol::utils::math_utils::current_timestamp;
use crate::stable_storage::state_handler::get_certificate_witness;
use candid::Principal;
use ic_cdk::{query, update};
use crate::guards::access_control::guard_prevent_anonymous;
use std::cell::RefCell;
use std::collections::{HashMap, VecDeque};


thread_local! {
    static RATE_LIMITER: RefCell<HashMap<Principal, VecDeque<u64>>> = RefCell::new(HashMap::new());
}

/*
 * @title Check User Rate Limit Status
 * @notice Determines whether the caller has exceeded the allowed number of function calls within a specific time window.
 * @dev Counts the number of valid timestamps in the rate-limiting queue and compares it with the predefined limit.
 * @functionality User rate-limiting mechanism to restrict excessive usage of functions.
 *
 * # Parameters
 * - `function_name` - The name of the function to check. *(Currently unused, can be integrated for per-function limits.)*
 *
 * # Returns
 * - `Ok(bool)` - True if the user is currently rate-limited (blocked), false otherwise.
 * - `Err(Error)` - If the caller is an anonymous principal.
 */
#[query]
pub fn is_user_blocked() -> Result<(bool, Certificate), Error> {
    guard_prevent_anonymous()?;
    let caller = ic_cdk::api::caller();
    let now = current_timestamp();
    let cert = get_certificate_witness("user_blocked".to_string());
    let is_blocked = RATE_LIMITER.with(|map| {
        let map = map.borrow();
        let maybe_queue = map.get(&caller);

        match maybe_queue {
            Some(queue) => {
                let valid_count = queue.iter().filter(|&&t| now - t <= WINDOW_SIZE).count();
                valid_count >= LIMIT
            }
            None => false, // No calls logged = not blocked
        }
    });

    Ok((is_blocked, cert))
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

const LIMIT: usize = REQUEST_LIMIT; 
const WINDOW_SIZE: u64 = WINDOW_SIZE_VAR; 

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