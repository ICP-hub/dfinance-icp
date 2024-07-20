use candid::{CandidType, Deserialize};
use std::ops::{Add, Div, Mul, Sub};

const RAY: u128 = 1_000_000_000_000_000_000_000_000_000;
const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 365 days

pub fn calculate_linear_interest(rate: u128, last_update_timestamp: u64) -> u128 {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate * time_delta as u128 / SECONDS_PER_YEAR as u128;
    RAY + result
}

pub fn calculate_compounded_interest(rate: u128, last_update_timestamp: u64, current_timestamp: u64) -> u128 {
    let exp = current_timestamp - last_update_timestamp;

    if exp == 0 {
        return RAY;
    }

    let exp_minus_one = exp - 1;
    let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };

    let base_power_two = rate.mul(rate) / (SECONDS_PER_YEAR as u128).mul(SECONDS_PER_YEAR as u128);
    let base_power_three = base_power_two.mul(rate) / SECONDS_PER_YEAR as u128;

    let second_term = exp as u128 * exp_minus_one as u128 * base_power_two / 2;
    let third_term = exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three / 6;

    RAY + (rate * exp as u128) / SECONDS_PER_YEAR as u128 + second_term + third_term
}

pub fn calculate_compounded_interest_with_current_timestamp(rate: u128, last_update_timestamp: u64) -> u128 {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    calculate_compounded_interest(rate, last_update_timestamp, current_timestamp)
}


trait RayMath {
    fn ray_mul(self, other: Self) -> Self;
    fn ray_div(self, other: Self) -> Self;
}

impl RayMath for u128 {
    fn ray_mul(self, other: u128) -> u128 {
        self.mul(other) / RAY
    }

    fn ray_div(self, other: u128) -> u128 {
        self.mul(RAY) / other
    }
}