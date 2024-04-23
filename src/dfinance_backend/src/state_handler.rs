use std::collections::HashMap;
use candid::Principal;
use serde::{Deserialize, Serialize};
use crate::types::User;


#[derive(Serialize, Deserialize)]
pub struct State {
    pub users: HashMap<Principal, User>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
        }
    }
}

impl Default for State {
    fn default() -> Self {
        State::new()
    }
}