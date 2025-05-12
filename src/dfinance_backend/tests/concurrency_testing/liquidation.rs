use crate::utils::common_functions::{
    fetch_reserve_data, get_user_principal2, get_users_principal,
    test_create_user_reserve_with_low_health, test_get_asset_principal, test_icrc2_aprove,
};
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};

/*
 * @title Test Liquidation Functionality for Asset Transactions
 * @notice Validates the liquidation functionality for assets when the borrower’s health factor falls below the liquidation threshold.
 * @dev Ensures that the liquidation process is triggered correctly for assets like ICP, ckBTC, ckETH, etc., under various conditions, including valid and invalid scenarios.
 * @functionality Confirms that the liquidation function processes requests successfully when the borrower is eligible for liquidation and rejects invalid liquidation requests (e.g., if the health factor is above the threshold). Verifies if the correct asset is liquidated and if the borrower’s balance is updated appropriately.
 */
#[allow(dead_code)]
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
            reward_amount: Nat::from(40_357_486u128), // Reward calculated accordingly
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210_000u128), // 0.0021 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220_496u128), // Reward calculated accordingly
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(20_000_000_000u128), // 2,000 ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(20_999_673_926u128), // Reward calculated accordingly
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 125 ckUSDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_155_527u128), // Reward calculated accordingly
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal2();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );
    test_create_user_reserve_with_low_health(pic, backend_canister); // Create user reserves for liquidation tests

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset); // Log the debt asset involved in liquidation
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset); // Log the collateral asset involved in liquidation
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0); // Convert amount to human-readable format (with correct precision)
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of); // Log the principal on whose behalf liquidation is executed
        ic_cdk::println!("Reward Amount: {}", case.reward_amount); // Log the reward amount calculated for liquidation
        ic_cdk::println!("Expected Success: {}", case.expect_success); // Log expected outcome of the test
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg); // Log expected error message for failure cases
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        ic_cdk::println!("\n====================== Initial Debt Reserves before concurrent Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.debt_asset); // Fetch and log the initial debt reserves before liquidation
        ic_cdk::println!("\n====================== Initial Collateral Reserves before concurrent Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.collateral_asset); // Fetch and log the initial collateral reserves before liquidation
        ic_cdk::println!("\n---------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs for liquidation requests
        for _ in random_users.clone() {
            let asset_principal =
                match test_get_asset_principal(case.debt_asset.clone(), pic, backend_canister) {
                    Some(principal) => principal, // Get the asset principal for liquidation
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
                        continue; // Skip to next test case
                    }
                };

            let approved = test_icrc2_aprove(
                user_principal,
                asset_principal,
                pic,
                backend_canister,
                case.amount.clone(), // Approve ICRC2 transfer for liquidation
            );
            if !approved {
                if !case.expect_success {
                    if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                        println!(
                            "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                            i + 1,
                            case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                        );
                        continue; // Skip to next test case
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

            let liquidation_params = ExecuteLiquidationParams {
                debt_asset: case.debt_asset.clone(),
                collateral_asset: case.collateral_asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
                reward_amount: case.reward_amount.clone(),
            };

            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_liquidation",
                    encode_one(liquidation_params).unwrap(), // Submit liquidation request with parameters
                )
                .unwrap();
            msg_ids.push(msg); // Store message ID for tracking the request
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res); // Store results of all liquidation requests
        }

        for result in results {
            match result {
                WasmResult::Reply(response) => {
                    let liquidation_response: Result<Nat, errors::Error> =
                        candid::decode_one(&response)
                            .expect("Failed to decode liquidation response");

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
                        Err(e) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(e.message()) {
                                    println!(
                                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("Error msg not given"),
                                        e.message()
                                    );
                                    continue;
                                }
                                ic_cdk::println!(
                                    "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                    i + 1,
                                    e
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
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

        ic_cdk::println!("\n====================== Final Debt Reserves after Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.debt_asset); // Fetch and log the final debt reserves after liquidation
        ic_cdk::println!("\n====================== Final Collateral Reserves after Liquidation ======================\n");
        fetch_reserve_data(pic, backend_canister, &case.collateral_asset); // Fetch and log the final collateral reserves after liquidation
        ic_cdk::println!("\n---------------------------------------------------------\n");
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
