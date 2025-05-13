use crate::utils::common_functions::{fetch_reserve_data, fetch_user_data};
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};

/*
 * @title Borrow Stress Test
 * @notice This function performs a stress test for the borrow functionality by simulating multiple borrow requests.
 * @dev It sends borrow requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the borrow logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be borrowed.
 * 2. Sends a borrow request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the borrow function resides.
 * @param random_users List of user principals for whom the borrow request will be tested.
 */
pub fn test_borrow(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    // Define test cases with asset names and borrow amounts
    let test_cases = vec![
        // Valid test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(400_000u128), // 4 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 30 USDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(500u128), // 0.000005 ETH
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();

    // Log the start of the stress test
    ic_cdk::println!(
        "\n======================== 🚀 Starting IC Borrow Stress Testing ========================"
    );
    ic_cdk::println!(
        "🔥 Running stress test with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Borrow Request Initiated", i + 1);
        let amount_float = case.amount.clone().0.try_into().unwrap_or(0u64) as f64 / 100000000.0;
        ic_cdk::println!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8}  \n🔹 Expected Success: {}",
            case.asset,
            amount_float,
            case.expect_success
        );
        if let Some(msg) = &case.expected_error_message {
            ic_cdk::println!("⚠️ Expected Error: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        // Iterate over each user to test borrow functionality
        for user_principal in &random_users {
            /* Borrow params */
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
                *user_principal,
                "execute_borrow",
                encode_one(borrow_params).unwrap(),
            );

            // Handle the borrow response
            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode IC borrow response");

                    match borrow_response {
                        Ok(_) if case.expect_success => {
                            ic_cdk::println!(
                                "✅ User {}: Borrow successful.",
                                user_principal.to_text(),
                            );
                            success_count += 1;
                        }
                        Err(error) if !case.expect_success => {
                            if case.expected_error_message.as_deref() == Some(error.message()) {
                                ic_cdk::println!(
                                    "✅ Test Case {} Passed: Borrow rejected as expected. Message: {:?}",
                                    i + 1, error
                                );
                                ic_cdk::println!("\n==================== Checking Reserves After successful Borrow ====================\n");
                                // Reserve data fetching
                                fetch_reserve_data(pic, backend_canister, &case.asset);
                                ic_cdk::println!("\n==================== Checking User data After successful Borrow ====================\n");
                                // User reserve data fetching
                                fetch_user_data(
                                    pic,
                                    backend_canister,
                                    user_principal,
                                    &case.asset,
                                );
                                ic_cdk::println!(
                                    "\n---------------------------------------------------------\n"
                                );
                                success_count += 1;
                            } else {
                                ic_cdk::println!(
                                    "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("(none)"),
                                    error.message()
                                );
                                failure_count += 1;
                            }
                        }
                        Err(error) => {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Expected success but got rejection. Message: {:?}",
                                i + 1,
                                error
                            );
                            failure_count += 1;
                        }
                        _ => {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Expected failure but received success.",
                                i + 1
                            );
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Function call rejected. Message: {}",
                        i + 1,
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Error during function call: {:?}",
                        i + 1,
                        e
                    );
                    failure_count += 1;
                }
            }
        }

        // Log test case summary
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count,);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count,);
        ic_cdk::println!("------------------------------------------------------------\n");
    }

    // Log the completion of the stress test
    ic_cdk::println!(
        "\n======================== ✅ IC Borrow Tests Completed ========================"
    );
}
