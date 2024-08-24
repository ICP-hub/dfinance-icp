use candid::{CandidType, Deserialize, Nat, Principal};

use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub borrow_rate: Option<f64>,
    pub supply_rate_apr: Option<f64>,
    pub total_supply: Option<u128>,
    pub last_update_timestamp: u64,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub accrued_to_treasury: u128,
    pub liquidity_index: u128,
    pub current_liquidity_rate: u128,
    pub configuration: ReserveConfiguration,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ReserveCache {
    pub reserve_configuration: ReserveConfiguration,
    pub reserve_factor: u128,
    pub curr_liquidity_index: u128,
    pub next_liquidity_index: u128,
    pub curr_variable_borrow_index: u128,
    pub next_variable_borrow_index: u128,
    pub curr_liquidity_rate: u128,
    pub curr_variable_borrow_rate: u128,
    pub a_token_address: Principal,
    pub stable_debt_token_address: Principal,
    pub variable_debt_token_address: Principal,
    pub reserve_last_update_timestamp: u64,
    pub curr_scaled_variable_debt: u128,
    pub next_scaled_variable_debt: u128,
    pub curr_principal_stable_debt: u128,
    pub curr_total_stable_debt: u128,
    pub curr_avg_stable_borrow_rate: u128,
    pub stable_debt_last_update_timestamp: u64,
    pub next_total_stable_debt: u128,
    pub next_avg_stable_borrow_rate: u128,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: u128,
    pub on_behalf_of: Principal,
    pub referral_code: u16,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct CalculateInterestRatesParams {
    pub unbacked: u128,
    pub liquidity_added: u128,
    pub liquidity_taken: u128,
    pub total_stable_debt: u128,
    pub total_variable_debt: u128,
    pub average_stable_borrow_rate: u128,
    pub reserve_factor: u128,
    pub reserve: String,
    pub a_token: String,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct InitReserveParams {
    pub asset: String,
    pub a_token_address: String,
    pub stable_debt_address: String,
    pub variable_debt_address: String,
    pub interest_rate_strategy_address: String,
    pub reserves_count: u64,
    pub max_number_reserves: u64,
}

#[derive(CandidType, Deserialize, Clone, PartialEq)]
pub enum InterestRateMode {
    None,
    Stable,
    Variable,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct ExecuteBorrowParams {
    pub asset: String,
    pub user: String,
    pub on_behalf_of: String,
    pub amount: u128,
    pub interest_rate: Nat,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: Nat,
    pub interest_rate_mode: InterestRateMode,
    pub on_behalf_of: Principal,
    use_dtokens: bool,
}
