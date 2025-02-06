use candid::types::principal;
use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use ic_cdk::caller;
// use dfinance_backend::declarations::assets::ReserveData;
use pocket_ic::{CanisterSettings, PocketIc, WasmResult};
use serde::Serialize;
use std::error::Error;
use std::fs;
use std::ptr::null;
mod error;
use error as errors;

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: Nat,
    pub current_liquidity_rate: Nat,
    pub asset_supply: Nat,
    pub asset_borrow: Nat,
    pub liquidity_index: Nat,
    pub debt_index: Nat,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
    pub accure_to_platform: Nat,
}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub liquidation_bonus: Nat,
    pub borrowing_enabled: bool,
    pub borrow_cap: Nat, //TODO set it according to borrow
    pub supply_cap: Nat, //set it according to supply
    pub liquidation_protocol_fee: Nat,
    pub active: bool,
    pub frozen: bool,
    pub paused: bool,
    pub reserve_factor: Nat,
}
#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: TransferAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    InsufficientAllowance { allowance: Nat },
    BadBurn { min_burn_amount: Nat },
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    CreatedInFuture { ledger_time: u64 },
    TooOld,
    InsufficientFunds { balance: Nat },
}

#[derive(CandidType)]
pub enum LedgerArgument {
    Init(InitArgs),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct ArchiveOptions {
    num_blocks_to_archive: u64,
    max_transactions_per_response: Option<u64>,
    trigger_threshold: u64,
    more_controller_ids: Option<Vec<Principal>>,
    max_message_size_bytes: Option<u64>,
    cycles_for_archive_creation: Option<u64>,
    node_max_memory_size_bytes: Option<u64>,
    controller_id: Principal,
}

#[derive(CandidType, Deserialize, Serialize)]
struct FeatureFlags {
    icrc2: bool,
}

#[derive(CandidType, Deserialize, Serialize)]
struct InitArgs {
    token_symbol: String,
    token_name: String,
    transfer_fee: Nat,
    metadata: Vec<(String, String)>,
    minting_account: Account,
    initial_balances: Vec<(Account, Nat)>,
    archive_options: ArchiveOptions,
    feature_flags: Option<FeatureFlags>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct ApproveArgs {
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    from_subaccount: Option<Vec<u8>>,
    created_at_time: Option<u64>,
    amount: Nat,
    expected_allowance: Option<Nat>,
    expires_at: Option<u64>,
    spender: Account,
}

#[derive(CandidType, Deserialize, Serialize, Debug)]
enum ApproveError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    AllowanceChanged { current_allowance: Nat },
    CreatedInFuture { ledger_time: Nat },
    TooOld,
    Expired { ledger_time: Nat },
    InsufficientFunds { balance: Nat },
}

#[derive(CandidType, Deserialize, Serialize)]
enum ApproveResult {
    Ok(Nat),
    Err(ApproveError),
}

// #[derive(CandidType, Serialize, Deserialize)]
// struct Asset {
//     symbol: String,
// }

// #[derive(CandidType, Serialize, Deserialize)]
// struct GetExchangeRateRequest {
//     base_asset: Asset,
//     quote_asset: Asset,
//     timestamp: Option<u64>,
// }

// #[derive(CandidType, Deserialize)]
// struct GetExchangeRateResult {
//     rate: f64, // Assuming XRC returns a floating point exchange rate
// }

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";
const XRC_WASM: &str = "../../target/wasm32-unknown-unknown/release/xrc.wasm";

fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    let user_principal =
        Principal::from_text("3rott-asn2i-gpewt-g3av6-sg2w4-z5q4f-ex4gs-ybgbn-2blcx-b46lg-5ae")
            .unwrap();

    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 5_000_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    ic_cdk::println!("Backend canister: {}", backend_canister);
    pic.install_canister(
        backend_canister,
        wasm,
        candid::encode_one(Principal::anonymous()).unwrap(),
        Some(Principal::anonymous()),
    );

    let xrc_canister = pic.create_canister();
    pic.add_cycles(xrc_canister, 5_000_000_000_000_000); // 2T Cycles
    let wasm = fs::read(XRC_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(xrc_canister, wasm, vec![], None);

    ic_cdk::println!("xrc canister: {}", xrc_canister);
    ic_cdk::println!("backend cycles = {}", pic.cycle_balance(backend_canister));
    ic_cdk::println!("cycles = {}", pic.cycle_balance(xrc_canister));

    let _ = pocket_ic::PocketIc::set_controllers(
        &pic,
        backend_canister,
        Some(Principal::anonymous()),
        vec![user_principal],
    );
    ic_cdk::println!("Backend canister: {}", backend_canister);

    // 🔹 Define test input (token name + reserve data)
    let token_name = "ICP".to_string();
    let reserve_data = ReserveData {
        asset_name: Some(token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(45u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(58u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(63u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(1u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(15u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    //================= Initialize ==================
    // 🔹 Call the `initialize` function

    ic_cdk::println!("things are working:");
    // 🔹 Call the `initialize` function
    let result = pic.update_call(
        backend_canister,
        user_principal,
        "initialize",
        encode_args((&token_name, &reserve_data)).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode initialize response");

            match initialize_response {
                Ok(()) => {
                    ic_cdk::println!("✅ Initialize function succeeded for test case");
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

    // let args = GetExchangeRateRequest {
    //     base_asset: Asset {
    //         symbol: "ICP".to_string(),
    //     },
    //     quote_asset: Asset {
    //         symbol: "USD".to_string(),
    //     },
    //     timestamp: None, // Use Some(timestamp) if you want a historical rate
    // };

    // let res: Result<(GetExchangeRateResult,), (ic_cdk::api::call::RejectionCode, String)> =
    //     pic.update_call(
    //         xrc_canister,
    //         "get_exchange_rate",
    //         (args,),
    //     );

    // match res {
    //     Ok((rate_result,)) => {
    //         println!("Exchange rate: {:?}", rate_result.rate);
    //     }
    //     Err((code, msg)) => {
    //         println!("Error: {:?}, {}", code, msg);
    //     }
    // }

    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "update_reserves_price",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<String, errors::Error> = candid::decode_one(&response)
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
    (pic, backend_canister)
}

#[test]
fn test_faucet() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        // simulate_insufficient_balance: bool,
        // simulate_faucet_failure: bool,
    }

    let test_cases = vec![
        // Valid faucet request
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000u128),
            expect_success: true,
            expected_error_message: None,
            // simulate_insufficient_balance: false,
            // simulate_faucet_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: Nat::from(50000u128),
            expect_success: false,
            expected_error_message: Some("Asset not found: nonexistent_asset".to_string()),
            // simulate_insufficient_balance: false,
            // simulate_faucet_failure: false,
        },
        // Minimum valid amount
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: 1, // Minimum valid amount
        //     expect_success: true,
        //     expected_error_message: None,
        //     simulate_insufficient_balance: false,
        //     simulate_faucet_failure: false,
        // },
        // Large amount request
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: 1_000_000, // Large amount
        //     expect_success: true,
        //     expected_error_message: None,
        //     simulate_insufficient_balance: false,
        //     simulate_faucet_failure: false,
        // },
        // Insufficient balance case
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: 10_000_000, // Valid amount but insufficient balance
        //     expect_success: false,
        //     expected_error_message: Some("Insufficient balance in faucet".to_string()),
        //     simulate_insufficient_balance: true,
        //     simulate_faucet_failure: false,
        // },
        // Faucet failure (simulate failure during transfer)
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: 100000,
        //     user: Principal::anonymous().to_string(),
        //     expect_success: false,
        //     expected_error_message: Some("Faucet transfer failed".to_string()),
        //     simulate_insufficient_balance: false,
        //     simulate_faucet_failure: true,
        // },
    ];

    let (pic, backend_canister) = setup();
    let user_principal =
        Principal::from_text("3rott-asn2i-gpewt-g3av6-sg2w4-z5q4f-ex4gs-ybgbn-2blcx-b46lg-5ae")
            .unwrap();

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("Running test case no: {}", i + 1);
        ic_cdk::println!("Test case details: {:?}", case);

        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );
        // ic_cdk::println!("Faucet request result: {:?}", errors::Error::);

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Result<Nat, errors::Error>, _> =
                    candid::decode_one(&reply);

                match decoded_response {
                    Ok(Ok(balance)) => {
                        ic_cdk::println!("Faucet succeeded. New balance: {}", balance);
                    }
                    Ok(Err(error)) => {
                        ic_cdk::println!("Faucet failed with error: {:?}", error);
                    }
                    Err(decode_err) => {
                        ic_cdk::println!("Failed to decode faucet response: {:?}", decode_err);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    ic_cdk::println!("Faucet rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during faucet function call: {:?}", e);
            }
        }

        println!("****************************************************************************");
    }
}

#[test]
fn test_supply() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        user: String,
        on_behalf_of: String,
        interest_rate: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid borrow case
        TestCase {
            asset: "ckBTC".to_string(), //
            amount: 1000,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user1".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user2".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some(
                "No canister ID found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user4".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     user: Principal::anonymous().to_string(),
        //     on_behalf_of: "user6".to_string(),
        //     interest_rate: Nat::from(0u64),
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();

    // for case in test_cases {
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();
        println!();
        // Now call the borrow function  ///
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "borrow",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.user.clone(),
                case.on_behalf_of.clone(),
                case.interest_rate.clone(),
            ))
            .unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let borrow_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode borrow response");

                match borrow_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("Deposit succeeded for case: {:?}", case);
                        } else {
                            panic!("Expected failure but got success for case: {:?}", case);
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.as_str()),
                                "Error message mismatch for case: {:?}",
                                case
                            );
                            println!("Deposit failed as expected with error: {:?}", e);
                        } else {
                            panic!("Expected success but got error: {:?}", e);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    println!("Deposit rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during deposit function call: {:?}", e);
            }
        }

        println!();
        println!("****************************************************************************");
        println!();
    }
}

#[test]
fn test_borrow() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        user: String,
        on_behalf_of: String,
        interest_rate: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid borrow case
        TestCase {
            asset: "ckBTC".to_string(), //
            amount: 1000,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user1".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user2".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some(
                "No canister ID found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user4".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     user: Principal::anonymous().to_string(),
        //     on_behalf_of: "user6".to_string(),
        //     interest_rate: Nat::from(0u64),
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();

    // for case in test_cases {
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();
        println!();
        // Now call the borrow function  ///
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "borrow",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.user.clone(),
                case.on_behalf_of.clone(),
                case.interest_rate.clone(),
            ))
            .unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let borrow_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode borrow response");

                match borrow_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("Borrow succeeded for case: {:?}", case);
                        } else {
                            panic!("Expected failure but got success for case: {:?}", case);
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.as_str()),
                                "Error message mismatch for case: {:?}",
                                case
                            );
                            println!("Borrow failed as expected with error: {:?}", e);
                        } else {
                            panic!("Expected success but got error: {:?}", e);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    println!("Borrow rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during borrow function call: {:?}", e);
            }
        }

        println!();
        println!("****************************************************************************");
        println!();
    }
}

#[test]
fn test_withdraw() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        user: String,
        on_behalf_of: String,
        interest_rate: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid borrow case
        TestCase {
            asset: "ckBTC".to_string(), //
            amount: 1000,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user1".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user2".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some(
                "No canister ID found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user4".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     user: Principal::anonymous().to_string(),
        //     on_behalf_of: "user6".to_string(),
        //     interest_rate: Nat::from(0u64),
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();

    // for case in test_cases {
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();
        println!();
        // Now call the borrow function  ///
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "borrow",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.user.clone(),
                case.on_behalf_of.clone(),
                case.interest_rate.clone(),
            ))
            .unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let borrow_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode withdraw response");

                match borrow_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("Withdraw succeeded for case: {:?}", case);
                        } else {
                            panic!("Expected failure but got success for case: {:?}", case);
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.as_str()),
                                "Error message mismatch for case: {:?}",
                                case
                            );
                            println!("Withdraw failed as expected with error: {:?}", e);
                        } else {
                            panic!("Expected success but got error: {:?}", e);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    println!("Withdraw rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during withdraw function call: {:?}", e);
            }
        }

        println!();
        println!("****************************************************************************");
        println!();
    }
}

#[test]
fn test_repay() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        user: String,
        on_behalf_of: String,
        interest_rate: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid borrow case
        TestCase {
            asset: "ckBTC".to_string(), //
            amount: 1000,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user1".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user2".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some(
                "No canister ID found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user4".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     user: Principal::anonymous().to_string(),
        //     on_behalf_of: "user6".to_string(),
        //     interest_rate: Nat::from(0u64),
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();

    // for case in test_cases {
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();
        println!();
        // Now call the borrow function  ///
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "borrow",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.user.clone(),
                case.on_behalf_of.clone(),
                case.interest_rate.clone(),
            ))
            .unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let borrow_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode repay response");

                match borrow_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("Repay succeeded for case: {:?}", case);
                        } else {
                            panic!("Expected failure but got success for case: {:?}", case);
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.as_str()),
                                "Error message mismatch for case: {:?}",
                                case
                            );
                            println!("Repay failed as expected with error: {:?}", e);
                        } else {
                            panic!("Expected success but got error: {:?}", e);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    println!("Repay rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during repay function call: {:?}", e);
            }
        }

        println!();
        println!("****************************************************************************");
        println!();
    }
}

#[test]
fn test_liquidation() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        user: String,
        on_behalf_of: String,
        interest_rate: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid borrow case
        TestCase {
            asset: "ckBTC".to_string(), //
            amount: 1000,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user1".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user2".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some(
                "No canister ID found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user4".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     user: Principal::anonymous().to_string(),
        //     on_behalf_of: "user6".to_string(),
        //     interest_rate: Nat::from(0u64),
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();

    // for case in test_cases {
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();
        println!();
        // Now call the borrow function  ///
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "borrow",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.user.clone(),
                case.on_behalf_of.clone(),
                case.interest_rate.clone(),
            ))
            .unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let borrow_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode borrow response");

                match borrow_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("Liquidation succeeded for case: {:?}", case);
                        } else {
                            panic!("Expected failure but got success for case: {:?}", case);
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            assert_eq!(
                                case.expected_error_message.as_deref(),
                                Some(e.as_str()),
                                "Error message mismatch for case: {:?}",
                                case
                            );
                            println!("Liquidation failed as expected with error: {:?}", e);
                        } else {
                            panic!("Expected success but got error: {:?}", e);
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    println!("Liquidation rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during Liquidation function call: {:?}", e);
            }
        }

        println!();
        println!("****************************************************************************");
        println!();
    }
}
