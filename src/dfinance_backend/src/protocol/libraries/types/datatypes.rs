pub mod data_types {

    #[derive(Default, Clone)]
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

    #[derive(Default, Clone)]
    pub struct ReserveConfigurationMap {
        pub data: u128,
    }

    #[derive(Default, Clone)]
    pub struct UserConfigurationMap {
        pub data: u128,
    }

    #[derive(Default, Clone)]
    pub struct EModeCategory {
        pub ltv: u16,
        pub liquidation_threshold: u16,
        pub liquidation_bonus: u16,
        pub price_source: String,
        pub label: String,
    }

    #[derive(Clone, Copy)]
    pub enum InterestRateMode {
        None,
        Stable,
        Variable,
    }

    #[derive(Default, Clone)]
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

    #[derive(Default, Clone)]
    pub struct ExecuteLiquidationCallParams {
        pub reserves_count: u128,
        pub debt_to_cover: u128,
        pub collateral_asset: String,
        pub debt_asset: String,
        pub user: String,
        pub receive_a_token: bool,
        pub price_oracle: String,
        pub user_e_mode_category: u8,
        pub price_oracle_sentinel: String,
    }

    #[derive(Default, Clone)]
    pub struct ExecuteSupplyParams {
        pub asset: String,
        pub amount: u128,
        pub on_behalf_of: String,
        pub referral_code: u16,
    }

    #[derive(Default, Clone)]
    pub struct ExecuteBorrowParams {
        pub asset: String,
        pub user: String,
        pub on_behalf_of: String,
        pub amount: u128,
        pub interest_rate_mode: InterestRateMode,
        pub referral_code: u16,
        pub release_underlying: bool,
        pub max_stable_rate_borrow_size_percent: u128,
        pub reserves_count: u128,
        pub oracle: String,
        pub user_e_mode_category: u8,
        pub price_oracle_sentinel: String,
    }

    #[derive(Default, Clone)]
    pub struct ExecuteRepayParams {
        pub asset: String,
        pub amount: u128,
        pub interest_rate_mode: InterestRateMode,
        pub on_behalf_of: String,
        pub use_a_tokens: bool,
    }

    #[derive(Default, Clone)]
    pub struct ExecuteWithdrawParams {
        pub asset: String,
        pub amount: u128,
        pub to: String,
        pub reserves_count: u128,
        pub oracle: String,
        pub user_e_mode_category: u8,
    }

    #[derive(Default, Clone)]
    pub struct ExecuteSetUserEModeParams {
        pub reserves_count: u128,
        pub oracle: String,
        pub category_id: u8,
    }

    #[derive(Default, Clone)]
    pub struct FinalizeTransferParams {
        pub asset: String,
        pub from: String,
        pub to: String,
        pub amount: u128,
        pub balance_from_before: u128,
        pub balance_to_before: u128,
        pub reserves_count: u128,
        pub oracle: String,
        pub from_e_mode_category: u8,
    }

    #[derive(Default, Clone)]
    pub struct FlashloanParams {
        pub receiver_address: String,
        pub assets: Vec<String>,
        pub amounts: Vec<u128>,
        pub interest_rate_modes: Vec<u128>,
        pub on_behalf_of: String,
        pub params: Vec<u8>,
        pub referral_code: u16,
        pub flash_loan_premium_to_protocol: u128,
        pub flash_loan_premium_total: u128,
        pub max_stable_rate_borrow_size_percent: u128,
        pub reserves_count: u128,
        pub addresses_provider: String,
        pub user_e_mode_category: u8,
        pub is_authorized_flash_borrower: bool,
    }

    #[derive(Default, Clone)]
    pub struct FlashloanSimpleParams {
        pub receiver_address: String,
        pub asset: String,
        pub amount: u128,
        pub params: Vec<u8>,
        pub referral_code: u16,
        pub flash_loan_premium_to_protocol: u128,
        pub flash_loan_premium_total: u128,
    }

    #[derive(Default, Clone)]
    pub struct FlashLoanRepaymentParams {
        pub amount: u128,
        pub total_premium: u128,
        pub flash_loan_premium_to_protocol: u128,
        pub asset: String,
        pub receiver_address: String,
        pub referral_code: u16,
    }

    #[derive(Default, Clone)]
    pub struct CalculateUserAccountDataParams {
        pub user_config: UserConfigurationMap,
        pub reserves_count: u128,
        pub user: String,
        pub oracle: String,
        pub user_e_mode_category: u8,
    }

    #[derive(Default, Clone)]
    pub struct ValidateBorrowParams {
        pub reserve_cache: ReserveCache,
        pub user_config: UserConfigurationMap,
        pub asset: String,
        pub user_address: String,
        pub amount: u128,
        pub interest_rate_mode: InterestRateMode,
        pub max_stable_loan_percent: u128,
        pub reserves_count: u128,
        pub oracle: String,
        pub user_e_mode_category: u8,
        pub price_oracle_sentinel: String,
        pub isolation_mode_active: bool,
        pub isolation_mode_collateral_address: String,
        pub isolation_mode_debt_ceiling: u128,
    }

    #[derive(Default, Clone)]
    pub struct ValidateLiquidationCallParams {
        pub debt_reserve_cache: ReserveCache,
        pub total_debt: u128,
        pub health_factor: u128,
        pub price_oracle_sentinel: String,
    }

    #[derive(Default, Clone)]
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

    #[derive(Default, Clone)]
    pub struct InitReserveParams {
        pub asset: String,
        pub a_token_address: String,
        pub stable_debt_address: String,
        pub variable_debt_address: String,
        pub interest_rate_strategy_address: String,
        pub reserves_count: u16,
        pub max_number_reserves: u16,
    }
}
