use candid::{decode_one, encode_args, encode_one, Principal};
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
    let (pic, backend_canister, random_users) = setup();
    test_register_user(&pic, backend_canister, random_users.clone());
    test_faucet(&pic, backend_canister, random_users.clone());
    test_supply(&pic, backend_canister, random_users.clone());
    test_borrow(&pic, backend_canister, random_users.clone());
    test_repay(&pic, backend_canister, random_users.clone());
    test_withdraw(&pic, backend_canister, random_users.clone());
    test_liquidation(&pic, backend_canister, random_users.clone());
}

fn setup() -> (PocketIc, Principal, Vec<Principal>) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();
    let random_users = generate_principals(10);

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
 * @dev Adds the primary user as well as additional test users (1 to 5) to the system to simulate various liquidation scenarios. 
 *      This ensures that the system properly handles edge cases with multiple participants.
 * @test Steps:
 * 1. Registers the primary user and additional test users to simulate real-world liquidation scenarios.
 * 2. Ensures that the liquidation system correctly accommodates multiple user interactions.
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
* @title Register Users
* @notice Registers users to participate in liquidation testing scenarios.
* @dev Registers the primary user as well as the test users for simulated liquidation events. 
*      This allows the testing of how the system behaves with multiple participants, ensuring its scalability and functionality under load.
* @test Steps:
* 1. Registers all users (primary + test users) to the backend canister.
* 2. Verifies that the system can handle multiple registered users and simulate their interaction within liquidation scenarios.
*/
    test_register_user(&pic, backend_canister, get_users_principals_vector());

/*
 * @title Update Reserve Price
 * @notice Calls `update_reserve_price_test` to update the reserve price cache.
 * @dev Simulates the process of updating reserve price data and ensures that the cache is refreshed correctly. 
 *      The test confirms that the system reacts appropriately when the reserve prices are updated, and the system state is consistent after the operation.
 * @test Steps:
 * 1. Calls the `update_reserve_price_test` function on the backend canister.
 * 2. Decodes the response and verifies that the reserve price update is successful.
 * 3. Ensures that the system correctly handles any potential failures and provides informative error messages.
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

    (pic, backend_canister, random_users)
}

/*
 * @title Register Users
 * @notice Registers users to participate in liquidation testing.
 * @dev This function registers both the primary user and test users (1 to 5) to simulate liquidation events. 
 *      It interacts with the backend canister's `register_user` function, ensuring that user registration works as expected and no errors occur during the process.
 *      The system should correctly handle user registrations, and this test verifies that.
 * @test Steps:
 * 1. Iterates over the provided list of user principals (including test users and the primary user).
 * 2. For each user, it sends a registration call to the backend canister.
 * 3. The response is checked to ensure the registration succeeds without errors.
 * 4. If an error occurs (such as a failed registration), the test will panic and report the failure.
 */
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

/*
 * @title Faucet Stress Test
 * @notice This function performs a stress test for the faucet functionality by simulating multiple faucet requests.
 * @dev It sends faucet requests to multiple users for different asset types and amounts, and checks if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the faucet logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts.
 * 2. Sends a faucet request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the faucet function resides.
 * @param random_users List of user principals for whom the faucet request will be tested.
 */
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
            amount: Nat::from(500_000_000u128), // 5 ICP
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
            amount: Nat::from(14_000_000u128), // 0.14 ckETH
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
                        Ok(_) => {
                            ic_cdk::println!(
                                "✅ User {}: Faucet successful.",
                                user_principal.to_text(),
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
                        Ok(_) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet successful.",
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

/*
 * @title Borrow Stress Test
 * @notice This function performs a stress test for the borrow functionality by simulating multiple borrow requests.
 * @dev It sends borrow requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the borrow logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be borrowed.
 * 2. Sends a borrow request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the borrow function resides.
 * @param random_users List of user principals for whom the borrow request will be tested.
 */
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
            amount: Nat::from(100_000_000u128), // 1 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4_000u128), // 0.004 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(400_000u128), // 4 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000u128), // 30 USDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(500u128), // 0.000005 ETH
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
                *user_principal,
                "execute_borrow",
                encode_one(borrow_params).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let borrow_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode IC borrow response");

                    match borrow_response {
                        Ok(_) if case.expect_success => {
                            ic_cdk::println!(
                                "✅ User {}: Borrow successful.",
                                user_principal.to_text(),
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

/*
 * @title Withdraw Stress Test
 * @notice This function performs a stress test for the withdraw functionality by simulating multiple withdraw requests.
 * @dev It sends withdraw requests to multiple users for different asset types and amounts, checking if the requests succeed or fail.
 *      The test runs multiple scenarios, verifying that the withdraw logic behaves correctly for each user and asset.
 *      It logs the results, including both successful and failed transactions, and produces a detailed summary.
 *
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with assets and amounts to be withdrawn.
 * 2. Sends a withdraw request for each user principal for each test case.
 * 3. Verifies the response, expecting either success or failure based on predefined expectations.
 * 4. Logs detailed results for each test case and summarizes the success/failure counts at the end of each iteration.
 * 5. Handles errors such as function rejection, approval rejection, or response decoding issues gracefully, with informative logs.
 * 6. Ensures the expected error message is returned when a failure is anticipated, and checks for error message consistency.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the withdraw function resides.
 * @param random_users List of user principals for whom the withdraw request will be tested.
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
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(200_000_000u128), // 2 ICP
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(4u128), // 0.00004 ckBTC
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(400u128), // 0.004 ckBTC
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(10_000_000u128), // 100 ckUSDC
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(3u128), // 0.03 ckUSDT
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5u128), // 0.00005 ckETH
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
            // ic_cdk::println!(
            //     "\n======================== Initial Reserve Data   ========================\n"
            // );

            // fetch_reserve_data(pic, backend_canister, &case.asset);

            // ic_cdk::println!(
            //     "\n======================== Initial User Data  ========================\n"
            // );

            // fetch_user_data(pic, backend_canister, &user_principal, &case.asset);

            /* Withdraw params */
            let withdraw_params = ExecuteWithdrawParams {
                asset: case.asset.clone(),
                amount: case.amount.clone(),
                on_behalf_of: case.on_behalf_of,
                is_collateral: case.is_collateral,
            };

            /*
             * @title Execute Withdraw
             * @notice Executes the withdraw operation and validates outcomes.
             * @dev Calls the backend function, checks responses, and verifies success or failure.
             */
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
                        Ok(_) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                failure_count += 1;
                            } else {
                                ic_cdk::println!(
                                    "✅ User {}: Withdraw successful.",
                                    user_principal.to_text(),
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
        "\n======================== ✅ IC Withdraw Tests Completed ========================\n"
    );
}

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
                on_behalf_of: case.on_behalf_of.clone(),
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
                        Ok(balance) => {
                            ic_cdk::println!("✅ Repay successful! : {}", balance);
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

/*
 * @title Liquidation Stress Test
 * @notice This function tests the liquidation functionality by simulating liquidation requests for different debt and collateral assets.
 * @dev It runs multiple test cases with varying amounts of debt, collateral, and rewards, checking if the liquidation logic behaves correctly.
 *      The function validates the approval of ICRC2 transfers, the execution of liquidation requests, and the expected results.
 *      It logs detailed information, including the success or failure of each test case and any mismatches in expected error messages.
 *      After each test case, the function outputs the success/failure status and any related error messages, ensuring accurate reporting.
 * 
 * @test Steps:
 * 1. Iterates through a set of predefined test cases with debt and collateral assets and amounts.
 * 2. Validates the approval of ICRC2 transfers before proceeding with liquidation.
 * 3. Sends liquidation requests for each test case, checking if the function completes successfully or fails as expected.
 * 4. If the request fails, ensures the expected error message matches the actual error.
 * 5. Logs detailed results for each test case, including success/failure information and any error message mismatches.
 * 6. Ensures the correct behavior when liquidation is expected to fail, confirming rejection messages are consistent.
 *
 * @param pic PocketIc instance to interact with the Internet Computer.
 * @param backend_canister Backend canister principal where the liquidation function resides.
 * @param random_users List of user principals for whom the liquidation request will be tested.
 */

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
            amount: Nat::from(40_000_000u128), // 0.4 ICP (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40_357_486u128), // 0.40357486 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(420_000u128), // 2.1 ckBTC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(440_996u128), // 2.20496 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(40_000_000_000u128), // 200,000 ckUSDC (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(41999673926u128), // 209,996.73926 ckUSDC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12_500_000_000u128), // 12,500 ckUSDT (includes transaction fee)
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13_062_175_527u128), // 13,062.175527 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        // // Invalid burn amount : with 0 reward
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Invalid burn amount".to_string()),
        },
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5_250_000u128),
            expect_success: true,
            expected_error_message: None,
        },
    ];

    // let user_principal = get_user_principal();
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

        for _ in random_users.clone() {
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
                Ok(WasmResult::Reject(reject_message)) => {
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
