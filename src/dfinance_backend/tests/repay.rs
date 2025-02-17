use candid::{decode_one, encode_args, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
mod error;
use error as errors;


fn test_repay(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500u128),
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
            amount: Nat::from(50000000u128),
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
        // repay on no borrow
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no debt to repay".to_string()),
        },
    ];

    let user_principal = get_user_principal();

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

        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        // Now call the repay function
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
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                i + 1,
                                error
                            );
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
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Repay Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}
