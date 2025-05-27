use crate::utils::common_functions::*;
use crate::utils::error as errors;
use candid::Nat;
use candid::{decode_one, encode_args, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Faucet Stress Test
 * @notice This function performs a stress test for the faucet functionality by simulating multiple faucet requests.
 * @dev It sends faucet requests to multiple users for different asset types and amounts, and checks if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the faucet logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts.
 * 2. Sends a faucet request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the faucet function resides.
 * @param random_users List of user principals for whom the faucet request will be tested.
 */
pub fn test_faucet(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    // Define test cases with asset names and faucet amounts
    let test_cases = vec![
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(500_000_000u128), // 5 ICP
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(450_000u128), // 0.0045 ckBTC
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(45_000_000_000u128), // 450 ckUSDC
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(30_000_000_000u128), // 300 ckUSDT
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(15_000_000u128), // 0.15 ckETH
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    ];
    init_tracing();
    let total_users = random_users.len();
    // Log the start of the stress test
    info!(
        "\n======================== Starting IC Faucet Stress Testing ========================\n"
    );
    info!(
        "🔥 Stress Testing with {} user principals! 🔥\n",
        total_users
    );

    // Iterate over each test case to perform faucet requests
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🚀 Test Case {}: Faucet Request Initiated", i + 1);

        // Convert the amount to float for easier display
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8} \n🔹 Expected Success: {}",
            case.asset,
            amount_float / 100000000.0,
            case.expect_success
        );
        info!("------------------------------------------------------------\n");

        // Track success and failure counts for the current test case
        let mut success_count = 0;
        let mut failure_count = 0;

        /*
         * @title Faucet Request Test
         * @notice Tests the faucet function for expected success or failure.
         *
         * @dev Steps:
         *      1. Calls `faucet` with asset and amount.
         *      2. Decodes and verifies response.
         *      3. Logs success or failure.
         *
         * @param pic PocketIc instance.
         * @param backend_canister Backend canister principal.
         * @param user_principal User's principal.
         */
        // Simulate faucet requests for each user
        for user_principal in &random_users {
            let result = pic.update_call(
                backend_canister,
                *user_principal,
                "faucet",
                encode_args((case.asset.clone(), case.amount.clone())).unwrap(),

            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let faucet_response: Result<Nat, errors::Error> =
                        decode_one(&reply).expect("Failed to decode faucet response");
                    match faucet_response {
                        Ok(_) => {
                            info!(
                                "✅ User {}: Faucet successful.",
                                user_principal.to_text(),
                            );
                            success_count += 1;
                        }
                        Err(error) => {
                            error!(
                                "❌ User {}: Faucet Failed. Error: {}",
                                user_principal.to_text(),
                                error.message()
                            );
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    error!(
                        "❌ User {}: Faucet Rejected. Message: {}",
                        user_principal.to_text(),
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    error!(
                        "❌ User {}: Faucet Call Error: {:?}",
                        user_principal.to_text(),
                        e
                    );
                    failure_count += 1;
                }
            }
        }

        /*
         * @title Faucet Request for Users
         * @notice Simulates faucet requests for multiple users to test liquidation scenarios.
         *
         * @dev Steps:
         *      1. Iterates through users (1 to 5).
         *      2. Calls `faucet` with user principal.
         *      3. Verifies response and logs success/failure.
         *
         * @param pic PocketIc instance.
         * @param backend_canister Backend canister principal.
         */
        // Iterate through user principals to simulate multiple faucet requests
        for num in 1..=5 {
            let index: u32 = num as u32;
            // Simulate faucet request for a specific user
            let result = pic.update_call(
                backend_canister,
                get_users_principal(Nat::from(index)).unwrap(),
                "faucet",
                encode_args((case.asset.clone(), case.amount.clone())).unwrap(),

            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let faucet_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode faucet response");

                    match faucet_response {
                        Ok(_) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} Passed: Faucet successful.",
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
                                    continue;
                                }
                                info!(
                                    "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
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
                        "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                        i + 1,
                        e
                    );
                    continue;
                }
            }
        }

        // Log summary for the test case
        info!("\n------------------------------------------------------------");
        info!("📊 Test Case {} Summary: ", i + 1);
        info!("✅ Successful Transactions: {}", success_count,);
        error!("❌ Failed Transactions: {}", failure_count,);
        info!("------------------------------------------------------------\n");
    }

    // Log the completion of the faucet stress test
    info!(
        "\n======================== IC Faucet Stress Test Completed ========================\n"
    );
}
