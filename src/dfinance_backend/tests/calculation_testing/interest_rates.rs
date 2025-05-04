use candid::Nat;
use std::ops::Mul;
use crate::calculation_testing::normalized_supply::user_normalized_supply;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::constant_variables::*;


pub trait ScalingMath {
    fn scaled_mul(self, other: Self) -> Self;
    fn scaled_div(self, other: Self) -> Self;
}

impl ScalingMath for Nat {
    fn scaled_mul(self, other: Nat) -> Nat {
        self.mul(other) / get_scaling_value()
    }

    fn scaled_div(self, other: Nat) -> Nat {
        self.mul(get_scaling_value()) / other
    }
}


fn get_scaling_value() -> Nat {
    Nat::from(SCALING_FACTOR)
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
        .scaled_mul(user_normalized_supply(reserve.clone()).unwrap());
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
 * @title Test Interest Rate Calculation
 * @notice Validates the calculation of liquidity and borrow rates based on given parameters.
 * @dev Ensures that the liquidity and borrow rates are calculated accurately based on liquidity added, liquidity taken, total debt, and various configuration parameters.
 * @functionality Verifies the accuracy of the interest rate calculation based on real-world asset data and the platform’s rate parameters.
 */
pub async fn test_calculate_interest_rates() {
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


     // Standard Rate Params Instance
     let standard_params = InterestRateParams {
        optimal_usage_ratio:       Nat::from(80_000_000u128), // 80%
        max_excess_usage_ratio:    Nat::from(20_000_000u128), // 20%
        base_variable_borrow_rate: Nat::from(1_000_000u128),  // 1%
        variable_rate_slope1:      Nat::from(4_000_000u128),  // 4%
        variable_rate_slope2:      Nat::from(60_000_000u128), // 60%
    };

    // Base Reserve Configuration Instance 
    let default_reserve_config = ReserveConfiguration {
        ltv:                       Nat::from(75_000_000u128), // 75%
        liquidation_threshold:     Nat::from(80_000_000u128), // 80%
        liquidation_bonus:         Nat::from(5_000_000u128),  // 5%
        borrowing_enabled:         true,
        borrow_cap:                Nat::from(1_000_000_000_000_000_000u128), // 10M tokens 
        supply_cap:                Nat::from(1_000_000_000_000_000_000u128), // 10M tokens
        liquidation_protocol_fee:  Nat::from(1_000_000u128),  // 1%
        reserve_factor:            Nat::from(10_000_000u128), // 10% scaled
    };

    // Base ReserveData Instance 
    let default_reserve_data = ReserveData {
        asset_name:                 "TestAsset".to_string(),
        id:                         1,
        d_token_canister:           None,
        debt_token_canister:        None,
        borrow_rate:                Nat::from(0u128),             // Initial rate 0%
        current_liquidity_rate:     Nat::from(0u128),             // Initial rate 0%
        asset_supply:               Nat::from(1_000_000_000_000u128), // 10k base units 
        asset_borrow:               Nat::from(0u128),             // 0
        liquidity_index:            Nat::from(100_000_000u128),    // 1.0 scaled index
        debt_index:                 Nat::from(100_000_000u128),    // 1.0 scaled index
        configuration:              default_reserve_config.clone(), // Clone the default config
        can_be_collateral:          Some(true),
        last_update_timestamp:      0,                            // 0
        accure_to_platform:         Nat::from(0u128),             // 0
    };




    let test_cases = vec![
        // Test Case 1: Zero Debt, Zero Utilization
        TestCase { // Checks base case with no borrowing activity.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(0u128),                            // 0 Debt base units
            params:                   standard_params.clone(),                     // Clone base params
            reserve:                  default_reserve_data.clone(),              // Clone base reserve data
            reserve_factor:           Nat::from(10_000_000u128),                   // 10% scaled
            asset:                    "TestAsset_ZeroU".to_string(),
            expected_liquidity_rate:  Nat::from(0u128),                            // 0% Liq APR scaled
            expected_borrow_rate:     Nat::from(1_000_000u128),                    // 1% Base Borrow APR scaled
        },

        // Test Case 2: Low Utilization (U = 20%)
        TestCase { // Checks rate calc below optimal U.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(250_000_000_000u128),            // 2.5k tokens debt base units
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_LowU".to_string(),
            expected_liquidity_rate:  Nat::from(399_600u128),                   // ~0.40% Liq APR scaled
            expected_borrow_rate:     Nat::from(2_000_000u128),                // 2.00% Borrow APR scaled
        },

        // Test Case 3: Mid Utilization (U = 50%)
        TestCase { // Checks rate calc below optimal U, higher utilization.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt base units
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_MidU".to_string(),
            expected_liquidity_rate:  Nat::from(1_748_250u128),               // ~1.75% Liq APR scaled
            expected_borrow_rate:     Nat::from(3_500_000u128),                // 3.50% Borrow APR scaled
        },

        // Test Case 4: Optimal Utilization (U = 80%)
         TestCase { // Checks boundary condition exactly at optimal U.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(4_000_000_000_000u128),         // 40k tokens debt base units
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_OptimalU".to_string(),
            expected_liquidity_rate:  Nat::from(3_996_000u128),               // ~4.00% Liq APR scaled
            expected_borrow_rate:     Nat::from(5_000_000u128),                // 5.00% Borrow APR scaled
        },

        // Test Case 5: High Utilization (U = 90%)
        TestCase { 
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(9_000_000_000_000u128),         // 90k tokens debt base units
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_HighU".to_string(),
            expected_liquidity_rate:  Nat::from(31_468_500u128),              // ~31.47% Liq APR scaled
            expected_borrow_rate:     Nat::from(35_000_000u128),               // 35.00% Borrow APR scaled
        },

        // Test Case 6: Zero available liquidity (U=100%)
        TestCase { // Tests U=1 edge case.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(1_000_000_000_000u128),         // Taken = Initial Supply (10k tokens)
            total_debt:               Nat::from(500_000_000_000u128),          // 5k tokens debt
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_ZeroAvail".to_string(),
            expected_liquidity_rate:  Nat::from(64_935_000u128),             // ~64.94% Liq APR scaled
            expected_borrow_rate:     Nat::from(65_000_000u128),              // 65.00% Borrow APR scaled (Max Rate)
        },

        // Test Case 7: Utilization slightly ABOVE Optimal (Nat truncation likely makes it optimal)
        TestCase { // Tests crossing the kink point upwards.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(4_000_000_000_001u128),         // 40k tokens + 1 base unit debt
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_JustAboveOptimal".to_string(),
            expected_liquidity_rate:  Nat::from(3_996_000u128),               // ~4.00% Liq APR scaled 
            expected_borrow_rate:     Nat::from(5_000_000u128),                // 5.00% Borrow APR scaled 
        },

         // Test Case 8: Utilization slightly BELOW Optimal
        TestCase { // Tests crossing the kink point downwards.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(3_999_999_999_999u128),         // 40k tokens - 1 base unit debt
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_JustBelowOptimal".to_string(),
            expected_liquidity_rate:  Nat::from(3_995_998u128),               // ~3.996% Liq APR scaled
            expected_borrow_rate:     Nat::from(4_999_998u128),               // ~5.00% Borrow APR scaled
        },

        // Test Case 9: Large Liquidity Added (Lowers U)
        TestCase { // Tests impact of large liq_added.
            liq_added:                Nat::from(9_000_000_000_000u128),         // Add 9k tokens
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_LargeLiqAdd".to_string(),
            expected_liquidity_rate:  Nat::from(132_098u128),                 // ~0.132% Liq APR scaled
            expected_borrow_rate:     Nat::from(1_454_545u128),                // ~1.454% Borrow APR scaled
        },

        // Test Case 10: Large Liquidity Taken (Increases U)
        TestCase { // Tests impact of large liq_taken.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(500_000_000_000u128),          // Take 5k tokens
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_LargeLiqTake".to_string(),
            expected_liquidity_rate:  Nat::from(2_885_998u128),               // ~2.886% Liq APR scaled
            expected_borrow_rate:     Nat::from(4_333_332u128),                // ~4.333% Borrow APR scaled
        },

         // Test Case 11: Zero Base Rate
        TestCase { // Tests model with zero base rate.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt (U=50%)
            params:                   InterestRateParams { base_variable_borrow_rate: Nat::from(0u32), ..standard_params.clone() },
            reserve:             default_reserve_data.clone(),
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_ZeroBase".to_string(),
            expected_liquidity_rate:  Nat::from(1_248_750u128),               // ~1.25% Liq APR scaled
            expected_borrow_rate:     Nat::from(2_500_000u128),                // 2.50% Borrow APR scaled
        },

         // Test Case 12: Zero Slope1
        TestCase { // Tests model with zero initial slope.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt (U=50%)
            params:                   InterestRateParams { variable_rate_slope1: Nat::from(0u32), ..standard_params.clone() },
            reserve:             default_reserve_data.clone(),
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_ZeroSlope1".to_string(),
            expected_liquidity_rate:  Nat::from(499_500u128),                // ~0.50% Liq APR scaled
            expected_borrow_rate:     Nat::from(1_000_000u128),                // 1.00% Borrow APR scaled
        },

         // Test Case 13: Zero Slope2
        TestCase { // Tests model with zero excess slope (U=90%).
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(9_000_000_000_000u128),         // 90k tokens debt (U=90%)
            params:                   InterestRateParams { variable_rate_slope2: Nat::from(0u32), ..standard_params.clone() },
            reserve:             default_reserve_data.clone(),             // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),               // 10% scaled
            asset:                    "TestAsset_ZeroSlope2".to_string(),
            expected_liquidity_rate:  Nat::from(4_495_500u128),               // ~4.50% Liq APR scaled
            expected_borrow_rate:     Nat::from(5_000_000u128),                // 5.00% Borrow APR scaled
        },

        // Test Case 14: Zero Optimal Usage Ratio (U > 0)
        TestCase { // Tests edge case where U > 0 = Optimal.
            liq_added:                Nat::from(100_000_000_000u128),     // 1k tokens added
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(2_000_000_000_000u128),   // 20k tokens debt
            params:                   InterestRateParams { optimal_usage_ratio: Nat::from(0u32), ..standard_params.clone() }, // Override optimal ratio
            reserve:             ReserveData { asset_supply: Nat::from(10_000_000_000_000u128), ..default_reserve_data.clone()}, // Override supply to 100k
            reserve_factor:           Nat::from(10_000_000u128),         // 10% scaled
            asset:                    "TestAsset_ZeroOptimal".to_string(),
            expected_liquidity_rate:  Nat::from(9_013_584u128),         // ~9.01% Liq APR scaled
            expected_borrow_rate:     Nat::from(54_586_775u128),           // ~54.59% Borrow APR scaled
        },

         // Test Case 15: Optimal = 100% (U=90%)
        TestCase { // Tests when optimal is max possible.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(9_000_000_000_000u128),         // 90k tokens debt (U=90%)
            params:                   InterestRateParams { optimal_usage_ratio: Nat::from(100_000_000u128), ..standard_params.clone() }, // Optimal = 100%
            reserve:             default_reserve_data.clone(),
            reserve_factor:           Nat::from(10_000_000u128),
            asset:                    "TestAsset_Optimal100".to_string(),
            expected_liquidity_rate:  Nat::from(4_135_860u128),              // ~4.135% Liq APR scaled
            expected_borrow_rate:     Nat::from(4_600_000u128),               // 4.60% Borrow APR scaled
        },

        // Test Case 16: Zero Reserve Factor (U=50%)
        TestCase { // Tests impact on liquidity rate only.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt (U=50%)
            params:                   standard_params.clone(),
            reserve:             ReserveData {
                                          configuration: ReserveConfiguration { 
                                              reserve_factor: Nat::from(0u128), // 0% scaled RF
                                              ..default_reserve_config.clone() 
                                          },
                                          ..default_reserve_data.clone() 
                                      },
            reserve_factor:           Nat::from(0u128),                          // RF=0
            asset:                    "TestAsset_ZeroRF".to_string(),
            expected_liquidity_rate:  Nat::from(1_750_000u128),                // 1.75% Liq APR scaled
            expected_borrow_rate:     Nat::from(3_500_000u128),                // 3.50% Borrow APR scaled
        },

         // Test Case 17: High Reserve Factor (50%, U=50%)
        TestCase { // Tests high RF impact on LR.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),         // 10k tokens debt (U=50%)
            params:                   standard_params.clone(),
            reserve:             ReserveData {
                                          configuration: ReserveConfiguration {
                                              reserve_factor: Nat::from(50_000_000u128), // 50%  RF
                                              ..default_reserve_config.clone()
                                          },
                                          ..default_reserve_data.clone()
                                      },
            reserve_factor:           Nat::from(50_000_000u128),                 // 50% scaled
            asset:                    "TestAsset_HighRF".to_string(),
            expected_liquidity_rate:  Nat::from(1_741_250u128),               // ~1.74% Liq APR scaled
            expected_borrow_rate:     Nat::from(3_500_000u128),               // 3.50% Borrow APR scaled
        },

        // Test Case 18: Tiny Asset Supply (Results in U=100% due to truncation)
        TestCase { // Checks with small denominator for U.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(10u128),                         // 10 base units debt
            params:                   standard_params.clone(),
            reserve:             ReserveData { asset_supply: Nat::from(10u128), ..default_reserve_data.clone() }, // Override supply to 10 base units
            reserve_factor:           Nat::from(10_000_000u128),                 // 10% 
            asset:                    "TestAsset_TinySupply".to_string(),
            expected_liquidity_rate:  Nat::from(1_748_250u128),                 // ~1.75% Liq APR scaled 
            expected_borrow_rate:     Nat::from(3_500_000u128),                // 3.50% Borrow APR scaled 
        },

        // Test Case 19: Huge Asset Supply (U=10%)
        TestCase { // Checks with large denominator for U.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_111_111_000_000_000u128),     // ~1.11M tokens debt
            params:                   standard_params.clone(),
            reserve:             ReserveData { asset_supply: Nat::from(1_000_000_000_000_000_000u128), ..default_reserve_data.clone() }, // Override supply to 10M tokens
            reserve_factor:           Nat::from(10_000_000u128),                // 10% scaled
            asset:                    "TestAsset_HugeSupply".to_string(),
            expected_liquidity_rate:  Nat::from(1_114u128),                // ~0.001114 Liq APR scaled
            expected_borrow_rate:     Nat::from(1_005_548u128),                 // 1.55% Borrow APR scaled
        },

         // Test Case 20: Different Rate Params (Steeper Slope1, U=50%)
        TestCase { // Tests different rate model parameters.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000u128),        // 10k tokens debt (U=50%)
            params:                   InterestRateParams { variable_rate_slope1: Nat::from(10_000_000u128), ..standard_params.clone() }, // Override Slope1=10%
            reserve:             default_reserve_data.clone(),
            reserve_factor:           Nat::from(10_000_000u128),
            asset:                    "TestAsset_SteepSlope1".to_string(),
            expected_liquidity_rate:  Nat::from(3_621_375u128),             // ~3.62% Liq APR scaled
            expected_borrow_rate:     Nat::from(7_250_000u128),              // 7.25% Borrow APR scaled
        },

         // Test Case 21: Different Rate Params (Higher Optimal U=90%, U=85%)
        TestCase { // Tests shift in optimal point.
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(5_666_666_666_666u128),        // ~56.7k tokens debt (U~=85%)
            params:                   InterestRateParams { optimal_usage_ratio: Nat::from(90_000_000u128), ..standard_params.clone() }, // Override Optimal=90%
            reserve:             default_reserve_data.clone(),
            reserve_factor:           Nat::from(10_000_000u128),
            asset:                    "TestAsset_HighOptimal".to_string(),
            expected_liquidity_rate:  Nat::from(4_057_047u128),              // ~4.05% Liq APR scaled
            expected_borrow_rate:     Nat::from(4_777_776u128),              // ~4.78% Borrow APR scaled
        },
         // Test Case 22: Very Large Debt (Near Overflow)
        TestCase { 
            liq_added:                Nat::from(0u128),
            liq_taken:                Nat::from(0u128),
            total_debt:               Nat::from(1_000_000_000_000_000_000_000_000_000u128), 
            params:                   standard_params.clone(),
            reserve:             default_reserve_data.clone(),           // Uses default supply=10k tokens
            reserve_factor:           Nat::from(10_000_000u128),
            asset:                    "TestAsset_LargeDebt".to_string(),
            expected_liquidity_rate:  Nat::from(64_934_996u128),                 // ~64.93% Liq APR scaled
            expected_borrow_rate:     Nat::from(64_999_997u128),                // ~65.00% Borrow APR scaled
        },
    ];













    // let test_cases = vec![TestCase {
    //     liq_added: Nat::from(1_000u128),
    //     liq_taken: Nat::from(500u128),
    //     total_debt: Nat::from(5_000u128),
    //     params: InterestRateParams {
    //         base_variable_borrow_rate: Nat::from(3u128),
    //         optimal_usage_ratio: Nat::from(80u128),
    //         max_excess_usage_ratio: Nat::from(20u128),
    //         variable_rate_slope1: Nat::from(2u128),
    //         variable_rate_slope2: Nat::from(4u128),
    //     },
    //     reserve: ReserveData {
    //         asset_name: "TestAsset".to_string(),
    //         id: 1,
    //         d_token_canister: Principal::from_text("canister1").ok(),
    //         debt_token_canister: Principal::from_text("canister2").ok(),
    //         borrow_rate: Nat::from(5u128),
    //         current_liquidity_rate: Nat::from(2u128),
    //         asset_supply: Nat::from(10_000u128),
    //         asset_borrow: Nat::from(3_000u128),
    //         liquidity_index: Nat::from(1_000_000u128),
    //         debt_index: Nat::from(1_000_000u128),
    //         configuration: ReserveConfiguration {
    //             ltv: Nat::from(75u128),
    //             liquidation_threshold: Nat::from(85u128),
    //             liquidation_bonus: Nat::from(10u128),
    //             borrowing_enabled: true,
    //             borrow_cap: Nat::from(100_000u128),
    //             supply_cap: Nat::from(200_000u128),
    //             liquidation_protocol_fee: Nat::from(5u128),
    //             active: true,
    //             frozen: false,
    //             paused: false,
    //             reserve_factor: Nat::from(10u128),
    //         },
    //         can_be_collateral: Some(true),
    //         last_update_timestamp: 1_700_000_000,
    //         accure_to_platform: Nat::from(500u128),
    //     },
    //     reserve_factor: Nat::from(10u128),
    //     asset: "TestAsset".to_string(),
    //     expected_liquidity_rate: Nat::from(15_943_866u128),
    //     expected_borrow_rate: Nat::from(17_857_131u128),
    // }];

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