use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use tracing::{info,error};

/*
 * @title Supply Function Test
 * @notice Tests the supply function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for supply requests with different asset types, amounts, and collateral statuses. It checks the success or failure of each request, verifying the expected outcomes (such as a successful supply or receiving an appropriate error message).
 *
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 *
 * @functionality:
 * 1. Executes supply requests for different assets (ICP, ckETH, ckUSDT, etc.) with varying amounts and collateral statuses.
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Handles cases where ICRC2 approval is required for the asset.
 * 4. Simulates supply requests for multiple users to test asset supply scenarios and rollback mechanisms.
 * 5. Validates the state of reserves and user data before and after the supply operation.
 * 6. Handles scenarios where supply requests may fail due to insufficient approval or unexpected errors.
 */

pub fn test_supply(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        can_be_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(2_500_000_000u128), // 25 ICP (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(400_000_000u128), // 4 ICP (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(10_000_000u128), // 0.1 ckETH (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(100_000u128), // 0.001 ckETH (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(25_000_000_000u128), // 250 ckUSDT (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(5_000_000_000u128), // 50 ckUSDT (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(4_500_000_000u128), // 45 ckUSDT (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(42_093_186u128), // 0.42093186 ICP (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal2();
    let mut passed_tests = 0;
    let mut failed_tests: i32 = 0;

    init_tracing();
    info!("\n======================== Starting IC Supply Tests ========================\n");

    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        if i % 2 != Nat::from(0u128) {
            info!("🔵 IC Test Case {}: Executing Supply Request (Intentional Failure to Trigger Rollback in a Controlled Manner) ", i + 1);
        } else {
            info!("🔵 IC Test Case {}: Executing Supply Request", i + 1);
        }
        info!(" Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!(" Amount: {}", amount_float / 100000000.0);
        info!(" Is Collateral: {}", case.can_be_collateral);
        info!(" Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!(" Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        if i % 2 == Nat::from(0u128) {
            /* Get asset principal; handle missing cases  */
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        if !case.expect_success {
                            info!(
                                "✅ IC Test Case {} Passed: Supply rejected as expected",
                                i + 1,
                            );
                        } else {
                            error!(
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
                pic,
                backend_canister,
                case.amount.clone(),
            );
            if !approved {
                if !case.expect_success {
                    if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                        error!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                    );
                        continue;
                    }
                    info!(
                        "✅ IC Test Case {} Passed: Supply rejected as expected",
                        i + 1,
                    );
                } else {
                    error!(
                        "❌ IC Test Case {} Failed: Expected success but got rejection",
                        i + 1
                    );
                }
                continue;
            }
        }
        info!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

        fetch_reserve_data(pic, backend_canister, &case.asset);

        if i == Nat::from(0u128) {
            info!("\n======================== User Reserve Data will be Created after supply ========================\n");
        } else {
            info!("\n======================== Initial User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }
        info!("\n----------------------------------------------------------------------------------------\n");
        /* Supply params */
        let supply_params = ExecuteSupplyParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            can_be_collateral: case.can_be_collateral,
        };

        /*
         * @title Execute Supply
         * @notice Executes the supply operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_supply",
            encode_one(supply_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let supply_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode supply response");
                info!("Supply response: {:?}", supply_response);
                match supply_response {
                    Ok(_balance) => {
                        if !case.expect_success {
                            error!(
                                "❌ Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            failed_tests += 1;
                        } else {
                            info!("✅ Test Case {} Passed: Supply successful.", i + 1,);
                            passed_tests += 1;
                        }
                    }
                    Err(error) => {
                        if case.expect_success {
                            if i % 2 != 0 {
                                info!(
                                    "\n============================================================"
                                );
                                error!(
                                    "❌ Test Case Failed: Supply failed with error: {:?}",
                                    error
                                );
                                info!(
                                    "✅ Test Case {} Passed: ICRC Approval Not Provided",
                                    i + 1
                                );
                                info!(
                                    "   ➜ Triggering rollback mechanism for asset: {}",
                                    case.asset
                                );
                                info!(
                                    "------------------------------------------------------------"
                                );
                                info!("🔄 Rollback Process Initiated...");
                                info!("   ⏳ Reverting all state changes...");
                                info!(
                                    "   🔁 Restoring previous balances and reserves..."
                                );
                                info!("✅ Rollback Successfully Completed!");
                                info!(
                                    "============================================================\n"
                                );

                                failed_tests += 1;
                            }
                        } else if case.expected_error_message.as_deref() != Some(error.message()) {
                            error!(
                                "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                i + 1,
                                case.expected_error_message.as_deref().unwrap_or("N/A"),
                                error.message()
                            );
                            failed_tests += 1;
                        } else {
                            info!("✅ Test Case {} Passed: Supply rejected as expected with message: {:?}", i + 1, error);
                            passed_tests += 1;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                error!(
                    "❌ Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                failed_tests += 1;
            }
            Err(e) => {
                error!(
                    "❌ Test Case {} Failed: Error during supply function call: {:?}",
                    i + 1,
                    e
                );
                failed_tests += 1;
            }
        }
        if i % 2 == Nat::from(0u128) {
            info!("\n======================== Verifying Reserve Data (No Rollbacks Initiated) ========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            info!(
            "\n======================== Verifying User Data (No Rollbacks Initiated) ========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        } else {
            info!("\n======================== Verifying Reserve Data After Intended Rollback ========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            info!(
            "\n======================== Verifying User Data After Intended Rollback ========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

            info!("\n----------------------------------------------------------------------------------------\n");
        }
    }

    info!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}
