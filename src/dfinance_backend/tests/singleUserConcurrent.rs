use candid::Nat;
use candid::{encode_args, encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use std::collections::HashMap;
use std::fs;
mod utils;
mod concurrency_testing;
use crate::utils::common_functions::{
     generate_principals, get_user_principal, get_users_principal,
    test_add_tester,
};
use crate::utils::constant_variables::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
mod single_user;
use crate::single_user::supply::test_supply;
use crate::single_user::faucet::test_faucet;
use crate::single_user::borrow::test_borrow;
use crate::single_user::repay::test_repay;
use crate::single_user::withdraw::test_withdraw;
use crate::single_user::liquidation::test_liquidation;
use crate::single_user::liquidated_user::test_liquidated_user;

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

#[test]
fn call_test_function() {
    let (pic, backend_canister, random_users) = setup();
    test_faucet(&pic, backend_canister, random_users.clone());
    test_supply(&pic, backend_canister);
    test_borrow(&pic, backend_canister);
    test_repay(&pic, backend_canister);
    test_withdraw(&pic, backend_canister);
    test_liquidation(&pic, backend_canister);
    test_liquidated_user(&pic, backend_canister, random_users);
}

fn setup() -> (PocketIc, Principal, Vec<Principal>) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();
    let random_users = generate_principals(2);

    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, INITIAL_CYCLES);
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    ic_cdk::println!("Backend canister: {}", backend_canister);
    pic.install_canister(
        backend_canister,
        wasm,
        candid::encode_one(user_principal).unwrap(),
        Some(Principal::anonymous()),
    );

    let _ = pocket_ic::PocketIc::set_controllers(
        &pic,
        backend_canister,
        Some(Principal::anonymous()),
        vec![user_principal],
    );

    // 🔹 Define test input (token name + reserve data)
    let icp_token_name = "ICP".to_string();
    let icp_reserve_data = ReserveData {
        asset_name: icp_token_name.clone(),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(ZERO_VALUE),
        current_liquidity_rate: Nat::from(ZERO_VALUE),
        asset_supply: Nat::from(ZERO_VALUE),
        asset_borrow: Nat::from(ZERO_VALUE),
        liquidity_index: Nat::from(LIQUIDATION_INDEX),
        debt_index: Nat::from(ZERO_VALUE),
        configuration: ReserveConfiguration {
            ltv: Nat::from(ICP_LTV),
            liquidation_threshold: Nat::from(ICP_LIQUIDATION_THRESHOLD),
            liquidation_bonus: Nat::from(ICP_LIQUIDATION_BONUS),
            borrowing_enabled: true,
            borrow_cap: Nat::from(BORROW_CAP),
            supply_cap: Nat::from(SUPPLY_CAP),
            liquidation_protocol_fee: Nat::from(ZERO_VALUE),
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ck_btc_token_name = "ckBTC".to_string();
    let ck_btc_reserve_data = ReserveData {
        asset_name: ck_btc_token_name.clone(),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(ZERO_VALUE),
        current_liquidity_rate: Nat::from(ZERO_VALUE),
        asset_supply: Nat::from(ZERO_VALUE),
        asset_borrow: Nat::from(ZERO_VALUE),
        liquidity_index: Nat::from(LIQUIDATION_INDEX),
        debt_index: Nat::from(ZERO_VALUE),
        configuration: ReserveConfiguration {
            ltv: Nat::from(BTC_LTV),
            liquidation_threshold: Nat::from(BTC_LIQUIDATION_THRESHOLD),
            liquidation_bonus: Nat::from(BTC_LIQUIDATION_BONUS),
            borrowing_enabled: true,
            borrow_cap: Nat::from(BORROW_CAP),
            supply_cap: Nat::from(SUPPLY_CAP),
            liquidation_protocol_fee: Nat::from(ZERO_VALUE),
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ck_eth_token_name = "ckETH".to_string();
    let ck_eth_reserve_data = ReserveData {
        asset_name: ck_eth_token_name.clone(),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(ZERO_VALUE),
        current_liquidity_rate: Nat::from(ZERO_VALUE),
        asset_supply: Nat::from(ZERO_VALUE),
        asset_borrow: Nat::from(ZERO_VALUE),
        liquidity_index: Nat::from(LIQUIDATION_INDEX),
        debt_index: Nat::from(ZERO_VALUE),
        configuration: ReserveConfiguration {
            ltv: Nat::from(ETH_LTV),
            liquidation_threshold: Nat::from(ETH_LIQUIDATION_THRESHOLD),
            liquidation_bonus: Nat::from(ETH_LIQUIDATION_BONUS),
            borrowing_enabled: true,
            borrow_cap: Nat::from(BORROW_CAP),
            supply_cap: Nat::from(SUPPLY_CAP),
            liquidation_protocol_fee: Nat::from(ZERO_VALUE),
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ck_usdc_token_name = "ckUSDC".to_string();
    let ck_usdc_reserve_data = ReserveData {
        asset_name: ck_usdc_token_name.clone(),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(ZERO_VALUE),
        current_liquidity_rate: Nat::from(ZERO_VALUE),
        asset_supply: Nat::from(ZERO_VALUE),
        asset_borrow: Nat::from(ZERO_VALUE),
        liquidity_index: Nat::from(LIQUIDATION_INDEX),
        debt_index: Nat::from(ZERO_VALUE),
        configuration: ReserveConfiguration {
            ltv: Nat::from(USDC_LTV),
            liquidation_threshold: Nat::from(USDC_LIQUIDATION_THRESHOLD),
            liquidation_bonus: Nat::from(USDC_LIQUIDATION_BONUS),
            borrowing_enabled: true,
            borrow_cap: Nat::from(BORROW_CAP),
            supply_cap: Nat::from(SUPPLY_CAP),
            liquidation_protocol_fee: Nat::from(ZERO_VALUE),
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ck_usdt_token_name = "ckUSDT".to_string();
    let ck_usdt_reserve_data = ReserveData {
        asset_name: ck_usdt_token_name.clone(),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(ZERO_VALUE),
        current_liquidity_rate: Nat::from(ZERO_VALUE),
        asset_supply: Nat::from(ZERO_VALUE),
        asset_borrow: Nat::from(ZERO_VALUE),
        liquidity_index: Nat::from(LIQUIDATION_INDEX),
        debt_index: Nat::from(ZERO_VALUE),
        configuration: ReserveConfiguration {
            ltv: Nat::from(USDT_LTV),
            liquidation_threshold: Nat::from(USDT_LIQUIDATION_THRESHOLD),
            liquidation_bonus: Nat::from(USDT_LIQUIDATION_BONUS),
            borrowing_enabled: true,
            borrow_cap: Nat::from(BORROW_CAP),
            supply_cap: Nat::from(SUPPLY_CAP),
            liquidation_protocol_fee: Nat::from(ZERO_VALUE),
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let mut reserve_tokens_map: HashMap<String, ReserveData> = HashMap::new();

    reserve_tokens_map.insert(icp_token_name, icp_reserve_data);
    reserve_tokens_map.insert(ck_btc_token_name, ck_btc_reserve_data);
    reserve_tokens_map.insert(ck_eth_token_name, ck_eth_reserve_data);
    reserve_tokens_map.insert(ck_usdc_token_name, ck_usdc_reserve_data);
    reserve_tokens_map.insert(ck_usdt_token_name, ck_usdt_reserve_data);

    //================= Initialize ==================
    // 🔹 Call the `initialize` function

    for (token_name, reserve_data) in &reserve_tokens_map {
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "initialize",
            encode_args((token_name, reserve_data, "https://storage.googleapis.com/dfinance/ICPMARKET.png")).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let initialize_response: Result<(), errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode initialize response");

                match initialize_response {
                    Ok(()) => {
                        ic_cdk::println!("✅ Initialize function succeeded for {:?}", token_name);
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "❌ Initialize function failed as expected with error: {:?}",
                            e
                        );
                        panic!("🚨 Expected success but got error: {:?}", e);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                panic!("🚨 Initialize function was rejected: {:?}", reject_message);
            }
            Err(e) => {
                panic!("🚨 Error calling initialize function: {:?}", e);
            }
        }
    }

    test_add_tester(&pic, backend_canister, user_principal, user_principal);
    /*
     * @title Add Testers
     * @notice Registers testers to validate liquidation scenarios.
     * @dev Adds the primary user and test users (1 to 5).
     */
    // test_add_tester(&pic, backend_canister, user_principal, user_principal);
    for num in 1..=5 {
        let index: u32 = num as u32;
        test_add_tester(
            &pic,
            backend_canister,
            user_principal,
            get_users_principal(Nat::from(index)).unwrap(),
        );
    }

    let result = pic.update_call(
        backend_canister,
        user_principal,
        "update_reserve_price_test",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let update_reserve_response: Result<(), errors::Error> = candid::decode_one(&response)
                .expect("Failed to decode reserve price cache response");

            match update_reserve_response {
                Ok(_message) => {
                    ic_cdk::println!("✅ update reserve price function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!(
                        "update reserve price function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨update reserve price function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling update reserve price function: {:?}", e);
        }
    }

    (pic, backend_canister, random_users)
}


// fn test_faucet(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: Nat,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }

//     let test_cases = vec![
//         //  Valid faucet request for each asset
//         TestCase {
//             asset: "ICP".to_string(),
//             amount: Nat::from(5_000_000_00u128),
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     let user_principal = get_user_principal();
//     ic_cdk::println!(
//         "\n======================== Starting IC Faucet Tests ========================\n"
//     );
//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Faucet Request", i + 1);
//         ic_cdk::println!("Asset: {}", case.asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         /*
//          * @title Faucet Request Test
//          * @notice Tests the faucet function for expected success or failure.
//          *
//          * @dev Steps:
//          *      1. Calls `faucet` with asset and amount.
//          *      2. Decodes and verifies response.
//          *      3. Logs success or failure.
//          *
//          * @param pic PocketIc instance.
//          * @param backend_canister Backend canister principal.
//          * @param user_principal User's principal.
//          */
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             let msg_id = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "faucet",
//                 encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
//             );
//             msg_ids.push(msg_id);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();
//             match result {
//                 WasmResult::Reply(reply) => {
//                     let faucet_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to decode faucet response");

//                     match faucet_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!(
//                                 "✅ IC Test Case {} for user {} Passed: Faucet successful.",
//                                 i + 1,
//                                 balance
//                             );
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     error.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
//                                 i + 1,
//                                 error
//                             );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}", i + 1, error, user_principal.to_text());
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//             }
//         }

//         /*
//          * @title Faucet Request for Users
//          * @notice Simulates faucet requests for multiple users to test liquidation scenarios.
//          *
//          * @dev Steps:
//          *      1. Iterates through users (1 to 5).
//          *      2. Calls `faucet` with user principal.
//          *      3. Verifies response and logs success/failure.
//          *
//          * @param pic PocketIc instance.
//          * @param backend_canister Backend canister principal.
//          */
//         for num in 1..=5 {
//             let index: u32 = num as u32;
//             // Simulate faucet request
//             let result = pic.update_call(
//                 backend_canister,
//                 get_users_principal(Nat::from(index)).unwrap(),
//                 "faucet",
//                 encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
//             );

//             match result {
//                 Ok(WasmResult::Reply(reply)) => {
//                     let faucet_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to decode faucet response");

//                     match faucet_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!(
//                                 "✅ IC Test Case {} for user {} Passed: Faucet successful.",
//                                 i + 1,
//                                 balance
//                             );
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                         "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                         i + 1,
//                                         case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                         error.message()
//                                     );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                     "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
//                                     i + 1,
//                                     error
//                                 );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 Ok(WasmResult::Reject(reject_message)) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//                 Err(e) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
//                         i + 1,
//                         e
//                     );
//                     continue;
//                 }
//             }
//         }

//         for user_principal in random_users.clone() {
//             // Simulate faucet request
//             let result = pic.update_call(
//                 backend_canister,
//                 user_principal,
//                 "faucet",
//                 encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
//             );

//             match result {
//                 Ok(WasmResult::Reply(reply)) => {
//                     let faucet_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to decode faucet response");

//                     match faucet_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!(
//                                 "✅ IC Test Case {} for user {} Passed: Faucet successful.",
//                                 i + 1,
//                                 balance
//                             );
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                         "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                         i + 1,
//                                         case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                         error.message()
//                                     );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                     "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
//                                     i + 1,
//                                     error
//                                 );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 Ok(WasmResult::Reject(reject_message)) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//                 Err(e) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
//                         i + 1,
//                         e
//                     );
//                     continue;
//                 }
//             }
//         }
//     }
//     ic_cdk::println!(
//         "\n======================== IC Faucet Tests Completed ========================\n"
//     );
// }

// fn test_supply(pic: &PocketIc, backend_canister: Principal) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: Nat,
//         is_collateral: bool,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }

//     let test_cases: Vec<TestCase> = vec![
//         // ✅ Valid Test Case (only one active for now, uncomment others as needed)
//         TestCase {
//             asset: "ICP".to_string(),
//             amount: Nat::from(5_00_000_000u128), // 5 ICP (includes transaction fee)
//             is_collateral: true,
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     let user_principal = get_user_principal();

//     ic_cdk::println!("\n================= Starting IC Supply Tests =================\n");

//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!(
//             "\n------------------ Test Case {} ------------------",
//             i + 1
//         );
//         ic_cdk::println!("Asset: {}", case.asset);
//         ic_cdk::println!("Amount: {}", case.amount.clone());
//         ic_cdk::println!("Is Collateral: {}", case.is_collateral);
//         ic_cdk::println!("Expect Success: {}", case.expect_success);

//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }

//         // Get the asset principal (fail fast if None)
//         let asset_principal =
//             match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
//                 Some(principal) => principal,
//                 None => {
//                     if !case.expect_success {
//                         ic_cdk::println!("✅ Passed: Supply rejected as expected");
//                     } else {
//                         ic_cdk::println!("❌ Failed: Expected success but got rejection");
//                     }
//                     continue;
//                 }
//             };

//         // Approve ICRC2 transfer before attempting supply
//         let approved = test_icrc2_aprove(
//             user_principal,
//             asset_principal,
//             &pic,
//             backend_canister,
//             case.amount.clone(),
//         );
//         if !approved {
//             if !case.expect_success {
//                 let expected = case.expected_error_message.as_deref().unwrap_or("");
//                 if expected != "icrc2 not approved" {
//                     ic_cdk::println!(
//                         "❌ Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
//                         expected
//                     );
//                 } else {
//                     ic_cdk::println!("✅ Passed: Supply rejected as expected");
//                 }
//             } else {
//                 ic_cdk::println!("❌ Failed: Expected success but got rejection");
//             }
//             continue;
//         }

//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             // Supply parameters
//             let supply_params = ExecuteSupplyParams {
//                 asset: case.asset.clone(),
//                 amount: case.amount.clone(),
//                 is_collateral: case.is_collateral,
//             };
//             let msg_id = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "execute_supply",
//                 encode_one(supply_params).unwrap(),
//             );
//             msg_ids.push(msg_id);
//         }

//         // Await and handle all concurrent responses
//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();

//             match result {
//                 WasmResult::Reply(reply) => {
//                     let response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to decode supply response");

//                     match response {
//                         Ok(balance) => {
//                             if case.expect_success {
//                                 ic_cdk::println!(
//                                     "✅ Call {} Success: Supply succeeded.{:?}",
//                                     j + 1,
//                                     user_principal.to_text()
//                                 );
//                             } else {
//                                 ic_cdk::println!(
//                                     "❌ Call {} Failed: Expected failure but got success.",
//                                     j + 1
//                                 );
//                             }
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 let expected = case.expected_error_message.as_deref().unwrap_or("");
//                                 if expected != error.message() {
//                                     ic_cdk::println!(
//                                         "❌ Call {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                         j + 1,
//                                         expected,
//                                         error.message()
//                                     );
//                                 } else {
//                                     ic_cdk::println!(
//                                         "✅ Call {} Passed: Supply rejected with expected error: {}",
//                                         j + 1,
//                                         error.message()
//                                     );
//                                 }
//                             } else {
//                                 ic_cdk::println!(
//                                     "❌ Call {} Failed: Expected success but got error: {}: {:?}",
//                                     j + 1,
//                                     error.message(),
//                                     user_principal.to_text()
//                                 );
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reason) => {
//                     ic_cdk::println!("❌ Call {} Rejected: Rejection message: {}", j + 1, reason);
//                 } // Err(e) => {
//                   //     ic_cdk::println!("❌ Call {} Failed: Supply execution error: {:?}", j + 1, e);
//                   // }
//             }
//         }
//     }

//     ic_cdk::println!("\n================= IC Supply Tests Completed =================\n");
// }

// fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: Nat,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }

//     let test_cases = vec![
//         // valid test cases
//         TestCase {
//             asset: "ICP".to_string(),
//             amount: Nat::from(2_00_000_000u128), // 2 ICP
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     let user_principal = get_user_principal();

//     ic_cdk::println!(
//         "\n======================== Starting IC Borrow Tests ========================\n"
//     );
//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
//         ic_cdk::println!("Asset: {}", case.asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         /*
//          * @title Execute Borrow Transaction
//          * @notice Calls the backend canister to execute a borrow operation.
//          * @dev Validates the borrow response and checks for expected success or failure.
//          */
//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             /* Borrow params */
//             let borrow_params = ExecuteBorrowParams {
//                 asset: case.asset.clone(),
//                 amount: case.amount.clone(),
//             };
//             let result = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "execute_borrow",
//                 encode_one(borrow_params).unwrap(),
//             );
//             msg_ids.push(result);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();
//             match result {
//                 WasmResult::Reply(reply) => {
//                     let borrow_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to get IC borrow response");

//                     match borrow_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Borrow successful.",
//                                 i + 1,
//                             );
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     error.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
//                                 i + 1,
//                                 error
//                             );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}", i + 1, error, user_principal.to_text());
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//             }
//         }
//     }
//     ic_cdk::println!(
//         "\n======================== IC Borrow Tests Completed ========================\n"
//     );
// }

// fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: Nat,
//         on_behalf_of: Option<Principal>,
//         is_collateral: bool,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }

//     let test_cases = vec![
//         // Valid Withdrawals (Direct)
//         TestCase {
//             asset: "ICP".to_string(),
//             amount: Nat::from(2_00_000_000u128), // 2.00 ICP
//             on_behalf_of: None,
//             is_collateral: false,
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     ic_cdk::println!(
//         "\n======================== Starting IC Withdraw Tests ========================\n"
//     );
//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
//         ic_cdk::println!("Asset: {}", case.asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         ic_cdk::println!(
//             "On Behalf Of: {}",
//             case.on_behalf_of
//                 .as_ref()
//                 .map_or("None".to_string(), |p| p.to_text())
//         );
//         ic_cdk::println!("Is Collateral: {}", case.is_collateral);
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         let user_principal = get_user_principal();
//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             /* Withdraw params */
//             let withdraw_params = ExecuteWithdrawParams {
//                 asset: case.asset.clone(),
//                 amount: case.amount.clone(),
//                 is_collateral: case.is_collateral.clone(),
//             };

//             /*
//              * @title Execute Withdraw
//              * @notice Executes the withdraw operation and validates outcomes.
//              * @dev Calls the backend function, checks responses, and verifies success or failure.
//              */
//             let result = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "execute_withdraw",
//                 encode_one(withdraw_params).unwrap(),
//             );
//             msg_ids.push(result);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();
//             match result {
//                 WasmResult::Reply(reply) => {
//                     let withdraw_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to get IC withdraw response");

//                     match withdraw_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Withdraw successful.",
//                                 i + 1,
//                             );
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     error.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
//                                 i + 1,
//                                 error
//                             );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got error : {:?}: {:?}", i + 1, error, user_principal.to_text());
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//             }
//         }
//     }

//     ic_cdk::println!(
//         "\n======================== IC Withdraw Tests Completed ========================\n"
//     );
// }

// fn test_repay(pic: &PocketIc, backend_canister: Principal) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: Nat,
//         on_behalf_of: Option<Principal>,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }

//     let test_cases: Vec<TestCase> = vec![
//         // Valid  test cases
//         TestCase {
//             asset: "ICP".to_string(),
//             amount: Nat::from(2_00_000_000u128), // 2.00 ICP (includes transaction fee)
//             on_behalf_of: None,
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     let user_principal = get_user_principal();

//     ic_cdk::println!(
//         "\n======================== Starting IC Repay Tests ========================\n"
//     );

//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
//         ic_cdk::println!("Asset: {}", case.asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         if let Some(ref principal) = case.on_behalf_of {
//             ic_cdk::println!("On Behalf Of: {}", principal);
//         }
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         /* Get asset principal; handle missing cases  */
//         let asset_principal =
//             match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
//                 Some(principal) => principal,
//                 None => {
//                     if !case.expect_success {
//                         ic_cdk::println!(
//                             "✅ IC Test Case {} Passed: Repay rejected as expected",
//                             i + 1,
//                         );
//                     } else {
//                         ic_cdk::println!(
//                             "❌ IC Test Case {} Failed: Expected success but got rejection",
//                             i + 1
//                         );
//                     }
//                     continue;
//                 }
//             };

//         /*
//          * @title Approve ICRC2 Transfer
//          * @notice Approves ICRC2 transfer before supply operation.
//          * @dev Validates approval status and expected outcomes.
//          */
//         let approved = test_icrc2_aprove(
//             user_principal,
//             asset_principal,
//             &pic,
//             backend_canister,
//             Nat::from(case.amount.clone()),
//         );
//         if !approved {
//             if !case.expect_success {
//                 if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
//                     println!(
//                         "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
//                         i + 1,
//                         case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                     );
//                     continue;
//                 }
//                 ic_cdk::println!(
//                     "✅ IC Test Case {} Passed: Repay rejected as expected",
//                     i + 1,
//                 );
//             } else {
//                 ic_cdk::println!(
//                     "❌ IC Test Case {} Failed: Expected success but got rejection",
//                     i + 1
//                 );
//             }
//             continue;
//         }

//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             /* Repay params */
//             let repay_params = ExecuteRepayParams {
//                 asset: case.asset.clone(),
//                 amount: case.amount.clone(),
//                 on_behalf_of: case.on_behalf_of.clone(),
//             };

//             /*
//              * @title Execute Repay
//              * @notice Executes the repay operation and validates outcomes.
//              * @dev Calls the backend function, checks responses, and verifies success or failure.
//              */
//             let result = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "execute_repay",
//                 encode_one(repay_params).unwrap(),
//             );
//             msg_ids.push(result);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();
//             match result {
//                 WasmResult::Reply(reply) => {
//                     let repay_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&reply).expect("Failed to get IC repay response");

//                     match repay_response {
//                         Ok(balance) => {
//                             if !case.expect_success {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success.",
//                                     i + 1
//                                 );
//                                 continue;
//                             }
//                             ic_cdk::println!("✅ IC Test Case {} Passed: Repay successful.", i + 1,);
//                         }
//                         Err(error) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(error.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     error.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
//                                 i + 1,
//                                 error
//                             );
//                             } else {
//                                 ic_cdk::println!(
//                                 "❌ IC Test Case {} Failed: Expected success but got error: {:?}: {:?}",
//                                 i + 1,
//                                 error,user_principal.to_text()
//                             );
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 }
//             }
//         }
//     }
//     ic_cdk::println!(
//         "\n======================== IC Repay Tests Completed ========================\n"
//     );
// }

// fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         debt_asset: String,
//         collateral_asset: String,
//         amount: Nat,
//         on_behalf_of: Principal,
//         reward_amount: Nat,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }
//     let test_cases = vec![
//         // Valid cases with sufficient collateral
//         TestCase {
//             debt_asset: "ICP".to_string(),
//             collateral_asset: "ICP".to_string(),
//             amount: Nat::from(40_000_000u128), // 0.40 ICP (includes transaction fee)
//             on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
//             reward_amount: Nat::from(40_357_486u128), // Reward: 0.40357486 ICP
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     let user_principal = get_user_principal();
//     ic_cdk::println!(
//         "\n======================== Starting IC Liquidation Tests ========================\n"
//     );

//     /*
//      * @title Test Creating User Reserve with Low Health
//      * @notice This function tests the creation of user reserves with low health factors.
//      * @dev
//      * - The function simulates users supplying and borrowing assets close to the liquidation threshold.
//      * - It ensures that the approval process for ICRC2 transfers is validated before supply operations.
//      * - Each user is assigned an asset to supply and borrow with predefined amounts.
//      * - The function also verifies the expected behavior and error handling in case of failures.
//      */
//     test_create_user_reserve_with_low_health_one_user(&pic, backend_canister);

//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
//         ic_cdk::println!("Debt Asset: {}", case.debt_asset);
//         ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
//         let reward_amount_u128: u64 = case.reward_amount.clone().0.try_into().unwrap();
//         let reward_amount_float = reward_amount_u128 as f64;
//         ic_cdk::println!("Reward Amount: {}", reward_amount_float / 100000000.0);
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         /* Get asset principal; handle missing cases  */
//         let asset_principal =
//             match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister) {
//                 Some(principal) => principal,
//                 None => {
//                     if !case.expect_success {
//                         ic_cdk::println!(
//                             "✅ IC Test Case {} Passed: Liquidation rejected as expected",
//                             i + 1,
//                         );
//                     } else {
//                         ic_cdk::println!(
//                             "❌ IC Test Case {} Failed: Expected success but got rejection",
//                             i + 1
//                         );
//                     }
//                     continue;
//                 }
//             };

//         /*
//          * @title Approve ICRC2 Transfer
//          * @notice Approves ICRC2 transfer before supply operation.
//          * @dev Validates approval status and expected outcomes.
//          */
//         let approved = test_icrc2_aprove(
//             get_user_principal(),
//             asset_principal,
//             &pic,
//             backend_canister,
//             Nat::from(case.amount.clone()),
//         );
//         if !approved {
//             if !case.expect_success {
//                 if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
//                     println!(
//                         "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
//                         i + 1,
//                         case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                     );
//                     continue;
//                 }
//                 ic_cdk::println!(
//                     "✅ IC Test Case {} Passed: Liquidation rejected as expected",
//                     i + 1,
//                 );
//             } else {
//                 ic_cdk::println!(
//                     "❌ IC Test Case {} Failed: Expected success but got rejection",
//                     i + 1
//                 );
//             }
//             continue;
//         }

//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for _ in 0..5 {
//             /* Liquidation params */
//             let liquidation_params = ExecuteLiquidationParams {
//                 debt_asset: case.debt_asset.clone(),
//                 collateral_asset: case.collateral_asset.clone(),
//                 amount: case.amount.clone(),
//                 on_behalf_of: case.on_behalf_of.clone(),
//                 reward_amount: case.reward_amount.clone(),
//             };

//             /*
//              * @title Execute Liquidation
//              * @notice Executes the liquidation operation and validates outcomes.
//              * @dev Calls the backend function, checks responses, and verifies success or failure.
//              */
//             let result = pic.submit_call(
//                 backend_canister,
//                 get_user_principal(),
//                 "execute_liquidation",
//                 encode_one(liquidation_params).unwrap(),
//             );
//             msg_ids.push(result);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();

//             match result {
//                 WasmResult::Reply(response) => {
//                     let liquidation_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&response)
//                             .expect("Failed to decode liquidation response");

//                     match liquidation_response {
//                         Ok(_) => {
//                             if case.expect_success {
//                                 ic_cdk::println!(
//                                     "✅ IC Test Case {} Passed: Liquidation completed successfully",
//                                     i + 1
//                                 );
//                             } else {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success",
//                                     i + 1
//                                 );
//                             }
//                         }
//                         Err(e) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(e.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     e.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
//                                 i + 1,
//                                 e
//                             );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 } // Err(e) => {
//                   //     ic_cdk::println!(
//                   //         "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
//                   //         i + 1,
//                   //         e
//                   //     );
//                   //     continue;
//                   // }
//             }
//         }
//     }
//     ic_cdk::println!(
//         "\n======================== IC Liquidation Tests Completed ========================\n"
//     );
// }

// fn test_liquidated_user(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         debt_asset: String,
//         collateral_asset: String,
//         amount: Nat,
//         on_behalf_of: Principal,
//         reward_amount: Nat,
//         expect_success: bool,
//         expected_error_message: Option<String>,
//     }
//     let test_cases = vec![
//         // Valid cases with sufficient collateral
//         TestCase {
//             debt_asset: "ICP".to_string(),
//             collateral_asset: "ICP".to_string(),
//             amount: Nat::from(40_000_000u128), // 0.40 ICP (includes transaction fee)
//             on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
//             reward_amount: Nat::from(40_357_486u128), // Reward: 0.40357486 ICP
//             expect_success: true,
//             expected_error_message: None,
//         },
//     ];

//     ic_cdk::println!(
//         "\n======================== Starting IC Liquidation Tests ========================\n"
//     );

//     /*
//      * @title Test Creating User Reserve with Low Health
//      * @notice This function tests the creation of user reserves with low health factors.
//      * @dev
//      * - The function simulates users supplying and borrowing assets close to the liquidation threshold.
//      * - It ensures that the approval process for ICRC2 transfers is validated before supply operations.
//      * - Each user is assigned an asset to supply and borrow with predefined amounts.
//      * - The function also verifies the expected behavior and error handling in case of failures.
//      */
//     test_create_user_reserve_with_low_health_one_user(&pic, backend_canister);

//     for (i, case) in test_cases.iter().enumerate() {
//         ic_cdk::println!("\n------------------------------------------------------------");
//         ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
//         ic_cdk::println!("Debt Asset: {}", case.debt_asset);
//         ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
//         let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
//         let amount_float = amount_u128 as f64;
//         ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
//         ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
//         let reward_amount_u128: u64 = case.reward_amount.clone().0.try_into().unwrap();
//         let reward_amount_float = reward_amount_u128 as f64;
//         ic_cdk::println!("Reward Amount: {}", reward_amount_float / 100000000.0);
//         ic_cdk::println!("Expected Success: {}", case.expect_success);
//         if let Some(ref msg) = case.expected_error_message {
//             ic_cdk::println!("Expected Error Message: {}", msg);
//         }
//         ic_cdk::println!("------------------------------------------------------------\n");

//         /* Get asset principal; handle missing cases  */
//         let asset_principal =
//             match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister) {
//                 Some(principal) => principal,
//                 None => {
//                     if !case.expect_success {
//                         ic_cdk::println!(
//                             "✅ IC Test Case {} Passed: Liquidation rejected as expected",
//                             i + 1,
//                         );
//                     } else {
//                         ic_cdk::println!(
//                             "❌ IC Test Case {} Failed: Expected success but got rejection",
//                             i + 1
//                         );
//                     }
//                     continue;
//                 }
//             };

//         /*
//          * @title Approve ICRC2 Transfer
//          * @notice Approves ICRC2 transfer before supply operation.
//          * @dev Validates approval status and expected outcomes.
//          */
//         for user_principal in random_users.clone() {
//             let approved = test_icrc2_aprove(
//                 user_principal,
//                 asset_principal,
//                 &pic,
//                 backend_canister,
//                 Nat::from(case.amount.clone()),
//             );
//             if !approved {
//                 if !case.expect_success {
//                     if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
//                         println!(
//                         "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
//                         i + 1,
//                         case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                     );
//                         continue;
//                     }
//                     ic_cdk::println!(
//                         "✅ IC Test Case {} Passed: Liquidation rejected as expected",
//                         i + 1,
//                     );
//                 } else {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Expected success but got rejection",
//                         i + 1
//                     );
//                 }
//                 continue;
//             }
//         }

//         // Simulate 5 concurrent calls
//         let mut msg_ids = vec![];
//         for user_principal in random_users.clone() {
//             /* Liquidation params */
//             let liquidation_params = ExecuteLiquidationParams {
//                 debt_asset: case.debt_asset.clone(),
//                 collateral_asset: case.collateral_asset.clone(),
//                 amount: case.amount.clone(),
//                 on_behalf_of: case.on_behalf_of.clone(),
//                 reward_amount: case.reward_amount.clone(),
//             };

//             /*
//              * @title Execute Liquidation
//              * @notice Executes the liquidation operation and validates outcomes.
//              * @dev Calls the backend function, checks responses, and verifies success or failure.
//              */
//             let result = pic.submit_call(
//                 backend_canister,
//                 user_principal,
//                 "execute_liquidation",
//                 encode_one(liquidation_params).unwrap(),
//             );
//             msg_ids.push(result);
//         }

//         for (j, msg_id) in msg_ids.into_iter().enumerate() {
//             let msg_id = msg_id.unwrap(); // Handle the Result to extract RawMessageId
//             let result = pic.await_call(msg_id).unwrap();

//             match result {
//                 WasmResult::Reply(response) => {
//                     let liquidation_response: Result<Nat, errors::Error> =
//                         candid::decode_one(&response)
//                             .expect("Failed to decode liquidation response");

//                     match liquidation_response {
//                         Ok(_) => {
//                             if case.expect_success {
//                                 ic_cdk::println!(
//                                     "✅ IC Test Case {} Passed: Liquidation completed successfully",
//                                     i + 1
//                                 );
//                             } else {
//                                 ic_cdk::println!(
//                                     "❌ IC Test Case {} Failed: Expected failure but got success",
//                                     i + 1
//                                 );
//                             }
//                         }
//                         Err(e) => {
//                             if !case.expect_success {
//                                 if case.expected_error_message.as_deref() != Some(e.message()) {
//                                     println!(
//                                     "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
//                                     i + 1,
//                                     case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
//                                     e.message()
//                                 );
//                                     continue;
//                                 }
//                                 ic_cdk::println!(
//                                 "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
//                                 i + 1,
//                                 e
//                             );
//                             } else {
//                                 ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
//                                 continue;
//                             }
//                         }
//                     }
//                 }
//                 WasmResult::Reject(reject_message) => {
//                     ic_cdk::println!(
//                         "❌ IC Test Case {} Failed: Function call rejected with message: {}",
//                         i + 1,
//                         reject_message
//                     );
//                     continue;
//                 } // Err(e) => {
//                   //     ic_cdk::println!(
//                   //         "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
//                   //         i + 1,
//                   //         e
//                   //     );
//                   //     continue;
//                   // }
//             }
//         }
//     }
//     ic_cdk::println!(
//         "\n======================== IC Liquidation Tests Completed ========================\n"
//     );
// }