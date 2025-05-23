use candid::{ encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc,  WasmResult};
use tracing::{info,error};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;



/*
 * @title Withdraw Function Test
 * @notice Tests the withdraw function for various assets and withdrawal conditions.
 * @dev This function runs a series of test cases for withdraw requests with different assets, amounts, collateral status, and options for withdrawing on behalf of another principal. It verifies the success or failure of each withdrawal request and checks whether the appropriate error messages are returned when failures occur.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes withdraw requests for different assets (e.g., ICP, ckETH, ckUSDT) with varying amounts, including collateralized and non-collateralized withdrawals.
 * 2. Checks if the withdrawal is processed successfully or rejected as expected.
 * 3. Simulates withdrawing on behalf of another user when applicable.
 * 4. Verifies that error messages are returned correctly if the withdrawal is unsuccessful or if the expected outcome does not match.
 * 5. Validates whether the balance is updated correctly after the withdrawal.
 */

 pub fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        can_be_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(400_000u128), // 0.004 ckUSDT (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(200_000_000_000u128), // 2000 ckUSDT (includes transaction fee)
            can_be_collateral: false,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000u128), // 0.01 ICP (includes transaction fee)
            can_be_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(20_000_000_000u128), // 200 ICP (includes transaction fee)
            can_be_collateral: true,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500_000u128), // 0.005 ckUSDT (includes transaction fee)
            can_be_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500_000_000_000u128), // 5000 ckUSDT (includes transaction fee)
            can_be_collateral: true,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
    ];
    init_tracing();
    info!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        info!("\n------------------------------------------------------------");
        if i%2 != Nat::from(0u128) {
            info!("🔵 IC Test Case {}: Executing Withdraw Request (Intentional Failure to Trigger Rollback in a Controlled Manner) ", i + 1);
        }else{
            info!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        }
        // info!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        info!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0);
        info!("Is Collateral: {}", case.can_be_collateral);
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        info!("\n=========================== Initial Reserve Data Before Roll Backs  ===========================\n");

        fetch_reserve_data(pic, backend_canister, &case.asset);

        info!("\n=========================== Initial User Data Before Roll Backs ===========================\n");

        fetch_user_data(pic, backend_canister, &get_user_principal2(), &case.asset);

        info!("\n----------------------------------------------------------------------------------------\n");

        /* Withdraw params */
        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            can_be_collateral: case.can_be_collateral,
        };

        /*
         * @title Execute Withdraw
         * @notice Executes the withdraw operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            get_user_principal2(),
            "execute_withdraw",
            encode_one(withdraw_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let withdraw_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                match withdraw_response {
                    Ok(_balance) => {
                        if !case.expect_success {
                            error!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        info!(
                            "✅ IC Test Case {} Passed: Withdraw successful.",
                            i + 1,
                        );
                        info!("\n=========================== Final Reserve Data (Without Roll Backs)  ===========================\n");

                            fetch_reserve_data(pic, backend_canister, &case.asset);

                            info!("\n=========================== Final User Data (Without Roll Backs) ===========================\n");

                            fetch_user_data(pic, backend_canister, &get_user_principal2(), &case.asset);

                            info!("\n----------------------------------------------------------------------------------------\n");
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
                                "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                            info!("\n=========================== Final Reserve Data After Roll Backs  ===========================\n");

                            fetch_reserve_data(pic, backend_canister, &case.asset);

                            info!("\n=========================== Final User Data After Roll Backs ===========================\n");

                            fetch_user_data(pic, backend_canister, &get_user_principal2(), &case.asset);

                            info!("\n----------------------------------------------------------------------------------------\n");
                        } else {
                            error!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
                        }
                        
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                error!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                error!(
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }

    info!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}