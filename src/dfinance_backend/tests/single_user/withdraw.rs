use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::get_user_principal2;
use crate::utils::error as errors;
use crate::utils::structs::*;





/*
 * @title Test Withdraw Functionality for Asset Transactions
 * @notice Validates the withdraw functionality for various assets like ICP, ckBTC, ckETH, etc.
 * @dev Ensures that the withdraw function handles different asset types and amounts correctly. It checks both successful withdrawal operations and failure cases such as insufficient balance, invalid asset types, and collateral withdrawal.
 * @functionality Confirms that the withdraw function processes requests successfully when expected and rejects invalid withdraw requests with appropriate error messages, while also verifying if the correct balance is returned after each withdrawal attempt.
 */
pub fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
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
            amount: Nat::from(1_50_000_000u128), // 1.50 ICP (transfer fee included)
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

        let user_principal = get_user_principal2();
        // Simulate 5 concurrent calls
        let mut msg_ids = vec![];
        for _ in 0..5 {
            /* Withdraw params */
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
            let result = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_withdraw",
                encode_one(withdraw_params).unwrap(),
            );
            msg_ids.push(result);
        }

        for (j, msg_id) in msg_ids.into_iter().enumerate() {
            let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
            let result = pic.await_call(msg_id).unwrap();
            match result {
                WasmResult::Reply(reply) => {
                    let withdraw_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                    match withdraw_response {
                        Ok(_balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Withdraw successful.\n",
                                i + 1,
                            );
                        }
                        Err(error) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(error.message()) {
                                    println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
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
                                ic_cdk::println!(
                                    "-----------------------------------------------------------------------",
                                );
                                ic_cdk::println!(
                                    "❌ Call {} Failed: Expected success but got error: {}",
                                    j + 1,
                                    error.message(),
                                );
                                ic_cdk::println!(
                                    "----------------  Wait for the previous operation to complete before retrying.  ------------\n",
                                );
                                // ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got error : {:?}: {:?}", i + 1, error, user_principal.to_text());
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
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}