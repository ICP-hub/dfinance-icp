use candid::{CandidType, Deserialize, Principal};

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct ReserveConfigurationMap {
    pub data: u128,
}

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct  ReserveData {
    pub configuration: Option<ReserveConfigurationMap>,
    pub a_token_address: Option<Principal>,
    pub stable_debt_token_address: Option<Principal>,
    pub variable_debt_token_address: Option<Principal>,
    pub interest_rate_strategy_address: Option<Principal>,
    pub liquidity_index: Option<u128>,
    pub variable_borrow_index: Option<u128>,
    pub current_liquidity_rate: Option<u128>,
    pub current_variable_borrow_rate: Option<u128>,
    pub current_stable_borrow_rate: Option<u128>,
    pub last_update_timestamp: Option<u64>,
    pub id: u16,
    pub accrued_to_treasury: Option<u128>,
    pub unbacked: u128,
    pub isolation_mode_total_debt: u128,
    // pub total_stable_debt: Option<u128>,
    // pub total_variable_debt: Option<u128>,
    // pub reserve_factor: Option<u128>,
}

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct ReserveCache {
    pub curr_scaled_variable_debt: u128,
    pub next_scaled_variable_debt: u128,
    pub curr_principal_stable_debt: u128,
    pub curr_avg_stable_borrow_rate: u128,
    pub curr_total_stable_debt: u128,
    pub next_avg_stable_borrow_rate: u128,
    pub next_total_stable_debt: u128,
    pub curr_liquidity_index: u128,
    pub next_liquidity_index: u128,
    pub curr_variable_borrow_index: u128,
    pub next_variable_borrow_index: u128,
    pub curr_liquidity_rate: u128,
    pub curr_variable_borrow_rate: u128,
    pub reserve_factor: u128,
    pub reserve_configuration: ReserveConfigurationMap,
    pub a_token_address: String,
    pub stable_debt_token_address: String,
    pub variable_debt_token_address: String,
    pub reserve_last_update_timestamp: u64,
    pub stable_debt_last_update_timestamp: u64,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: u128,
    pub on_behalf_of: String,
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




