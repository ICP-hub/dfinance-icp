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

// #[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
// pub struct UserData {
//     pub net_worth: f64,
//     pub net_apy: f64,
//     pub health_factor: f64,
//     pub transaction_history: Vec<Transaction>,
//     pub faucet: Option<Vec<(String, u64)>>,
// }

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub net_worth: Option<u128>,
    // pub total_collateral: f64, //generalize all value in one base currency like eth
    // pub total_debt: f64,  
    // pub available_borrow: f64,
    pub net_apy: Option<f64>, //is needed?
    pub health_factor: Option<f64>,
    pub supply: Option<Vec<(String, u128)>>, // asset, amount
    pub borrow: Option<Vec<(String, u128)>>,
    // pub reserves: Vec<UserReserveData>,
    // pub ltv: f64, 
    // pub current_liquidation_threshold: f64,
}



#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub user_id: String,                   
    pub reserve: String,                    
    pub principal_stable_debt: u64,         // Principal amount of debt at a stable rate
    pub total_stable_debt: u64,             // Total stable debt including accrued interest
    pub total_variable_debt: u64,           // Total variable debt including accrued interest
    pub avg_stable_borrow_rate: f64,        // Weighted average stable borrow rate
    pub last_update_timestamp: u64,         // Timestamp of the last update to this data
    pub liquidity_index: f64,               // Liquidity index at the time of the last update
    pub variable_borrow_index: f64,         // Variable borrow index at the time of the last update
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
    // pub unbacked: u128,
    pub liquidity_added: u128,
    pub liquidity_taken: u128,
    pub total_stable_debt: u128,
    pub total_variable_debt: u128,
    pub average_stable_borrow_rate: u128,
    pub reserve_factor: u128,
    // pub reserve: Principal,
    pub reserve: String,
    pub d_token: Principal,
}