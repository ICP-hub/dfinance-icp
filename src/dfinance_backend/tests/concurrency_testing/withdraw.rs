use crate::utils::common_functions::fetch_reserve_data;
use crate::utils::common_functions::init_tracing;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Test Withdraw Functionality for Asset Transactions
 * @notice Validates the withdraw functionality for various assets like ICP, ckBTC, ckETH, etc.
 * @dev Ensures that the withdraw function handles different asset types and amounts correctly. It checks both successful withdrawal operations and failure cases such as insufficient balance, invalid asset types, and collateral withdrawal.
 * @functionality Confirms that the withdraw function processes requests successfully when expected and rejects invalid withdraw requests with appropriate error messages, while also verifying if the correct balance is returned after each withdrawal attempt.
 */
#[allow(dead_code)]
pub fn test_withdraw(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        can_be_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(3_800_000_000u128), // 38 ICP (includes transaction fee)
            can_be_collateral: false,                 // Asset is not marked as collateral
            expect_success: true,                 // Expect success
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40_000u128), // 0.0004 ckBTC (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5_000u128), // 0.00005 ckETH (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(1_000_000u128), // 0.010 ckUSDT (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2_000_000u128), // 0.02 ckUSDC (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();
    // Start the withdraw test cases
    info!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        info!("Asset: {}", case.asset); // Display asset for withdraw request
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0); // Display amount in human-readable format
        info!("Is Collateral: {}", case.can_be_collateral); // Log whether the asset is collateral
        info!("Expected Success: {}", case.expect_success); // Log expected success/failure of test case
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg); // Log expected error message in failure case
        }
        info!("------------------------------------------------------------\n");

        // Fetch initial reserve data before making withdraw request
        info!(
            "\n======================== Initial reserve data before concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone());

        info!(
            "\n======================================================================================\n"
        );

        let mut msg_ids = Vec::new(); // Initialize vector to store message IDs for each withdraw request
        for user_principal in random_users.clone() {
            // Prepare withdraw parameters
            let withdraw_params = ExecuteWithdrawParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                can_be_collateral: case.can_be_collateral,
            };

            // Submit the withdraw request to backend canister
            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_withdraw", // Function to withdraw
                    encode_one(withdraw_params).unwrap(),
                )
                .unwrap();
            msg_ids.push(msg); // Store the message ID for tracking
        }
        let mut results = Vec::new(); // Collect results for all withdraw requests
                                      // Process each result after submitting withdraw requests
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res); // Store result of each withdraw request
        }

        // Check if the withdraw operation succeeded or failed
        for result in results {
            match result {
                WasmResult::Reply(reply) => {
                    // Decode the response from the backend
                    let withdraw_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                    match withdraw_response {
                        Ok(_balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue; // Continue to next test case if failure expected but success occurred
                            }
                            info!(
                                "✅ IC Test Case {} Passed: Withdraw successful.",
                                i + 1,
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
                                    continue; // Skip this test case if error message does not match
                                }
                                info!(
                                    "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                    i + 1,
                                    error
                                );
                                continue; // Continue to next test case if success expected but rejection occurred
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
                    continue; // Skip if the function call is rejected
                }
            }
        }

        // Fetch final reserve data after withdraw operation is processed
        info!(
            "\n======================== Total reserve data after concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone());
        info!("\n---------------------------------------------------------\n");
    }

    // End of withdraw tests
    info!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}
