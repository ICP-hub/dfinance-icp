use candid::{CandidType, Nat, Deserialize, Principal};
use serde::Serialize;
use crate::declarations::assets::ReserveConfigurationMap;

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

#[derive(CandidType, Deserialize)]
pub struct ReserveData {
    pub last_update_timestamp: u64,
    pub liquidity_index: Nat,
    pub current_liquidity_rate: Nat,
    pub variable_borrow_index: Nat,
    pub current_variable_borrow_rate: Nat,
    pub a_token_address: Principal,
    pub stable_debt_token_address: Principal,
    pub variable_debt_token_address: Principal,
    pub interest_rate_strategy_address: Principal,
    pub unbacked: Nat,
    pub accrued_to_treasury: Nat,
    pub configuration: ReserveConfigurationMap,
}