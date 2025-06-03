use crate::constants::constant_variables::constants::{
    MAX_VALUE, SCALING_FACTOR, SECONDS_PER_YEAR, NANOS_PER_SECOND, TWO_VALUE, ZERO_VALUE
};
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::{debug, info};
use candid::Nat;
use ic_cdk::api::time;
use std::ops::Mul;

/*
 * @title Get Scaling Value
 * @functionality Provides access to the system's scaling factor used for fixed-point arithmetic
 * @dev Returns the SCALING_FACTOR used in interest calculations.
 * @returns The scaling factor as a `Nat` value.
 */
fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
}

/*
 * @title Calculate Linear Interest
 * @functionality Computes simple interest linearly based on time elapsed and interest rate
 * @dev Computes interest using a simple linear model based on the provided interest rate.
 * @param rate_input The annual interest rate as a `Nat` (percentage basis).
 * @param last_update_timestamp The timestamp (in seconds) when the interest was last updated.
 * 
 * @formula interest_factor = 1 + (rate * t / seconds_in_year)
 * Where:
 *   - `rate` is the interest rate per second (scaled using SCALING_FACTOR, e.g., 1e8)
 *   - `t` is the time difference in seconds (current_timestamp - last_update_timestamp)
 *   - `SCALING_FACTOR` ensures precision for financial operations which is 10^8.
 * 
 *          Note: The implementation returns `SCALING_FACTOR + (rate_input * time_delta / SECONDS_PER_YEAR)`.
 *          This implies `rate_input` already incorporates `SCALING_FACTOR` and the formula calculates
 *          `scaling_factor * (1 + (annual_rate * time_delta / seconds_in_year))`.
 *  
 * @returns The linear interest factor as a `Nat`, scaled using `SCALING_FACTOR`.
 */
pub fn calculate_linear_interest(rate_input: Nat, last_update_timestamp: u64) -> Nat {
    let rate = rate_input;
    let current_timestamp = current_timestamp();
    if last_update_timestamp > current_timestamp {
        debug!(
            "Last update timestamp ({}) is greater than current timestamp ({}). Returning 0.",
            last_update_timestamp, current_timestamp
        );
        return Nat::from(0u128);
    }
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate.clone() * time_delta / SECONDS_PER_YEAR;

    debug!(
        "time delta {} and result {} and rate {}, linear interest result: {}",
        time_delta, result, rate, get_scaling_value() + result.clone() 
    );

    get_scaling_value() + result

}

/*
 * @title Compounded Interest Calculation Inspired by Aave Protocol
 * @dev This function calculates compounded interest using a 3rd-order Taylor expansion approximation.
 *
 * Inspired Formula (from Aave Solidity Code):
 *
 *   1 + (rate * t) + (rate^2 * t * (t-1)) / (2) + (rate^3 * t * (t-1) * (t-2)) / (6)
 *
 * Where:
 *   - `rate` is the interest rate per second (scaled using SCALING_FACTOR, e.g., 1e8)
 *   - `t` is the time difference in seconds (current_timestamp - last_update_timestamp)
 *   - `SCALING_FACTOR` ensures precision for financial operations which is 10^8.
 *
 * This 3rd-order Taylor expansion is an efficient approximation for calculating compound interest
 * over small intervals without expensive exponential operations.
 * @param rate_input The annual interest rate as a `Nat` (percentage basis). e.g (1% -> 0.01 * 10^8)
 * @param last_update_timestamp The timestamp (in seconds) when the interest was last updated.
 * @param The current timestamp (in seconds).
 * @returns The compounded interest(debt index) factor as a `Nat`, scaled using `SCALING_FACTOR`.
*/

pub fn calculate_compounded_interest(
    rate_input: Nat,
    last_update_timestamp: u64,
    current_timestamp: u64,
) -> Nat {
    // Ensure that timestamps are valid (underflow check)
    if last_update_timestamp > current_timestamp {
        debug!(
            "Last update timestamp ({}) is greater than current timestamp ({}). Returning 0.",
            last_update_timestamp, current_timestamp
        );
        return Nat::from(0u128);
    }

    let exp = Nat::from(current_timestamp - last_update_timestamp);

    //If no time has passed, interest(Debt index) is 1 (scaled with 10^8)
    if exp == Nat::from(0u128) {
        info!("No time elapsed between timestamps. Returning scaling value.");
        return get_scaling_value();
    }
    debug!("time delta {} and rate_input {}", exp, rate_input);
    let rate = rate_input;
    //First Term: Linear interest (rate * t / SECONDS_PER_YEAR)
    let scaled_rate = if exp > SECONDS_PER_YEAR {
        Nat::from(0u128) // Prevent overflow
    } else {
        (rate.clone() * exp.clone()) / SECONDS_PER_YEAR
    };

    // Prepare (t-1) and (t-2) terms
    let exp_minus_one = exp.clone() - Nat::from(1u128);
    let exp_minus_two = if exp > Nat::from(TWO_VALUE) {
        exp.clone() - Nat::from(TWO_VALUE)
    } else {
        Nat::from(ZERO_VALUE)
    };
    // Calculate basePowerTwo = (rate^2) / (SECONDS_PER_YEAR^2)
    let base_power_two =
        (rate.clone().scaled_mul(rate.clone())) / (SECONDS_PER_YEAR * SECONDS_PER_YEAR);
    // Calculate basePowerThree = (rate^3) / (SECONDS_PER_YEAR^3)
    let base_power_three = if base_power_two > Nat::from(u128::MAX) {
        Nat::from(0u128) // Prevent overflow in base_power_three
    } else {
        (base_power_two.clone().scaled_mul(rate)) / SECONDS_PER_YEAR
    };
    //Second Term: Quadratic interest (rate^2 * t * (t-1) / 2)
    let second_term = (exp.clone() * exp_minus_one.clone() * base_power_two) / Nat::from(2u128);

    //Third Term: Cubic interest (rate^3 * t * (t-1) * (t-2) / 6)
    let third_term = (exp * exp_minus_one * exp_minus_two * base_power_three) / Nat::from(6u128);

    // Result (Growth factor) scaled with 10^8
    let result =
        get_scaling_value() + scaled_rate.clone() + second_term.clone() + third_term.clone();
    debug!(
        "result {} and scaled_rate {} and second_term {} and third_term {}",
        result.clone(),
        scaled_rate,
        second_term,
        third_term
    ); //debug
    result
}

/*
 * @title Scaling Math Operations
 * @functionality Defines a trait for performing fixed-point arithmetic operations with consistent precision
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
 * @functionality Implements fixed-point arithmetic for the Nat type to maintain precision in financial calculations
 * @dev Implements precise scaling operations for `Nat` using a predefined scaling factor.
 * @notice Ensures consistent precision in arithmetic operations such as multiplication and division.
 */
impl ScalingMath for Nat {
    //Multiplies two Nat values, assuming both are already scaled by SCALING_FACTOR, 
    // and returns a result also scaled by SCALING_FACTOR. (Formula:(A * SF) * (B * SF) / SF = ABSF)
    fn scaled_mul(self, other: Nat) -> Nat {
        self.mul(other) / get_scaling_value()
    }

    // Divides twoNatvalues, assuming both are already scaled bySCALING_FACTOR, 
    // and returns a result also scaled bySCALING_FACTOR. (Formula:(A * SF) / (B * SF) * SF = (A/B)*SF)
    fn scaled_div(self, other: Nat) -> Nat {
        self.mul(get_scaling_value()) / other
    }

    // Multiplies a Nat value by the scaling factor and returns the result.
    // This is useful for converting a raw value to its scaled representation.
    // (Formula: A * SF)
    fn to_scaled(self) -> Nat {
        self.mul(get_scaling_value())
    }
}

/*
 * @title Maximum Value Helper
 * @functionality Provides access to the maximum value constraint for numerical operations
 * @dev Returns the maximum possible value that can be stored in a `Nat` type.
 *      This value is `2^128 - 1`, representing the largest unsigned 128-bit integer.
 * @returns `Nat` - The maximum possible `Nat` value.
 */
pub fn get_max_value() -> Nat {
    Nat::from(MAX_VALUE)
}

/*
 * @title Timestamp Utility
 * @functionality Provides standardized access to the current system time in seconds
 * @notice Returns the current timestamp in seconds.
 * @dev Converts nanoseconds from `time()` API to seconds.
 * @return `u64` The current timestamp.
 */
pub fn current_timestamp() -> u64 {
    time() / NANOS_PER_SECOND as u64
}
