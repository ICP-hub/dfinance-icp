use candid::{decode_one, encode_args, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
mod error;
use error as errors;

fn test_faucet(pic: &PocketIc, backend_canister: Principal) {
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
            amount: Nat::from(5_000_000_000u128), // 50 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128), // 0.0004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128), //   0.00002 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128), // 0.0001 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(1000_000u128), //  0.00005 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100000u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50000u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(10_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Amount is too much".to_string()),
        },
        // Boundry amount
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Faucet Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Faucet Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }
        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(1u32)).unwrap(),
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }

        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(2u32)).unwrap(),
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Faucet Tests Completed ========================\n"
    );
}