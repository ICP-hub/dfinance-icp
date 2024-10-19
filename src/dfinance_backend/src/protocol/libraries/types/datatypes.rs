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

#[derive(Debug)]
pub struct Candid<T>(pub T);

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    pub net_worth: Option<u128>,
    pub total_collateral: Option<u128>,
    pub total_debt: Option<u128>,
    pub available_borrow: Option<u128>,
    pub net_apy: Option<u128>,
    pub health_factor: Option<u128>,
    pub ltv: Option<u128>,
    pub liquidation_threshold: Option<u128>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
    pub max_ltv: Option<u128>
    //index
    //total_supply
    

}

impl Default for UserData {
    fn default() -> Self {
        Self {
            user_id: Default::default(),
            net_worth: Some(0),
            total_collateral: Some(0),
            total_debt: Some(0),
            available_borrow: Some(0), 
            net_apy: Some(0),
            health_factor: Some(0),
            ltv: Some(0),
            liquidation_threshold: Some(0),
            reserves: Default::default(),
            max_ltv: Some(0)
        }
    }
}

#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub principal_stable_debt: u64,
    pub borrow_rate: u128,
    pub supply_rate: u128,
    // pub avg_stable_borrow_rate: u128,
    pub last_update_timestamp: u64,
    pub liquidity_index: u128,
    pub asset_supply: u128,
    pub asset_borrow: u128,
    pub variable_borrow_index: u128,
    pub asset_price_when_supplied: u128,
    pub asset_price_when_borrowed: u128,
}
impl Default for UserReserveData {
    fn default() -> Self {
        Self {
            reserve: Default::default(),
            principal_stable_debt: Default::default(),
            borrow_rate: Default::default(),
            supply_rate: Default::default(),
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
    // pub reserve_factor: u128,
    pub reserve: String,
    pub d_token: Option<String>,
}
