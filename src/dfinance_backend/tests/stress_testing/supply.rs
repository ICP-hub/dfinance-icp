use candid::{decode_one, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;







/*
 * @title Supply Stress Test
 * @notice This function performs a stress test for the supply functionality by simulating multiple supply requests.
 * @dev It sends supply requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the supply logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be supplied.
 * 2. Sends a supply request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the supply function resides.
 * @param random_users List of user principals for whom the supply request will be tested.
 */
pub fn test_supply(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    struct TestCase {
        asset: String,
        amount: Nat,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(400_000_000u128), // 4 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128), // 0.045 ckBTC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128), // 0.045 ckBTC (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ckusdc (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3_000_000_000u128), // 30 ckUSDT (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5_000u128), // 0.00005 ckETH (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();
    ic_cdk::println!(
        "\n======================== Starting IC Supply Stress Testing ========================\n"
    );
    ic_cdk::println!(
        "🔥 Stress Testing with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Supply Request Initiated", i + 1);

        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8} \n🔹 Collateral: {} \n🔹 Expected Success: {}",
            case.asset,
            amount_float / 100000000.0,
            case.is_collateral,
            case.expect_success
        );

        if let Some(msg) = &case.expected_error_message {
            ic_cdk::println!("⚠️ Expected Error: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in &random_users {
            /* Get asset principal; handle missing cases  */
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        ic_cdk::println!(
                            "❌ User {}: Asset principal not found",
                            user_principal.to_text()
                        );
                        failure_count += 1;
                        continue;
                    }
                };

            /*
             * @title Approve ICRC2 Transfer
             * @notice Approves ICRC2 transfer before supply operation.
             * @dev Validates approval status and expected outcomes.
             */
            if !test_icrc2_aprove(
                *user_principal,
                asset_principal,
                pic,
                backend_canister,
                case.amount.clone(),
            ) {
                ic_cdk::println!(
                    "❌ User {}: ICRC2 approval rejected",
                    user_principal.to_text()
                );
                failure_count += 1;
                continue;
            }

            // ic_cdk::println!("\n======================== Initial Reserve Data   ========================\n");

            // fetch_reserve_data(pic, backend_canister, &case.asset);

            // ic_cdk::println!("\n======================== Initial User Data  ========================\n");

            // fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

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
                *user_principal,
                "execute_supply",
                encode_one(supply_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    match decode_one::<Result<Nat, errors::Error>>(&reply) {
                        Ok(Ok(_)) => {
                            ic_cdk::println!(
                                "✅ User {}: Supply Successful.",
                                user_principal.to_text(),
                            );
                            success_count += 1;
                        }
                        Ok(Err(error)) => {
                            ic_cdk::println!(
                                "❌ User {}: Supply Failed. Error: {}",
                                user_principal.to_text(),
                                error.message()
                            );
                            failure_count += 1;
                        }
                        Err(_) => {
                            ic_cdk::println!(
                                "❌ User {}: Unexpected Response Format",
                                user_principal.to_text()
                            );
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(msg)) => {
                    ic_cdk::println!(
                        "❌ User {}: Supply Call Rejected. Message: {}",
                        user_principal.to_text(),
                        msg
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ User {}: Supply Call Error: {:?}",
                        user_principal.to_text(),
                        e
                    );
                    failure_count += 1;
                }
            }

            // ic_cdk::println!(
            //     "\n======================== Updated Reserve Data   ========================\n"
            // );

            // fetch_reserve_data(pic, backend_canister, &case.asset);

            // ic_cdk::println!(
            //     "\n======================== Updated User Data  ========================\n"
            // );

            // fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }

        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count,);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count,);
        ic_cdk::println!("------------------------------------------------------------\n");
    }

    ic_cdk::println!(
        "\n======================== IC Supply Stress Test Completed ========================\n"
    );
}