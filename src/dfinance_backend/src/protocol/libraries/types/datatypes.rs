use candid::{CandidType, Nat, Deserialize, Principal};
use serde::Serialize;

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct Transaction {
    pub transaction_hash: String,
    pub block: u64,
    pub method: String,
    pub age: u32,
    pub from: String,
    pub to: String,
    pub value: f64,
    pub transaction_fee: f64,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub net_worth: f64,
    pub net_apy: f64,
    pub health_factor: f64,
    pub transaction_history: Vec<Transaction>,
    pub faucet: Option<Vec<(String, u64)>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InitReserveInput {
    pub a_token_impl: Principal,
    pub stable_debt_token_impl: Principal,
    pub variable_debt_token_impl: Principal,
    pub underlying_asset_decimals: u8,
    pub interest_rate_strategy_address: Principal,
    pub underlying_asset: Principal,
    pub treasury: Principal,
    pub incentives_controller: Principal,
    pub a_token_name: String,
    pub a_token_symbol: String,
    pub variable_debt_token_name: String,
    pub variable_debt_token_symbol: String,
    pub stable_debt_token_name: String,
    pub stable_debt_token_symbol: String,
    pub params: Vec<u8>,
}
