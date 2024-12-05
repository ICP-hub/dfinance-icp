use std::ops::{Div, Mul};

const SCALING_FACTOR: u128 = 100_000_000; //10^8
const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60; // 365 days
//leap year calculation left 
pub fn calculate_linear_interest(rate: u128, last_update_timestamp: u64) -> u128 {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate * time_delta as u128 / SECONDS_PER_YEAR as u128;
    SCALING_FACTOR + result
}


// pub fn calculate_compounded_interest(
//     rate: u128,
//     last_update_timestamp: u64,
//     current_timestamp: u64,
// ) -> u128 {
//     let exp = current_timestamp - last_update_timestamp;
//     if exp == 0 {
//         return SCALING_FACTOR;
//     }

//     let scaled_rate = rate * exp as u128 / SECONDS_PER_YEAR as u128;

//     let exp_minus_one = exp - 1;
//     let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };

//     let base_power_two = (rate * rate) / SCALING_FACTOR;
//     let base_power_three = (base_power_two * rate) / SCALING_FACTOR;

//     let second_term = (exp as u128 * exp_minus_one as u128 * base_power_two) / (2 * SECONDS_PER_YEAR as u128);
//     let third_term =
//         (exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three) / (6 * SECONDS_PER_YEAR as u128 * SECONDS_PER_YEAR as u128);

//     SCALING_FACTOR + scaled_rate + second_term + third_term
// }

pub fn calculate_compounded_interest(
    rate: u128,
    last_update_timestamp: u64,
    current_timestamp: u64,
) -> u128 {
    let exp = current_timestamp - last_update_timestamp;
    ic_cdk::println!("exp (time difference): {}", exp);

    if exp == 0 {
        ic_cdk::println!("No time has passed, returning SCALING_FACTOR: {}", SCALING_FACTOR);
        return SCALING_FACTOR;
    }

    let scaled_rate = rate * exp as u128 / SECONDS_PER_YEAR as u128;
    ic_cdk::println!("scaled_rate: {}", scaled_rate);

    let exp_minus_one = exp - 1;
    let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };
    ic_cdk::println!("exp_minus_one: {}", exp_minus_one);
    ic_cdk::println!("exp_minus_two: {}", exp_minus_two);

    let base_power_two = (rate * rate) / SCALING_FACTOR;
    ic_cdk::println!("base_power_two: {}", base_power_two);

    let base_power_three = (base_power_two * rate) / SCALING_FACTOR;
    ic_cdk::println!("base_power_three: {}", base_power_three);

    let second_term = (exp as u128 * exp_minus_one as u128 * base_power_two) / (2 * SECONDS_PER_YEAR as u128);
    ic_cdk::println!("second_term: {}", second_term);

    let third_term =
        (exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three) / (6 * SECONDS_PER_YEAR as u128 * SECONDS_PER_YEAR as u128);
    ic_cdk::println!("third_term: {}", third_term);

    let final_result = SCALING_FACTOR + scaled_rate + second_term + third_term;
    ic_cdk::println!("final_result (compounded interest): {}", final_result);

    final_result
}



pub fn calculate_compounded_interest_with_current_timestamp(
    rate: u128,
    last_update_timestamp: u64,
) -> u128 {
    let current_timestamp = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds
    
    calculate_compounded_interest(rate, last_update_timestamp, current_timestamp)
}

pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
    fn scaled_div(self, other: Self) -> Self;
    fn scaled_to_float(self) -> f64;
    fn to_scaled(self) -> u128;
}

impl ScalingMath for u128 {
    fn scaled_mul(self, other: u128) -> u128 {
        self.mul(other) / SCALING_FACTOR
    }

    fn scaled_div(self, other: u128) -> u128 {
        self.mul(SCALING_FACTOR) / other
    }

    fn scaled_to_float(self) -> f64 {
        self.div(SCALING_FACTOR) as f64
    }

    fn to_scaled(self) -> u128 {
        self.mul(SCALING_FACTOR)
    }
}
