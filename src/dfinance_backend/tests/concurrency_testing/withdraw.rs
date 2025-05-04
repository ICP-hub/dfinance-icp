use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::fetch_reserve_data;
use crate::utils::error as errors;
use crate::utils::structs::*;





/*
 * @title Test Withdraw Functionality for Asset Transactions
 * @notice Validates the withdraw functionality for various assets like ICP, ckBTC, ckETH, etc.
 * @dev Ensures that the withdraw function handles different asset types and amounts correctly. It checks both successful withdrawal operations and failure cases such as insufficient balance, invalid asset types, and collateral withdrawal.
 * @functionality Confirms that the withdraw function processes requests successfully when expected and rejects invalid withdraw requests with appropriate error messages, while also verifying if the correct balance is returned after each withdrawal attempt.
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
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(3_800_000_000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40_000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5_000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(1_000_000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2_000_000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
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
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");
        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let withdraw_params = ExecuteWithdrawParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                is_collateral: case.is_collateral.clone(),
            };
            // Now call the withdraw function
            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_withdraw",
                    encode_one(withdraw_params).unwrap(),
                )
                .unwrap();
            msg_ids.push(msg);
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }

        for result in results {
            match result {
                WasmResult::Reply(reply) => {
                    let withdraw_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                    match withdraw_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Withdraw successful.",
                                i + 1,
                            );
                        }
                        Err(error) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(error.message()) {
                                    println!(
                                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                        error.message()
                                    );
                                    continue;
                                }
                                ic_cdk::println!(
                                    "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                                continue;
                            }
                        }
                    }
                }
                WasmResult::Reject(reject_message) => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    continue;
                }
            }
        }
        ic_cdk::println!(
            "\n======================== Total reserve data after concurent calls  ========================\n"
        );
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone());
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}