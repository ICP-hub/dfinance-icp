use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::Nat;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};

/*
 * @title Repay Stress Test
 * @notice This function performs a stress test for the repay functionality by simulating multiple repay requests.
 * @dev It sends repay requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the repay logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be repaid.
 * 2. Sends a repay request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the repay function resides.
 * @param random_users List of user principals for whom the repay request will be tested.
 */

pub fn test_repay(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid test case
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(400_000u128), // 4 ckUSDC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 300 ckUSDT (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(500u128), // 0.0005 ckETH (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();
    ic_cdk::println!(
        "\n======================== Starting IC Repay Stress Testing ========================\n"
    );
    ic_cdk::println!("🔥 Running tests with {} users 🔥\n", total_users);

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Repay Request Initiated", i + 1);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8} \n🔹 Expected Success: {}",
            case.asset,
            amount_float / 100000000.0,
            case.expect_success
        );
        ic_cdk::println!(
            "\n=================== Checking Reserves before Repayment ===================\n"
        );
        // Fetch and display reserve data
        fetch_reserve_data(pic, backend_canister, &case.asset);
        ic_cdk::println!("------------------------------------------------------------\n");
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
                        ic_cdk::println!("❌ Asset principal not found. Skipping user.");
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
                ic_cdk::println!("❌ Approval failed for user: {}", user_principal);
                failure_count += 1;
                continue;
            }

            /* Repay params */
            let repay_params = ExecuteRepayParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
            };

            /*
             * @title Execute Repay
             * @notice Executes the repay operation and validates outcomes.
             * @dev Calls the backend function, checks responses, and verifies success or failure.
             */
            match pic.update_call(
                backend_canister,
                *user_principal,
                "execute_repay",
                encode_one(repay_params).unwrap(),
            ) {
                Ok(WasmResult::Reply(reply)) => {
                    let repay_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode response");
                    match repay_response {
                        Ok(_balance) => {
                            ic_cdk::println!("✅ Repay successful!");
                            ic_cdk::println!("\n=================== Checking Reserves After successful Repayment ===================\n");
                            // Fetch and display reserve data
                            fetch_reserve_data(pic, backend_canister, &case.asset);
                            success_count += 1;
                        }
                        Err(error) => {
                            ic_cdk::println!("❌ Repay failed: {}", error.message());
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!("❌ Function call rejected: {}", reject_message);
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!("❌ Error during function call: {:?}", e);
                    failure_count += 1;
                }
            }
        }

        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count);
        ic_cdk::println!("------------------------------------------------------------\n");
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}
