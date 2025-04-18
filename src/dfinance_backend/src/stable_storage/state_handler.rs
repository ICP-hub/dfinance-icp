use crate::stable_storage::state::State;
use std::cell::RefCell;
use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

/*
 * @title Memory Manager
 * @dev This thread-local static variable initializes and manages the memory allocation.
 * @notice It uses the `MemoryManager` with the `DefaultMemoryImpl` implementation.
 * @returns A `RefCell` wrapping a `MemoryManager` instance.
 * @functionality Initializes and manages memory allocation using the `MemoryManager` with the `DefaultMemoryImpl` implementation.
 */


thread_local! {

    // The memory manager.
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

}
/*
 * @title Canister State Manager
 * @dev This thread-local static variable initializes and manages the global state of the canister.
 * @notice The state is created using the memory manager to ensure efficient storage handling.
 * @returns A `RefCell` wrapping the `State` instance.
 * @functionality Initializes and manages the global state of the canister using the memory manager.
 */

thread_local! {

    // The state of the canister.
    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State::new(&mm.borrow()))
    );
}


/* Read-only access to the global state. 
   @functionality State Access
   Executes a closure `f` with an immutable reference to `State`. */
pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}

/* Mutable access to the global state.
   @functionality State Mutation
   Executes the provided function `f` with a mutable reference to `State`. */
pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}
