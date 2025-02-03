use crate::state::STATE;
use crate::declarations::state::State;

/// @notice Provides read access to the global state.
/// @dev Executes the provided function `f` with an immutable reference to `State`. 
///      This allows safe read operations without modifying the state.
/// @param f A closure that takes an immutable reference to `State` and returns a result.
/// @return The result of executing `f` with the state.
pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}

/// @notice Provides mutable access to the global state.
/// @dev Executes the provided function `f` with a mutable reference to `State`. 
///      This allows modifying the state while ensuring thread safety via `RefCell`.
/// @param f A closure that takes a mutable reference to `State` and returns a result.
/// @return The result of executing `f` with the mutable state
pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}
