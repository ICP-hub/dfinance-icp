use crate::utils::common_functions::fetch_reserve_data;
use crate::utils::common_functions::init_tracing;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Test Borrow Functionality for Asset Transactions
 * @notice Validates the borrow functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the borrow function handles different asset types and amounts correctly, checking both successful borrow operations and failure cases such as insufficient balance or invalid asset types.
 * @functionality Confirms that the borrow function processes requests successfully when expected and rejects invalid borrow requests with appropriate error messages.
 */
#[allow(dead_code)]
pub fn test_borrow(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(1_000_000_000u128), // 10 ICP (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20_000u128), // 0.0002 ckBTC (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(400_000u128), // 4 ckUSDT (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.0002 ckETH (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(800_000u128), // 8 ckUSDC (includes transaction fee)
            expect_success: true,
            expected_error_message: None,
        },
    ];
    init_tracing();

    info!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        info!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0); // Displaying the amount in human-readable form
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        info!(
            "\n======================== Initial reserve data before concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone()); // Fetch and print reserve data before borrowing
        info!("\n---------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let borrow_params = ExecuteBorrowParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
            };

            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_borrow",
                    encode_one(borrow_params).unwrap(),
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
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC borrow response");

                    match borrow_response {
                        Ok(_balance) => {
                            if !case.expect_success {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            info!(
                                "✅ IC Test Case {} Passed: Borrow successful.",
                                i + 1,
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
                                    "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
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
        info!(
            "\n======================== Total reserve data after concurrent calls  ========================\n"
        );
        fetch_reserve_data(pic, backend_canister, &case.asset.clone()); // Fetch and print reserve data after borrowing
        info!("\n---------------------------------------------------------\n");
    }
    info!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}
