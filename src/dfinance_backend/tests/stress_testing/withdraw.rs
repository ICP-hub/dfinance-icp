use crate::utils::common_functions::init_tracing;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Withdraw Stress Test
 * @notice This function performs a stress test for the withdraw functionality by simulating multiple withdraw requests.
 * @dev It sends withdraw requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the withdraw logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be withdrawn.
 * 2. Sends a withdraw request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the withdraw function resides.
 * @param random_users List of user principals for whom the withdraw request will be tested.
 */
pub fn test_withdraw(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ICP
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.00004 ckBTC
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(400u128), // 0.004 ckBTC
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(10_000_000u128), // 100 ckUSDC
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3_000_000u128), // 0.03 ckUSDT
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5_000u128), // 0.00005 ckETH
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();
    let total_users = random_users.len();

    info!("\n======================== 🚀 IC Withdraw Stress Testing Started ========================\n");
    info!(
        "🔥 Running stress test with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🚀 Test Case {}: Withdraw Request Initiated", i + 1);
        let _amount_float = case.amount.clone().0.try_into().unwrap_or(0u64) as f64 / 100000000.0;

        if let Some(msg) = &case.expected_error_message {
            info!("⚠️ Expected Error: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in random_users.clone() {
            // Withdraw params
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
                        candid::decode_one(&reply).expect("Failed to decode withdraw response");

                    match withdraw_response {
                        Ok(_) => {
                            if !case.expect_success {
                                error!(
                                    "❌ Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                failure_count += 1;
                            } else {
                                info!(
                                    "✅ User {}: Withdraw successful.",
                                    user_principal.to_text(),
                                );
                                success_count += 1;
                            }
                        }
                        Err(error) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(error.message()) {
                                    error!(
                                        "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("No expected message"),
                                        error.message()
                                    );
                                    failure_count += 1;
                                } else {
                                    info!(
                                        "✅ Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                        i + 1,
                                        error
                                    );
                                    success_count += 1;
                                }
                            } else {
                                error!("❌ Test Case {} Failed: Expected success but got rejection: {:?}", i + 1, error);
                                failure_count += 1;
                            }
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    error!(
                        "❌ Test Case {} Failed: Call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    error!(
                        "❌ Test Case {} Failed: Error during function call: {:?}",
                        i + 1,
                        e
                    );
                    failure_count += 1;
                }
            }
        }

        info!("\n------------------------------------------------------------");
        info!("📊 Test Case {} Summary: ", i + 1);
        info!("✅ Successful Transactions: {}", success_count,);
        error!("❌ Failed Transactions: {}", failure_count,);
        info!("------------------------------------------------------------\n");
    }

    info!(
        "\n======================== ✅ IC Withdraw Tests Completed ========================\n"
    );
}
