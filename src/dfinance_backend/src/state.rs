// the state struct. This struct contains all the data that needs to be stored in the canister.

use crate::declarations::state::State;

use crate::memory::*;
use std::cell::RefCell;
thread_local! {

    // The state of the canister.
    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State::new(&mm.borrow()))
    );
}
