use crate::state::STATE;
use crate::declarations::state::State;

/* Read-only access to the global state. 
   Executes a closure `f` with an immutable reference to `State`. */
pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}
/* Mutable access to the global state.
   Executes the provided function `f` with a mutable reference to `State`. */
pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}
