use candid::Principal;
use candid::{CandidType, Deserialize, Nat};
use serde::Serialize;
use std::ops::Mul;
mod utils;
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::constant_variables::*;

#[test]
fn call_test_function() {
    test_calculate_linear_interest();
    test_calculate_compounded_interest();
    futures::executor::block_on(test_calculate_interest_rates());
    futures::executor::block_on(test_accrue_to_treasury());
}

impl Default for AccrueToTreasuryLocalVars {
    fn default() -> Self {
        AccrueToTreasuryLocalVars {
            prev_total_variable_debt: Nat::from(ZERO_VALUE),
            curr_total_variable_debt: Nat::from(ZERO_VALUE),
            total_debt_accrued: Nat::from(ZERO_VALUE),
            amount_to_mint: Nat::from(ZERO_VALUE),
        }
    }
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
    ic_cdk::println!("current time in cal_compound function {} and seconds per year {} and last timestamp {} and rate input {}", current_timestamp, SECONDS_PER_YEAR, last_update_timestamp, rate_input);
    let exp = current_timestamp - last_update_timestamp;
    ic_cdk::println!("exp (time difference): {}", exp);
    if exp == 0 {
        ic_cdk::println!("exp is 0, returning SCALING_FACTOR {}", get_scaling_value());
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

    let base_power_two = rate.clone().scaled_mul(rate.clone())
        / (SECONDS_PER_YEAR as u128 * SECONDS_PER_YEAR as u128);
    ic_cdk::println!("Base power two: {}", base_power_two);

    let base_power_three =
        base_power_two.clone().scaled_mul(rate.clone()) / SECONDS_PER_YEAR as u128;
    ic_cdk::println!("Base power three: {}", base_power_three);

    let second_term = (exp as u128 * exp_minus_one as u128 * base_power_two) / Nat::from(2u128);
    ic_cdk::println!("Second term: {}", second_term);

    let third_term =
        (exp as u128 * exp_minus_one as u128 * exp_minus_two as u128 * base_power_three)
            / Nat::from(6u128);
    ic_cdk::println!("Third term: {}", third_term);

    let result = get_scaling_value() + scaled_rate + second_term + third_term;
    ic_cdk::println!("Final result: {}", result);

    result
}

/*
 * @title User Normalized Supply
 * @notice Computes the updated liquidity index based on interest rates.
 * @dev Returns the stored index if no update is needed; otherwise, applies linear interest.
 * @param reserve_data - Reserve data containing rate and index information.
 * @return The updated liquidity index for the reserve.
 * @functionality Updates liquidity index based on linear interest since last update.
 */
pub fn user_normalized_supply(reserve_data: ReserveData) -> Result<Nat, errors::Error> {
    let current_time = 1_700_000_000;
    ic_cdk::println!("Current timestamp: {}", current_time);

    if reserve_data.last_update_timestamp == current_time {
        ic_cdk::println!("No update needed as timestamps match.");
        return Ok(reserve_data.liquidity_index);
    } else {
        let cumulated_liquidity_interest = calculate_linear_interest(
            reserve_data.current_liquidity_rate,
            reserve_data.last_update_timestamp,
        );
        ic_cdk::println!(
            "previoys liquidity index: {} for reserve",
            reserve_data.liquidity_index
        );
        //  user_reserve_data.liquidity_index =
        return Ok(cumulated_liquidity_interest.scaled_mul(reserve_data.liquidity_index));
    }
}

/*
 * @title Calculate Interest Rates
 * @notice Computes liquidity and borrow rates based on utilization ratio.
 * @dev Adjusts rates dynamically based on optimal and excess usage conditions.
 * @param liq_added - Amount of liquidity added to the reserve.
 * @param liq_taken - Amount of liquidity taken from the reserve.
 * @param total_debt - Total borrowed amount from the reserve.
 * @param params - Interest rate configuration parameters.
 * @param reserve - Reserve data including current supply and index info.
 * @param reserve_factor - Fraction of interest reserved by the protocol.
 * @param asset - Identifier of the asset for logging and context.
 * @return A tuple containing the updated liquidity rate and borrow rate.
 * @functionality Dynamically calculates interest rates for borrowing and supplying based on asset utilization.
 */
pub async fn calculate_interest_rates(
    liq_added: Nat,
    liq_taken: Nat,
    total_debt: Nat,
    params: &InterestRateParams,
    reserve: ReserveData,
    reserve_factor: Nat,
    asset: String,
) -> Result<(Nat, Nat), errors::Error> {
    ic_cdk::println!("\n----------- Calculating Interest Rates --------------\n");
    ic_cdk::println!("Asset: {:?}", asset);
    ic_cdk::println!("Total Debt: {:?}", total_debt);
    ic_cdk::println!("Liquidity Added: {:?}", liq_added);
    ic_cdk::println!("Liquidity Taken: {:?}", liq_taken);
    ic_cdk::println!("Reserve Factor: {:?}", reserve_factor);

    let mut current_liquidity_rate = Nat::from(ZERO_VALUE);
    let mut curr_borrow_rate = params.base_variable_borrow_rate.clone();

    let total_supply = reserve
        .clone()
        .asset_supply
        .scaled_mul(user_normalized_supply(reserve.clone())?);
    ic_cdk::println!("Total Supply: {:?}", total_supply);
    ic_cdk::println!("Liquidity in reserve: {:?}", reserve.asset_supply);
    // ic_cdk::println!("interest: {:?}", user_normalized_supply(reserve.clone()).unwrap());
    let available_liq = total_supply.clone() + liq_added.clone() - liq_taken.clone();

    ic_cdk::println!("Available Liquidity: {:?}", available_liq);

    if total_debt.clone() != Nat::from(ZERO_VALUE) {
        let utilization_ratio = total_debt
            .clone()
            .scaled_div(total_debt.clone() + available_liq.clone());
        ic_cdk::println!("Utilization Ratio: {:?}", utilization_ratio);
        ic_cdk::println!("Optimal Usage Ratio: {:?}", params.optimal_usage_ratio);

        if utilization_ratio > params.optimal_usage_ratio.clone() {
            let excess_ratio = utilization_ratio.clone() - params.optimal_usage_ratio.clone();
            let excess_usage_scaled = excess_ratio
                .clone()
                .scaled_div(params.max_excess_usage_ratio.clone());

            ic_cdk::println!("Excess Ratio: {:?}", excess_ratio);
            ic_cdk::println!("Excess Usage Scaled: {:?}", excess_usage_scaled);

            curr_borrow_rate += params.variable_rate_slope1.clone()
                + params
                    .variable_rate_slope2
                    .clone()
                    .scaled_mul(excess_usage_scaled);

            ic_cdk::println!(
                "Borrow Rate (After Excess Usage Applied): {:?}",
                curr_borrow_rate
            );
        } else {
            curr_borrow_rate += params
                .variable_rate_slope1
                .clone()
                .scaled_mul(utilization_ratio.clone())
                .scaled_div(params.optimal_usage_ratio.clone());

            ic_cdk::println!("Borrow Rate (Within Optimal Usage): {:?}", curr_borrow_rate);
        }

        current_liquidity_rate = curr_borrow_rate
            .clone()
            .scaled_mul(utilization_ratio.clone())
            .scaled_mul(Nat::from(100_000_000u128) - (reserve_factor / Nat::from(100u128)));

        ic_cdk::println!("Final Borrow Rate: {:?}", curr_borrow_rate);
        ic_cdk::println!("Final Liquidity Rate: {:?}", current_liquidity_rate);
    }

    ic_cdk::println!("\n------------ Interest Rate Calculation Completed -------------\n");

    Ok((current_liquidity_rate, curr_borrow_rate))
}

/*
 * @title Accrue to Treasury
 * @notice Computes and transfers accrued interest to the platform treasury.
 * @dev Calculates debt accrued and mints the corresponding amount for the treasury.
 * @functionality Allocates a portion of accrued interest to the treasury based on the reserve factor.
 */

pub fn accrue_to_treasury(
    reserve_data: &mut ReserveData,
    reserve_cache: &ReserveCache,
) -> Result<(), errors::Error> {
    let mut vars = AccrueToTreasuryLocalVars::default();

    if reserve_cache.reserve_factor == Nat::from(ZERO_VALUE) {
        return Ok(());
    }

    vars.prev_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.curr_debt_index.clone(),
    );
    ic_cdk::println!(
        "prev_total_variable_debt in accure: {:?}",
        vars.prev_total_variable_debt
    );

    vars.curr_total_variable_debt = ScalingMath::scaled_mul(
        reserve_cache.curr_debt.clone(),
        reserve_cache.next_debt_index.clone(),
    );
    ic_cdk::println!(
        "curr_total_variable_debt in accure: {:?}",
        vars.curr_total_variable_debt
    );

    if vars.curr_total_variable_debt < vars.prev_total_variable_debt {
        return Err(errors::Error::AmountSubtractionError);
    }

    vars.total_debt_accrued = vars.curr_total_variable_debt - vars.prev_total_variable_debt;
    ic_cdk::println!(
        "total_debt_accrued in accure: {:?}",
        vars.total_debt_accrued
    );
    vars.amount_to_mint = ScalingMath::scaled_mul(
        vars.total_debt_accrued.clone(),
        reserve_cache.reserve_factor.clone(),
    ); //percent
    ic_cdk::println!("amount_to_mint in accure: {:?}", vars.amount_to_mint);
    if vars.amount_to_mint != Nat::from(ZERO_VALUE) {
        reserve_data.accure_to_platform += (ScalingMath::scaled_mul(
            vars.amount_to_mint,
            reserve_cache.next_liquidity_index.clone(),
        )) / 100 as u128;
        ic_cdk::println!(
            "accure_to_platform in accure: {:?}",
            reserve_data.accure_to_platform
        );
    }
    Ok(())
}

/*
 * @title Test Linear Interest Calculation
 * @notice Validates the linear interest calculation functionality.
 * @dev Ensures that the calculation of linear interest is correct based on rate and timestamps.
 * @functionality Verifies that linear interest is computed and matches the expected output based on various rate and time conditions.
 */
fn test_calculate_linear_interest() {
    let current_timestamp = 1_700_000_000;

    #[derive(Debug, Clone)]
    struct TestCase {
        rate_input: Nat,
        last_update_timestamp: u64,
        expected_output: Nat,
    }

    let test_cases = vec![
        TestCase {
            rate_input: Nat::from(5u128), // 5% annual interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR, // 1 year ago
            expected_output: get_scaling_value() + Nat::from(5u128),
        },
        TestCase {
            rate_input: Nat::from(10u128), // 10% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR / 2), // 6 months ago
            expected_output: get_scaling_value() + Nat::from(5u128),
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

/*
 * @title Test Compounded Interest Calculation
 * @notice Validates the compounded interest calculation functionality.
 * @dev Ensures that the compounded interest is calculated accurately based on the rate and timestamps.
 * @functionality Verifies that compounded interest is computed correctly and matches the expected output based on rate and time conditions.
 */
fn test_calculate_compounded_interest() {
    #[derive(Debug, Clone)]
    struct TestCase {
        rate_input: Nat,
        last_update_timestamp: u64,
        expected_output: Nat,
    }

    let current_timestamp = 1_700_000_000; // Mocked timestamp for testing

    let test_cases = vec![
        TestCase {
            rate_input: Nat::from(5u128), // 5% annual interest
            last_update_timestamp: current_timestamp - SECONDS_PER_YEAR, // 1 year ago
            expected_output: get_scaling_value() + Nat::from(5u128), // Approximation
        },
        TestCase {
            rate_input: Nat::from(10u128), // 10% annual interest
            last_update_timestamp: current_timestamp - (SECONDS_PER_YEAR / 2), // 6 months ago
            expected_output: get_scaling_value() + Nat::from(5u128), // Approximation
        },
    ];

    println!("\n======================== Running `calculate_compounded_interest` Tests ========================\n");

    for (i, case) in test_cases.iter().enumerate() {
        println!("\n------------------------------------------------------------");
        println!("🔵 Test Case {}: Calculating Compounded Interest", i + 1);
        println!("Rate Input: {}%", case.rate_input);
        println!("Last Update Timestamp: {}", case.last_update_timestamp);
        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Expected Output: {}", amount_float / 100000000.0);
        println!("------------------------------------------------------------\n");

        let result = calculate_compounded_interest(
            case.rate_input.clone(),
            case.last_update_timestamp,
            current_timestamp,
        );

        let amount_u128: u64 = case.expected_output.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;

        let amount_u128_result: u64 = result.clone().0.try_into().unwrap();
        let amount_float_result = amount_u128_result as f64;

        if result == case.expected_output {
            println!(
                "✅ Test Case {} Passed: Expected Borrow Index = {}, Got = {}",
                i + 1,
                amount_float / 100000000.0,
                amount_float_result / 100000000.0
            );
        } else {
            println!("❌ Test Case {} Failed:", i + 1);
            println!("   Expected Borrow Index: {}", amount_float / 100000000.0);
            println!("   Got:      {}", amount_float_result / 100000000.0);
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

    println!("\n======================== All test cases completed. ========================\n");
}

/*
 * @title Test Interest Rate Calculation
 * @notice Validates the calculation of liquidity and borrow rates based on given parameters.
 * @dev Ensures that the liquidity and borrow rates are calculated accurately based on liquidity added, liquidity taken, total debt, and various configuration parameters.
 * @functionality Verifies the accuracy of the interest rate calculation based on real-world asset data and the platform’s rate parameters.
 */
async fn test_calculate_interest_rates() {
    #[derive(Debug, Clone)]
    struct TestCase {
        liq_added: Nat,
        liq_taken: Nat,
        total_debt: Nat,
        params: InterestRateParams,
        reserve: ReserveData,
        reserve_factor: Nat,
        asset: String,
        expected_liquidity_rate: Nat,
        expected_borrow_rate: Nat,
    }

    let test_cases = vec![TestCase {
        liq_added: Nat::from(1_000u128),
        liq_taken: Nat::from(500u128),
        total_debt: Nat::from(5_000u128),
        params: InterestRateParams {
            base_variable_borrow_rate: Nat::from(3u128),
            optimal_usage_ratio: Nat::from(80u128),
            max_excess_usage_ratio: Nat::from(20u128),
            variable_rate_slope1: Nat::from(2u128),
            variable_rate_slope2: Nat::from(4u128),
        },
        reserve: ReserveData {
            asset_name: "TestAsset".to_string(),
            id: 1,
            d_token_canister: Principal::from_text("canister1").ok(),
            debt_token_canister: Principal::from_text("canister2").ok(),
            borrow_rate: Nat::from(5u128),
            current_liquidity_rate: Nat::from(2u128),
            asset_supply: Nat::from(10_000u128),
            asset_borrow: Nat::from(3_000u128),
            liquidity_index: Nat::from(1_000_000u128),
            debt_index: Nat::from(1_000_000u128),
            configuration: ReserveConfiguration {
                ltv: Nat::from(75u128),
                liquidation_threshold: Nat::from(85u128),
                liquidation_bonus: Nat::from(10u128),
                borrowing_enabled: true,
                borrow_cap: Nat::from(100_000u128),
                supply_cap: Nat::from(200_000u128),
                liquidation_protocol_fee: Nat::from(5u128),
                active: true,
                frozen: false,
                paused: false,
                reserve_factor: Nat::from(10u128),
            },
            can_be_collateral: Some(true),
            last_update_timestamp: 1_700_000_000,
            accure_to_platform: Nat::from(500u128),
        },
        reserve_factor: Nat::from(10u128),
        asset: "TestAsset".to_string(),
        expected_liquidity_rate: Nat::from(15_943_866u128),
        expected_borrow_rate: Nat::from(17_857_131u128),
    }];

    for (i, case) in test_cases.iter().enumerate() {
        println!("\n------------------------------------------------------------");
        println!("🔵 Test Case {}: Calculating Interest Rates", i + 1);
        println!("Liquidity Added: {:?}", case.liq_added);
        println!("Liquidity Taken: {:?}", case.liq_taken);
        println!("Total Debt: {:?}", case.total_debt);
        println!("Asset: {:?}", case.asset);
        let amount_u128: u64 = case.expected_liquidity_rate.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        println!("Expected Liquidity Rate: {:?}", amount_float / 100000000.0);

        let amount_u128_borrow: u64 = case.expected_borrow_rate.clone().0.try_into().unwrap();
        let amount_float_borrow = amount_u128_borrow as f64;
        println!(
            "Expected Borrow Rate: {:?}",
            amount_float_borrow / 100000000.0
        );
        println!("------------------------------------------------------------\n");

        let result = calculate_interest_rates(
            case.liq_added.clone(),
            case.liq_taken.clone(),
            case.total_debt.clone(),
            &case.params,
            case.reserve.clone(),
            case.reserve_factor.clone(),
            case.asset.clone(),
        )
        .await;

        match result {
            Ok((liquidity_rate, borrow_rate)) => {
                let amount_u128: u64 = liquidity_rate.clone().0.try_into().unwrap();
                let amount_float = amount_u128 as f64;

                let amount_u128_borrow: u64 = borrow_rate.clone().0.try_into().unwrap();
                let amount_float_borrow = amount_u128_borrow as f64;
                println!(
                    "🔹 Calculated Liquidity Rate: {}",
                    amount_float / 100000000.0
                );
                println!(
                    "🔹 Calculated Borrow Rate: {}",
                    amount_float_borrow / 100000000.0
                );

                assert_eq!(
                    liquidity_rate,
                    case.expected_liquidity_rate,
                    "❌ Test Case {} Failed: Expected Liquidity Rate {}, Got {}",
                    i + 1,
                    case.expected_liquidity_rate,
                    liquidity_rate
                );

                assert_eq!(
                    borrow_rate,
                    case.expected_borrow_rate,
                    "❌ Test Case {} Failed: Expected Borrow Rate {}, Got {}",
                    i + 1,
                    case.expected_borrow_rate,
                    borrow_rate
                );

                println!("✅ Test Case {} Passed", i + 1);
            }
            Err(e) => {
                println!("❌ Test Case {} Failed with Error: {:?}", i + 1, e);
                panic!("Test Case {} encountered an error", i + 1);
            }
        }
    }

    println!("\n======================== All test cases completed. ========================\n");
}

/*
 * @title Test Accrue to Treasury
 * @notice Validates the accrued interest transfer functionality to the treasury.
 * @dev Ensures the calculation of accrued interest is accurate and matches the expected treasury amount.
 * @functionality Validates that the accrued interest is accurately computed and transferred to the platform treasury.
 */
async fn test_accrue_to_treasury() {
    #[derive(Debug, Clone)]
    struct TestCase {
        reserve_data: ReserveData,
        reserve_cache: ReserveCache,
        expected_accure_to_platform: Nat,
    }

    let test_cases = vec![TestCase {
        reserve_data: ReserveData {
            asset_name: "TestAsset".to_string(),
            id: 1,
            d_token_canister: Principal::from_text("canister1").ok(),
            debt_token_canister: Principal::from_text("canister2").ok(),
            borrow_rate: Nat::from(5u128),
            current_liquidity_rate: Nat::from(2u128),
            asset_supply: Nat::from(10_000u128),
            asset_borrow: Nat::from(3_000u128),
            liquidity_index: Nat::from(1_000_000u128),
            debt_index: Nat::from(1_000_000u128),
            configuration: ReserveConfiguration {
                ltv: Nat::from(75u128),
                liquidation_threshold: Nat::from(85u128),
                liquidation_bonus: Nat::from(10u128),
                borrowing_enabled: true,
                borrow_cap: Nat::from(10_0000u128),
                supply_cap: Nat::from(200_000u128),
                liquidation_protocol_fee: Nat::from(5u128),
                active: true,
                frozen: false,
                paused: false,
                reserve_factor: Nat::from(10u128),
            },
            can_be_collateral: Some(true),
            last_update_timestamp: 1_700_000_000,
            accure_to_platform: Nat::from(500u128),
        },
        reserve_cache: ReserveCache {
            reserve_configuration: ReserveConfiguration {
                ltv: Nat::from(75u128),
                liquidation_threshold: Nat::from(85u128),
                liquidation_bonus: Nat::from(10u128),
                borrowing_enabled: true,
                borrow_cap: Nat::from(100_000u128),
                supply_cap: Nat::from(200_000u128),
                liquidation_protocol_fee: Nat::from(5u128),
                active: true,
                frozen: false,
                paused: false,
                reserve_factor: Nat::from(10u128),
            },
            curr_liquidity_index: Nat::from(1_000_000u128),
            next_liquidity_index: Nat::from(1_200_000u128),
            curr_liquidity_rate: Nat::from(2u128),
            reserve_last_update_timestamp: 1_700_000_000,
            curr_debt_index: Nat::from(1_000_000u128),
            next_debt_index: Nat::from(1_100_000u128),
            curr_debt_rate: Nat::from(5u128),
            next_debt_rate: Nat::from(6u128),
            debt_last_update_timestamp: 1_700_000_000,
            reserve_factor: Nat::from(10u128),
            curr_debt: Nat::from(5_000u128),
            next_debt: Nat::from(5_500u128),
            curr_supply: Nat::from(10_000u128),
        },
        expected_accure_to_platform: Nat::from(500u128),
    }];

    for (i, case) in test_cases.iter().enumerate() {
        println!("\n------------------------------------------------------------");
        println!("🟡 Test Case {}: Accruing to Treasury", i + 1);
        let amount_u128: u64 = case
            .reserve_data
            .accure_to_platform
            .clone()
            .0
            .try_into()
            .unwrap();
        let amount_float = amount_u128 as f64;

        let amount_u128_borrow: u64 = case
            .expected_accure_to_platform
            .clone()
            .0
            .try_into()
            .unwrap();
        let amount_float_borrow = amount_u128_borrow as f64;
        println!(
            "Initial Accrue to Platform: {:.8}",
            amount_float / 100000000.0
        );

        println!("Reserve Factor: {:?}", case.reserve_cache.reserve_factor);
        println!(
            "Expected Accrue to Platform: {:.8}",
            amount_float_borrow / 100000000.0
        );

        println!("------------------------------------------------------------\n");

        let mut reserve_data = case.reserve_data.clone();
        let result = accrue_to_treasury(&mut reserve_data, &case.reserve_cache);
        
        match result {
            Ok(_) => {
                let amount_u128_borrow: u64 = reserve_data
                    .accure_to_platform
                    .clone()
                    .0
                    .try_into()
                    .unwrap();
                let amount_float_borrow = amount_u128_borrow as f64;
                ic_cdk::println!(
                    "✅ Test Case Passed with accure_to_platform {:.8}",
                    amount_float_borrow / 100000000.0
                );
                assert_eq!(
                    reserve_data.accure_to_platform,
                    case.expected_accure_to_platform,
                    "Test Case {} Failed: Expected Accure to Platform {}, Got {}",
                    i + 1,
                    case.expected_accure_to_platform,
                    reserve_data.accure_to_platform
                );
                println!("✅ Test Case {} Passed", i + 1);
            }
            Err(e) => {
                println!("❌ Test Case {} Failed with Error: {:?}", i + 1, e);
                panic!("Test Case {} encountered an error", i + 1);
            }
        }
    }
    println!("\n======================== All test cases completed. ========================\n");
}
