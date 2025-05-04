use crate::utils::common_functions::{
    fetch_reserve_data, test_get_asset_principal, test_icrc2_aprove,
};
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};

/*
 * @title Test Supply Functionality for Asset Transactions
 * @notice Validates the functionality of the supply operation for various assets.
 * @dev Ensures that the supply function correctly processes asset supply requests, including handling collateral, amount validation, and edge cases such as asset approval errors or insufficient funds.
 * @functionality Confirms that the supply function performs as expected, rejecting invalid requests and successfully processing valid transactions.
 */

pub fn test_supply(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid Test Cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(4_000_000_000u128), // 40 ICP (includes transaction fee)
            is_collateral: true,                  // Mark asset as collateral
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_000u128), // 0.00045 ckBTC (includes transaction fee)
            is_collateral: false,          // Mark asset as non-collateral
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(800_000_000u128), // 8 ckUSDC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(6_000u128), // 0.06 ckETH (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(40_000_000u128), // 0.4 ckUSDT (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    // Starting the supply test cases
    ic_cdk::println!(
        "\n======================== Starting IC Supply Tests ========================\n"
    );

    // Iterate over all test cases for asset supply
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Supply Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset); // Display the asset to be supplied
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0); // Convert the amount into human-readable format
        ic_cdk::println!("Is Collateral: {}", case.is_collateral); // Log whether the asset is being supplied as collateral
        ic_cdk::println!("Expected Success: {}", case.expect_success); // Log expected success/failure outcome of the test
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg); // Log the expected error message for failure cases
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        // Fetch and log the reserve data before supply request is made
        ic_cdk::println!(
            "\n======================== Initial Reserve data before concurrent calls  ========================\n"
        );
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone()); // Fetch reserve data for the asset before supply
        ic_cdk::println!(
            "\n======================================================================================\n"
        );

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs for each supply request
        for user_principal in random_users.clone() {
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                    Some(principal) => principal, // Get the asset principal for supply operation
                    None => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Supply rejected as expected",
                                i + 1,
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection",
                                i + 1
                            );
                        }
                        continue; // Skip the current iteration if the asset principal is not found
                    }
                };

            // Approve the asset transfer for the supply operation
            let approved = test_icrc2_aprove(
                user_principal,
                asset_principal,
                &pic,
                backend_canister,
                case.amount.clone(),
            );
            if !approved {
                if !case.expect_success {
                    if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                        println!(
                            "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                            i + 1,
                            case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                        );
                        continue; // Skip if the approval fails and the expected error message is different
                    }
                    ic_cdk::println!(
                        "✅ IC Test Case {} Passed: Supply rejected as expected",
                        i + 1,
                    );
                } else {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Expected success but got rejection",
                        i + 1
                    );
                }
                continue; // Skip to the next test case if approval fails
            }

            // Prepare supply parameters
            let supply_params = ExecuteSupplyParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                is_collateral: case.is_collateral,
            };

            // Submit the supply request to the backend canister
            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_supply",
                    encode_one(supply_params).unwrap(), // Call the supply method on the backend canister
                )
                .unwrap();
            msg_ids.push(msg); // Store the message ID for tracking the supply request
        }

        let mut results = Vec::new(); // Store results for all repay requests
                                      // Collect and process the results of all supply requests
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res); // Store the result of each supply request
        }

        // Check each result and determine whether it succeeded or failed
        for result in results {
            match result {
                WasmResult::Reply(reply) => {
                    let supply_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get supply response");

                    match supply_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue; // Continue to the next test case if failure was expected but success occurred
                            }
                            ic_cdk::println!("✅ IC Test Case {} Passed: Supply successful", i + 1,);
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
                                    continue; // Skip the test case if the error message doesn't match the expected one
                                }
                                ic_cdk::println!(
                                    "✅ IC Test Case {} Passed: Supply rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                    i + 1,
                                    error
                                );
                                continue; // Continue to the next test case if expected success but rejection occurred
                            }
                        }
                    }
                }
                WasmResult::Reject(reject_message) => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    continue; // Skip the test case if the function call was rejected
                }
            }
        }

        // Fetch and log the final reserve data after supply request is processed
        ic_cdk::println!(
            "\n======================== Total reserve data after concurrent calls  ========================\n"
        );
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone()); // Fetch updated reserve data after supply
        ic_cdk::println!("\n---------------------------------------------------------\n");
    }

    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}
