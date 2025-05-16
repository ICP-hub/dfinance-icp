use candid::{ encode_args, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use tracing::{info,error};


/*
 * @title Faucet Request Test
 * @notice Tests the faucet function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for faucet requests with different asset types and amounts. It checks the success or failure of each request, verifying the expected outcomes (such as receiving the correct amount or receiving the appropriate error message).
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes faucet requests for different assets (ICP, ckBTC, ckUSDC, etc.).
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Handles cases where asset length exceeds the allowed limit.
 * 4. Simulates faucet requests for multiple users to test liquidation scenarios.
 */
pub fn test_faucet(pic: &PocketIc, backend_canister: Principal) {
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
            amount: Nat::from(5_000_000_000u128), // 50 ICP (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(450_000u128), // 0.0045 ckBTC (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(40_000_000_000u128), // 400 ckUSDC (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000_000u128), // 300 ckUSDT (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(14_000_000u128), // 0.14 ckETH (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        // // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100_000u128), // 0.001 ckETH (transfer fee included)
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },

         // Test Case : Request Exactly $400 USD to check if the the remaining limit is in place
         TestCase { 
            asset: "ckUSDC".to_string(),
            amount: Nat::from(40_000_000_000u128), // 400 ckUSDC (transfer fee included)
            expect_success: false,
            expected_error_message: Some("Requested amount exceeds the remaining faucet limit.".to_string()),
        },

        // Test Case : Request Just close to the limit
        TestCase { 
            asset: "ckUSDC".to_string(),
            amount: Nat::from(5_000_000_000u128), // 50 ckUSDC (transfer fee included)
            expect_success: true,
            expected_error_message: None, 
        },
        // Test Case : Request Just Over $500 USD Limit
        TestCase { 
            asset: "ckUSDC".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ckUSDC (transfer fee included)
            expect_success: false,
            expected_error_message: Some("Requested amount exceeds the remaining faucet limit.".to_string()), 
        },
        // Test Case : Request $4500 USD beyond faucet limit
        TestCase { 
            asset: "ckUSDC".to_string(),
            amount: Nat::from(450_000_000_000u128), // 4500 ckUSDC (transfer fee included)
            expect_success: false,
            expected_error_message: Some("Requested amount exceeds the total faucet limit.".to_string()), 
        },

        // Test Case : Request extremely small amount
        TestCase { 
            asset: "ICP".to_string(), 
            amount: Nat::from(1u128), // 0.00000001 ICP (transfer fee included)
            expect_success: true, 
            expected_error_message: None, 
        },
        // Test Case : trailing whitespace in asset name
        TestCase { 
            asset: "ICP ".to_string(), // white space after ICP
            amount: Nat::from(1u128), // 0.00000001 ICP (transfer fee included)
            expect_success: false, 
            expected_error_message: Some("no canister id found".to_string()), 
        },
        // Test Case : lower case asset name
        TestCase { 
            asset: "icp".to_string(),  // lower case asset name
            amount: Nat::from(1u128), // 0.00000001 ICP (transfer fee included)
            expect_success: false, 
            expected_error_message: Some("no canister id found".to_string()), 
        },
        // Test Case : empty asset name
        TestCase { 
            asset: "".to_string(), // empty asset name
            amount: Nat::from(1u128), // 0.00000001 unknown (transfer fee included)
            expect_success: false, 
            expected_error_message: Some("Asset cannot be an empty string".to_string()), 
        },
        // Test Case : amount is zero
        TestCase { 
            asset: "ICP".to_string(), 
            amount: Nat::from(0u128), // 0 ICP (transfer fee included)
            expect_success: false, 
            expected_error_message: Some("Amount must be greater than 0".to_string()), 
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
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
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
                                "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
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