use candid::{CandidType, Deserialize};

#[derive(Debug, CandidType, Deserialize)]
pub struct ReserveData {
    pub liquidity_index: u128,
    pub current_liquidity_rate: u128,
    pub variable_borrow_index: u128,
    pub current_variable_borrow_rate: u128,
    pub current_stable_borrow_rate: u128,
    pub last_update_timestamp: u64,
    pub id: u16,
    pub a_token_address: String,
    pub stable_debt_token_address: String,
    pub variable_debt_token_address: String,
    pub interest_rate_strategy_address: String,
    pub accrued_to_treasury: u128,
    pub unbacked: u128,
    pub isolation_mode_total_debt: u128,
}
