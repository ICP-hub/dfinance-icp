use crate::types::*;
use candid::Principal;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct State {
    pub users: HashMap<Principal, User>,
    pub total_deposit: HashMap<u32, f64>,
    pub deposits: HashMap<Principal, Vec<Deposit>>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            total_deposit: HashMap::new(),
            deposits: HashMap::new(),
        }
    }
}

impl Default for State {
    fn default() -> Self {
        State::new()
    }
}
