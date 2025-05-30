use candid:: Nat;
use tracing::{info,error,debug};
use std::ops::Mul;
use crate::utils::{common_functions::init_tracing, constant_variables::*};

pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
}

impl ScalingMath for Nat {
    fn scaled_mul(self, other: Nat) -> Nat {
        self.mul(other) / get_scaling_value()
    }
}


fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
}



/*
 * @title Calculate Compounded Interest
 * @notice Computes interest using a compounded formula based on time elapsed.
 * @dev Uses time delta, scaling factors, and power terms for accuracy.
 * @param rate_input - The interest rate (scaled Nat).
 * @param last_update_timestamp - The timestamp of the last update in seconds.
 * @param current_timestamp - The current timestamp in seconds.
 * @return Compounded interest over time, scaled appropriately.
 * @functionality Calculates compounded interest based on time delta using a power series expansion.
 */
pub fn calculate_compounded_interest(
    rate_input: Nat,
    last_update_timestamp: u64,
    current_timestamp: u64,
) -> Nat {

    init_tracing();
    info!("current time in cal_compound function {} and seconds per year {} and last timestamp {} and rate input {}", current_timestamp, SECONDS_PER_YEAR, last_update_timestamp, rate_input);
    if last_update_timestamp > current_timestamp{
        error!("Exponential function underflow"); 
        return Nat::from(0u128); 
    }
    let exp = current_timestamp - last_update_timestamp;
    debug!("exp (time difference): {}", exp);
    if exp == 0 {
        debug!("exp is 0, returning SCALING_FACTOR {}", get_scaling_value());
        return get_scaling_value();
    }
    let rate = rate_input;
    debug!("Rate calculated: {}", rate);

    let scaled_rate = (rate.clone() * exp as u128) / SECONDS_PER_YEAR as u128;
    debug!("Scaled rate: {}", scaled_rate);

    let exp_minus_one = exp - 1;
    debug!("exp_minus_one: {}", exp_minus_one);

    let exp_minus_two = if exp > 2 { exp - 2 } else { 0 };
    debug!("exp_minus_two: {}", exp_minus_two);

    let base_power_two = rate.clone().scaled_mul(rate.clone())
        / (SECONDS_PER_YEAR as u128 * SECONDS_PER_YEAR as u128);
    debug!("Base power two: {}", base_power_two);

    let base_power_three =
        base_power_two.clone().scaled_mul(rate.clone()) / SECONDS_PER_YEAR as u128;
    debug!("Base power three: {}", base_power_three);

    let second_term = (exp as u128 * exp_minus_one as u128 * base_power_two) / Nat::from(2u128);
    debug!("Second term: {}", second_term);

    let third_term =
        (exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three)
            / Nat::from(6u128);
    debug!("Third term: {}", third_term);

    let result = get_scaling_value() + scaled_rate + second_term + third_term;
    debug!("Final result: {}", result);

    result
}

/*
 * @title Test Compounded Interest Calculation
 * @notice Validates the compounded interest calculation functionality.
 * @dev Ensures that the compounded interest is calculated accurately based on the rate and timestamps.
 * @functionality Verifies that compounded interest is computed correctly and matches the expected output based on rate and time conditions.
 */
pub fn test_calculate_compounded_interest() {
    #[derive(Debug, Clone)]
    struct TestCase {
        rate_input: Nat,
        last_update_timestamp: u64,
        expected_output: Nat,
    }

    let current_timestamp = 1_700_000_000; // Mocked timestamp for testing

    let test_cases = vec![
        TestCase {
            rate_input: Nat::from(5_000_000u128), // 5% interest
            last_update_timestamp: current_timestamp , // time difference 0
            expected_output: get_scaling_value(), // Approximation
        },

        TestCase {
            rate_input: Nat::from(0u128), // 0% interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR , // 1 year
            expected_output: get_scaling_value(), // Approximation
        },
        TestCase {
            rate_input: Nat::from(0u128), // 0% interest
            last_update_timestamp: current_timestamp , // 0 time difference
            expected_output: get_scaling_value(), // Approximation
        },
        TestCase {
            rate_input: Nat::from(1_000_000u128), // 1% interest
            last_update_timestamp: current_timestamp - 1 , // 1 second ago
            expected_output: get_scaling_value(), // Approximation
        },
        TestCase {
            rate_input: Nat::from(1_000_000u128), // 1% interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR , // 1 year ago
            expected_output: Nat::from(101_000_000u128), // Approximation
        },

        TestCase {
            rate_input: Nat::from(1_000_000u128), // 1% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 10) , // 10 years ago
            expected_output: Nat::from(110_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(50_000_000u128), // 50% interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR , // 1 year ago
            expected_output: Nat::from(150_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(100_000_000u128), // 100% interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR, // 1 year ago
            expected_output: Nat::from(200_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(50_000_000u128), // 50% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR/2), // half a year ago
            expected_output: Nat::from(125_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(500_000_000u128), // 500% interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR, // 1 year ago
            expected_output: Nat::from(600_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR - 86400), // 1 day ago
            expected_output: Nat::from(109_972_602u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% interest
            last_update_timestamp: current_timestamp  - 2, // 2 seconds ago
            expected_output: Nat::from(100_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% interest
            last_update_timestamp: current_timestamp  - 2000, // 2000 seconds ago
            expected_output: Nat::from(100_000_634u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(60_000_000_000u128), // 60000% interest
            last_update_timestamp: current_timestamp  - SECONDS_PER_YEAR, // 1 year ago
            expected_output: Nat::from(60_100_000_000u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(26_000_000u128), // 26% interest
            last_update_timestamp: 0, // inception - time difference 1700-000-000
            expected_output: Nat::from(1_501_572_805u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(3_000_000u128), // 3% interest
            last_update_timestamp: current_timestamp + (SECONDS_PER_YEAR * 10), // 10 years later
            expected_output: Nat::from(0u128),
        },
        TestCase {
            rate_input: Nat::from(1u128), // 0.000001%  interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 10), // 10 years
            expected_output: Nat::from(100_000_010u128),
        },
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR + 540000), // 1 year and 54000 ago
            expected_output: Nat::from(110_171_232u128),
        },
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR - 540000), // 54000 seconds less than a year
            expected_output: Nat::from(109_828_767u128),
        },
        TestCase {
            rate_input: Nat::from(10_000u128), // 0.01% interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 2), // 2 years
            expected_output: Nat::from(100_020_000u128),
        },
        TestCase {
            rate_input: Nat::from(1_000_000u128), // 1% interest
            last_update_timestamp: 0, // time difference 0
            expected_output: Nat::from(101_000_000u128),
        },
    ];
    init_tracing();
    info!("\n======================== Running `calculate_compounded_interest` Tests ========================\n");

    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 Test Case {}: Calculating Compounded Interest", i + 1);
        info!("Rate Input: {}%", case.rate_input);
        info!("Last Update Timestamp: {}", case.last_update_timestamp);
        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Expected Output: {}", amount_float / 100000000.0);
        info!("------------------------------------------------------------\n");
        let mut curr_time = current_timestamp;
        if i == 20 {
            curr_time =31_536_000u64;
        }
        let result = calculate_compounded_interest(
            case.rate_input.clone(),
            case.last_update_timestamp,
            curr_time,
        );

        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;

        let amount_u128_result: u64 = result.clone().0.try_into().unwrap();
        let amount_float_result = amount_u128_result as f64;

        if result == case.expected_output {
            info!(
                "✅ Test Case {} Passed: Expected Borrow Index = {}, Got = {}",
                i + 1,
                amount_float / 100000000.0,
                amount_float_result / 100000000.0
            );
        } else {
            error!("❌ Test Case {} Failed:", i + 1);
            info!("   Expected Borrow Index: {}", amount_float / 100000000.0);
            info!("   Got:      {}", amount_float_result / 100000000.0);
        }

        assert_eq!(
            result,
            case.expected_output,
            "Test Case {} Failed: Expected {}, Got {}",
            i + 1,
            case.expected_output,
            result
        );
    }

    info!("\n======================== All test cases completed. ========================\n");
}