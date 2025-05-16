use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title IC Withdraw Functionality Test
 * @description This function tests the `execute_withdraw` method of the backend canister by simulating both valid and invalid withdraw scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets, withdrawal amounts, and conditions (e.g., collateral).
 * - Simulates withdrawal requests and validates the results against expected outcomes.
 * - Tests include successful withdrawal attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as large amounts exceeding balance, empty asset names, unknown assets, zero/huge withdrawal amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare withdrawal parameters with asset, amount, and additional info (e.g., collateral).
 *    b. Call the `execute_withdraw` method on the backend canister.
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
 * - Verifies that the backend correctly processes valid withdraw requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining withdraw logic.
 *
 * @note
 * Uses `info!` for verbose logging during test execution.
 */
pub fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2.00 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1.00 ICP (with collateral) (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(30_000u128), // 0.0003 ckBTC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(2_000u128), // 0.00002 ckETH
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(1_000_000u128), // 10,000 ckUSDT
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(400_000u128), // 200,000 ckUSDC
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // // Invalid Cases (General Failures)
        // // Large amount exceeding wallet balance
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000_000u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        // // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        TestCase {
            asset: "ckUSDT ".to_string(),  // Asset name with trailing space
            amount: Nat::from(10_000u128), // 10 USDT
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        TestCase {
            asset: "icp".to_string(),           // Lowercase asset name
            amount: Nat::from(100_000_000u128), // 0.1 ICP
            is_collateral: false,
            expect_success: false, // Assuming asset names are case-sensitive
            expected_error_message: Some("no canister id found".to_string()),
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(1u128), // Withdraw tiny fraction
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Fee exceeds the amount".to_string()),
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(10_000_000u128), // 0.10 ICP
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();
    let user_principal = get_user_principal2();
    info!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        info!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0);
        info!("Is Collateral: {}", case.is_collateral);
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        //checking asset principal
        let _asset_principal =
            match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        info!(
                            "✅ IC Test Case {} Passed: Supply rejected as expected",
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

        /* Withdraw params */
        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            is_collateral: case.is_collateral,

        };

        /*
         * @title Execute Withdraw
         * @notice Executes the withdraw operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_withdraw",
            encode_one(withdraw_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let withdraw_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                match withdraw_response {
                    Ok(_) => {
                        if !case.expect_success {
                            error!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        info!("✅ IC Test Case {} Passed: Withdraw successful.", i + 1,);
                        info!("\n=================== Checking Reserves After successful Withdrawal ===================\n");
                        // Check reserve data after successful withdraw
                        fetch_reserve_data(pic, backend_canister, &case.asset);
                        info!("\n=================== Checking User data After successful Withdrawal ===================\n");
                        //check user data after successful withdraw
                        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
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
                                "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                            info!("\n===================  Verifying Reserve after intentional withdrawl failure ===================\n");
                            // Check reserve data after successful withdraw
                            fetch_reserve_data(pic, backend_canister, &case.asset);
                            info!("\n===================  Verifying Reserve after intentional withdrawl failure ===================\n");
                            // check user data after successful withdraw
                            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
                        } else {
                            error!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
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
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }

    info!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}
