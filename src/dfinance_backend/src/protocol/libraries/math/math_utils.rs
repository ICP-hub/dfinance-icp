use std::ops::Mul;

use candid::Nat;


fn get_scaling_value() -> Nat {
    Nat::from(100000000u128)
}

const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 365 days
//leap year calculation left 
pub fn calculate_linear_interest(rate_input: Nat, last_update_timestamp: u64) -> Nat {
    let rate = rate_input/Nat::from(100u128);
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    ic_cdk::println!("current time in cal_linear function {} and seconds per year {} and last timestamp {}", current_timestamp, SECONDS_PER_YEAR, last_update_timestamp);
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate.clone() * time_delta / SECONDS_PER_YEAR;
    ic_cdk::println!("time_delta as u128 / SECONDS_PER_YEAR as u128 {}", time_delta / SECONDS_PER_YEAR);
    ic_cdk::println!("time delta {} and result {} and rate {}", time_delta, result, rate);
    get_scaling_value() + result
}


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
    let rate = rate_input / Nat::from(100u128);
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



pub fn calculate_compounded_interest_with_current_timestamp(
    rate: Nat,
    last_update_timestamp: u64,
) -> Nat {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    calculate_compounded_interest(rate, last_update_timestamp, current_timestamp)
}

pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
    fn scaled_div(self, other: Self) -> Self;
    fn to_scaled(self) -> Nat;
}

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
