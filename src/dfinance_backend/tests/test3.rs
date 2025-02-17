use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;
mod error;
use error as errors;
use std::collections::HashMap;
mod functions;
use functions::*;
mod structs;
use structs::*;


const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";


fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();

    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 5_000_000_000_000_000);
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
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),   // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(5800000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(6300000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(100000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckBTC_token_name = "ckBTC".to_string();
    let ckBTC_reserve_data = ReserveData {
        asset_name: Some(ckBTC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7300000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckETH_token_name = "ckETH".to_string();
    let ckETH_reserve_data = ReserveData {
        asset_name: Some(ckETH_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(8000000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(8300000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckUSDC_token_name = "ckUSDC".to_string();
    let ckUSDC_reserve_data = ReserveData {
        asset_name: Some(ckUSDC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(1u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckUSDT_token_name = "ckUSDT".to_string();
    let ckUSDT_reserve_data = ReserveData {
        asset_name: Some(ckUSDT_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(450000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let mut reserve_tokens_map: HashMap<String, ReserveData> = HashMap::new();

    reserve_tokens_map.insert(ICP_token_name, ICP_reserve_data);
    reserve_tokens_map.insert(ckBTC_token_name, ckBTC_reserve_data);
    reserve_tokens_map.insert(ckETH_token_name, ckETH_reserve_data);
    reserve_tokens_map.insert(ckUSDC_token_name, ckUSDC_reserve_data);
    reserve_tokens_map.insert(ckUSDT_token_name, ckUSDT_reserve_data);

    //================= Initialize ==================
    // 🔹 Call the `initialize` function

    ic_cdk::println!("things are working:");
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

    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args(("tester".to_string(), user_principal.clone())).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match initialize_response {
                Ok(()) => {
                    ic_cdk::println!("✅ Add Tester function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!("Add Tester function failed as expected with error: {:?}", e);
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!("🚨 Add Tester function was rejected: {:?}", reject_message);
        }
        Err(e) => {
            panic!("🚨 Error calling Add Tester function: {:?}", e);
        }
    }

     
    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args(("tester2".to_string(), get_users_principal(Nat::from(2u32)).unwrap())).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match initialize_response {
                Ok(()) => {
                    ic_cdk::println!("✅ Add Tester function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!(
                        "Add Tester function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Add Tester function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling Add Tester function: {:?}", e);
        }
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
            let initialize_response: Result<(), errors::Error> = candid::decode_one(&response)
                .expect("Failed to decode reserve price cache response");

            match initialize_response {
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

    let result = pic.update_call(
        backend_canister,
        user_principal,
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match initialize_response {
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
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Register user function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling register user function: {:?}", e);
        }
    }
    let result = pic.update_call(
        backend_canister,
        get_users_principal(Nat::from(1u32)).unwrap(),
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match initialize_response {
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
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Register user function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling register user function: {:?}", e);
        }
    }

    let result = pic.update_call(
        backend_canister,
        get_users_principal(Nat::from(2u32)).unwrap(),
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match initialize_response {
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
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Register user function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling register user function: {:?}", e);
        }
    }
    (pic, backend_canister)
}

#[test]
fn call_test_function() {
    let (pic, backend_canister) = setup();
    test_faucet(&pic, backend_canister);
    test_supply(&pic, backend_canister);
    test_borrow(&pic, backend_canister);
    test_repay(&pic, backend_canister);
    test_withdraw(&pic, backend_canister);
    test_liquidation(&pic, backend_canister);
}


fn test_faucet(pic: &PocketIc, backend_canister: Principal) {
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
            amount: Nat::from(40000u128), // 0.0004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128), //   0.00002 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128), // 0.0001 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(1000_000u128), //  0.00005 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100000u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50000u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(10_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Amount is too much".to_string()),
        },
        // Boundry amount
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128),
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

        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }
        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(1u32)).unwrap(),
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }

        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(2u32)).unwrap(),
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected rejection.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Faucet function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Faucet Tests Completed ========================\n"
    );
}

fn test_supply(pic: &PocketIc, backend_canister: Principal) {
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
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        //  Invalid Test Cases
        // Empty assets name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(1000000000000000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        //  low wallet amount
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(100000000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some(
                "Amount must be less than user available balance".to_string(),
            ),
        },
        // // testcase will work only if this asset has not been faucet
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: Nat::from(1000000000u128),
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("Amount must be less than user available balance".to_string()),
        // },

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
    ];

    let user_principal = get_user_principal();
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
                        panic!("Unexpected rejection.");
                    }
                    continue;
                }
            };
        let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister);
        if !approved {
            continue;
        }

        let supply_params = ExecuteSupplyParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            is_collateral: case.is_collateral,
        };

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
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch for case: {:?}",
                                i + 1,
                                case
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Supply rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during supply function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Supply Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}

fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        //
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500u128),
            expect_success: true,
            expected_error_message: None,
        },
        // Boundary Cases (Minimum and Maximum Withdrawals)
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: Nat::from(100000000u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        // Invalid Cases (General Failures)
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETHEREUM".to_string(),
            amount: Nat::from(50u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Large amount
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(100_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Amount is too much".to_string()),
        },
    ];

    let user_principal = get_user_principal();

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

        let borrow_params = ExecuteBorrowParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
        };

        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_borrow",
            encode_one(borrow_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let borrow_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC borrow response");

                match borrow_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Borrow successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during borrow function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Borrow Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}

fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
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
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // Valid Collateral Withdrawals
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid Cases (General Failures)
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // // Valid Case: Withdraw Exact Reserve Amount
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(500u128),
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

        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            is_collateral: case.is_collateral.clone(),
        };
        // Now call the withdraw function  ///
        let result = pic.update_call(
            backend_canister,
            get_user_principal(),
            "execute_withdraw",
            encode_one(withdraw_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let withdraw_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                match withdraw_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Withdraw successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Function call error.");
            }
        }
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}

fn test_repay(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid cases
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "TooLongAsset".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50000000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("wallet balance is low".to_string()),
        },
        // repay on no borrow
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no debt to repay".to_string()),
        },
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

        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        // Now call the repay function
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_repay",
            encode_one(repay_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let repay_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC repay response");

                match repay_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            panic!("Unexpected success.");
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(error.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
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
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Repay Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}

fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
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
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(40400_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(10_000u128),
        //     on_behalf_of: get_user_principal(),
        //     reward_amount: Nat::from(361_936u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(50u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        // Unsupported asset pairs
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(100u128),
        //     expect_success: false,
        //     expected_error_message: Some("Invalid collateral-debt pair".to_string()),
        // },

        // // Zero amount (invalid scenario)
        // TestCase {
        //     debt_asset: "ckETH".to_string(),
        //     collateral_asset: "ckUSDC".to_string(),
        //     amount: Nat::from(0u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(0u128),
        //     expect_success: false,
        //     expected_error_message: Some("Amount must be greater than zero".to_string()),
        // },

        // Very large amounts (stress test)
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(u128::MAX), // Max possible amount
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(u128::MAX),
        //     expect_success: false,
        //     expected_error_message: Some("Amount exceeds maximum limit".to_string()),
        // },

        // // Edge case: Minimal possible amount
        // TestCase {
        //     debt_asset: "ICP".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(1u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(10u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        //  Invalid principal (malformed or blocked user)
        TestCase {
            debt_asset: "XYZ".to_string(),
            collateral_asset: "XYZ".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(), 
            reward_amount: Nat::from(40400_000u128),
            expect_success: false,
            expected_error_message: Some("No principal found for asset".to_string()),
        },

        // Anonymous principals are not allowed
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        },

        // Zero amount 
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(150u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },

        // Borrowing against an unlisted or unknown asset (hypothetical scenario)
        TestCase {
            debt_asset: "XYZCoin_invalid".to_string(), // Unsupported coin
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(30u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
    ];

    let user_principal = get_user_principal();
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

        let asset_principal =
            match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister){
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
                        panic!("Unexpected rejection.");
                    }
                    continue;
                }
            };

            let approved =test_icrc2_aprove(
            get_users_principal(Nat::from(1u128)).unwrap(),
            asset_principal,
            &pic,
            backend_canister,
        );
        if !approved {
            continue;
        }

        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
            reward_amount: case.reward_amount.clone(),
        };

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
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.message()),
                                "❌ IC Test Case {} Failed: Error message mismatch.",
                                i + 1
                            );
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                i + 1,
                                e
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
                            panic!("Unexpected rejection.");
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
                panic!("Unexpected rejection.");
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Liquidation Function call error.");
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
