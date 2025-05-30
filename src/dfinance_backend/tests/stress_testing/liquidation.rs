use candid::{ encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use tracing::{info,error};


/*
 * @title Liquidation Stress Test
 * @notice This function tests the liquidation functionality by simulating liquidation requests for different debt and collateral assets.
 * @dev It runs multiple test cases with varying amounts of debt, collateral, and rewards, checking if the liquidation logic behaves correctly.
 *      The function validates the approval of ICRC2 transfers, the execution of liquidation requests, and the expected results.
 *      It logs detailed information, including the success or failure of each test case and any mismatches in expected error messages.
 *      After each test case, the function outputs the success/failure status and any related error messages, ensuring accurate reporting.
 * 
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with debt and collateral assets and amounts.
 * 2. Validates the approval of ICRC2 transfers before proceeding with liquidation.
 * 3. Sends liquidation requests for each test case, checking if the function completes successfully or fails as expected.
 * 4. If the request fails, ensures the expected error message matches the actual error.
 * 5. Logs detailed results for each test case, including success/failure information and any error message mismatches.
 * 6. Ensures the correct behavior when liquidation is expected to fail, confirming rejection messages are consistent.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the liquidation function resides.
 * @param random_users List of user principals for whom the liquidation request will be tested.
 */

pub fn test_liquidation(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(40_000_000u128), // 0.4 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_357_475u128), // 0.40357486 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(410_000u128), // 0.0041 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(430_486u128), // 0.00430486 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(20_000_000_000u128), // 200 ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(20_999_673_916u128), // 209.99673926 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 125 ckUSDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_175_517u128), // 130.62175527 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid burn amount : with 0 reward
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), //0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(0u128), //0 reward
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), // 0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128),     // Expected reward: 0.0525 ckETH
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
            reward_amount: Nat::from(10_000u128),  // No reward since liquidation request exceeds collateral
            expect_success: false,
            expected_error_message: Some("Reward is higher than expected".to_string()), 
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(1_000_000_000_000_000_000u128), // 1 million ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(1_050_000_000_000_000_000u128),  // Expected reward: 1.05 million ckUSDC
            expect_success: false,
            expected_error_message: Some("Reward is higher than expected".to_string()), // Stress test should pass if the system can handle the large amount
        },
    ];
    init_tracing();
    info!(
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
        info!("\n------------------------------------------------------------");
        info!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        info!("Debt Asset: {}", case.debt_asset);
        info!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        info!("Amount: {}", amount_float / 100000000.0);
        info!("On Behalf Of: {}", case.on_behalf_of);
        let reward_amount_u128: u64 = case.reward_amount.clone().0.try_into().unwrap();
        let reward_amount_float = reward_amount_u128 as f64;
        info!("Reward Amount: {}", reward_amount_float / 100000000.0);
        info!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            info!("Expected Error Message: {}", msg);
        }
        info!("------------------------------------------------------------\n");

        info!("\n====================== Checking Debt Reserves before Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.debt_asset);
        info!("\n====================== Checking Collateral Reserves before Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
        info!("\n-----------------------------------------------------------------------------\n");
        for user_principal in random_users.clone() {
            info!("\nPerforming Test: {} for user:   {:?}\n", (i+1), user_principal.to_text() );
            /* Get asset principal; handle missing cases  */
            let asset_principal =
                match test_get_asset_principal(case.debt_asset.clone(), pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        if !case.expect_success {
                            info!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected",
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
                case.amount.clone()

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
                        "✅ IC Test Case {} Passed: Liquidation rejected as expected",
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
                user_principal,
                "execute_liquidation",
                encode_one(liquidation_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(response)) => {
                    let liquidation_response: Result<Nat, errors::Error> =
                        candid::decode_one(&response)
                            .expect("Failed to decode liquidation response");

                    match liquidation_response {
                        Ok(_) => {
                            if case.expect_success {
                                info!(
                                    "✅ IC Test Case {} Passed: Liquidation completed successfully",
                                    i + 1
                                );
                                info!("\n====================== Checking Debt Reserves After successful Liquidation ======================\n");
                                fetch_reserve_data(pic, backend_canister, &case.debt_asset);
                                info!("\n====================== Checking Collateral Reserves After successful Liquidation ======================\n");
                                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
                                info!("\n-----------------------------------------------------------------------------\n");
                            } else {
                                error!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success",
                                    i + 1
                                );
                            }
                        }
                        Err(e) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(e.message()) {
                                    error!(
                                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                                        e.message()
                                    );
                                    continue;
                                }
                                info!(
                                    "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                    i + 1,
                                    e
                                );
                            } else {
                                error!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
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
                _ => {
                    error!(
                        "❌ IC Test Case {} Failed: Error during liquidation function call:",
                        i + 1,
                    );
                    continue;
                }
            }
        }
    }
    info!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}