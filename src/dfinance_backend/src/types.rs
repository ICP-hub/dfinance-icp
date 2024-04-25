use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize)]
pub struct User {
    pub username: String,
    pub full_name: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct Deposit {
    pub wallet_address: String,
    pub amount: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]

pub struct MonthlyData {
    pub total_deposits: f64,
    pub total_borrowed: f64,
    pub total_fees: f64,
    pub lending_apr: f64,
    pub buy_and_burn: f64,
    pub phase: u32,
    pub team_income: f64,
    pub fees_to_lender: f64,
    pub lender_lp_yield: f64,
    pub borrower_lp_yield: f64,
    pub current_month: u32,
    pub supply_stacked: f64,
}
