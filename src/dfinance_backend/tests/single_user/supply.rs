use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::{
     get_user_principal2, test_get_asset_principal, test_icrc2_aprove
};
use crate::utils::error as errors;
use crate::utils::structs::*;







/*
 * @title Test Supply Functionality for Asset Transactions
 * @notice Validates the functionality of the supply operation for various assets.
 * @dev Ensures that the supply function correctly processes asset supply requests, including handling collateral, amount validation, and edge cases such as asset approval errors or insufficient funds.
 * @functionality Confirms that the supply function performs as expected, rejecting invalid requests and successfully processing valid transactions.
 */

pub fn test_supply(pic: &PocketIc, backend_canister: Principal) {
        #[derive(Debug, Clone)]
        struct TestCase {
            asset: String,
            amount: Nat,
            is_collateral: bool,
            expect_success: bool,
            expected_error_message: Option<String>,
        }
    
        let test_cases: Vec<TestCase> = vec![
            // ✅ Valid Test Case (only one active for now, uncomment others as needed)
            TestCase {
                asset: "ICP".to_string(),
                amount: Nat::from(5_00_000_000u128), // 5 ICP (includes transaction fee)
                is_collateral: true,
                expect_success: true,
                expected_error_message: None,
            },
        ];
    
        let user_principal = get_user_principal2();
    
        ic_cdk::println!("\n================= Starting IC Supply Tests =================\n");
    
        for (i, case) in test_cases.iter().enumerate() {
            ic_cdk::println!(
                "\n------------------ Test Case {} ------------------",
                i + 1
            );
            ic_cdk::println!("Asset: {}", case.asset);
            ic_cdk::println!("Amount: {}", case.amount.clone());
            ic_cdk::println!("Is Collateral: {}", case.is_collateral);
            ic_cdk::println!("Expect Success: {}", case.expect_success);
    
            if let Some(ref msg) = case.expected_error_message {
                ic_cdk::println!("Expected Error Message: {}", msg);
            }
    
            // Get the asset principal (fail fast if None)
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        if !case.expect_success {
                            ic_cdk::println!("✅ Passed: Supply rejected as expected");
                        } else {
                            ic_cdk::println!("❌ Failed: Expected success but got rejection");
                        }
                        continue;
                    }
                };
    
            // Approve ICRC2 transfer before attempting supply
            let approved = test_icrc2_aprove(
                user_principal,
                asset_principal,
                &pic,
                backend_canister,
                case.amount.clone(), // 5 ICP (transfer fee included)
            );
            if !approved {
                if !case.expect_success {
                    let expected = case.expected_error_message.as_deref().unwrap_or("");
                    if expected != "icrc2 not approved" {
                        ic_cdk::println!(
                            "❌ Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                            expected
                        );
                    } else {
                        ic_cdk::println!("✅ Passed: Supply rejected as expected");
                    }
                } else {
                    ic_cdk::println!("❌ Failed: Expected success but got rejection");
                }
                continue;
            }
    
            // Simulate 5 concurrent calls
            let mut msg_ids = vec![];
            for _ in 0..5 {
                // Supply parameters
                let supply_params = ExecuteSupplyParams {
                    asset: case.asset.clone(),
                    amount: case.amount.clone(), // 5 ICP (transfer fee included)
                    is_collateral: case.is_collateral,
                };
                let msg_id = pic.submit_call(
                    backend_canister,
                    user_principal,
                    "execute_supply",
                    encode_one(supply_params).unwrap(),
                );
                msg_ids.push(msg_id);
            }
    
            // Await and handle all concurrent responses
            for (j, msg_id) in msg_ids.into_iter().enumerate() {
                let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
                let result = pic.await_call(msg_id).unwrap();
    
                match result {
                    WasmResult::Reply(reply) => {
                        let response: Result<Nat, errors::Error> =
                            candid::decode_one(&reply).expect("Failed to decode supply response");
    
                        match response {
                            Ok(_balance) => {
                                if case.expect_success {
                                    ic_cdk::println!(
                                        "✅ Call {} Success: Supply succeeded.\n",
                                        j + 1,
                                    );
                                } else {
                                    ic_cdk::println!(
                                        "❌ Call {} Failed: Expected failure but got success.",
                                        j + 1
                                    );
                                }
                            }
                            Err(error) => {
                                if !case.expect_success {
                                    let expected = case.expected_error_message.as_deref().unwrap_or("");
                                    if expected != error.message() {
                                        ic_cdk::println!(
                                            "❌ Call {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                            j + 1,
                                            expected,
                                            error.message()
                                        );
                                    } else {
                                        ic_cdk::println!(
                                            "✅ Call {} Passed: Supply rejected with expected error: {}",
                                            j + 1,
                                            error.message()
                                        );
                                    }
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
                                    
                                }
                            }
                        }
                    }
                    WasmResult::Reject(reason) => {
                        ic_cdk::println!("❌ Call {} Rejected: Rejection message: {}", j + 1, reason);
                    } 
                }
            }
        }
    
        ic_cdk::println!("\n================= IC Supply Tests Completed =================\n");
    }