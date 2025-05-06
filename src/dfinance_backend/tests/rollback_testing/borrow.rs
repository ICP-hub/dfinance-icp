use candid::{ encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;






/*
 * @title Borrow Function Test
 * @notice Tests the borrow function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for borrow requests with different asset types and amounts. It checks the success or failure of each request, verifying the expected outcomes (such as a successful borrow or receiving an appropriate error message).
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes borrow requests for different assets (ICP, ckETH, ckUSDT, etc.) with varying amounts.
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Simulates borrow requests for multiple users to test borrowing scenarios and error handling.
 * 4. Validates the borrow response and checks whether the balance is updated correctly.
 * 5. Handles cases where the borrow request may fail due to errors or unexpected conditions, including mismatched error messages.
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
            amount: Nat::from(5_00_000_000u128), // 5 ICP (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(10_000_000_000u128), // 100 ICP (transfer fee included)
            expect_success: false,
            expected_error_message: Some("LTV should be less than Liquidation Threshold".to_string()),
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.000002 ckETH (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ckETH (transfer fee included)
            expect_success: false,
            expected_error_message: Some("LTV should be less than Liquidation Threshold".to_string()),
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 0.3 ckUSDT (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(200_800_000_000u128), // 2008 ckUSDT (transfer fee included)
            expect_success: false,
            expected_error_message: Some("LTV should be less than Liquidation Threshold".to_string()),
        },
    ];

    let user_principal = get_user_principal2();

    ic_cdk::println!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        if i%2 != Nat::from(0u128) {
            ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request (Intentional Failure to Trigger Rollback in a Controlled Manner) ", i + 1);
        }else{
            ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        }
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");


        ic_cdk::println!("\n=========================== Initial Reserve Data Before Roll Backs  ===========================\n");

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!("\n=========================== Initial User Data Before Roll Backs ===========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

            ic_cdk::println!("\n----------------------------------------------------------------------------------------\n");

        /* Borrow params */
        let borrow_params = ExecuteBorrowParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
        };

        /*
         * @title Execute Borrow Transaction
         * @notice Calls the backend canister to execute a borrow operation.
         * @dev Validates the borrow response and checks for expected success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_borrow",
            encode_one(borrow_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let borrow_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC borrow response");

                match borrow_response {
                    Ok(_balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Borrow successful.",
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
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
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
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during borrow function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
        if i%2 == Nat::from(0u128) {
            ic_cdk::println!("\n=========================== Final Reserve Data (No Rollbacks Initiated) ===========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            ic_cdk::println!(
            "\n=========================== Final User Data (No Rollbacks Initiated) ===========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
    }else{
        ic_cdk::println!("\n=========================== Verifying Reserve Data After Intended Rollback ===========================\n");
        fetch_reserve_data(pic, backend_canister, &case.asset);
        ic_cdk::println!(
            "\n=========================== Verifying User Data After Intended Rollback ===========================\n"
        );
        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
    }
    }
    ic_cdk::println!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}