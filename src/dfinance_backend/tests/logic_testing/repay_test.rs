use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
/*
 * @title IC Repay Functionality Test
 * @description This function tests the `execute_repay` method of the backend canister by simulating both valid and invalid repay scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets and repay amounts.
 * - Simulates repay requests and validates the results against expected outcomes.
 * - Tests include successful repay attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as empty asset names, unknown assets, zero/huge repay amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare repay parameters with asset and amount.
 *    b. Call the `execute_repay` method on the backend canister.
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
 * - Verifies that the backend correctly processes valid repay requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining repay logic.
 *
 * @note
 * Uses `ic_cdk::println!` for verbose logging during test execution.
 */
pub fn test_repay(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid  test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2.00 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(10_000u128), // 0.0001 ckBTC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), //  0.000002 ckETH (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(5_000_000u128), // .05 USDC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(5_000_000u128), // 0.05 USDT (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid cases
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "TooLongAsset".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("wallet balance is low".to_string()),
        },
        // tRAILING WHITESPACES
        TestCase {
            asset: "ckUSDC ".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Lower case asset name
        TestCase {
            asset: "ckusdc".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // On behalf of --> anonymous user
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: Some(Principal::anonymous()),
            expect_success: false,
            expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        },
        // repay on no borrow
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("wallet balance is low".to_string()),
        },
    ];

    let user_principal = get_user_principal2();

    ic_cdk::println!(
        "\n======================== Starting IC Repay Tests ========================\n"
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        if let Some(ref principal) = case.on_behalf_of {
            ic_cdk::println!("On Behalf Of: {}", principal);
        }
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        /* Get asset principal; handle missing cases  */
        let asset_principal =
            match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay rejected as expected",
                            i + 1,
                        );
                    } else {
                        ic_cdk::println!(
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
            user_principal,
            asset_principal,
            &pic,
            backend_canister,
            Nat::from(case.amount.clone()),
        );
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                    );
                    continue;
                }
                ic_cdk::println!(
                    "✅ IC Test Case {} Passed: Repay rejected as expected",
                    i + 1,
                );
            } else {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }

        /* Repay params */
        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        /*
         * @title Execute Repay
         * @notice Executes the repay operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_repay",
            encode_one(repay_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let repay_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC repay response");

                match repay_response {
                    Ok(_) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!("✅ IC Test Case {} Passed: Repay successful.", i + 1,);
                        ic_cdk::println!("\n=================== Checking Reserves After successful Repayment ===================\n");
                        // Fetch and display reserve data
                        fetch_reserve_data(pic, backend_canister, &case.asset);
                        ic_cdk::println!("\n=================== Checking User data After successful Repayment ===================\n");
                        // Fetch and display user data
                        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                            ic_cdk::println!("\n===================  Verifying Reserve after intentional repay failure ===================\n");
                            // Fetch and display reserve data
                            fetch_reserve_data(pic, backend_canister, &case.asset);
                            ic_cdk::println!("\n===================  Verifying User data after intentional repay failure ===================\n");
                            // Fetch and display user data
                            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                i + 1,
                                error
                            );
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}
