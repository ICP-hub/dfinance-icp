use candid::Nat;
use crate::utils::constant_variables::*;



fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
}

/*
 * @title Calculate Linear Interest
 * @notice Computes interest accrued over time using a linear rate formula.
 * @dev Uses a fixed timestamp, calculates time delta, and scales the result.
 * @param rate_input - The interest rate (scaled Nat).
 * @param last_update_timestamp - The timestamp of the last update in seconds.
 * @return Accumulated linear interest scaled appropriately.
 * @functionality Returns the result of linear interest based on elapsed time and rate.
 */
pub fn calculate_linear_interest(rate_input: Nat, last_update_timestamp: u64) -> Nat {
    // let rate = rate_input/Nat::from(100u128);
    let rate = rate_input;
    let current_timestamp = 1_700_000_000; // Convert nanoseconds to seconds
    if last_update_timestamp > current_timestamp{
        ic_cdk::println!("Exponential function underflow"); //error
        return Nat::from(0u128); 
       //error result
    }
    ic_cdk::println!(
        "current time in cal_linear function {} and seconds per year {} and last timestamp {}",
        current_timestamp,
        SECONDS_PER_YEAR,
        last_update_timestamp
    );
    let time_delta = current_timestamp - last_update_timestamp;
    let result = rate.clone() * time_delta / SECONDS_PER_YEAR;
    ic_cdk::println!(
        "time_delta as u128 / SECONDS_PER_YEAR as u128 {}",
        time_delta / SECONDS_PER_YEAR
    );
    ic_cdk::println!(
        "time delta {} and result {} and rate {}",
        time_delta,
        result,
        rate
    );
    get_scaling_value() + result
}




/*
 * @title Test Linear Interest Calculation
 * @notice Validates the linear interest calculation functionality.
 * @dev Ensures that the calculation of linear interest is correct based on rate and timestamps.
 * @functionality Verifies that linear interest is computed and matches the expected output based on various rate and time conditions.
 */
pub fn test_calculate_linear_interest() {
    let current_timestamp = 1_700_000_000;

    #[derive(Debug, Clone)]
    struct TestCase {
        rate_input: Nat,
        last_update_timestamp: u64,
        expected_output: Nat,
    }

    let test_cases = vec![
        //simple 3% interest
        TestCase {
            rate_input: Nat::from(3_000_000u128), // 3% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR / 365), // 1 day ago
            expected_output: Nat::from(100_008_219u128),
        },
        //simple 8% interest
        TestCase {
            rate_input: Nat::from(8_000_000u128), // 8% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR - 950000), // 
            expected_output: Nat::from(107_759_005u128),
        },
        //simple 15% interest
        TestCase {
            rate_input: Nat::from(15_000_000u128), // 15% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR -222225), // 
            expected_output: Nat::from(114_894_299u128),
        },
        //simple 6% interest
        TestCase {
            rate_input: Nat::from(6_000_000u128), // 6% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR / 9), // 
            expected_output: Nat::from(100_666_666u128),
        },
        // simple 10% interest for 6 months
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR / 2), // 6 months ago
            expected_output: Nat::from(105_000_000u128),
        },
        // simple 0% interest for 1 year
        TestCase {
            rate_input: Nat::from(0u128), // 0% annual interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR, // 1 year
            expected_output: get_scaling_value() , // no growth
        },
        // simple 5% interest for 0 seconds
        TestCase {
            rate_input: Nat::from(0u128), // 0% annual interest
            last_update_timestamp: current_timestamp , // 0 time
            expected_output: get_scaling_value() , // no growth
        },
        // 0% interest for 0 seconds
        TestCase {
            rate_input: Nat::from(0u128), // 0% annual interest
            last_update_timestamp: current_timestamp, // 0 seconds
            expected_output: get_scaling_value() , // no growth
        },
        // simple 1% interest for 1 seconds
        TestCase {
            rate_input: Nat::from(1_000_000u128), // 5% annual interest
            last_update_timestamp: current_timestamp - 1, // 0 seconds
            expected_output: Nat::from(100_000_000u128) , // truncating interst to 0
        },
        //3% interest for 10 years
        TestCase {
            rate_input: Nat::from(3_000_000u128), // 3% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 10), // 10 years ago
            expected_output: Nat::from(130_000_000u128),
        },
        //50% interest for 1 years
        TestCase {
            rate_input: Nat::from(50_000_000u128), // 50% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR), // 1 year ago
            expected_output: Nat::from(150_000_000u128),
        },
        //100% interest for 1 years
        TestCase {
            rate_input: Nat::from(100_000_000u128), // 100% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR), // 1 year ago
            expected_output: Nat::from(200_000_000u128),
        },
        //100% interest for .25 years (quarter)
        TestCase {
            rate_input: Nat::from(100_000_000u128), // 100% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR/4), // 1 year ago
            expected_output: Nat::from(125_000_000u128),
        },
        //60000% interest for 1 years  cc
        TestCase {
            rate_input: Nat::from(60_000_000_000u128), // 100% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR), // 1 year ago
            expected_output: Nat::from(60_100_000_000u128),
        },
        //10% interest from start of unix time  cc
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% annual interest
            last_update_timestamp: 0, // 0 seconds
            expected_output: Nat::from(639_066_463u128),
        },
        //10% interest for 1 year and 540000 seconds cc
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR + 540000), // 1 year and 54000 ago
            expected_output: Nat::from(110_171_232u128),
        },
        //10% interest for 540000 seconds less than a year cc
        TestCase {
            rate_input: Nat::from(10_000_000u128), // 10% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR - 540000), // 54000 seconds less than a year
            expected_output: Nat::from(109_828_767u128),
        },
        //.01% interest for 2 years
        TestCase {
            rate_input: Nat::from(10_000u128), // 0.01% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 2), // 2 years
            expected_output: Nat::from(100_020_000u128),
        },
        //.000001% interest for 10 years
        TestCase {
            rate_input: Nat::from(1u128), // 0.000001% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR * 10), // 10 years
            expected_output: Nat::from(100_000_010u128),
        },
        // last update timestamp in the future
        TestCase {
            rate_input: Nat::from(3_000_000u128), // 3% annual interest
            last_update_timestamp: current_timestamp + (SECONDS_PER_YEAR * 10), // 10 years later
            expected_output: Nat::from(0u128),
        },
    ];

    println!("\n======================== Running test cases for `calculate_linear_interest` ========================\n");

    for (i, case) in test_cases.iter().enumerate() {
        println!("\n------------------------------------------------------------");
        println!(
            "🔵 Test Case {}: Executing `calculate_linear_interest`",
            i + 1
        );
        println!("Rate Input: {}", case.rate_input);
        println!("Last Update Timestamp: {}", case.last_update_timestamp);
        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Expected Output: {}", amount_float / 100000000.0);
        println!("------------------------------------------------------------\n");

        let result = calculate_linear_interest(case.rate_input.clone(), case.last_update_timestamp);

        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;

        let amount_u128_result: u64 = result.clone().0.try_into().unwrap();
        let amount_float_result = amount_u128_result as f64;
        // ic_cdk::println!("Expected Output: {}", amount_float / 100000000.0);
        if result == case.expected_output {
            println!(
                "✅ Test Case {} Passed: Expected Liquidity Index = {}, Got = {}",
                i + 1,
                amount_float / 100000000.0,
                amount_float_result / 100000000.0
            );
        } else {
            println!("❌ Test Case {} Failed", i + 1);
            println!(
                "   Expected Liquidity Index: {}",
                amount_float / 100000000.0
            );
            println!("   Got:      {}", amount_float_result / 100000000.0);
        }

        assert_eq!(
            result,
            case.expected_output,
            "Test case {} failed: expected {}, got {}",
            i + 1,
            case.expected_output,
            result
        );
    }

    println!("\n======================== All test cases completed ========================\n");
}