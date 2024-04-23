use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize)]
pub struct User {
    pub username: String,
    pub full_name: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Deposit {
    pub wallet_address: String,
    pub amount: f64,
}
