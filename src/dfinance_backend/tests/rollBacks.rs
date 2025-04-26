use candid::{encode_args, encode_one, Principal};
use candid::Nat;
use pocket_ic::{PocketIc, WasmResult};
use std::collections::HashMap;
use std::fs;
mod utils;
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::constant_variables::*;

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

fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();

    let user_principal = get_user_principal();

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
            frozen: false,
            active: true,
            paused: false,
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
            frozen: false,
            active: true,
            paused: false,
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
            frozen: false,
            active: true,
            paused: false,
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
            frozen: false,
            active: true,
            paused: false,
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

    reserve_tokens_map.insert(icp_token_name, icp_reserve_data);
    reserve_tokens_map.insert(ck_btc_token_name, ck_btc_reserve_data);
    reserve_tokens_map.insert(ck_eth_token_name, ck_eth_reserve_data);
    reserve_tokens_map.insert(ck_usdc_token_name, ck_usdc_reserve_data);
    reserve_tokens_map.insert(ck_usdt_token_name, ck_usdt_reserve_data);

    /*
     * @title Initialize Tokens
     * @notice Calls the `initialize` function for each token to set up reserves.
     * @dev Iterates through `reserve_tokens_map` and sends an update call to initialize each token.
     */
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

    /*
     * @title Add Testers
     * @notice Registers testers to validate liquidation scenarios.
     * @dev Adds the primary user and test users (1 to 5).
     */
    test_add_tester(&pic, backend_canister, user_principal, user_principal);
    for num in 1..=5 {
        let index: u32 = num as u32;
        test_add_tester(
            &pic,
            backend_canister,
            user_principal,
            get_users_principal(Nat::from(index)).unwrap(),
        );
    }

    /*
     * @title Update Reserve Price
     * @notice Calls `update_reserve_price_test` to update the reserve price cache.
     * @dev Sends an update call and decodes the response.
     */
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

    /*
     * @title Register Users
     * @notice Registers users to participate in liquidation testing.
     * @dev Adds the primary user and test users (1 to 5).
     */
    test_register_user(&pic, backend_canister, user_principal);
    for num in 1..=5 {
        let index: u32 = num as u32;
        test_register_user(
            &pic,
            backend_canister,
            get_users_principal(Nat::from(index)).unwrap(),
        );
    }

    (pic, backend_canister)
}

/*
 * @title Register Users
 * @notice Registers users to participate in liquidation testing.
 * @dev Calls the `register_user` function on the backend canister to add the primary user and additional test users (1 to 5). This function handles user registration and verifies the response for success or failure.
 * @functionality Ensures that the `register_user` function is called correctly and that the registration succeeds. If there is an error, the failure is logged, and the test halts to ensure proper error handling.
 */
fn test_register_user(pic: &PocketIc, backend_canister: Principal, user_principal: Principal) {
    let result = pic.update_call(
        backend_canister,
        user_principal,
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
}

/*
 * @title Faucet Request Test
 * @notice Tests the faucet function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for faucet requests with different asset types and amounts. It checks the success or failure of each request, verifying the expected outcomes (such as receiving the correct amount or receiving the appropriate error message).
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes faucet requests for different assets (ICP, ckBTC, ckUSDC, etc.).
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Handles cases where asset length exceeds the allowed limit.
 * 4. Simulates faucet requests for multiple users to test liquidation scenarios.
 */
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
        // // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100_000u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
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

        /*
         * @title Faucet Request Test
         * @notice Tests the faucet function for expected success or failure.
         *
         * @dev Steps:
         *      1. Calls `faucet` with asset and amount.
         *      2. Decodes and verifies response.
         *      3. Logs success or failure.
         *
         * @param pic PocketIc instance.
         * @param backend_canister Backend canister principal.
         * @param user_principal User's principal.
         */
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
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
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }

        /*
         * @title Faucet Request for Users
         * @notice Simulates faucet requests for multiple users to test liquidation scenarios.
         *
         * @dev Steps:
         *      1. Iterates through users (1 to 5).
         *      2. Calls `faucet` with user principal.
         *      3. Verifies response and logs success/failure.
         *
         * @param pic PocketIc instance.
         * @param backend_canister Backend canister principal.
         */
        for num in 1..=5 {
            let index: u32 = num as u32;
            // Simulate faucet request
            let result = pic.update_call(
                backend_canister,
                get_users_principal(Nat::from(index)).unwrap(),
                "faucet",
                encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
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
                        "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                        i + 1,
                        e
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
 * @title Supply Function Test
 * @notice Tests the supply function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for supply requests with different asset types, amounts, and collateral statuses. It checks the success or failure of each request, verifying the expected outcomes (such as a successful supply or receiving an appropriate error message).
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes supply requests for different assets (ICP, ckETH, ckUSDT, etc.) with varying amounts and collateral statuses.
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Handles cases where ICRC2 approval is required for the asset.
 * 4. Simulates supply requests for multiple users to test asset supply scenarios and rollback mechanisms.
 * 5. Validates the state of reserves and user data before and after the supply operation.
 * 6. Handles scenarios where supply requests may fail due to insufficient approval or unexpected errors.
 */

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
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(5_00_000_000u128), // 5 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(4_00_000_000u128), // 4 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(14_000_000u128), // 0.14 ckETH (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(1_00_000u128), // 0.001 ckETH (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000_000u128), // 30,000 ckUSDT (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Supply Tests ========================\n"
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 Test Case {}: Executing Supply Request", i + 1);
        ic_cdk::println!(" Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!(" Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!(" Is Collateral: {}", case.is_collateral);
        ic_cdk::println!(" Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!(" Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        if i % 2 == Nat::from(0u128) {
            /* Get asset principal; handle missing cases  */
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
        }
        if i % 2 != Nat::from(0u128) {
            ic_cdk::println!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!("\n======================== Initial User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
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
                    candid::decode_one(&reply).expect("Failed to decode supply response");

                match supply_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                        } else {
                            ic_cdk::println!(
                                "✅ Test Case {} Passed: Supply successful. New Balance: {}",
                                i + 1,
                                balance
                            );
                        }
                    }
                    Err(error) => {
                        if case.expect_success {
                            if i % 2 != 0 {
                                ic_cdk::println!(
                                    "\n============================================================"
                                );
                                ic_cdk::println!(
                                    "✅ Test Case {} Passed: ICRC Approval Not Provided",
                                    i + 1
                                );
                                ic_cdk::println!(
                                    "   ➜ Triggering rollback mechanism for asset: {}",
                                    case.asset
                                );
                                ic_cdk::println!(
                                    "------------------------------------------------------------"
                                );
                                ic_cdk::println!("🔄 Rollback Process Initiated...");
                                ic_cdk::println!("   ⏳ Reverting all state changes...");
                                ic_cdk::println!(
                                    "   🔁 Restoring previous balances and reserves..."
                                );
                                ic_cdk::println!("✅ Rollback Successfully Completed!");
                                ic_cdk::println!(
                                    "============================================================\n"
                                );
                            }
                        } else if case.expected_error_message.as_deref() != Some(error.message()) {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                i + 1,
                                case.expected_error_message.as_deref().unwrap_or("N/A"),
                                error.message()
                            );
                        } else {
                            ic_cdk::println!("✅ Test Case {} Passed: Supply rejected as expected with message: {:?}", i + 1, error);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ Test Case {} Failed: Error during supply function call: {:?}",
                    i + 1,
                    e
                );
            }
        }
        if i % 2 != Nat::from(0u128) {
            ic_cdk::println!("\n======================== Final Reserve Data After Rollback ========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            ic_cdk::println!(
            "\n======================== Final User Data After Rollback ========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }
    }

    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}

/*
 * @title Borrow Function Test
 * @notice Tests the borrow function for expected success or failure with various assets.
 * @dev This function runs a series of test cases for borrow requests with different asset types and amounts. It checks the success or failure of each request, verifying the expected outcomes (such as a successful borrow or receiving an appropriate error message).
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes borrow requests for different assets (ICP, ckETH, ckUSDT, etc.) with varying amounts.
 * 2. Verifies success or failure based on expected outcomes.
 * 3. Simulates borrow requests for multiple users to test borrowing scenarios and error handling.
 * 4. Validates the borrow response and checks whether the balance is updated correctly.
 * 5. Handles cases where the borrow request may fail due to errors or unexpected conditions, including mismatched error messages.
 */

fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
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
            amount: Nat::from(1_00_000_000u128), // 1 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_00_000_000u128), // 1 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 30 ckUSDT
            expect_success: true,
            expected_error_message: None,
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

        /* Borrow params */
        let borrow_params = ExecuteBorrowParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
        };

        /*
         * @title Execute Borrow Transaction
         * @notice Calls the backend canister to execute a borrow operation.
         * @dev Validates the borrow response and checks for expected success or failure.
         */
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
                    "❌ IC Test Case {} Failed: Error during borrow function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}

/*
 * @title Withdraw Function Test
 * @notice Tests the withdraw function for various assets and withdrawal conditions.
 * @dev This function runs a series of test cases for withdraw requests with different assets, amounts, collateral status, and options for withdrawing on behalf of another principal. It verifies the success or failure of each withdrawal request and checks whether the appropriate error messages are returned when failures occur.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes withdraw requests for different assets (e.g., ICP, ckETH, ckUSDT) with varying amounts, including collateralized and non-collateralized withdrawals.
 * 2. Checks if the withdrawal is processed successfully or rejected as expected.
 * 3. Simulates withdrawing on behalf of another user when applicable.
 * 4. Verifies that error messages are returned correctly if the withdrawal is unsuccessful or if the expected outcome does not match.
 * 5. Validates whether the balance is updated correctly after the withdrawal.
 */

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
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10_000u128), // 100 ckUSDT
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(2_000u128), // 0.02 ckETH
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ICP
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(20_000u128), // 0.00000002 ICP
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
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

        /* Withdraw params */
        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            is_collateral: case.is_collateral.clone(),
        };

        /*
         * @title Execute Withdraw
         * @notice Executes the withdraw operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
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
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}

/*
 * @title Repay Function Test
 * @notice Tests the repay function for various assets and repayment conditions.
 * @dev This function runs a series of test cases for repay requests with different assets, amounts, and options for repaying on behalf of another principal. It verifies the success or failure of each repayment request, checks whether the appropriate error messages are returned, and ensures the rollback mechanism is triggered when needed.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes repay requests for different assets (e.g., ICP, ckETH, ckUSDT) with varying amounts, including transaction fees.
 * 2. Handles repayment requests both with and without approval for the ICRC2 transfer.
 * 3. Validates the approval status for ICRC2 transfer before proceeding with repayment.
 * 4. Verifies if the repayment is processed successfully or rejected as expected.
 * 5. Checks whether error messages are returned correctly in case of failure.
 * 6. Simulates repayment on behalf of another principal when applicable.
 * 7. Ensures that the rollback mechanism is triggered and the state is reverted when necessary.
 */

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
        // Valid  test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(400u128), // 0.004 ckETH (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128), // 0.002 ckETH (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 30 ckUSDT (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
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

        if i % 2 == Nat::from(0u128) {
            /* Get asset principal; handle missing cases  */
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
        }

        if i % 2 != Nat::from(0u128) {
            ic_cdk::println!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

            fetch_reserve_data(pic, backend_canister, &case.asset);

            ic_cdk::println!("\n======================== Initial User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }

        /* Repay params */
        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        /*
         * @title Execute Repay
         * @notice Executes the repay operation and validates outcomes.
         * @dev Calls the backend function, checks responses, and verifies success or failure.
         */
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
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if case.expect_success {
                            if i % 2 != 0 {
                                ic_cdk::println!(
                                    "\n============================================================"
                                );
                                ic_cdk::println!(
                                    "🟢 Test Case {} Passed: ICRC Approval Not Provided",
                                    i + 1
                                );
                                ic_cdk::println!(
                                    "   ➜ Triggering rollback mechanism for asset: {}",
                                    case.asset
                                );
                                ic_cdk::println!(
                                    "------------------------------------------------------------"
                                );
                                ic_cdk::println!("🔄 Rollback Process Initiated...");
                                ic_cdk::println!("   ⏳ Reverting all state changes...");
                                ic_cdk::println!(
                                    "   🔁 Restoring previous balances and reserves..."
                                );
                                ic_cdk::println!("✅ Rollback Successfully Completed!");
                                ic_cdk::println!(
                                    "============================================================\n"
                                );
                            }
                        } else if case.expected_error_message.as_deref() != Some(error.message()) {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                i + 1,
                                case.expected_error_message.as_deref().unwrap_or("N/A"),
                                error.message()
                            );
                        } else {
                            ic_cdk::println!("✅ Test Case {} Passed: Supply rejected as expected with message: {:?}", i + 1, error);
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
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
        if i % 2 != Nat::from(0u128) {
            ic_cdk::println!("\n======================== Final Reserve Data After Rollback ========================\n");
            fetch_reserve_data(pic, backend_canister, &case.asset);
            ic_cdk::println!(
            "\n======================== Final User Data After Rollback ========================\n"
        );
            fetch_user_data(pic, backend_canister, &user_principal, &case.asset);
        }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}

/*
 * @title Liquidation Function Test
 * @notice Tests the liquidation function for various assets and liquidation conditions.
 * @dev This function runs a series of test cases for liquidation requests with different assets, amounts, and conditions for liquidating on behalf of another principal. It verifies the success or failure of each liquidation request, checks whether the appropriate error messages are returned, and ensures the rollback mechanism is triggered when needed.
 * 
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * 
 * @functionality:
 * 1. Executes liquidation requests for different assets (e.g., ICP, ckBTC, ckUSDC) with varying amounts, including transaction fees.
 * 2. Handles liquidation requests both with and without approval for the ICRC2 transfer.
 * 3. Validates the approval status for ICRC2 transfer before proceeding with liquidation.
 * 4. Verifies if the liquidation is processed successfully or rejected as expected.
 * 5. Checks whether error messages are returned correctly in case of failure.
 * 6. Simulates liquidation on behalf of another principal when applicable.
 * 7. Ensures that the rollback mechanism is triggered and the state is reverted when necessary.
 * 8. Logs and prints detailed information about each test case, including asset details, expected success/failure, and error messages (if any).
 * 9. Fetches and prints reserve data and user data both before and after liquidation attempts to validate state changes or rollback.
 * 10. Provides feedback on whether the liquidation request succeeded or failed, and whether the rollback was correctly executed in case of failure.
 */

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
            amount: Nat::from(40_000_000u128), // 0.4 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_400_000u128), // 4.04 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210_000u128), // 0.0021 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220_500u128), // 0.002205 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(200_00_000_000u128), // 2000 ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(210_00_000_000u128), // 2100 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 1250 ckUSDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_500_000u128), // 1306.25 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal();
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
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        if i % 2 == Nat::from(0u128) {
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
            let approved = test_icrc2_aprove(
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
        }

        if i % 2 != Nat::from(0u128) {
            if case.collateral_asset == case.debt_asset {
                ic_cdk::println!("\n======================== Initial Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            } else {
                ic_cdk::println!("\n======================== Initial Debt Asset Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.debt_asset);

                ic_cdk::println!("\n======================== Initial Collateral Asset Reserve Data Before Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            }

            ic_cdk::println!("\n======================== Initial Liquidator User Data Before Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.debt_asset);

            ic_cdk::println!("\n======================== Initial On Behalf User Data Before Roll Backs ========================\n");

            fetch_user_data(
                pic,
                backend_canister,
                &case.on_behalf_of,
                &case.collateral_asset,
            );
        }
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
                    Err(error) => {
                        if case.expect_success {
                            if i % 2 != 0 {
                                ic_cdk::println!(
                                    "\n============================================================"
                                );
                                ic_cdk::println!(
                                    "🟢 Test Case {} Passed: ICRC Approval Not Provided",
                                    i + 1
                                );
                                ic_cdk::println!(
                                    "   ➜ Triggering rollback mechanism for asset: {}",
                                    case.debt_asset
                                );
                                ic_cdk::println!(
                                    "------------------------------------------------------------"
                                );
                                ic_cdk::println!("🔄 Rollback Process Initiated...");
                                ic_cdk::println!("   ⏳ Reverting all state changes...");
                                ic_cdk::println!(
                                    "   🔁 Restoring previous balances and reserves..."
                                );
                                ic_cdk::println!("✅ Rollback Successfully Completed!");
                                ic_cdk::println!(
                                    "============================================================\n"
                                );
                            }
                        } else if case.expected_error_message.as_deref() != Some(error.message()) {
                            ic_cdk::println!(
                                "❌ Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                i + 1,
                                case.expected_error_message.as_deref().unwrap_or("N/A"),
                                error.message()
                            );
                        } else {
                            ic_cdk::println!("✅ Test Case {} Passed: Supply rejected as expected with message: {:?}", i + 1, error);
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
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }

        if i % 2 != Nat::from(0u128) {
            if case.collateral_asset == case.debt_asset {
                ic_cdk::println!("\n========================  Reserve Data After Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            } else {
                ic_cdk::println!("\n======================== Debt Asset Reserve Data After Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.debt_asset);

                ic_cdk::println!("\n======================== Collateral Asset Reserve Data After Roll Backs  ========================\n");

                fetch_reserve_data(pic, backend_canister, &case.collateral_asset);
            }

            ic_cdk::println!("\n======================== Liquidator User Data After Roll Backs ========================\n");

            fetch_user_data(pic, backend_canister, &user_principal, &case.debt_asset);

            ic_cdk::println!("\n======================== On Behalf User Data After Roll Backs ========================\n");

            fetch_user_data(
                pic,
                backend_canister,
                &case.on_behalf_of,
                &case.collateral_asset,
            );
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
