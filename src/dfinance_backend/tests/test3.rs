use candid::types::principal;
use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
// use dfinance_backend::declarations::assets::ReserveData;
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: f64,
    pub supply_rate_apr: Option<f64>,
    pub total_supply: f64,
    pub total_borrowed: f64,
    pub liquidity_index: f64,
    pub current_liquidity_rate: f64,
    pub debt_index: f64,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: u16,
    pub liquidation_threshold: u16,
    pub liquidation_bonus: u16,
    pub borrowing_enabled: bool,
    pub borrow_cap: u64,
    pub supply_cap: u64,
    pub liquidation_protocol_fee: u16,
    pub active: bool,
    pub frozen: bool,
    pub paused: bool,
    pub reserve_factor: u16,
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

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 5_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(backend_canister, wasm, vec![], None);

    println!("Backend canister: {}", backend_canister);

    //=================Reserve Initialize ==================

    let _ = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve",
        encode_one(()).unwrap(),
    );

    let _ = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "faucet",
        encode_args(("ckBTC", 100000u64)).unwrap(),
    );

    (pic, backend_canister)
}

#[test]
fn test_deposit() {
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
