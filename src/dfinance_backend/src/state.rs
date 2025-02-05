// the state struct. This struct contains all the data that needs to be stored in the canister.

use crate::declarations::state::State;

use crate::memory::*;
use std::cell::RefCell;
/*
 * @title Canister State Manager
 * @dev This thread-local static variable initializes and manages the global state of the canister.
 * @notice The state is created using the memory manager to ensure efficient storage handling.
 * @returns A `RefCell` wrapping the `State` instance.
 */

thread_local! {

    // The state of the canister.
    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State::new(&mm.borrow()))
    );
}
