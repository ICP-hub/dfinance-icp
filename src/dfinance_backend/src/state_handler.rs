use std::collections::HashMap;
use crate::{Deserialize, Serialize, Principal};
//use crate::types::{User, TokenDeposits};

use crate::types::*;
// use ic_cdk_timers::TimerId;
// use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Clone)]
pub struct State {
    pub users: HashMap<Principal, User>,
    pub provider_deposits : HashMap<Principal, TokenDeposits>,
    //pub token_deposits : HashMap<String, Vec<LiquidityEvent>>,
    pub total_deposit: HashMap<u32, f64>,
    pub deposits: HashMap<Principal, Vec<Deposit>>,
    pub launch_timestamp: Option<u64>,
    pub current_phase: u32,
    pub total_deposits: f64,
    pub monthly_data: HashMap<u32, MonthlyData>,
}

impl State {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            provider_deposits: HashMap::new(),
            total_deposit: HashMap::new(),
            deposits: HashMap::new(),
            launch_timestamp: None,
            current_phase: 1,
            total_deposits: 0.0,
            monthly_data: HashMap::new(),
        }
    }
}

impl Default for State {
    fn default() -> Self {
        State::new()
    }
}
