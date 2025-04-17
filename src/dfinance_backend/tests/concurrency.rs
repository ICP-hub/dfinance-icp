use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;
use std::collections::HashMap;
mod utils;
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::constant_variables::*;



#[test]
fn call_test_function() {
    let (pic, backend_canister,random_users) = setup();
    test_register_user(&pic, backend_canister, random_users.clone());
    test_faucet(&pic, backend_canister,random_users.clone());
    test_supply(&pic, backend_canister,random_users.clone());
    test_borrow(&pic, backend_canister,random_users.clone());
    test_repay(&pic, backend_canister,random_users.clone());
    test_withdraw(&pic, backend_canister,random_users.clone());
    // test_liquidation(&pic, backend_canister,random_users.clone());
}

/*
 * @title Test Setup and Initialization for Asset Reserves
 * @notice Validates the setup and initialization of asset reserves on the backend canister.
 * @dev Ensures that the backend canister is correctly initialized with the given asset and reserve data, and the initialization functions execute successfully without errors.
 * @functionality Confirms that each asset is correctly initialized and that the reserve data is set up according to predefined configurations.
 */
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
        candid::encode_one(Principal::anonymous()).unwrap(),
        Some(Principal::anonymous()),
    );

    let _ = pocket_ic::PocketIc::set_controllers(
        &pic,
        backend_canister,
        Some(Principal::anonymous()),
        vec![user_principal],
    );

    // 🔹 Define test input (token name + reserve data)
    let ICP_token_name = "ICP".to_string();
    let ICP_reserve_data = ReserveData {
        asset_name: Some(ICP_token_name.clone()),
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
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ckBTC_token_name = "ckBTC".to_string();
    let ckBTC_reserve_data = ReserveData {
        asset_name: Some(ckBTC_token_name.clone()),
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
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ckETH_token_name = "ckETH".to_string();
    let ckETH_reserve_data = ReserveData {
        asset_name: Some(ckETH_token_name.clone()),
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
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ckUSDC_token_name = "ckUSDC".to_string();
    let ckUSDC_reserve_data = ReserveData {
        asset_name: Some(ckUSDC_token_name.clone()),
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
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let ckUSDT_token_name = "ckUSDT".to_string();
    let ckUSDT_reserve_data = ReserveData {
        asset_name: Some(ckUSDT_token_name.clone()),
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
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(RESERVE_FACTOR),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(ZERO_VALUE),
    };

    let mut reserve_tokens_map: HashMap<String, ReserveData> = HashMap::new();

    reserve_tokens_map.insert(ICP_token_name, ICP_reserve_data);
    reserve_tokens_map.insert(ckBTC_token_name, ckBTC_reserve_data);
    reserve_tokens_map.insert(ckETH_token_name, ckETH_reserve_data);
    reserve_tokens_map.insert(ckUSDC_token_name, ckUSDC_reserve_data);
    reserve_tokens_map.insert(ckUSDT_token_name, ckUSDT_reserve_data);

    //================= Initialize ==================
    // 🔹 Call the `initialize` function

    for (token_name, reserve_data) in &reserve_tokens_map {
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "initialize",
            encode_args((token_name, reserve_data)).unwrap(),
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

    (pic, backend_canister,random_users)
}

/*
 * @title Test User Registration on Backend Canister
 * @notice Validates the user registration functionality for multiple users.
 * @dev Ensures that the "register_user" function works as expected for different users and handles both success and failure cases.
 * @functionality Confirms that users can be registered successfully and any errors during registration are properly handled.
 */
fn test_register_user(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>){

    let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
    for user_principal in random_users {
        let msg = pic.submit_call(
            backend_canister,
            user_principal,
            "register_user",
            encode_one(()).unwrap(),
        ).unwrap();
        msg_ids.push(msg); // Store the message ID in the vector
    }
    let mut results = Vec::new();
    for msg_id in msg_ids {
        let res = pic.await_call(msg_id).unwrap();
        results.push(res);
    }
    for result in results{
        // 🔹 Decode the response
        match result {
            WasmResult::Reply(response) => {
                let register_user_response: Result<String, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode register user response");
    
                match register_user_response {
                    Ok(_message) => {
                        ic_cdk::println!("✅ Register user function succeeded");
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "Register user function failed as expected with error: {:?}",
                            e
                        );
                        panic!("🚨 Expected success but got error: {:?}", e);
                    }
                }
            }
            WasmResult::Reject(reject_message) => {
                panic!(
                    "🚨 Register user function was rejected: {:?}",
                    reject_message
                );
            }
            _ => {
                panic!("🚨 Error calling register user function.");
            }
        }
    }
}

/*
 * @title Test Faucet Functionality for Asset Distributions
 * @notice Validates the faucet functionality for distributing assets to users.
 * @dev Ensures that the faucet function distributes assets (like ICP, ckBTC, etc.) correctly and handles both successful and failure cases based on the asset configuration.
 * @functionality Confirms that the faucet distributes the correct amount of assets and handles edge cases such as insufficient funds or asset type errors.
 */
fn test_faucet(pic: &PocketIc, backend_canister: Principal,random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        //  Valid faucet request for each asset
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(5_000_000_000u128), // 50 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(450_000u128), // 0.0045 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(45_000_000_000u128), //   450 usdc
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000_000u128), // 300 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(14_000_000u128), //  0.14 ckETH
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Faucet Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Faucet Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let msg = pic.submit_call(
                backend_canister,
                user_principal,
                "faucet",
                encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
            ).unwrap();
            msg_ids.push(msg); // Store the message ID in the vector
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }
        for result in results{
            match result {
                WasmResult::Reply(reply) => {
                    // ic_cdk::println!("Raw response bytes: {:?}", candid::decode_one(&reply));
                    let faucet_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode faucet response");
    
                    match faucet_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                                i + 1,
                                balance
                            );
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
                                    "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during faucet function call.",
                        i + 1,
                    );
                    continue;
                }
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Faucet Tests Completed ========================\n"
    );
}
/*
 * @title Test Supply Functionality for Asset Transactions
 * @notice Validates the functionality of the supply operation for various assets.
 * @dev Ensures that the supply function correctly processes asset supply requests, including handling collateral, amount validation, and edge cases such as asset approval errors or insufficient funds.
 * @functionality Confirms that the supply function performs as expected, rejecting invalid requests and successfully processing valid transactions.
 */

fn test_supply(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(4_000_000_000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(40_000u128),
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(2_000u128),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(5_000u128),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(10_000u128),
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        
    ];

    
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

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
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
       
            let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister,  case.amount.clone());
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
            let supply_params = ExecuteSupplyParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                is_collateral: case.is_collateral,
            };
    
            let msg = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_supply",
                encode_one(supply_params).unwrap(),
            ).unwrap();
            msg_ids.push(msg);
        }

        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }

        for result in results{
            match result {
                WasmResult::Reply(reply) => {
                    let supply_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get supply response");
    
                    match supply_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Supply successful. New Balance: {}",
                                i + 1,
                                balance
                            );
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
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during supply function call.",
                        i + 1
                    );
                    continue;
                }
            }
        }
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone());
    }
    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}

/*
 * @title Test Borrow Functionality for Asset Transactions
 * @notice Validates the borrow functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the borrow function handles different asset types and amounts correctly, checking both successful borrow operations and failure cases such as insufficient balance or invalid asset types.
 * @functionality Confirms that the borrow function processes requests successfully when expected and rejects invalid borrow requests with appropriate error messages.
 */
fn test_borrow(pic: &PocketIc,  backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // valid test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(20_000u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(500u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(500u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        
    ];

    // let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let borrow_params = ExecuteBorrowParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
            };

            let msg = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_borrow",
                encode_one(borrow_params).unwrap(),
            ).unwrap();
            msg_ids.push(msg);
        }

        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }
        for result in results{
            match result {
                WasmResult::Reply(reply) => {
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC borrow response");
    
                    match borrow_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Borrow successful. New Balance: {}",
                                i + 1,
                                balance
                            );
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
                                    "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during borrow function call:",
                        i + 1,
                    );
                    continue;
                }
            }
        }
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone());
    }
    ic_cdk::println!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}

/*
 * @title Test Withdraw Functionality for Asset Transactions
 * @notice Validates the withdraw functionality for various assets like ICP, ckBTC, ckETH, etc.
 * @dev Ensures that the withdraw function handles different asset types and amounts correctly. It checks both successful withdrawal operations and failure cases such as insufficient balance, invalid asset types, and collateral withdrawal.
 * @functionality Confirms that the withdraw function processes requests successfully when expected and rejects invalid withdraw requests with appropriate error messages, while also verifying if the correct balance is returned after each withdrawal attempt.
 */
fn test_withdraw(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(3_800_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(40_000u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(5_000u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(10_000u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(2_000u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        
    ];

    ic_cdk::println!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!(
            "On Behalf Of: {}",
            case.on_behalf_of
                .as_ref()
                .map_or("None".to_string(), |p| p.to_text())
        );
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");
        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let withdraw_params = ExecuteWithdrawParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
                is_collateral: case.is_collateral.clone(),
            };
            // Now call the withdraw function 
            let msg = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_withdraw",
                encode_one(withdraw_params).unwrap(),
            ).unwrap();
            msg_ids.push(msg);
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }

        for result in results{
            match result {
                WasmResult::Reply(reply) => {
                    let withdraw_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC withdraw response");
    
                    match withdraw_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Withdraw successful. New Balance: {}",
                                i + 1,
                                balance
                            );
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
                                    "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during withdraw function call:",
                        i + 1,
                    );
                    continue;
                }
            }
        }
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone());
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}

/*
 * @title Test Repay Functionality for Asset Transactions
 * @notice Validates the repay functionality for various assets like ICP, ckBTC, ckUSDT, etc.
 * @dev Ensures that the repay function handles different asset types and amounts correctly. It checks both successful repay operations and failure cases such as insufficient balance, invalid asset types, or non-approved asset transfers.
 * @functionality Confirms that the repay function processes requests successfully when expected and rejects invalid repay requests with appropriate error messages, ensuring that the balance is correctly updated after each repayment attempt.
 */
fn test_repay(pic: &PocketIc,  backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid  test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(20_000u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(500u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(500u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        
    ];

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Repay Tests ========================\n"
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        if let Some(ref principal) = case.on_behalf_of {
            ic_cdk::println!("On Behalf Of: {}", principal);
        }
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
        
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Repay rejected as expected",
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
            let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister, Nat::from(case.amount.clone()));
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
                        "✅ IC Test Case {} Passed: Repay rejected as expected",
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
            let repay_params = ExecuteRepayParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of.clone(),
            };
    
            // Now call the repay function
            let msg = pic.submit_call(
                backend_canister,
                user_principal,
                "execute_repay",
                encode_one(repay_params).unwrap(),
            ).unwrap();
            msg_ids.push(msg);
        }

        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }

        for result in results{
            match result {
                WasmResult::Reply(reply) => {
                    let repay_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to get IC repay response");
    
                    match repay_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                                i + 1,
                                balance
                            );
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
                                    "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                    i + 1,
                                    error
                                );
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during repay function call:",
                        i + 1,
                    );
                    continue;
                }
            }
        }
        fetch_reserve_data(&pic, backend_canister, &case.asset.clone());
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}

/*
 * @title Test Liquidation Functionality for Asset Transactions
 * @notice Validates the liquidation functionality for assets when the borrower’s health factor falls below the liquidation threshold.
 * @dev Ensures that the liquidation process is triggered correctly for assets like ICP, ckBTC, ckETH, etc., under various conditions, including valid and invalid scenarios.
 * @functionality Confirms that the liquidation function processes requests successfully when the borrower is eligible for liquidation and rejects invalid liquidation requests (e.g., if the health factor is above the threshold). Verifies if the correct asset is liquidated and if the borrower’s balance is updated appropriately.
 */
fn test_liquidation(pic: &PocketIc, backend_canister: Principal,random_users: Vec<Principal>) {
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
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_400_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(210_000u128),
        //     on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
        //     reward_amount: Nat::from(220_500u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckUSDC".to_string(),
        //     amount: Nat::from(200_00_000_000u128),
        //     on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
        //     reward_amount: Nat::from(210_00_000_000u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     debt_asset: "ckUSDT".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(12_500_000_000u128),
        //     on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
        //     reward_amount: Nat::from(13_062_500_000u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        

    ];

    // let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );
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
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut msg_ids = Vec::new(); // Initialize the vector to store message IDs
        for user_principal in random_users.clone() {
            let asset_principal =
                match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister){
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
    
            let approved =test_icrc2_aprove(
                get_users_principal(Nat::from(1u128)).unwrap(),
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
    
            let liquidation_params = ExecuteLiquidationParams {
                debt_asset: case.debt_asset.clone(),
                collateral_asset: case.collateral_asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of.clone(),
                reward_amount: case.reward_amount.clone(),
            };
    
            let msg = pic.submit_call(
                backend_canister,
                get_users_principal(Nat::from(1u32)).unwrap(),
                "execute_liquidation",
                encode_one(liquidation_params).unwrap(),
            ).unwrap();
            msg_ids.push(msg);
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
        }

        for result in results{
            match result {
                WasmResult::Reply(response) => {
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
                _ => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during liquidation function call:",
                        i + 1,
                    );
                    continue;
                }
            }
        }

    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}