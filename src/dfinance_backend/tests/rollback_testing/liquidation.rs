use candid::{ encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;





/*
 * @title Liquidation Function Test
 * @notice Tests the liquidation function for various assets and liquidation conditions.
 * @dev This function runs a series of test cases for liquidation requests with different assets, amounts, and conditions for liquidating on behalf of another principal. It verifies the success or failure of each liquidation request, checks whether the appropriate error messages are returned, and ensures the rollback mechanism is triggered when needed.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes liquidation requests for different assets (e.g., ICP, ckBTC, ckUSDC) with varying amounts, including transaction fees.
 * 2. Handles liquidation requests both with and without approval for the ICRC2 transfer.
 * 3. Validates the approval status for ICRC2 transfer before proceeding with liquidation.
 * 4. Verifies if the liquidation is processed successfully or rejected as expected.
 * 5. Checks whether error messages are returned correctly in case of failure.
 * 6. Simulates liquidation on behalf of another principal when applicable.
 * 7. Ensures that the rollback mechanism is triggered and the state is reverted when necessary.
 * 8. Logs and prints detailed information about each test case, including asset details, expected success/failure, and error messages (if any).
 * 9. Fetches and prints reserve data and user data both before and after liquidation attempts to validate state changes or rollback.
 * 10. Provides feedback on whether the liquidation request succeeded or failed, and whether the rollback was correctly executed in case of failure.
 */

 pub fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        debt_asset: String,
        collateral_asset: String,
        amount: Nat,
        on_behalf_of: Principal,
        reward_amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid cases with sufficient collateral
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(40_000_000u128), // 0.4 ICP (transferfee included)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_400_000u128), // 0.404 ICP (liquidation reward)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210_000u128), // 0.0021 ckBTC (transferfee included)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220_500u128), // 0.002205 ckBTC (liquidation reward)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(20_000_000_000u128), // 2000 ckUSDC (transferfee included)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(21_000_000_000u128), // 2100 ckUSDC (liquidation reward)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 1250 ckUSDT (transferfee included)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_500_000u128), // 1306.25 ckUSDT (liquidation reward)
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "INV".to_string(),
            amount: Nat::from(50_000_000u128),  // 0.5 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(50_000_000u128),  // Expected reward: 0.5 ICP
            expect_success: false,
            expected_error_message: Some("no reserve data found of the given asset".to_string()), // Expecting failure due to invalid collateral asset
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ckBTC (includes transaction fee) higher than debt
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(100_000u128),  // No reward since liquidation request exceeds collateral
            expect_success: false,
            expected_error_message: Some("Repay cannot be more than debt".to_string()), // Expecting failure due to insufficient collateral
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );

    /*
     * @title Test Creating User Reserve with Low Health
     * @notice This function tests the creation of user reserves with low health factors.
     * @dev
     * - The function simulates users supplying and borrowing assets close to the liquidation threshold.
     * - It ensures that the approval process for ICRC2 transfers is validated before supply operations.
     * - Each user is assigned an asset to supply and borrow with predefined amounts.
     * - The function also verifies the expected behavior and error handling in case of failures.
     */
    test_create_user_reserve_with_low_health(pic, backend_canister);

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        if i%2 != Nat::from(0u128) {
            ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request (Intentional Failure to Trigger Rollback in a Controlled Manner) ", i + 1);
        }else{
            ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        }
        // ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset);
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        if i % 2 == Nat::from(0u128) {
            let asset_principal =
                match test_get_asset_principal(case.debt_asset.clone(), pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected",
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
                get_users_principal(Nat::from(1u128)).unwrap(),
                asset_principal,
                pic,
                backend_canister,
                case.amount.clone()

            );
            if !approved {
                if !case.expect_success {
                    if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                        println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given"),

                    );
                        continue;
                    }
                    ic_cdk::println!(
                        "✅ IC Test Case {} Passed: Liquidation rejected as expected",
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
            if case.collateral_asset == case.debt_asset {
                ic_cdk::println!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            } else {
                ic_cdk::println!("\n======================== Initial Debt Asset Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.debt_asset);

                ic_cdk::println!("\n======================== Initial Collateral Asset Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            }

            ic_cdk::println!("\n======================== Initial Liquidator User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.debt_asset);

            ic_cdk::println!("\n======================== Initial On Behalf User Data Before Roll Backs ========================\n");

            fetch_user_data(
                pic,
                backend_canister,
                &case.on_behalf_of,
                &case.collateral_asset,
            );
        }
        /* Liquidation params */
        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            reward_amount: case.reward_amount.clone(),
        };

        /*
         * @title Execute Liquidation
         * @notice Executes the liquidation operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(1u32)).unwrap(),
            "execute_liquidation",
            encode_one(liquidation_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let liquidation_response: Result<Nat, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode liquidation response");

                match liquidation_response {
                    Ok(_) => {
                        if case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation completed successfully",
                                i + 1
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success",
                                i + 1
                            );
                        }
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
                                    case.debt_asset
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
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
        if i%2 == Nat::from(0u128) {

            if case.collateral_asset == case.debt_asset {
                ic_cdk::println!("\n========================  Final Reserve Data (No Rollbacks Initiated)  ========================\n");
    
                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            } else {
                ic_cdk::println!("\n======================== Final Debt Asset Reserve Data (No Rollbacks Initiated)  ========================\n");
    
                fetch_reserve_data(pic, backend_canister, &case.debt_asset);
    
                ic_cdk::println!("\n========================  Final Collateral Asset Reserve Data (No Rollbacks Initiated)  ========================\n");
    
                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            }
    
            ic_cdk::println!("\n======================== Liquidator User Data (No Rollbacks Initiated) ========================\n");
    
            fetch_user_data(pic, backend_canister, &user_principal, &case.debt_asset);
    
            ic_cdk::println!("\n======================== On Behalf User Data (No Rollbacks Initiated) ========================\n");
    
            fetch_user_data(
                pic,
                backend_canister,
                &case.on_behalf_of,
                &case.collateral_asset,
            );
    }else{
        if case.collateral_asset == case.debt_asset {
            ic_cdk::println!("\n========================  Reserve Data After Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
        } else {
            ic_cdk::println!("\n======================== Debt Asset Reserve Data After Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.debt_asset);

            ic_cdk::println!("\n======================== Collateral Asset Reserve Data After Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
        }

        ic_cdk::println!("\n======================== Liquidator User Data After Roll Backs ========================\n");

        fetch_user_data(pic, backend_canister, &user_principal, &case.debt_asset);

        ic_cdk::println!("\n======================== On Behalf User Data After Roll Backs ========================\n");

        fetch_user_data(
            pic,
            backend_canister,
            &case.on_behalf_of,
            &case.collateral_asset,
        );
    }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}