// use candid::{CandidType, Deserialize};
// // all the values will store in u128 for better precision
// use serde::Serialize;
// #[derive(Debug, CandidType, Deserialize, Clone)]
// pub struct ReserveData {
//     pub asset_name: Option<String>,
//     pub id: u16,
//     pub d_token_canister: Option<String>,
//     pub debt_token_canister: Option<String>,
//     pub borrow_rate: f64, 
//     pub supply_rate_apr: Option<f64>, 
//     pub total_supply: f64,
//     pub total_borrowed: f64,
//     pub liquidity_index: f64,
//     pub current_liquidity_rate: f64,
//     pub debt_index: f64,
//     pub configuration: ReserveConfiguration,
//     pub can_be_collateral: Option<bool>,
//     pub last_update_timestamp: u64,
// }

// #[derive(CandidType, Deserialize, Clone, Debug)]
// pub struct ReserveCache {
//     pub reserve_configuration: ReserveConfiguration,
//     //Liquidity Index(t)=Liquidity Index(t−1) ×(1+ Borrow Interest Rate×Δt/365×100)
//     pub curr_liquidity_index: f64,
//     pub next_liquidity_index: f64,
//     pub curr_liquidity_rate: f64,
//     pub d_token_canister: Option<String>,
//     pub debt_token_canister: Option<String>,
//     pub reserve_last_update_timestamp: u64,
//     pub curr_debt_index: f64,
//     pub curr_debt_rate: f64,
//     pub next_debt_rate: f64,
//     pub next_debt_index: f64,
//     pub debt_last_update_timestamp: u64,
//     pub reserve_factor: u16,

// }

// #[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
// pub struct ReserveConfiguration {
//     pub ltv: u16,
//     pub liquidation_threshold: u16,
//     pub liquidation_bonus: u16,  
//     pub borrowing_enabled: bool, 
//     pub borrow_cap: u64,
//     pub supply_cap: u64,               
//     pub liquidation_protocol_fee: u16, 
//     pub active: bool,
//     pub frozen: bool,
//     pub paused: bool,
//     pub reserve_factor: u16,
// }


// #[derive(CandidType, Deserialize, Clone, Debug)]
// pub struct ExecuteSupplyParams {
//     pub asset: String,
//     pub amount: u128,
//     pub is_collateral: bool,

// }

// #[derive(CandidType, Deserialize, Clone)]
// pub struct CalculateInterestRatesParams {
//     pub unbacked: u128,
//     pub liquidity_added: u128,
//     pub liquidity_taken: u128,
//     pub total_stable_debt: u128,
//     pub total_variable_debt: u128,
//     pub average_stable_borrow_rate: u128,
//     pub reserve_factor: u128,
//     pub reserve: String,
//     pub d_token: String,
// }

// #[derive(CandidType, Deserialize, Clone)]
// pub struct InitReserveParams {
//     pub asset: String,
//     pub d_token_address: String,
//     pub stable_debt_address: String,
//     pub variable_debt_address: String,
//     pub interest_rate_strategy_address: String,
//     pub reserves_count: u64,
//     pub max_number_reserves: u64,
// }

// #[derive(CandidType, Deserialize, Clone, PartialEq)]
// pub enum InterestRateMode {
//     None,
//     Stable,
//     Variable,
// }

// #[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
// pub struct ExecuteBorrowParams {
//     pub asset: String,
//     pub amount: u128,
// }

// #[derive(CandidType, Deserialize, Clone, Debug)]
// pub struct ExecuteRepayParams {
//     pub asset: String,
//     pub amount: u128,
//     pub on_behalf_of: Option<String>,
// }

// #[derive(CandidType, Deserialize, Clone, Debug)]
// pub struct ExecuteWithdrawParams {
//     pub asset: String,
//     pub amount: u128,
//     pub on_behalf_of: Option<String>,
//     pub is_collateral: bool,
// }



    // pub accrued_to_treasury: u128,  //portion of interest or fees collected by a decentralized finance (DeFi) protocol that is allocated to the protocol's treasury or reserve fund.

use candid::{CandidType, Deserialize};
use serde::Serialize;
#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: u128, 
    pub supply_rate_apr: Option<u128>, 
    pub total_supply: u128,
    pub total_borrowed: u128,
    pub liquidity_index: u128,
    pub current_liquidity_rate: u128,
    pub debt_index: u128,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
    pub userlist: Option<Vec<(String, bool)>>
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ReserveCache {
    pub reserve_configuration: ReserveConfiguration,
    //Liquidity Index(t)=Liquidity Index(t−1) ×(1+ Borrow Interest Rate×Δt/365×100)
    pub curr_liquidity_index: u128,
    pub next_liquidity_index: u128,
    pub curr_liquidity_rate: u128,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub reserve_last_update_timestamp: u64,
    pub curr_debt_index: u128,
    pub curr_debt_rate: u128,
    pub next_debt_rate: u128,
    pub next_debt_index: u128,
    pub debt_last_update_timestamp: u64,
    pub reserve_factor: u128,

}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: u128,
    pub liquidation_threshold: u128,
    pub liquidation_bonus: u128,  
    pub borrowing_enabled: bool, 
    pub borrow_cap: u128,
    pub supply_cap: u128,               
    pub liquidation_protocol_fee: u128, 
    pub active: bool,
    pub frozen: bool,
    pub paused: bool,
    pub reserve_factor: u128,
}


#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: u128,
    pub is_collateral: bool,

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
    pub d_token: String,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct InitReserveParams {
    pub asset: String,
    pub d_token_address: String,
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
    pub amount: u128,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: u128,
    pub on_behalf_of: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteWithdrawParams {
    pub asset: String,
    pub amount: u128,
    pub on_behalf_of: Option<String>,
    pub is_collateral: bool,
}



    // pub accrued_to_treasury: u128,  //portion of interest or fees collected by a decentralized finance (DeFi) protocol that is allocated to the protocol's treasury or reserve fund.