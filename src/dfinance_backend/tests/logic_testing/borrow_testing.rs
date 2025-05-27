use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title IC Borrow Functionality Test
 * @description This function tests the `execute_borrow` method of the backend canister by simulating both valid and invalid borrow scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets and borrow amounts.
 * - Simulates borrow requests and validates the results against expected outcomes.
 * - Tests include successful borrow attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as empty asset names, unknown assets, zero/huge borrow amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare borrow parameters with asset and amount.
 *    b. Call the `execute_borrow` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that a balance is returned.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid borrow requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining borrow logic.
 *
 * @note
 * Uses `info!` for verbose logging during test execution.
 */
pub fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // valid test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ICP (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(10_000u128), // 0.0001 ckBTC (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(5_000_000u128), // 0.05 USDT (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), //0.000002 ckETH (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(5_000_000u128), //  0.05 USDC (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid Cases
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETHEREUM".to_string(),
            amount: Nat::from(50u128),
            expect_success: false,
            expected_error_message: Some("Length of the asset is invalid".to_string()),
        },
        // Large amount
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(100_000_000_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Platform balance is low".to_string()),
        },
        // Borrow amount is too high
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500_000_000_000u128),
            expect_success: false,
            expected_error_message: Some(
                "LTV should be less than Liquidation Threshold".to_string(),
            ),
        },
        // Tailing whitespaces
        TestCase {
            asset: "ckUSDC ".to_string(),
            amount: Nat::from(50_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Lower case asset name
        TestCase {
            asset: "ckusdc ".to_string(),
            amount: Nat::from(50_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
    ];
    init_tracing();
    let user_principal = get_user_principal2();

    // Start the borrow tests
    info!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        info!("Asset: {}", case.asset); // Display asset name for borrow request
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0); // Display amount in human-readable format
        info!("Expected Success: {}", case.expect_success); // Log expected outcome of the test
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg); // Log expected error message in failure case
        }
        info!("------------------------------------------------------------\n");

        // Check asset principal before proceeding with borrow
        let _asset_principal =
            match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        info!(
                            "✅ IC Test Case {} Passed: Borrow rejected as expected",
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

        /* Borrow parameters */
        let borrow_params = ExecuteBorrowParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
        };

        /*
         * @title Execute Borrow Transaction
         * @notice Calls the backend canister to execute a borrow operation.
         * @dev Validates the borrow response and checks for expected success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_borrow", // Function to borrow
            encode_one(borrow_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let borrow_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC borrow response");

                match borrow_response {
                    Ok(_) => {
                        if !case.expect_success {
                            error!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue; // Skip test if failure was expected but success occurred
                        }
                        info!("✅ IC Test Case {} Passed: Borrow successful.", i + 1,);
                        info!("\n==================== Checking Reserves After successful Borrow ====================\n");
                        // Fetch reserve data after successful borrow
                        fetch_reserve_data(pic, backend_canister, &case.asset);
                        info!("\n==================== Checking User data After successful Borrow ====================\n");
                        // Fetch user data after successful borrow
                        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
                        info!(
                            "\n---------------------------------------------------------\n"
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                error!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                                    error.message()
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                            info!("\n===================  Verifying Reserve after intentional borrow failure ===================\n");
                            fetch_reserve_data(pic, backend_canister, &case.asset);
                            info!("\n===================  Verifying User data after intentional borrow failure ===================\n");
                            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
                        } else {
                            error!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                i + 1,
                                error
                            );
                            continue; // Skip if success expected but rejection occurred
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
                continue; // Skip if the function call is rejected
            }
            Err(e) => {
                error!(
                    "❌ IC Test Case {} Failed: Error during borrow function call: {:?}",
                    i + 1,
                    e
                );
                continue; // Skip if an error occurred during borrow function call
            }
        }
    }
    info!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}
