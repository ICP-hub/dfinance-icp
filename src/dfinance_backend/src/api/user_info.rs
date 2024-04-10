use crate::{State};

pub fn username_exists(state: &State, username: String) -> bool {
    state.users.values().any(|val| val.username == username)
}