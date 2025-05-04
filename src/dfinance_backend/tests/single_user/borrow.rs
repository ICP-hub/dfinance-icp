use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::{fetch_reserve_data, get_user_principal, get_user_principal2}; 
use crate::utils::error as errors;
use crate::utils::structs::*;




/*
 * @title Test Borrow Functionality for Asset Transactions
 * @notice Validates the borrow functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the borrow function handles different asset types and amounts correctly, checking both successful borrow operations and failure cases such as insufficient balance or invalid asset types.
 * @functionality Confirms that the borrow function processes requests successfully when expected and rejects invalid borrow requests with appropriate error messages.
 */
pub fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // valid test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(2_00_000_000u128), // 2 ICP (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal2();

    ic_cdk::println!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        /*
         * @title Execute Borrow Transaction
         * @notice Calls the backend canister to execute a borrow operation.
         * @dev Validates the borrow response and checks for expected success or failure.
         */
        // Simulate 5 concurrent calls
        let mut msg_ids = vec![];
        for _ in 0..5 {
            /* Borrow params */
            let borrow_params = ExecuteBorrowParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
            };
            let result = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_borrow",
                encode_one(borrow_params).unwrap(),
            );
            msg_ids.push(result);
        }

        for (j, msg_id) in msg_ids.into_iter().enumerate() {
            let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
            let result = pic.await_call(msg_id).unwrap();
            match result {
                WasmResult::Reply(reply) => {
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC borrow response");

                    match borrow_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Borrow successful.\n",
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
                                "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
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
                                // ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}", i + 1, error, user_principal.to_text());
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
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}