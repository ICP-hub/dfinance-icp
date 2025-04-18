use candid::Nat;
use candid::{encode_args, encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use std::fs;
mod utils;
use crate::utils::common_functions::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use std::collections::HashMap;
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

    (pic, backend_canister)
}

/*
 * @title Register User
 * @notice Calls `register_user` in the backend and logs the result.
 *
 * @dev Steps:
 *      1. Calls `register_user`.
 *      2. Decodes and processes response.
 *      3. Logs success or failure.
 *
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * @param user_principal User principal.
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
 * @title Faucet Functionality Test
 * @description Tests the `faucet` method with various asset and amount combinations to ensure proper token distribution, validation, and error handling.
 *
 * @details
 * - Covers valid and invalid asset requests, including:
 *   - Proper asset names with acceptable amounts.
 *   - Invalid asset identifiers.
 *   - Zero amount requests.
 *   - Requests exceeding the faucet’s distribution limits.
 * - Verifies correct behavior by decoding the response and matching it with expected results.
 * - Logs clear output for each test case to highlight pass/fail status and error message validation.
 *
 * @steps
 * 1. Define multiple test cases with different asset names and amounts.
 * 2. For each case:
 *    - Call the faucet function with the provided parameters.
 *    - If successful, verify the returned balance.
 *    - If failed, ensure the error message matches the expected result.
 * 3. Repeat the same faucet call for 5 simulated users to test multi-user behavior.
 *
 * @params
 * - `pic`: The `PocketIc` instance simulating the IC environment.
 * - `backend_canister`: Principal ID of the canister being tested.
 *
 * @result
 * - Ensures proper validation of faucet logic across multiple edge and real-world scenarios.
 * - Useful for catching input validation bugs, incorrect limits, and broken transfer logic.
 *
 * @note Uses `ic_cdk::println!` for consistent logging across test cases.
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
            amount: Nat::from(5_000_000_00u128), // 50 ICP
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
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100_000u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50_000u128),
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
            expected_error_message: Some(
                "Requested amount exceeds the total faucet limit.".to_string(),
            ),
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
                            "✅ IC Test Case {} for user {} Passed: Faucet successful.",
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
                                "✅ IC Test Case {} for user {} Passed: Faucet successful.",
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
            amount: Nat::from(500_000_000u128), // 5 ICP (includes transaction fee)
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40_000u128), // 0.4 ckBTC (includes transaction fee)
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(200_000_000u128), // 200 ckUSDC (includes transaction fee)
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
            amount: Nat::from(500_000_000u128), // 500 ckUSDT (includes transaction fee)
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
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply successful.",
                            i + 1,
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

/*
 * @title IC Borrow Functionality Test
 * @description This function tests the `execute_borrow` method of the backend canister by simulating both valid and invalid borrow scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets and borrow amounts.
 * - Simulates borrow requests and validates the results against expected outcomes.
 * - Tests include successful borrow attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as empty asset names, unknown assets, zero/huge borrow amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare borrow parameters with asset and amount.
 *    b. Call the `execute_borrow` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that a balance is returned.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid borrow requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining borrow logic.
 *
 * @note
 * Uses `ic_cdk::println!` for verbose logging during test execution.
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
            amount: Nat::from(200_000_000u128), // 2 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(10_000u128), // 0.0001 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(5_000_000u128), // 50 USDT
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
            asset: "ckUSDC".to_string(),
            amount: Nat::from(5_000_000u128), // 50 USDC
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid Cases
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
            amount: Nat::from(100_000_000_000_000_000u128),
            expect_success: false,
            expected_error_message: Some(
                "Platform is unable to pay right now! Try Again Later".to_string(),
            ),
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
                            "✅ IC Test Case {} Passed: Borrow successful.",
                            i + 1,
                    
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
 * @title IC Withdraw Functionality Test
 * @description This function tests the `execute_withdraw` method of the backend canister by simulating both valid and invalid withdraw scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets, withdrawal amounts, and conditions (e.g., collateral).
 * - Simulates withdrawal requests and validates the results against expected outcomes.
 * - Tests include successful withdrawal attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as large amounts exceeding balance, empty asset names, unknown assets, zero/huge withdrawal amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare withdrawal parameters with asset, amount, and additional info (e.g., collateral).
 *    b. Call the `execute_withdraw` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that a balance is returned.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid withdraw requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining withdraw logic.
 *
 * @note
 * Uses `ic_cdk::println!` for verbose logging during test execution.
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
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2.00 ICP
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128), // 1.00 ICP (with collateral)
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(30_000u128), // 0.03 ckBTC
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(2_000u128), // 2.00 ckETH
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10_000u128), // 10,000 ckUSDT
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(200_000u128), // 200,000 ckUSDC
            on_behalf_of: None,
            is_collateral: false,
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
                            "✅ IC Test Case {} Passed: Withdraw successful.",
                            i + 1,
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
 * @title IC Repay Functionality Test
 * @description This function tests the `execute_repay` method of the backend canister by simulating both valid and invalid repay scenarios.
 *
 * @details
 * - Defines a list of test cases with various assets and repay amounts.
 * - Simulates repay requests and validates the results against expected outcomes.
 * - Tests include successful repay attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as empty asset names, unknown assets, zero/huge repay amounts, and long asset strings are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare repay parameters with asset and amount.
 *    b. Call the `execute_repay` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that a balance is returned.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid repay requests.
 * - Confirms appropriate error handling for various invalid scenarios.
 * - Provides detailed feedback to developers for debugging and refining repay logic.
 *
 * @note
 * Uses `ic_cdk::println!` for verbose logging during test execution.
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
            amount: Nat::from(200_000_000u128), // 2.00 ICP (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(10_000u128), // 0.0001 ckBTC (includes transaction fee)
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
            asset: "ckUSDC".to_string(),
            amount: Nat::from(5_000_000u128), // 500 USDC (includes transaction fee)
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(5_000_000u128), // 500 USDT (includes transaction fee)
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
            amount: Nat::from(50_000_000u128),
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
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: Nat::from(1_000_000_000u128),
        //     on_behalf_of: None,
        //     expect_success: false,
        //     expected_error_message: Some("Repay cannot be more than debt".to_string()),
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
                            "✅ IC Test Case {} Passed: Repay successful.",
                            i + 1,
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
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}

/*
 * @title IC Liquidation Functionality Test
 * @description This function tests the `execute_liquidation` method of the backend canister by simulating both valid and invalid liquidation scenarios.
 *
 * @details
 * - Defines a list of test cases with various debt and collateral assets and liquidation amounts.
 * - Simulates liquidation requests and validates the results against expected outcomes.
 * - Tests include successful liquidation attempts as well as failures due to input validation and business logic constraints.
 * - Ensures edge cases such as low collateral, invalid assets, anonymous principals, and zero amounts are handled correctly.
 * - Logs each test case with detailed information about the scenario and the test result.
 *
 * @steps
 * 1. Define a vector of test cases including expected outcomes.
 * 2. For each test case:
 *    a. Prepare liquidation parameters with debt and collateral asset, amount, and reward.
 *    b. Call the `execute_liquidation` method on the backend canister.
 *    c. Decode and analyze the response:
 *       - If success is expected, assert that liquidation completes without error.
 *       - If failure is expected, validate that the error message matches the expected message.
 *    d. Log success or failure based on test expectations.
 *
 * @params
 * - `pic`: An instance of PocketIc used to simulate the Internet Computer.
 * - `backend_canister`: The principal of the backend canister under test.
 *
 * @result
 * - Verifies that the backend correctly processes valid liquidation requests.
 * - Confirms appropriate error handling for various invalid scenarios, including collateral checks and asset validation.
 * - Provides detailed feedback to developers for debugging and refining liquidation logic.
 *
 * @note
 * Uses `ic_cdk::println!` for verbose logging during test execution.
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
            amount: Nat::from(40_000_000u128), // 0.40 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_357_486u128), // Reward: 0.40357486 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210_000u128), // 0.0021 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220_496u128), // Reward: 0.00220496 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(20_000_000_000u128), // 2000 USDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(20_999_673_926u128), // Reward: 2099.9673926 USDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 125 USDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_175_527u128), // Reward: 130.62175527 USDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), // 0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(0u128), // Reward: 0.00000000 ckETH
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128), // 0.06 ckETH (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128), // Reward: 0.0525 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        // // Health factor is falling below 1
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(5_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128),
            expect_success: false,
            expected_error_message: Some("Reward is higher than expected".to_string()),
        },
        // //  Invalid asset
        TestCase {
            debt_asset: "XYZ".to_string(),
            collateral_asset: "XYZ".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(40_400_000u128),
            expect_success: false,
            expected_error_message: Some("No principal found for asset".to_string()),
        },
        // // Anonymous principals are not allowed
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(10u128),
            expect_success: false,
            expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        },
        // // Zero amount
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(150u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
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
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
