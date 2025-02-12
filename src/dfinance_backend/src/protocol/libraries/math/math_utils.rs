use std::ops::Mul;
use candid::Nat;
use crate::constants::interest_variables::constants::SCALING_FACTOR;

/* 
 * @title Get Scaling Value
 * @dev Returns the SCALING_FACTOR used in interest calculations.
 * @returns The scaling factor as a `Nat` value.
 */
fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
}

const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 365 days
//leap year calculation left 

/* 
 * @title Calculate Linear Interest
 * @dev Computes interest using a simple linear model based on the provided interest rate.
 * @param rate_input The annual interest rate as a `Nat` (percentage basis).
 * @param last_update_timestamp The timestamp (in seconds) when the interest was last updated.
 * @returns The linear interest factor as a `Nat`, scaled using `SCALING_FACTOR`.
 */
pub fn calculate_linear_interest(rate_input: Nat, last_update_timestamp: u64) -> Nat {
    // let rate = rate_input/Nat::from(100u128);
        let rate = rate_input;
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    ic_cdk::println!("current time in cal_linear function {} and seconds per year {} and last timestamp {}", current_timestamp, SECONDS_PER_YEAR, last_update_timestamp);
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate.clone() * time_delta / SECONDS_PER_YEAR;
    ic_cdk::println!("time_delta as u128 / SECONDS_PER_YEAR as u128 {}", time_delta / SECONDS_PER_YEAR);
    ic_cdk::println!("time delta {} and result {} and rate {}", time_delta, result, rate);
    get_scaling_value() + result
}

/* 
 * @title Calculate Compounded Interest
 * @dev Computes interest using a continuous compounding formula based on the provided interest rate.
 * @param rate_input The annual interest rate as a `Nat` (percentage basis).
 * @param last_update_timestamp The timestamp (in seconds) when the interest was last updated.
 * @param current_timestamp The current timestamp (in seconds).
 * @returns The compounded interest factor as a `Nat`, scaled using `SCALING_FACTOR`.
 */
pub fn calculate_compounded_interest(
    rate_input: Nat,
    last_update_timestamp: u64,
    current_timestamp: u64,
) -> Nat {
    ic_cdk::println!("current time in cal_compound function {} and seconds per year {} and last timestamp {} and rate input {}", current_timestamp, SECONDS_PER_YEAR, last_update_timestamp, rate_input);
    let exp = current_timestamp - last_update_timestamp;
    ic_cdk::println!("exp (time difference): {}", exp);
    if exp == 0 {
        ic_cdk::println!("exp is 0, returning SCALING_FACTOR {}",get_scaling_value());
        return get_scaling_value();
    }
    let rate = rate_input;
    ic_cdk::println!("Rate calculated: {}", rate);
    
    let scaled_rate = (rate.clone() * exp as u128) / SECONDS_PER_YEAR as u128;
    ic_cdk::println!("Scaled rate: {}", scaled_rate);
    
    let exp_minus_one = exp - 1;
    ic_cdk::println!("exp_minus_one: {}", exp_minus_one);
    
    let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };
    ic_cdk::println!("exp_minus_two: {}", exp_minus_two);
    
    let base_power_two = rate.clone().scaled_mul(rate.clone()) / (SECONDS_PER_YEAR as u128 * SECONDS_PER_YEAR as u128) ;
    ic_cdk::println!("Base power two: {}", base_power_two);
    
    let base_power_three = base_power_two.clone().scaled_mul(rate.clone()) / SECONDS_PER_YEAR as u128;
    ic_cdk::println!("Base power three: {}", base_power_three);
    
    let second_term = (exp as u128 * exp_minus_one as u128 * base_power_two) / Nat::from(2u128);
    ic_cdk::println!("Second term: {}", second_term);
    
    let third_term =
        (exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three) / Nat::from(6u128);
    ic_cdk::println!("Third term: {}", third_term);
    
    let result = get_scaling_value() + scaled_rate + second_term + third_term;
    ic_cdk::println!("Final result: {}", result);
    
    result
}

/* 
 * @title Calculate Compounded Interest with Current Timestamp
 * @dev Calls `calculate_compounded_interest` using the current blockchain timestamp.
 * @param rate The annual interest rate as a `Nat` (percentage basis).
 * @param last_update_timestamp The timestamp (in seconds) when the interest was last updated.
 * @returns The compounded interest factor as a `Nat`, scaled using `SCALING_FACTOR`.
 */
pub fn calculate_compounded_interest_with_current_timestamp(
    rate: Nat,
    last_update_timestamp: u64,
) -> Nat {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    calculate_compounded_interest(rate, last_update_timestamp, current_timestamp)
}

/* 
 * @title Scaling Math Operations
 * @dev Defines mathematical operations for scaling values.
 * @notice Provides multiplication and division functions that handle `SCALING_FACTOR`.
 */
pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
    fn scaled_div(self, other: Self) -> Self;
    fn to_scaled(self) -> Nat;
}

/* 
 * @title ScalingMath Implementation for `Nat`
 * @dev Implements precise scaling operations for `Nat` using a predefined scaling factor.
 * @notice Ensures consistent precision in arithmetic operations such as multiplication and division.
 */
impl ScalingMath for Nat {
    fn scaled_mul(self, other: Nat) -> Nat {
        self.mul(other) / get_scaling_value()
    }

    fn scaled_div(self, other: Nat) -> Nat {
        self.mul(get_scaling_value()) / other
    }

    fn to_scaled(self) -> Nat {
        self.mul(get_scaling_value())
    }
}
