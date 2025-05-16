use candid::Nat;
use candid::{encode_args, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::{get_user_principal2, get_users_principal, init_tracing};
use crate::utils::error as errors;
use tracing::{info,error};




/*
 * @title Test Faucet Functionality for Asset Distributions
 * @notice Validates the faucet functionality for distributing assets to users.
 * @dev Ensures that the faucet function distributes assets (like ICP, ckBTC, etc.) correctly and handles both successful and failure cases based on the asset configuration.
 * @functionality Confirms that the faucet distributes the correct amount of assets and handles edge cases such as insufficient funds or asset type errors.
 */
pub fn test_faucet(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        //  Valid faucet request for each asset
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128), // 100 ICP (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();
    let user_principal = get_user_principal2();
    info!(
        "\n======================== Starting IC Faucet Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Faucet Request", i + 1);
        info!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0);
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

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
        let mut msg_ids = vec![];
        for _ in 0..5 {
            let msg_id = pic.submit_call(
                backend_canister,
                user_principal,
                "faucet",
                encode_args((case.asset.clone(), case.amount.clone())).unwrap(),

            );
            msg_ids.push(msg_id);
        }

        for (j, msg_id) in msg_ids.into_iter().enumerate() {
            let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
            let result = pic.await_call(msg_id).unwrap();
            match result {
                WasmResult::Reply(reply) => {
                    let faucet_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode faucet response");

                    match faucet_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} for user {} Passed: Faucet successful.\n",
                                i + 1,
                                balance
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
                                info!(
                                    "-----------------------------------------------------------------------",
                                );
                                error!(
                                    "❌ Call {} Failed: Expected success but got error: {}",
                                    j + 1,
                                    error.message(),
                                );
                                info!(
                                    "----------------  Wait for the previous operation to complete before retrying.  ------------\n",
                                );
                                // info!("❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}", i + 1, error, user_principal.to_text());
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
        for num in 1..=5 {
            let index: u32 = num as u32;
            // Simulate faucet request
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
                        Ok(balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} for user {} Passed: Faucet successful.",
                                i + 1,
                                balance
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

        for user_principal in random_users.clone() {
            // Simulate faucet request
            let result = pic.update_call(
                backend_canister,
                user_principal,
                "faucet",
                encode_args((case.asset.clone(), case.amount.clone())).unwrap(),

            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let faucet_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode faucet response");

                    match faucet_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} for user {} Passed: Faucet successful.",
                                i + 1,
                                balance
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
    }
    info!(
        "\n======================== IC Faucet Tests Completed ========================\n"
    );
}