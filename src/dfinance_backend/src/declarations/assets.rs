use candid::{CandidType, Deserialize, Nat, Principal};

use crate::protocol::configuration::reserve_configuration::ReserveConfiguration;


// #[derive(Debug, CandidType, Deserialize, Clone)]
// pub struct ReserveData {
    
//     pub configuration: ReserveConfiguration,
//     pub liquidity_index: u128,
//     pub current_liquidity_rate: u128,
//     pub variable_borrow_index: u128,
//     pub current_variable_borrow_rate: u128, //borrow_rate
//     pub current_stable_borrow_rate: u128, //remove
//     pub last_update_timestamp: u64,
//     pub id: u16,
//     pub a_token_address: Principal,
    
//     pub stable_debt_token_address: Principal,
//     pub variable_debt_token_address: Principal,
    
//     pub interest_rate_strategy_address: Principal,
//     pub accrued_to_treasury: u128,
//     pub unbacked: u128,
//     pub isolation_mode_total_debt: u128,

// }
#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub borrow_rate: Option<f64>, //8.25
    pub supply_rate_apr: Option<f64>, //8.25
    // pub total_supply: Option<Nat>,
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
    pub reserve_factor: u128,   //The reserve factor determines the portion of the interest that goes into the reserve pool. when someone borrow, interest is distributed b/w lenders and pool. //how much
    //Liquidity Index(t)=Liquidity Index(t−1) ×(1+ Borrow Interest Rate×Δt/365×100)
    //If you deposit 100 DAI into Aave and the liquidity index increases from 1 to 1.05 over a certain period, your deposit is now worth 105 DAI (reflecting the interest earned).
    pub curr_liquidity_index: u128,
    pub next_liquidity_index: u128,
    //It tracks the cumulative interest rate applied to borrowed assets over time, helping to calculate the amount of interest that borrowers owe.
    pub curr_variable_borrow_index: u128,
    pub next_variable_borrow_index: u128,
    //When demand for borrowing an asset is high, the liquidity rate increases to incentivize more deposits. Conversely, if demand is low, the liquidity rate decreases.
    //utilization rate, which is the percentage of the total available assets that have been borrowed. A higher utilization rate generally leads to a higher liquidity rate.
    pub curr_liquidity_rate: u128,//APY //percentage rate at which your deposit grows. //This interest comes from the payments made by borrowers who are using the deposited assets.
    pub curr_variable_borrow_rate: u128,
    pub d_token_canister: Principal,
    // pub stable_debt_token_address: Principal,
    // pub variable_debt_token_address: Principal,
    pub debt_token_canister: Principal,
    pub reserve_last_update_timestamp: u64,
    // pub curr_scaled_variable_debt: u128,
    // pub next_scaled_variable_debt: u128,
    pub curr_principal_stable_debt: u128,
    pub curr_total_stable_debt: u128,
    pub curr_avg_stable_borrow_rate: u128,
    pub stable_debt_last_update_timestamp: u64,
    pub next_total_stable_debt: u128,
    pub next_avg_stable_borrow_rate: u128,
}

// #[derive(CandidType, Deserialize, Clone, usize)]
// pub struct ReserveConfigurationMap {
//     pub data: U256,
// }

// #[derive(CandidType, Deserialize, Clone, Default)]
// pub struct ReserveData {
//     pub configuration: ReserveConfiguration,
//     pub a_token_address: Option<Principal>,
//     pub stable_debt_token_address: Option<Principal>,
//     pub variable_debt_token_address: Option<Principal>,
//     pub interest_rate_strategy_address: Option<Principal>,
//     pub liquidity_index: Option<u128>,
//     pub variable_borrow_index: Option<u128>,
//     pub current_liquidity_rate: Option<u128>,
//     pub current_variable_borrow_rate: Option<u128>,
//     pub current_stable_borrow_rate: Option<u128>,
//     pub last_update_timestamp: Option<u64>,
//     pub id: u16,
//     pub accrued_to_treasury: Option<u128>,
//     pub unbacked: u128,
//     pub isolation_mode_total_debt: u128,
//     // pub total_stable_debt: Option<u128>,
//     // pub total_variable_debt: Option<u128>,
//     // pub reserve_factor: Option<u128>,
    
// }

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteSupplyParams {
    // pub asset: Principal,
    pub asset: String,
    pub amount: u128,
    pub on_behalf_of: String,
    pub is_collateral: bool,
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

// #[derive(CandidType, Deserialize, Clone)]
// pub enum InterestRateMode {
//     None,
//     Stable,
//     Variable,
// }

// #[derive(CandidType, Deserialize, Clone)]
// struct ExecuteBorrowParams {
//     pub asset: String,
//     pub user: Principal,
//     pub on_behalf_of: Principal,
//     pub amount: Nat,
//     pub interest_rate_mode: InterestRateMode,
//     pub referral_code: u16,
//     pub release_underlying: bool,
//     pub max_stable_rate_borrow_size_percent: Nat,
//     pub reserves_count: Nat,
//     pub exchange_canister: Principal,
//     pub user_emode_category: u8,
//     pub price_oracle_sentinel: Principal,
// }

// #[derive(CandidType, Deserialize, Clone)]
// struct ExecuteRepayParams {
//     pub asset: String,
//     pub amount: Nat,
//     pub interest_rate_mode: InterestRateMode,
//     pub on_behalf_of: Principal,
//     use_dtokens: bool,
// }

#[derive(CandidType, Deserialize, Clone, PartialEq)]
pub enum InterestRateMode {
    None,
    Stable,
    Variable,
}

// #[derive(CandidType, Deserialize, Clone, PartialEq)]
// pub struct ExecuteBorrowParams {
//     pub asset: String,
//     pub user: Principal,
//     pub on_behalf_of: Principal,
//     pub amount: u128,
//     pub interest_rate_mode: InterestRateMode,
//     pub referral_code: u16,
//     pub release_underlying: bool,
//     pub max_stable_rate_borrow_size_percent: Nat,
//     pub reserves_count: Nat,
//     pub exchange_canister: Principal,
//     pub user_emode_category: u8,
//     pub price_oracle_sentinel: Principal,
//     pub interestRateMode : InterestRateMode,
// }

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


