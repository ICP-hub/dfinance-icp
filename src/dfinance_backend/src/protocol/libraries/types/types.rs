use std::collections::HashMap;

use candid::{CandidType, Nat};
use serde_bytes::ByteBuf;

use crate::{Deserialize, Serialize, Principal};

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct User {
    pub username: String,
    pub full_name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LiquidityEvent{
    pub token_amount : u128,
    pub timestamp : u64
}

pub type TokenDeposits = HashMap<String, Vec<LiquidityEvent>>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct AllowedTokens {
    pub name: &'static str,
    pub canister_id: &'static str,
}


#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct AllowanceArgs {
    pub account: Account,
    pub spender: Account,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(u128), // Assuming `Ok` returns a block index
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromError {
    BadFee { expected_fee: u128 },
    BadBurn { min_burn_amount: u128 },
    InsufficientFunds { balance: u128 },
    InsufficientAllowance { allowance: u128 },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: u128 },
    TemporarilyUnavailable,
    GenericError { error_code: u128, message: String },
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Allowance {
    pub allowance: u128,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    pub from: Account,
    pub to: Account,
    pub amount: u128, // Using u128 for large number representation
    pub fee: Option<u128>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArg {
    pub to: Account,
    pub fee: Option<Nat>,
    pub memo: Option<ByteBuf>,
    pub from_subaccount: Option<ByteBuf>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferResult {
    Ok(Nat),
    Err(String),
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
