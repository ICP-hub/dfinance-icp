use candid::{CandidType, Deserialize, Principal};
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
    pub user_id: Option<String>,
    pub net_worth: Option<f64>,
    pub net_apy: Option<f64>,
    pub health_factor: Option<f64>,
    pub ltv: Option<f64>,
    pub liquidation_threshold: Option<f64>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
}

impl Default for UserData {
    fn default() -> Self {
        Self {
            user_id: Default::default(),
            net_worth: Some(0.0),
            net_apy: Some(0.0),
            health_factor: Some(0.0),
            ltv: Some(0.0),
            liquidation_threshold: Some(0.0),
            reserves: Default::default(),
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub principal_stable_debt: u64,
    pub total_stable_debt: u64,
    pub total_variable_debt: u64,
    pub avg_stable_borrow_rate: f64,
    pub last_update_timestamp: u64,
    pub liquidity_index: f64,
    pub asset_supply: f64,
    pub asset_borrow: f64,
    pub variable_borrow_index: f64,
    pub asset_price_when_supplied: f64,
    pub asset_price_when_borrowed: f64,
}
impl Default for UserReserveData {
    fn default() -> Self {
        Self {
            reserve: Default::default(),
            principal_stable_debt: Default::default(),
            total_stable_debt: Default::default(),
            total_variable_debt: Default::default(),
            avg_stable_borrow_rate: Default::default(),
            last_update_timestamp: Default::default(),
            liquidity_index: Default::default(),
            asset_supply: Default::default(),
            asset_borrow: Default::default(),
            variable_borrow_index: Default::default(),
            asset_price_when_supplied: Default::default(),
            asset_price_when_borrowed: Default::default(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InitReserveInput {
    pub d_token_impl: Principal,
    pub stable_debt_token_impl: Principal,
    pub variable_debt_token_impl: Principal,
    pub underlying_asset_decimals: u8,
    pub interest_rate_strategy_address: Principal,
    pub underlying_asset: Principal,
    pub treasury: Principal,
    pub incentives_controller: Principal,
    pub d_token_name: String,
    pub d_token_symbol: String,
    pub variable_debt_token_name: String,
    pub variable_debt_token_symbol: String,
    pub stable_debt_token_name: String,
    pub stable_debt_token_symbol: String,
    pub params: Vec<u8>,
}

#[derive(Debug, CandidType, Deserialize, Serialize)]
pub struct CalculateInterestRatesParams {
    pub liquidity_added: u128,
    pub liquidity_taken: u128,
    pub total_stable_debt: u128,
    pub total_variable_debt: u128,
    pub average_stable_borrow_rate: u128,
    pub reserve_factor: u128,
    pub reserve: String,
    pub d_token: Principal,
}
