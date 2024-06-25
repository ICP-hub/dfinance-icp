use std::thread::current;

use crate::{api::*, math::*};
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};

pub const AVERAGE_RAISED: f64 = 100000.0;
pub const PROJECT_LAUNCHED: f64 = 2.0;

#[query(guard = "is_phase3_active")]
pub fn get_fund_raised() -> f64 {
    AVERAGE_RAISED * PROJECT_LAUNCHED
}

#[query(guard = "is_phase3_active")]
pub fn get_launchpad_fees() -> f64 {
    get_fund_raised() * 0.03
}

#[query(guard = "is_phase3_active")]
pub fn funds_to_projects() -> f64 {
    get_fund_raised() - get_launchpad_fees()
}
