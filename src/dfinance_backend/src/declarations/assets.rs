use candid::{CandidType, Deserialize, Nat, Principal};

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct ReserveConfigurationMap {
    pub data: u128,
}

#[derive(CandidType, Deserialize, Clone, Default)]
pub struct ReserveData {
    pub d_token_canister: Option<Principal>,
    pub stable_debt_token_canister: Option<Principal>,
    pub variable_debt_token_canister: Option<Principal>,
    pub interest_rate_strategy_address: Option<Principal>,
    pub liquidity_index: Option<u128>,
    pub variable_borrow_index: Option<u128>,
    pub current_liquidity_rate: Option<u128>,
    pub current_variable_borrow_rate: Option<u128>,
    pub current_stable_borrow_rate: Option<u128>,
    pub last_update_timestamp: Option<u64>,
    pub id: u16,
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

#[derive(CandidType, Deserialize, Clone)]
pub enum InterestRateMode {
    None,
    Stable,
    Variable,
}

#[derive(CandidType, Deserialize, Clone)]
struct ExecuteBorrowParams {
    pub asset: String,
    pub user: Principal,
    pub on_behalf_of: Principal,
    pub amount: Nat,
    pub interest_rate_mode: InterestRateMode,
    pub referral_code: u16,
    pub release_underlying: bool,
    pub max_stable_rate_borrow_size_percent: Nat,
    pub reserves_count: Nat,
    pub exchange_canister: Principal,
    pub user_emode_category: u8,
    pub price_oracle_sentinel: Principal,
}

#[derive(CandidType, Deserialize, Clone)]
struct ExecuteRepayParams {
    pub asset: String,
    pub amount: Nat,
    pub interest_rate_mode: InterestRateMode,
    pub on_behalf_of: Principal,
    use_dtokens: bool,
}
