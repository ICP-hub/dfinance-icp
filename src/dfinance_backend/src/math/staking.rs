use std::thread::current;

use crate::{api::*, math::*};
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};

pub const STAKE_GROWTH_RATE: f64 = 0.1;
pub const SUPPLY_STACKED: f64 = 0.1;
pub const TOTAL_SUPPLY: f64 = 1000000000.0;
pub const ALLOCATION_FOR_STACKING: f64 = 0.1;
pub const MONTHS_TO_RELEASE: f64 = 36.0;
#[query(guard = "is_phase3_active")]
pub fn get_supply_stacked() -> f64 {
    SUPPLY_STACKED * (1.0 + (STAKE_GROWTH_RATE * get_total_months() as f64))
}

#[query(guard = "is_phase3_active")]
pub fn number_of_tokens_stacked() -> f64 {
    TOTAL_SUPPLY * get_supply_stacked()
}

#[query(guard = "is_phase3_active")]
pub fn tokens_emitted_per_month() -> f64 {
    (ALLOCATION_FOR_STACKING * TOTAL_SUPPLY) / MONTHS_TO_RELEASE
}

#[query(guard = "is_phase3_active")]
pub fn stacking_apr() -> f64 {
    (tokens_emitted_per_month() * 12.0) / 1.0 + number_of_tokens_stacked()
}
