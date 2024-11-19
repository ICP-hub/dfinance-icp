// pub accrued_to_treasury: u128,  //portion of interest or fees collected by a decentralized finance (DeFi) protocol that is allocated to the protocol's treasury or reserve fund
use candid::{CandidType, Deserialize};
use serde::Serialize;
#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: u128, 
    pub current_liquidity_rate: u128,
    pub total_supply: u128,
    pub asset_supply: u128,
    pub total_borrowed: u128,
    pub asset_borrow: u128,
    pub liquidity_index: u128,
    pub debt_index: u128,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
    pub accure_to_platform: u128,
    pub userlist: Option<Vec<(String, bool)>> //TODO remove this if not needed for liq bot
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ReserveCache {
    pub reserve_configuration: ReserveConfiguration,
    //Liquidity Index(t)=Liquidity Index(t−1) ×(1+ Borrow Interest Rate×Δt/365×100) 
    pub curr_liquidity_index: u128,
    pub next_liquidity_index: u128,
    pub curr_liquidity_rate: u128,
    //next_rate if needed
    pub d_token_canister: Option<String>, //TODO remove 
    pub debt_token_canister: Option<String>, //remove
    pub reserve_last_update_timestamp: u64,
    pub curr_debt_index: u128,
    pub next_debt_index: u128,
    pub curr_debt_rate: u128,
    pub next_debt_rate: u128,
    pub debt_last_update_timestamp: u64, //for variable debt it is needed or not 
    pub reserve_factor: u128,

    pub curr_debt: u128,
    pub curr_supply: u128,
   
}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: u128,
    pub liquidation_threshold: u128,
    pub liquidation_bonus: u128,  
    pub borrowing_enabled: bool, 
    pub borrow_cap: u128,   //TODO set it according to borrow
    pub supply_cap: u128,   //set it according to supply     
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