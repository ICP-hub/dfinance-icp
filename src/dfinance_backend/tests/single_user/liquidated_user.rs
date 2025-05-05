use candid::Nat;
use candid::{ encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::common_functions::{
     get_user_principal2, get_users_principal, test_create_user_reserve_with_low_health, test_get_asset_principal, test_icrc2_aprove
};
use crate::utils::error as errors;
use crate::utils::structs::*;






pub fn test_liquidated_user(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(40_000_000u128), // 0.40 ICP (transfer fee included)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_357_486u128), // 0.40357486 ICP (transfer fee included)
            expect_success: true,
            expected_error_message: None,
        },
    ];

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
    test_create_user_reserve_with_low_health(&pic, backend_canister);

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset);
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
        let reward_amount_u128: u64 = case.reward_amount.clone().0.try_into().unwrap();
        let reward_amount_float = reward_amount_u128 as f64;
        ic_cdk::println!("Reward Amount: {}", reward_amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        /* Get asset principal; handle missing cases  */
        let asset_principal =
            match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister) {
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
        for user_principal in random_users.clone() {
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

        // Simulate 5 concurrent calls
        let mut msg_ids = vec![];
        for user_principal in random_users.clone() {
            /* Liquidation params */
            let liquidation_params = ExecuteLiquidationParams {
                debt_asset: case.debt_asset.clone(),
                collateral_asset: case.collateral_asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of.clone(),
                reward_amount: case.reward_amount.clone(),
            };

            /*
             * @title Execute Liquidation
             * @notice Executes the liquidation operation and validates outcomes.
             * @dev Calls the backend function, checks responses, and verifies success or failure.
             */
            let result = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_liquidation",
                encode_one(liquidation_params).unwrap(),
            );
            msg_ids.push(result);
        }

        for (j, msg_id) in msg_ids.into_iter().enumerate() {
            let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
            let result = pic.await_call(msg_id).unwrap();

            match result {
                WasmResult::Reply(response) => {
                    let liquidation_response: Result<Nat, errors::Error> =
                        candid::decode_one(&response)
                            .expect("Failed to decode liquidation response");

                    match liquidation_response {
                        Ok(_) => {
                            if case.expect_success {
                                ic_cdk::println!(
                                    "✅ IC Test Case {} Passed: Liquidation completed successfully\n",
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
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
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
                                ic_cdk::println!(
                                    "-----------------------------------------------------------------------",
                                );
                                ic_cdk::println!(
                                    "❌ Call {} Failed: Expected success but got error: {}",
                                    j + 1,
                                    e.message(),
                                );
                                ic_cdk::println!(
                                    "----------------  Wait for the previous operation to complete before retrying.  ------------\n",
                                );
                                // ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
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
                } // Err(e) => {
                  //     ic_cdk::println!(
                  //         "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                  //         i + 1,
                  //         e
                  //     );
                  //     continue;
                  // }
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}