use pocket_ic::{PocketIc, WasmResult};
use candid::Nat;
use candid::{encode_one, Principal};
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::common_functions::*;
use tracing::{info,error};
/*
 * @title IC Liquidation Functionality Test
 * @description This function tests the `execute_liquidation` method of the backend canister by simulating both valid and invalid liquidation scenarios.
 *
 * @details
 * - Defines a list of test cases with various debt and collateral assets and liquidation amounts.
 * - Simulates liquidation requests and validates the results against expected outcomes.
 * - Tests include successful liquidation attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as low collateral, invalid assets, anonymous principals, and zero amounts are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare liquidation parameters with debt and collateral asset, amount, and reward.
 *    b. Call the `execute_liquidation` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that liquidation completes without error.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid liquidation requests.
 * - Confirms appropriate error handling for various invalid scenarios, including collateral checks and asset validation.
 * - Provides detailed feedback to developers for debugging and refining liquidation logic.
 *
 * @note
 * Uses `info!` for verbose logging during test execution.
 */

pub fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        debt_asset: String,
        collateral_asset: String,
        amount: Nat,
        on_behalf_of: Principal,
        reward_amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }
    let test_cases = vec![
        // Valid cases with sufficient collateral
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(40_000_000u128), // 0.40 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_357_486u128), // Reward: 0.40357486 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210_000u128), // 0.0021 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220_496u128), // Reward: 0.00220496 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(20_000_000_000u128), // 2000 USDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(20_999_673_926u128), // Reward: 2099.9673926 USDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 125 USDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_175_527u128), // Reward: 130.62175527 USDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), // 0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(0u128), // Reward: 0.00000000 ckETH
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), // 0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128), // Reward: 0.0525 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        // // Health factor is falling below 1
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(5_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128),
            expect_success: false,
            expected_error_message: Some("Reward is higher than expected".to_string()),
        },
        // //  Invalid asset
        TestCase {
            debt_asset: "XYZ".to_string(),
            collateral_asset: "XYZ".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(40_400_000u128),
            expect_success: false,
            expected_error_message: Some("No principal found for asset".to_string()),
        },
        // // Anonymous principals are not allowed
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(10u128),
            expect_success: false,
            expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        },
        // // Zero amount
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(150u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "INV".to_string(),
            amount: Nat::from(50_000_000u128),  // 0.5 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(50_000_000u128),  // Expected reward: 0.5 ICP
            expect_success: false,
            expected_error_message: Some("no reserve data found of the given asset".to_string()), // Expecting failure due to invalid collateral asset
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ckBTC (includes transaction fee) higher than debt
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(100_000u128),  // No reward since liquidation request exceeds collateral
            expect_success: false,
            expected_error_message: Some("Repay cannot be more than debt".to_string()), // Expecting failure due to insufficient collateral
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(1_000_000_000_000_000_000u128), // 1 million ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(1_050_000_000_000_000_000u128),  // Expected reward: 1.05 million ckUSDC
            expect_success: false,
            expected_error_message: Some("Reward is higher than expected".to_string()), // Stress test should pass if the system can handle the large amount
        },

    ];
    init_tracing();
    info!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );

    /*
     * @title Test Creating User Reserve with Low Health
     * @notice This function tests the creation of user reserves with low health factors.
     * @dev
     * - The function simulates users supplying and borrowing assets close to the liquidation threshold.
     * - It ensures that the approval process for ICRC2 transfers is validated before supply operations.
     * - Each user is assigned an asset to supply and borrow with predefined amounts.
     * - The function also verifies the expected behavior and error handling in case of failures.
     */
    test_create_user_reserve_with_low_health(pic, backend_canister);

    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        info!("Debt Asset: {}", case.debt_asset);
        info!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0);
        info!("On Behalf Of: {}", case.on_behalf_of);
        let reward_amount_u128: u64 = case.reward_amount.clone().0.try_into().unwrap();
        let reward_amount_float = reward_amount_u128 as f64;
        info!("Reward Amount: {}", reward_amount_float / 100000000.0);
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        /* Get asset principal; handle missing cases  */
        let asset_principal =
            match test_get_asset_principal(case.debt_asset.clone(), pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        info!(
                            "✅ IC Test Case {} Passed: Liquidation rejected as expected",
                            i + 1,
                        );
                    } else {
                        error!(
                            "❌ IC Test Case {} Failed: Expected success but got rejection",
                            i + 1
                        );
                    }
                    continue;
                }
            };

        /*
         * @title Approve ICRC2 Transfer
         * @notice Approves ICRC2 transfer before supply operation.
         * @dev Validates approval status and expected outcomes.
         */
        let approved = test_icrc2_aprove(
            get_user_principal2(),
            asset_principal,
            pic,
            backend_canister,
            case.amount.clone()

        );
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    error!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given")
                    );
                    continue;
                }
                info!(
                    "✅ IC Test Case {} Passed: Liquidation rejected as expected",
                    i + 1,
                );
            } else {
                error!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }
        /* Liquidation params */
        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            reward_amount: case.reward_amount.clone(),
        };

        /*
         * @title Execute Liquidation
         * @notice Executes the liquidation operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            get_user_principal2(),
            "execute_liquidation",
            encode_one(liquidation_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let liquidation_response: Result<Nat, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode liquidation response");

                match liquidation_response {
                    Ok(_) => {
                        if case.expect_success {
                            info!(
                                "✅ IC Test Case {} Passed: Liquidation completed successfully",
                                i + 1
                            );
                            // Fetch and print reserve data for both debt and collateral assets
                            info!("\n====================== Checking Debt Reserves After successful Liquidation ======================\n");
                            fetch_reserve_data(pic, backend_canister, &case.debt_asset);
                            info!("\n====================== Checking Collateral Reserves After successful Liquidation ======================\n");
                            fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
                            info!("\n====================== Checking Liquidator User data for Collateral Asset After successful Liquidation ======================\n");
                            fetch_user_data(pic, backend_canister, &get_user_principal2(), &case.collateral_asset);
                            // Fetch and print on_behalf_of data for both debt and collateral assets
                            info!("\n====================== Checking User data for Debt Asset After successful Liquidation ======================\n");
                            fetch_user_data(pic, backend_canister, &case.on_behalf_of, &case.debt_asset);
                            info!("\n====================== Checking User data for Collateral Asset After successful Liquidation ======================\n");
                            fetch_user_data(pic, backend_canister, &case.on_behalf_of, &case.collateral_asset);
                            info!("\n---------------------------------------------------------\n");
                        } else {
                            error!(
                                "❌ IC Test Case {} Failed: Expected failure but got success",
                                i + 1
                            );
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(e.message()) {
                                error!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                                    e.message()
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                i + 1,
                                e
                            );
                            // Fetch and print reserve data for both debt and collateral assets
                            info!("\n======================  Verifying Debt Reserves After intentional Liquidation failure ======================\n");
                            fetch_reserve_data(pic, backend_canister, &case.debt_asset);
                            info!("\n======================  Verifying Collateral Reserves After intentional Liquidation failure ======================\n");
                            fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
                            info!("\n======================  Verifying Liquidator Reserves for Collateral Asset After intentional Liquidation failure ======================\n");
                            fetch_user_data(pic, backend_canister, &get_user_principal2(), &case.collateral_asset);
                            // Fetch and print on_behalf_of data for both debt and collateral assets
                            info!("\n======================  Verifying user Reserves for Debt Asset After intentional Liquidation failure ======================\n");
                            fetch_user_data(pic, backend_canister, &case.on_behalf_of, &case.debt_asset);
                            info!("\n====================== Verifying user Reserves for Collateral Asset After intentional Liquidation failure ======================\n");
                            fetch_user_data(pic, backend_canister, &case.on_behalf_of, &case.collateral_asset);
                            info!("\n---------------------------------------------------------\n");
                        } else {
                            error!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                error!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                error!(
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    info!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
