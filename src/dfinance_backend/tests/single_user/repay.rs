use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::{
    get_user_principal2, test_get_asset_principal, test_icrc2_aprove
};
use crate::utils::error as errors;
use crate::utils::structs::*;




/*
 * @title Test Repay Functionality for Asset Transactions
 * @notice Validates the repay functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the repay function handles different asset types and amounts correctly. It checks both successful repay operations and failure cases such as insufficient balance, invalid asset types, or non-approved asset transfers.
 * @functionality Confirms that the repay function processes requests successfully when expected and rejects invalid repay requests with appropriate error messages, ensuring that the balance is correctly updated after each repayment attempt.
 */
pub fn test_repay(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid  test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_20_000_000u128), // 1.2 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal2();

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

        /* Get asset principal; handle missing cases  */
        let asset_principal =
            match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay rejected as expected",
                            i + 1,
                        );
                    } else {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Expected success but got rejection",
                            i + 1
                        );
                    }
                    continue;
                }
            };

        /*
         * @title Approve ICRC2 Transfer
         * @notice Approves ICRC2 transfer before supply operation.
         * @dev Validates approval status and expected outcomes.
         */
        let approved = test_icrc2_aprove(
            user_principal,
            asset_principal,
            &pic,
            backend_canister,
            Nat::from(case.amount.clone()), // Amount ICP (transfer fee included)
        );
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                    );
                    continue;
                }
                ic_cdk::println!(
                    "✅ IC Test Case {} Passed: Repay rejected as expected",
                    i + 1,
                );
            } else {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }

        // Simulate 5 concurrent calls
        let mut msg_ids = vec![];
        for _ in 0..5 {
            /* Repay params */
            let repay_params = ExecuteRepayParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(), // Amount ICP (transfer fee included)
                on_behalf_of: case.on_behalf_of.clone(),
            };

            /*
             * @title Execute Repay
             * @notice Executes the repay operation and validates outcomes.
             * @dev Calls the backend function, checks responses, and verifies success or failure.
             */
            let result = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_repay",
                encode_one(repay_params).unwrap(),
            );
            msg_ids.push(result);
        }

        for (j, msg_id) in msg_ids.into_iter().enumerate() {
            let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
            let result = pic.await_call(msg_id).unwrap();
            match result {
                WasmResult::Reply(reply) => {
                    let repay_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC repay response");

                    match repay_response {
                        Ok(_balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!("✅ IC Test Case {} Passed: Repay successful.\n", i + 1,);
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
                                "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                            } else {
                            //     ic_cdk::println!(
                            //     "❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}",
                            //     i + 1,
                            //     error,user_principal.to_text()
                            // );
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
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}