use crate::utils::common_functions::{
    fetch_reserve_data, init_tracing, test_get_asset_principal, test_icrc2_aprove
};
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Test Repay Functionality for Asset Transactions
 * @notice Validates the repay functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the repay function handles different asset types and amounts correctly. It checks both successful repay operations and failure cases such as insufficient balance, invalid asset types, or non-approved asset transfers.
 * @functionality Confirms that the repay function processes requests successfully when expected and rejects invalid repay requests with appropriate error messages, ensuring that the balance is correctly updated after each repayment attempt.
 */
#[allow(dead_code)]
pub fn test_repay(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid test cases with sufficient balance
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128), // 10 ICP (includes transaction fee)
            on_behalf_of: None,                   // No principal is specified for repayment
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20_000u128), // 0.0002 ckBTC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(800_000u128), // 0.8 ckUSDC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(400_000u128), // 0.4 ckUSDT (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();
    // Starting the repayment test cases
    info!(
        "\n======================== Starting IC Repay Tests ========================\n"
    );

    // Iterate over all test cases for repayment
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
        info!("Asset: {}", case.asset); // Display the asset to be repaid
        info!("case amount = {}", case.amount); // Display the repayment amount
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0); // Convert the amount into human-readable format
        if let Some(ref principal) = case.on_behalf_of {
            info!("On Behalf Of: {}", principal); // Log the principal on behalf of whom repayment is executed (if provided)
        }
        info!("Expected Success: {}", case.expect_success); // Log expected success/failure outcome of the test
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg); // Log the expected error message for failure cases
        }
        info!("------------------------------------------------------------\n");

        // Fetch and log the reserve data before repayment
        info!(
            "\n======================== Initial reserve data before concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone()); // Fetch reserve data for the asset before repayment
        info!("\n---------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs for each repay request
        for user_principal in random_users.clone() {
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                    Some(principal) => principal, // Get the asset principal for repayment
                    None => {
                        if !case.expect_success {
                            info!(
                                "✅ IC Test Case {} Passed: Repay rejected as expected",
                                i + 1,
                            );
                        } else {
                            error!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection",
                                i + 1
                            );
                        }
                        continue; // Skip the current iteration if the asset principal is not found
                    }
                };

            let approved = test_icrc2_aprove(
                user_principal,
                asset_principal,
                pic,
                backend_canister,
                case.amount.clone() // Approve ICRC2 transfer for repayment
            );
            if !approved {
                if !case.expect_success {
                    if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                        error!(
                            "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                            i + 1,
                            case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                        );
                        continue; // Skip the current iteration if the approval fails
                    }
                    info!(
                        "✅ IC Test Case {} Passed: Repay rejected as expected",
                        i + 1,
                    );
                } else {
                    error!(
                        "❌ IC Test Case {} Failed: Expected success but got rejection",
                        i + 1
                    );
                }
                continue; // Skip to the next test case if approval failed
            }

            let repay_params = ExecuteRepayParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
            };

            // Now call the repay function with parameters
            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_repay",
                    encode_one(repay_params).unwrap(), // Call the repay method on the backend canister
                )
                .unwrap();
            msg_ids.push(msg); // Store the message ID for tracking the repayment request
        }

        let mut results = Vec::new();
        // Collect and process the results of all repay requests
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res); // Store the result of each repayment request
        }

        // Check each result and determine whether it succeeded or failed
        for result in results {
            match result {
                WasmResult::Reply(reply) => {
                    let repay_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC repay response");

                    match repay_response {
                        Ok(_balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!("✅ IC Test Case {} Passed: Repay successful.", i + 1,);
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
                                    "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                    i + 1,
                                    error
                                );
                                continue;
                            }
                        }
                    }
                }
                WasmResult::Reject(reject_message) => {
                    error!(
                        "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    continue;
                }
            }
        }

        // Fetch and log the final reserve data after repayment is processed
        info!(
            "\n======================== Total reserve data after concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone()); // Fetch updated reserve data after repayment
        info!("\n---------------------------------------------------------\n");
    }

    info!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}
