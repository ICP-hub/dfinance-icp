use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
/*
 * @title IC Supply Functionality Test
 * @description This function tests the `execute_supply` method of the backend canister by simulating valid and invalid supply scenarios.
 *
 * @details
 * - Defines a list of test cases involving various assets, amounts, and collateral configurations.
 * - Validates the asset principal, approves ICRC2 transfers, and submits the supply request.
 * - Checks the expected outcome of each test (success or failure), and validates error messages if provided.
 * - Ensures edge cases such as invalid asset names, zero amounts, long asset names, and insufficient balance are properly handled.
 * - Provides detailed logging for each test case to indicate success/failure, expected vs actual outcomes, and reasons for failure.
 *
 * @steps
 * 1. Loop through a list of structured test cases.
 * 2. For each test case:
 *    a. Resolve asset principal and check validity.
 *    b. Call ICRC2 approve to simulate user consent for transfer.
 *    c. Attempt supply operation and capture the result.
 *    d. Compare actual behavior with expected success/failure and expected error messages.
 *    e. Log the test result and mismatch details if applicable.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister being tested.
 *
 * @result
 * - Confirms that the supply logic correctly handles both typical and edge-case inputs.
 * - Validates proper approval handling, input validation, error feedback, and backend canister interaction.
 *
 * @note
 * Uses `ic_cdk::println!` for detailed output during each step of the test run.
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
        // Valid Test Cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(500_000_000u128), // 5 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40_000u128), // 0.4 ckBTC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ckUSDC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(), // 0.05 ckETH (includes transaction fee)
            amount: Nat::from(5_000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(300_000_000u128), // 300 ckUSDT (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(), // Asset previously supplied as non-collateral
            amount: Nat::from(10_000_000_000u128), // Supply another 100 ckUSDT
            is_collateral: false, // Explicitly keep it non-collateral
            expect_success: true, // Should succeed, just adding to existing non-collateral position
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(), // Asset previously supplied as non-collateral
            amount: Nat::from(50_000_000_00u128), // Supply another 50 ckUSDT
            is_collateral: true, // Explicitly keep it collateral
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(20_000_00u128), // 20 ckUSDT (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        //  Invalid Test Cases
        // Empty assets name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(1_000_000_000_000_000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        //low supply amount
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1u128), // Supply 1 e8s
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Fee exceeds the amount".to_string()),
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(10_001u128), // Supply 10,001 e8s
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Fee exceeds the amount".to_string()),
        },
        //  low wallet amount
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(100_000_000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some(
                "Amount must be less than user available balance".to_string(),
            ),
        },
        // Zero amount request
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(0u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some(
                "Asset must have a maximum length of 7 characters".to_string(),
            ),
        },
        // Non-existent asset
        TestCase {
            asset: "ckXYZ".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // TRAILING WHITESPACES
        TestCase {
            asset: "ckUSDC ".to_string(),
            amount: Nat::from(50_000_000_000u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
    ];

    let user_principal = get_user_principal2();
    ic_cdk::println!(
        "\n======================== Starting IC Supply Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Supply Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        
        ic_cdk::println!("------------------------------------------------------------\n");

        let asset_principal =
            match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply rejected as expected",
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

        ic_cdk::println!("user principal = {:?}",user_principal.to_text());
        ic_cdk::println!("asset principal = {:?}", asset_principal.to_text());
        ic_cdk::println!("backend canister = {:?}",backend_canister.to_text());

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
            case.amount.clone(),
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
                    "✅ IC Test Case {} Passed: Supply rejected as expected",
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
        /* Supply params */
        let supply_params = ExecuteSupplyParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            is_collateral: case.is_collateral,
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
                    candid::decode_one(&reply).expect("Failed to get supply response");

                match supply_response {
                    Ok(_) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!("✅ IC Test Case {} Passed: Supply successful.", i + 1,);
                        ic_cdk::println!("\n=================== Checking Reserves After successful supply ===================\n");
                        // Check reserves after successful supply
                        fetch_reserve_data(pic, backend_canister, &case.asset);
                        ic_cdk::println!("\n=================== Checking User data After successful supply ===================\n");
                        // Check user data after successful supply
                        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
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
                                "✅ IC Test Case {} Passed: Supply rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        ic_cdk::println!("\n===================  Verifying Reserve after intentional supply failure ===================\n");
                        // Check reserves after successful supply
                        fetch_reserve_data(pic, backend_canister, &case.asset);
                        ic_cdk::println!("\n===================  Verifying User data after intentional supply failure ===================\n");
                        // Check user data after successful supply
                        fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
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
                    "❌ IC Test Case {} Failed: Error during supply function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}
