use std::collections::HashMap;
use crate::{Deserialize, Serialize, Principal};
use crate::types::{User, TokenDeposits};


#[derive(Serialize, Deserialize, Clone)]
pub struct State {
    pub users: HashMap<Principal, User>,
    pub provider_deposits : HashMap<Principal, TokenDeposits>,
    //pub token_deposits : HashMap<String, Vec<LiquidityEvent>>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            provider_deposits: HashMap::new()
        }
    }
}

impl Default for State {
    fn default() -> Self {
        State::new()
    }
}