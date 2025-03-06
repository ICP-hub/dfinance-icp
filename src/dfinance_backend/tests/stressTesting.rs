use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
mod utils;
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

#[test]
fn call_test_function() {
    let (pic, backend_canister, random_users) = setup();
    test_register_user(&pic, backend_canister, random_users.clone());
    test_faucet(&pic, backend_canister, random_users.clone());
    test_supply(&pic, backend_canister, random_users.clone());
    test_borrow(&pic, backend_canister, random_users.clone());
    test_repay(&pic, backend_canister, random_users.clone());
    test_withdraw(&pic, backend_canister, random_users.clone());
    // test_liquidation(&pic, backend_canister,random_users.clone());
}

fn setup() -> (PocketIc, Principal, Vec<Principal>) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();
    let random_users = generate_principals(1);

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
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(5800000000u128),
            liquidation_threshold: Nat::from(6300000000u128),
            liquidation_bonus: Nat::from(100000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(1_000_000_000_000_000_000u128),
            supply_cap: Nat::from(1_000_000_000_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckBTC_token_name = "ckBTC".to_string();
    let ckBTC_reserve_data = ReserveData {
        asset_name: Some(ckBTC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7300000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(1_000_000_000_000_000_000u128),
            supply_cap: Nat::from(1_000_000_000_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckETH_token_name = "ckETH".to_string();
    let ckETH_reserve_data = ReserveData {
        asset_name: Some(ckETH_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(8000000000u128),
            liquidation_threshold: Nat::from(8300000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(1_000_000_000_000_000_000u128),
            supply_cap: Nat::from(1_000_000_000_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckUSDC_token_name = "ckUSDC".to_string();
    let ckUSDC_reserve_data = ReserveData {
        asset_name: Some(ckUSDC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(1u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(1_000_000_000_000_000_000u128),
            supply_cap: Nat::from(1_000_000_000_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckUSDT_token_name = "ckUSDT".to_string();
    let ckUSDT_reserve_data = ReserveData {
        asset_name: Some(ckUSDT_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(450000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(1_000_000_000_000_000_000u128),
            supply_cap: Nat::from(1_000_000_000_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
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
    test_add_tester(
        &pic,
        backend_canister,
        user_principal,
        get_users_principal(Nat::from(1u128)).unwrap(),
    );

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

    let result = pic.update_call(
        backend_canister,
        get_users_principal(Nat::from(1u128)).unwrap(),
        "register_user",
        encode_one(()).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(response)) => {
            let register_user_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match register_user_response {
                Ok(_message) => {
                    ic_cdk::println!("✅ Register user function succeeded for user1",);
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

    (pic, backend_canister, random_users)
}

fn test_register_user(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    for (i, user_principal) in random_users.iter().enumerate() {
        let result = pic.update_call(
            backend_canister,
            *user_principal,
            "register_user",
            encode_one(()).unwrap(),
        );

        // 🔹 Decode the response
        match result {
            Ok(WasmResult::Reply(response)) => {
                let register_user_response: Result<String, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode register user response");

                match register_user_response {
                    Ok(_message) => {
                        ic_cdk::println!(
                            "✅ Register user function succeeded for user {:?}",
                            i + 1
                        );
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
    }
}

fn test_faucet(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(500_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128), // 0.0045 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(45_00_000_000u128), //   450 usdc
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3_000_000_000u128), // 300 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();
    ic_cdk::println!(
        "\n======================== Starting IC Faucet Stress Testing ========================\n"
    );
    ic_cdk::println!(
        "🔥 Stress Testing with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Faucet Request Initiated", i + 1);

        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8} \n🔹 Expected Success: {}",
            case.asset,
            amount_float / 100000000.0,
            case.expect_success
        );
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in &random_users {
            let result = pic.update_call(
                backend_canister,
                *user_principal,
                "faucet",
                encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let faucet_response: Result<Nat, errors::Error> =
                        decode_one(&reply).expect("Failed to decode faucet response");
                    match faucet_response {
                        Ok(balance) => {
                            ic_cdk::println!(
                                "✅ User {}: Faucet Success. New Balance: {}",
                                user_principal.to_text(),
                                balance
                            );
                            success_count += 1;
                        }
                        Err(error) => {
                            ic_cdk::println!(
                                "❌ User {}: Faucet Failed. Error: {}",
                                user_principal.to_text(),
                                error.message()
                            );
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!(
                        "❌ User {}: Faucet Rejected. Message: {}",
                        user_principal.to_text(),
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ User {}: Faucet Call Error: {:?}",
                        user_principal.to_text(),
                        e
                    );
                    failure_count += 1;
                }
            }
        }

        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count,);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count,);
        ic_cdk::println!("------------------------------------------------------------\n");
    }

    ic_cdk::println!(
        "\n======================== IC Faucet Stress Test Completed ========================\n"
    );
}

fn test_supply(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(400_000_000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(45_00u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(1_00_000_000u128), //   450 usdc
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3_000_000_000u128), // 300 ckUSDT
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

            fn fetch_reserve_data(pic: &PocketIc, backend_canister: Principal, asset: &str) {
                let result = pic.query_call(
                    backend_canister,
                    get_user_principal(),
                    "get_reserve_data",
                    encode_one(asset.to_string()).unwrap(),
                );

                match result {
                    Ok(WasmResult::Reply(reply)) => {
                        let supply_response: Result<ReserveData, errors::Error> =
                            candid::decode_one(&reply)
                                .expect("Failed to decode reserve data response");

                        match supply_response {
                            Ok(balance) => {
                                ic_cdk::println!(
                                    "Reserve Data - Last Update Timestamp for {}: {:?}",
                                    asset,
                                    balance.last_update_timestamp
                                );
                                ic_cdk::println!(
                                    "Reserve Data - Asset Supply for {}: {:?}",
                                    asset,
                                    balance.asset_supply
                                );
                                ic_cdk::println!(
                                    "Reserve Data - Asset Borrow for {}: {:?}",
                                    asset,
                                    balance.asset_borrow
                                );
                                ic_cdk::println!(
                                    "Reserve Data - Debt Index for {}: {:?}",
                                    asset,
                                    balance.debt_index
                                );
                                ic_cdk::println!(
                                    "Reserve Data - Liquidity Index for {}: {:?}",
                                    asset,
                                    balance.liquidity_index
                                );
                            }
                            Err(error) => {
                                ic_cdk::println!(
                                    "Failed to retrieve reserve data for {}: {:?}",
                                    asset,
                                    error
                                );
                            }
                        }
                    }
                    Ok(WasmResult::Reject(reject_message)) => {
                        ic_cdk::println!("Query rejected for {}: {}", asset, reject_message);
                    }
                    Err(e) => {
                        ic_cdk::println!("Error retrieving reserve data for {}: {:?}", asset, e);
                    }
                }
            }

            fn fetch_user_data(
                pic: &PocketIc,
                backend_canister: Principal,
                user_principal: &Principal,
                asset: &str,
            ) {
                let result = pic.query_call(
                    backend_canister,
                    *user_principal,
                    "get_user_data",
                    encode_one(*user_principal).unwrap(),
                );

                match result {
                    Ok(WasmResult::Reply(reply)) => {
                        let user_response: Result<UserData, errors::Error> =
                            candid::decode_one(&reply)
                                .expect("Failed to decode user data response");

                        match user_response {
                            Ok(user_data) => {
                                if let Some(reserves) = &user_data.reserves {
                                    for (reserve_asset, reserve_data) in reserves {
                                        if reserve_asset == asset {
                                            ic_cdk::println!(
                                    "User Data for Asset: {} | Last Update Timestamp: {:?}",
                                    asset,
                                    reserve_data.last_update_timestamp
                                );
                                            ic_cdk::println!(
                                                "User Data for Asset: {} | dToken Balance: {:?}",
                                                asset,
                                                reserve_data.d_token_balance
                                            );
                                            ic_cdk::println!(
                                    "User Data for Asset: {} | Debt Token Balance: {:?}",
                                    asset,
                                    reserve_data.debt_token_blance
                                );
                                            ic_cdk::println!(
                                                "User Data for Asset: {} | Liquidity Index: {:?}",
                                                asset,
                                                reserve_data.liquidity_index
                                            );
                                            ic_cdk::println!(
                                    "User Data for Asset: {} | Variable Borrow Index: {:?}",
                                    asset,
                                    reserve_data.variable_borrow_index
                                );
                                        }
                                    }
                                } else {
                                    ic_cdk::println!("No reserve data found for user.");
                                }
                            }
                            Err(error) => {
                                ic_cdk::println!(
                                    "Failed to retrieve user data for {}: {:?}",
                                    user_principal,
                                    error
                                );
                            }
                        }
                    }
                    Ok(WasmResult::Reject(reject_message)) => {
                        ic_cdk::println!(
                            "Query rejected for {}: {}",
                            user_principal,
                            reject_message
                        );
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "Error retrieving user data for {}: {:?}",
                            user_principal,
                            e
                        );
                    }
                }
            }

            // ic_cdk::println!("\n======================== Initial Reserve Data   ========================\n");

            // fetch_reserve_data(pic, backend_canister, &case.asset);

            // ic_cdk::println!("\n======================== Initial User Data  ========================\n");

            // fetch_user_data(pic, backend_canister, &user_principal, &case.asset);


            let supply_params = ExecuteSupplyParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                is_collateral: case.is_collateral,
            };

            let result = pic.update_call(
                backend_canister,
                *user_principal,
                "execute_supply",
                encode_one(supply_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    match decode_one::<Result<Nat, errors::Error>>(&reply) {
                        Ok(Ok(balance)) => {
                            ic_cdk::println!(
                                "✅ User {}: Supply Successful. New Balance: {}",
                                user_principal.to_text(),
                                balance
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

fn test_borrow(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid test case
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_00u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_00u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(4_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(50u128),
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();

    ic_cdk::println!(
        "\n======================== 🚀 Starting IC Borrow Stress Testing ========================"
    );
    ic_cdk::println!(
        "🔥 Running stress test with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Borrow Request Initiated", i + 1);
        let amount_float = case.amount.clone().0.try_into().unwrap_or(0u64) as f64 / 100000000.0;
        ic_cdk::println!(
            "🔹 Asset: {} \n🔹 Amount (Tokens): {:.8}  \n🔹 Expected Success: {}",
            case.asset,
            amount_float,
            case.expect_success
        );
        if let Some(msg) = &case.expected_error_message {
            ic_cdk::println!("⚠️ Expected Error: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in &random_users {
            let borrow_params = ExecuteBorrowParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
            };

            let result = pic.update_call(
                backend_canister,
                *user_principal,
                "execute_borrow",
                encode_one(borrow_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode IC borrow response");

                    match borrow_response {
                        Ok(balance) if case.expect_success => {
                            ic_cdk::println!(
                                "✅ User {}: Borrow successful! New Balance: {}",
                                user_principal.to_text(),
                                balance
                            );
                            success_count += 1;
                        }
                        Err(error) if !case.expect_success => {
                            if case.expected_error_message.as_deref() == Some(error.message()) {
                                ic_cdk::println!(
                                    "✅ Test Case {} Passed: Borrow rejected as expected. Message: {:?}",
                                    i + 1, error
                                );
                                success_count += 1;
                            } else {
                                ic_cdk::println!(
                                    "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("(none)"),
                                    error.message()
                                );
                                failure_count += 1;
                            }
                        }
                        Err(error) => {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Expected success but got rejection. Message: {:?}",
                                i + 1,
                                error
                            );
                            failure_count += 1;
                        }
                        _ => {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Expected failure but received success.",
                                i + 1
                            );
                            failure_count += 1;
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Function call rejected. Message: {}",
                        i + 1,
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Error during function call: {:?}",
                        i + 1,
                        e
                    );
                    failure_count += 1;
                }
            }
        }

        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count,);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count,);
        ic_cdk::println!("------------------------------------------------------------\n");
    }

    ic_cdk::println!(
        "\n======================== ✅ IC Borrow Tests Completed ========================"
    );
}

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
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(400u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_00u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2_00_00u128), // 450 USDC
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3u128), // 300 ckUSDT
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let total_users = random_users.len();

    ic_cdk::println!("\n======================== 🚀 IC Withdraw Stress Testing Started ========================\n");
    ic_cdk::println!(
        "🔥 Running stress test with {} user principals! 🔥\n",
        total_users
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🚀 Test Case {}: Withdraw Request Initiated", i + 1);
        let amount_float = case.amount.clone().0.try_into().unwrap_or(0u64) as f64 / 100000000.0;
        ic_cdk::println!(
            "On Behalf Of: {}\n🔹 Asset: {} \n🔹 Amount (Tokens): {:.8} \n🔹 Expected Success: {} \n🔹 Is Collateral: {}",
            case.on_behalf_of
                .as_ref()
                .map_or("None".to_string(), |p| p.to_text()),
            case.asset,
            amount_float,
            case.expect_success,
            case.is_collateral
        );

        if let Some(msg) = &case.expected_error_message {
            ic_cdk::println!("⚠️ Expected Error: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in random_users.clone() {
            ic_cdk::println!(
                "\n======================== Initial Reserve Data   ========================\n"
            );

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!(
                "\n======================== Initial User Data  ========================\n"
            );

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

            let withdraw_params = ExecuteWithdrawParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
                is_collateral: case.is_collateral,
            };

            let result = pic.update_call(
                backend_canister,
                user_principal,
                "execute_withdraw",
                encode_one(withdraw_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let withdraw_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode withdraw response");

                    match withdraw_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                failure_count += 1;
                            } else {
                                ic_cdk::println!(
                                    "✅ User {}: Withdraw successful. New Balance: {}",
                                    user_principal.to_text(),
                                    balance
                                );
                                success_count += 1;
                            }
                        }
                        Err(error) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(error.message()) {
                                    ic_cdk::println!(
                                        "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("No expected message"),
                                        error.message()
                                    );
                                    failure_count += 1;
                                } else {
                                    ic_cdk::println!(
                                        "✅ Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                        i + 1,
                                        error
                                    );
                                    success_count += 1;
                                }
                            } else {
                                ic_cdk::println!("❌ Test Case {} Failed: Expected success but got rejection: {:?}", i + 1, error);
                                failure_count += 1;
                            }
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    failure_count += 1;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ Test Case {} Failed: Error during function call: {:?}",
                        i + 1,
                        e
                    );
                    failure_count += 1;
                }
            }

            ic_cdk::println!(
                "\n======================== Updated Reserve Data   ========================\n"
            );

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!(
                "\n======================== Updated User Data  ========================\n"
            );

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }

        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("📊 Test Case {} Summary: ", i + 1);
        ic_cdk::println!("✅ Successful Transactions: {}", success_count,);
        ic_cdk::println!("❌ Failed Transactions: {}", failure_count,);
        ic_cdk::println!("------------------------------------------------------------\n");
    }

    ic_cdk::println!(
        "\n======================== ✅ IC Withdraw Tests Completed ========================\n"
    );
}

fn test_repay(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            amount: Nat::from(100_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_00u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_00u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(4_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(50u128),
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

        if let Some(msg) = &case.expected_error_message {
            ic_cdk::println!("⚠️ Expected Error: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let mut success_count = 0;
        let mut failure_count = 0;

        for user_principal in &random_users {
            ic_cdk::println!("👤 Testing for user: {}", user_principal);
            let asset_principal =
                match test_get_asset_principal(case.asset.clone(), pic, backend_canister) {
                    Some(principal) => principal,
                    None => {
                        ic_cdk::println!("❌ Asset principal not found. Skipping user.");
                        failure_count += 1;
                        continue;
                    }
                };

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

            let repay_params = ExecuteRepayParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of.clone(),
            };

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
                        Ok(balance) => {
                            ic_cdk::println!("✅ Repay successful! New Balance: {}", balance);
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

fn test_liquidation(pic: &PocketIc, backend_canister: Principal, random_users: Vec<Principal>) {
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
            reward_amount: Nat::from(40400_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(210000u128),
        //     on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
        //     reward_amount: Nat::from(220500u128),
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
        //     amount: Nat::from(12500000000u128),
        //     on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
        //     reward_amount: Nat::from(13062500000u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    ];

    // let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );

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
            test_create_user_reserve_with_low_health(&pic, backend_canister);
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

            let liquidation_params = ExecuteLiquidationParams {
                debt_asset: case.debt_asset.clone(),
                collateral_asset: case.collateral_asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of.clone(),
                reward_amount: case.reward_amount.clone(),
            };

            let msg = pic
                .submit_call(
                    backend_canister,
                    user_principal,
                    "execute_liquidation",
                    encode_one(liquidation_params).unwrap(),
                )
                .unwrap();
            msg_ids.push(msg);
        }
        let mut results = Vec::new();
        for msg_id in msg_ids {
            let res = pic.await_call(msg_id).unwrap();
            results.push(res);
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
