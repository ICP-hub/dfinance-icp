use candid::{decode_one, encode_args, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
mod error;
use error as errors;

fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(3_800_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // Valid Collateral Withdrawals
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid Cases (General Failures)
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // // Valid Case: Withdraw Exact Reserve Amount
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(500u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    ];

    ic_cdk::println!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!(
            "On Behalf Of: {}",
            case.on_behalf_of
                .as_ref()
                .map_or("None".to_string(), |p| p.to_text())
        );
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            is_collateral: case.is_collateral.clone(),
        };
        // Now call the withdraw function  ///
        let result = pic.update_call(
            backend_canister,
            get_user_principal(),
            "execute_withdraw",
            encode_one(withdraw_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let withdraw_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                match withdraw_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Withdraw successful. New Balance: {}",
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
                                "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
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
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Function call error.");
            }
        }
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}
