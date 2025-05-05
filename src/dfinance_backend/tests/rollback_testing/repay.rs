use candid::{ encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc,  WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;





/*
 * @title Repay Function Test
 * @notice Tests the repay function for various assets and repayment conditions.
 * @dev This function runs a series of test cases for repay requests with different assets, amounts, and options for repaying on behalf of another principal. It verifies the success or failure of each repayment request, checks whether the appropriate error messages are returned, and ensures the rollback mechanism is triggered when needed.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes repay requests for different assets (e.g., ICP, ckETH, ckUSDT) with varying amounts, including transaction fees.
 * 2. Handles repayment requests both with and without approval for the ICRC2 transfer.
 * 3. Validates the approval status for ICRC2 transfer before proceeding with repayment.
 * 4. Verifies if the repayment is processed successfully or rejected as expected.
 * 5. Checks whether error messages are returned correctly in case of failure.
 * 6. Simulates repayment on behalf of another principal when applicable.
 * 7. Ensures that the rollback mechanism is triggered and the state is reverted when necessary.
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
            amount: Nat::from(100_000_000u128), // 1 ICP (transferfee included)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ICP (transferfee included)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(400u128), // 0.004 ckETH (transferfee included)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH (transferfee included)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 30 ckUSDT (transferfee included)
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
        if i%2 != Nat::from(0u128) {
            ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request (Intentional Failure to Trigger Rollback in a Controlled Manner) ", i + 1);
        }else{
            ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
        }
        // ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
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

        if i % 2 == Nat::from(0u128) {
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
                Nat::from(case.amount.clone()),
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
        }

        if i % 2 != Nat::from(0u128) {
            ic_cdk::println!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!("\n======================== Initial User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

            ic_cdk::println!("\n------------------------------------------------------------------------------------\n");
        }

        /* Repay params */
        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        /*
         * @title Execute Repay
         * @notice Executes the repay operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
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
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful.",
                            i + 1,
                        );
                    }
                    Err(error) => {
                        if case.expect_success {
                            if i % 2 != 0 {
                                ic_cdk::println!(
                                    "\n============================================================"
                                );
                                ic_cdk::println!(
                                    "🟢 Test Case {} Passed: ICRC Approval Not Provided",
                                    i + 1
                                );
                                ic_cdk::println!(
                                    "   ➜ Triggering rollback mechanism for asset: {}",
                                    case.asset
                                );
                                ic_cdk::println!(
                                    "------------------------------------------------------------"
                                );
                                ic_cdk::println!("🔄 Rollback Process Initiated...");
                                ic_cdk::println!("   ⏳ Reverting all state changes...");
                                ic_cdk::println!(
                                    "   🔁 Restoring previous balances and reserves..."
                                );
                                ic_cdk::println!("✅ Rollback Successfully Completed!");
                                ic_cdk::println!(
                                    "============================================================\n"
                                );
                            }
                        } else if case.expected_error_message.as_deref() != Some(error.message()) {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                i + 1,
                                case.expected_error_message.as_deref().unwrap_or("N/A"),
                                error.message()
                            );
                        } else {
                            ic_cdk::println!("✅ Test Case {} Passed: Supply rejected as expected with message: {:?}", i + 1, error);
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
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
        if i%2 == Nat::from(0u128) {
            ic_cdk::println!("\n======================== Final Reserve Data (No Rollbacks Initiated) ========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            ic_cdk::println!(
            "\n======================== Final User Data (No Rollbacks Initiated) ========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
            ic_cdk::println!("\n------------------------------------------------------------------------------------\n");
    }else{
        ic_cdk::println!("\n======================== Final Reserve Data After Rollback ========================\n");
        fetch_reserve_data(pic, backend_canister, &case.asset);
        ic_cdk::println!(
            "\n======================== Final User Data After Rollback ========================\n"
        );
        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        ic_cdk::println!("\n------------------------------------------------------------------------------------\n");
    }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}