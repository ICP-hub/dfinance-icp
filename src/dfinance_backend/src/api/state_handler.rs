use crate::declarations::state::State;
use crate::state::STATE;
// read_state should be used when you want to read the state of the canister. For eg. when you want to get the user data
pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}

// mutate_state should be used when you want to mutate the state of the canister. For eg. when you want to add user data
pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}
