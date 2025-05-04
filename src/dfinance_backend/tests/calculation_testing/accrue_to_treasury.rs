use candid:: Nat;
use std::ops::Mul;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::constant_variables::*;



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
 * @title Accrue to Treasury
 * @notice Computes and transfers accrued interest to the platform treasury.
 * @dev Calculates debt accrued and mints the corresponding amount for the treasury.
 * @functionality Allocates a portion of accrued interest to the treasury based on the reserve factor.
 */
//
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
 * @title Test Accrue to Treasury
 * @notice Validates the accrued interest transfer functionality to the treasury.
 * @dev Ensures the calculation of accrued interest is accurate and matches the expected treasury amount.
 * @functionality Validates that the accrued interest is accurately computed and transferred to the platform treasury.
 */
pub async fn test_accrue_to_treasury() {
    #[derive(Debug, Clone)]
    struct TestCase {
        reserve_data: ReserveData,
        reserve_cache: ReserveCache,
        expected_accure_to_platform: Nat,
    }
    


     let dummy_config = ReserveConfiguration {
        ltv: Nat::from(75_000_000u128), liquidation_threshold: Nat::from(80_000_000u128),
        liquidation_bonus: Nat::from(5_000_000u128),
        borrowing_enabled: true, 
        borrow_cap: Nat::from(1_000_000_000_000_000u128), 
        supply_cap: Nat::from(1_000_000_000_000_000u128),
        liquidation_protocol_fee: Nat::from(1_000_000u128), 
        reserve_factor: Nat::from(10_000_000u128) 
    };
     let default_cache = ReserveCache {
        reserve_configuration: dummy_config.clone(),
        curr_liquidity_index: Nat::from(100_000_000u128), // 1.0
        next_liquidity_index: Nat::from(100_000_000u128), // 1.0
        curr_liquidity_rate: Nat::from(1_000_000u128), // 1%
        reserve_last_update_timestamp: 1700000000,
        curr_debt_index: Nat::from(100_000_000u128), // 1.0
        next_debt_index: Nat::from(100_000_000u128), // 1.0
        curr_debt_rate: Nat::from(5_000_000u128), // 5%
        next_debt_rate: Nat::from(5_000_000u128), // 5%
        debt_last_update_timestamp: 1700000000,
        reserve_factor: Nat::from(10_000_000u128), // 10%
        curr_debt: Nat::from(0u128),
        next_debt: Nat::from(0u128),
        curr_supply: Nat::from(0u128),
    };
     let default_reserve = ReserveData {
        asset_name: "TestAsset".to_string(), id: 1,
        d_token_canister: None, 
        debt_token_canister: None,
        borrow_rate: Nat::from(5_000_000u128), // 5%
        current_liquidity_rate: Nat::from(1_000_000u128), // 1%
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100_000_000u128), // 1.0
        debt_index: Nat::from(100_000_000u128), // 1.0
        configuration: dummy_config.clone(), 
        can_be_collateral: Some(true), 
        last_update_timestamp: 1700000000,
        accure_to_platform: Nat::from(50_000_000_000u128), // 500 base units 
    };


    let test_cases = vec![
        // --- Normal Cases ---
        // Test Case 1: Normal Accrual, Moderate RF 
        TestCase {
            reserve_data: default_reserve.clone(), // Initial accrue = 500 base units
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(5_000_000_000u128),               // 50 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(110_000_000u128),           // Index = 1.1
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_000_600_000u128), // 500.006 
        },
        // Test Case 2: Normal Accrual, Higher RF (Yields Non-Zero Increment)
        TestCase {
            reserve_data: ReserveData { accure_to_platform: Nat::from(50_000_000_000u128), ..default_reserve.clone() }, // Initial accrue = 500 base units
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(5_000_000_000u128),               // 50 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(110_000_000u128),           // Index = 1.1
                reserve_factor: Nat::from(50_000_000u128),            // 50% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_003_000_000u128), // 500.3 
        },
        // Test Case 3: High Debt Base, Moderate RF* (Yields non-zero increment)
        TestCase {
            reserve_data: ReserveData { accure_to_platform: Nat::from(50_000_000_000u128), ..default_reserve.clone() }, // Initial accrue = 500 base units
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(500_000_000_000u128),              // 5000 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(110_000_000u128),           // Index = 1.1
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_060_000_000u128), // 500.60
        },
        // --- Edge Cases ---
        // Test Case 4: Zero Initial Debt
        TestCase {  // Checks no accrual if no debt.
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(0u128),                         // 0 base units debt
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(110_000_000u128),           // Index = 1.1
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_000_000_000u128), // 500 
        },
        // Test Case 5: Zero Reserve Factor
        TestCase {  // Checks function returns early if RF=0.
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                 curr_debt: Nat::from(5_000_000_000u128),              // 50 base units
                 curr_debt_index: Nat::from(100_000_000u128),          // Index = 1.0
                 next_debt_index: Nat::from(110_000_000u128),          // Index = 1.1
                 reserve_factor: Nat::from(0u128),                     // 0% RF
                 next_liquidity_index: Nat::from(120_000_000u128),     // Index = 1.2
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_000_000_000u128), // 500 
        },
        // Test Case 6: Zero Index Change (No time passed)
        TestCase {  // Checks no interest accrued if indices same.
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(5_000_000_000u128),               // 50 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(100_000_000u128),           // Index = 1.0 (No change)
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_000_000_000u128), // 500 
        },
        // // Test Case 7: Error Check: Negative Accrual (Indices Reversed)
        // TestCase { // Tests the AmountSubtractionError check.
        //     reserve_data: default_reserve.clone(),
        //     reserve_cache: ReserveCache {
        //          curr_debt: Nat::from(5_000_000_000u128),              // 50 base units
        //          curr_debt_index: Nat::from(110_000_000u128),          // Index = 1.1 (Start high)
        //          next_debt_index: Nat::from(100_000_000u128),          // Index = 1.0 (End low)
        //          reserve_factor: Nat::from(10_000_000u128),            // 10% RF
        //          next_liquidity_index: Nat::from(120_000_000u128),     // Index = 1.2
        //          ..default_cache.clone()
        //      },
        //     // Should return Err(AmountSubtractionError), platform value unchanged
        //     expected_accure_to_platform: Nat::from(50_000_000_000u128),
        // },
        // Test Case 8: Very High Debt Index Change*
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(5_000_000_000u128),               // 50 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(1_000_000_000u128),         // Index = 10.0
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(120_000_000u128),      // Index = 1.2
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_054_000_000u128), // 500.540
        },
        // Test Case 9: Very High Liquidity Index*
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(5_000_000_000u128),               // 50 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(110_000_000u128),           // Index = 1.1
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(10_000_000_000u128),   // Index = 100.0
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_050_000_000u128), // 500.50
        },
        // Test Case 10: Minimal Values to trigger Increment=1* (using revised inputs from calc)
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(1_000_000u128),                  // 1M base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(101_000_000u128),           // Index = 1.01
                reserve_factor: Nat::from(100_000_000u128),           // 100% RF
                next_liquidity_index: Nat::from(100_000_000u128),      // Index = 1.0
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_000_000_100u128), // 500.00000100
        },
        // Test Case 11: Large Increment Scenario*
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(10_000_000_000u128),              // 100 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(200_000_000u128),           // Index = 2.0
                reserve_factor: Nat::from(50_000_000u128),            // 50% RF
                next_liquidity_index: Nat::from(100_000_000u128),      // Index = 1.0
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_050_000_000u128), // 500.50000000
        },
         // Test Case 12: Zero next_liquidity_index
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(10_000_000_000u128),              // 100 base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(200_000_000u128),           // Index = 2.0
                reserve_factor: Nat::from(50_000_000u128),            // 50% RF
                next_liquidity_index: Nat::from(0u128),                // Index = 0.0
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(50_000_000_000u128), // 500 
        },
        // Test Case 13: Max Reserve Factor (100%)* - still zero increment with minimal index change
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(1_000_000u128),                  // 1M base units
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(100_000_001u128),           // Index = 1.0 + 1e-8
                reserve_factor: Nat::from(100_000_000u128),           // 100% RF
                next_liquidity_index: Nat::from(100_000_000u128),      // Index = 1.0
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_000_000_000u128), // 500 (increment is 0 due to truncation)
        },
        // Test Case 14: Very Large Indices*
        TestCase {
            reserve_data: ReserveData { accure_to_platform: Nat::from(50_000_000_000u128), ..default_reserve.clone() }, // Initial accrue=500 base units
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(10_000u128),                     // 10k base units
                curr_debt_index: Nat::from(10_000_000_000u128),        // Index = 100.0
                next_debt_index: Nat::from(11_000_000_000u128),        // Index = 110.0
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(10_000_000_000u128),   // Index = 100.0
                 ..default_cache.clone()
             },
            expected_accure_to_platform: Nat::from(50_000_010_000u128), // 500.00010000
        },
         // Test Case 15: Extremely High Accrued Value*
        TestCase {
            reserve_data: default_reserve.clone(),
            reserve_cache: ReserveCache {
                curr_debt: Nat::from(1_000_000_000_000_000u128),      // 10M base units = 1 Trillion
                curr_debt_index: Nat::from(100_000_000u128),           // Index = 1.0
                next_debt_index: Nat::from(1_100_000_000u128),         // Index = 11.0
                reserve_factor: Nat::from(10_000_000u128),            // 10% RF
                next_liquidity_index: Nat::from(100_000_000u128),      // Index = 1.0
                ..default_cache.clone()
            },
            expected_accure_to_platform: Nat::from(10_050_000_000_000u128), // 100500.00000000
        },
    ];



    // let test_cases = vec![TestCase 

    //{
    //     reserve_data: ReserveData {
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
    //             borrow_cap: Nat::from(10_0000u128),
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
    //     reserve_cache: ReserveCache {
    //         reserve_configuration: ReserveConfiguration {
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
    //         curr_liquidity_index: Nat::from(1_000_000u128),
    //         next_liquidity_index: Nat::from(1_200_000u128),
    //         curr_liquidity_rate: Nat::from(2u128),
    //         reserve_last_update_timestamp: 1_700_000_000,
    //         curr_debt_index: Nat::from(1_000_000u128),
    //         next_debt_index: Nat::from(1_100_000u128),
    //         curr_debt_rate: Nat::from(5u128),
    //         next_debt_rate: Nat::from(6u128),
    //         debt_last_update_timestamp: 1_700_000_000,
    //         reserve_factor: Nat::from(10u128),
    //         curr_debt: Nat::from(5_000u128),
    //         next_debt: Nat::from(5_500u128),
    //         curr_supply: Nat::from(10_000u128),
    //     },
    //     expected_accure_to_platform: Nat::from(500u128),
    // }
    // ];

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

