use crate::{types::*, with_state};
use candid::Principal;
use ciborium::value;
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};

use time::OffsetDateTime;

//global constant for utilization rate
pub const UTILIZATION_RATE: f64 = 0.5;

//global constant for interest rate
pub const INTEREST_RATE: f64 = 0.1;

//this function returns the current deposit
#[query]
pub fn get_current_deposist() -> f64 {
    with_state(|state| {
        let mut sum: f64 = 0.0;
        for (_, value) in state.total_deposits.iter() {
            sum += value; // Correctly using the same sum variable
        }
        sum
    })
}

//this function gets called internally and is used to change timestamp into month
pub fn timestamp_to_month(timestamp_ns: u64) -> u32 {
    //ic_cdk::api::time() returns ns of timestamp
    let timestamp_s = timestamp_ns / 1_000_000_000;
    // core funtion here : from_unix_timestamp()
    let date = OffsetDateTime::from_unix_timestamp(timestamp_s as i64).unwrap();

    date.month() as u32
}

//this function returns the total amount available for borrowing
#[query]
pub fn amount_available_for_borrowing() -> f64 {
    let total_deposit = get_current_deposist();
    total_deposit * UTILIZATION_RATE
}

//for testing
