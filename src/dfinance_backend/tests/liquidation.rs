use candid::{decode_one, encode_args, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
mod error;
use error as errors;

fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        debt_asset: String,
        collateral_asset: String,
        amount: Nat,
        on_behalf_of: Principal,
        reward_amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid cases with sufficient collateral
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(40400_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(10_000u128),
        //     on_behalf_of: get_user_principal(),
        //     reward_amount: Nat::from(361_936u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(50u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        // Unsupported asset pairs
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(100u128),
        //     expect_success: false,
        //     expected_error_message: Some("Invalid collateral-debt pair".to_string()),
        // },

        // // Zero amount (invalid scenario)
        // TestCase {
        //     debt_asset: "ckETH".to_string(),
        //     collateral_asset: "ckUSDC".to_string(),
        //     amount: Nat::from(0u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(0u128),
        //     expect_success: false,
        //     expected_error_message: Some("Amount must be greater than zero".to_string()),
        // },

        // Very large amounts (stress test)
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(u128::MAX), // Max possible amount
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(u128::MAX),
        //     expect_success: false,
        //     expected_error_message: Some("Amount exceeds maximum limit".to_string()),
        // },

        // // Edge case: Minimal possible amount
        // TestCase {
        //     debt_asset: "ICP".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(1u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(10u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        //  Invalid principal (malformed or blocked user)
        // TestCase {
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: Principal::from_slice(&[0; 29]), // Malformed principal
        //     reward_amount: Nat::from(5u128),
        //     expect_success: false,
        //     expected_error_message: Some("Invalid principal ID".to_string()),
        // },

        // // Zero reward amount (could be invalid depending on system logic)
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(10u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(0u128),
        //     expect_success: false,
        //     expected_error_message: Some("Reward amount must be greater than zero".to_string()),
        // },

        // Edge case: Borrowing with a different valid principal
        // TestCase {
        //     debt_asset: "ICP".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: Principal::from_text("w4xhj-lyaaa-aaaaa-qaaca-cai").unwrap(),
        //     reward_amount: Nat::from(150u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        // // Borrowing against an unlisted or unknown asset (hypothetical scenario)
        // TestCase {
        //     debt_asset: "XYZCoin".to_string(), // Unsupported coin
        //     collateral_asset: "ckUSDC".to_string(),
        //     amount: Nat::from(100u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(30u128),
        //     expect_success: false,
        //     expected_error_message: Some("Unsupported debt asset".to_string()),
        // },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );
    test_create_user_reserve_with_low_health(&pic, backend_canister);

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset);
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let asset_principal =
            test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister).unwrap();
        test_icrc2_aprove(
            get_users_principal(Nat::from(1u128)).unwrap(),
            asset_principal,
            &pic,
            backend_canister,
        );

        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
            reward_amount: case.reward_amount.clone(),
        };

        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(1u32)).unwrap(),
            "execute_liquidation",
            encode_one(liquidation_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let liquidation_response: Result<Nat, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode liquidation response");

                match liquidation_response {
                    Ok(_) => {
                        if case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation completed successfully",
                                i + 1
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success",
                                i + 1
                            );
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                i + 1,
                                e
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
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
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Liquidation Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
