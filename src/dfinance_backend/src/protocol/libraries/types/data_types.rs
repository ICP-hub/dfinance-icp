//define a comprehensive set of data structures and parameters that the DeFi protocol uses to manage and operate financial transactions
use ethnum::U256;
use ic_cdk::export::candid::{CandidType, Deserialize};


//Manages the configuration of a financial reserve using a compact bitmask representation to store multiple parameters in a single U256 value.
#[derive(CandidType, Deserialize, Clone)]
pub struct ReserveConfigurationMap {
    pub data: U256,
}

//Stores comprehensive state information about a reserve, including its configuration, interest rates, and other parameters.
#[derive(CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub configuration: ReserveConfigurationMap,
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


//Uses a bitmap to track which assets a user has used as collateral and which they have borrowed.
#[derive(CandidType, Deserialize, Clone)]
pub struct UserConfigurationMap {
    pub data: U256,
}

//Defines categories with custom parameters for eMode, which is an operational mode with different risk parameters.
#[derive(CandidType, Deserialize, Clone)]
pub struct EModeCategory {
    pub ltv: u16,
    pub liquidation_threshold: u16,
    pub liquidation_bonus: u16,
    pub price_source: String,
    pub label: String,
}

//An enum to specify different types of interest rate modes (none, stable, variable)
#[derive(CandidType, Deserialize, Clone)]
pub enum InterestRateMode {
    None,
    Stable,
    Variable,
}

//Caches various data points related to a reserve's current and next states to optimize performance during operations.
#[derive(CandidType, Deserialize, Clone)]
pub struct ReserveCache {
    pub curr_scaled_variable_debt: U256,
    pub next_scaled_variable_debt: U256,
    pub curr_principal_stable_debt: U256,
    pub curr_avg_stable_borrow_rate: U256,
    pub curr_total_stable_debt: U256,
    pub next_avg_stable_borrow_rate: U256,
    pub next_total_stable_debt: U256,
    pub curr_liquidity_index: U256,
    pub next_liquidity_index: U256,
    pub curr_variable_borrow_index: U256,
    pub next_variable_borrow_index: U256,
    pub curr_liquidity_rate: U256,
    pub curr_variable_borrow_rate: U256,
    pub reserve_factor: U256,
    pub reserve_configuration: ReserveConfigurationMap,
    pub a_token_address: String,
    pub stable_debt_token_address: String,
    pub variable_debt_token_address: String,
    pub reserve_last_update_timestamp: u64,
    pub stable_debt_last_update_timestamp: u64,
}

//Stores parameters required to execute a liquidation call.
#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteLiquidationCallParams {
    pub reserves_count: u64,
    pub debt_to_cover: U256,
    pub collateral_asset: String,
    pub debt_asset: String,
    pub user: String,
    pub receive_a_token: bool,
    pub price_oracle: String,
    pub user_e_mode_category: u8,
    pub price_oracle_sentinel: String,
}

//Stores parameters required to execute a supply action.
#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: U256,
    pub on_behalf_of: String,
    pub referral_code: u16,
}

//borrow action
#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteBorrowParams {
    pub asset: String,
    pub user: String,
    pub on_behalf_of: String,
    pub amount: U256,
    pub interest_rate_mode: InterestRateMode,
    pub referral_code: u16,
    pub release_underlying: bool,
    pub max_stable_rate_borrow_size_percent: u64,
    pub reserves_count: u64,
    pub oracle: String,
    pub user_e_mode_category: u8,
    pub price_oracle_sentinel: String,
}


#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: U256,
    pub interest_rate_mode: InterestRateMode,
    pub on_behalf_of: String,
    pub use_a_tokens: bool,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteWithdrawParams {
    pub asset: String,
    pub amount: U256,
    pub to: String,
    pub reserves_count: u64,
    pub oracle: String,
    pub user_e_mode_category: u8,
}

//required to set a user's eMode.
#[derive(CandidType, Deserialize, Clone)]
pub struct ExecuteSetUserEModeParams {
    pub reserves_count: u64,
    pub oracle: String,
    pub category_id: u8,
}

//required to finalize a transfer operation.
#[derive(CandidType, Deserialize, Clone)]
pub struct FinalizeTransferParams {
    pub asset: String,
    pub from: String,
    pub to: String,
    pub amount: U256,
    pub balance_from_before: U256,
    pub balance_to_before: U256,
    pub reserves_count: u64,
    pub oracle: String,
    pub from_e_mode_category: u8,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct FlashloanParams {
    pub receiver_address: String,
    pub assets: Vec<String>,
    pub amounts: Vec<U256>,
    pub interest_rate_modes: Vec<U256>,
    pub on_behalf_of: String,
    pub params: Vec<u8>,
    pub referral_code: u16,
    pub flash_loan_premium_to_protocol: U256,
    pub flash_loan_premium_total: U256,
    pub max_stable_rate_borrow_size_percent: u64,
    pub reserves_count: u64,
    pub addresses_provider: String,
    pub user_e_mode_category: u8,
    pub is_authorized_flash_borrower: bool,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct FlashloanSimpleParams {
    pub receiver_address: String,
    pub asset: String,
    pub amount: U256,
    pub params: Vec<u8>,
    pub referral_code: u16,
    pub flash_loan_premium_to_protocol: U256,
    pub flash_loan_premium_total: U256,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct FlashLoanRepaymentParams {
    pub amount: U256,
    pub total_premium: U256,
    pub flash_loan_premium_to_protocol: U256,
    pub asset: String,
    pub receiver_address: String,
    pub referral_code: u16,
}

//required to calculate a user's account data.
#[derive(CandidType, Deserialize, Clone)]
pub struct CalculateUserAccountDataParams {
    pub user_config: UserConfigurationMap,
    pub reserves_count: u64,
    pub user: String,
    pub oracle: String,
    pub user_e_mode_category: u8,
}


#[derive(CandidType, Deserialize, Clone)]
pub struct ValidateBorrowParams {
    pub reserve_cache: ReserveCache,
    pub user_config: UserConfigurationMap,
    pub asset: String,
    pub user_address: String,
    pub amount: U256,
    pub interest_rate_mode: InterestRateMode,
    pub max_stable_loan_percent: u64,
    pub reserves_count: u64,
    pub oracle: String,
    pub user_e_mode_category: u8,
    pub price_oracle_sentinel: String,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct ValidateLiquidationCallParams {
    pub debt_reserve_cache: ReserveCache,
    pub total_debt: U256,
    pub health_factor: U256,
    pub price_oracle_sentinel: String,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct CalculateInterestRatesParams {
    pub unbacked: U256,
    pub liquidity_added: U256,
    pub liquidity_taken: U256,
    pub total_stable_debt: U256,
    pub total_variable_debt: U256,
    pub average_stable_borrow_rate: U256,
    pub reserve_factor: U256,
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
