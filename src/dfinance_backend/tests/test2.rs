use candid::{decode_args, decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;

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
        encode_args(("ckBTC", 10000u64)).unwrap(),
    );

    (pic, backend_canister)
}

#[test]
fn test_deposit() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid deposit case
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1000,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some(
                "Error retrieving asset principal: No principal found for asset: nonexistent_asset"
                    .to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 100_000, // Large amount
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000_000, // Valid amount but insufficient balance
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some(
                "Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\""
                    .to_string(),
            ), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    // let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
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

        // call get_asset_principal (case.asset) -> store in asset_canister variable

        //backend function calling method-> // for reference ->// let _ = pic.update_call(
        //     backend_canister,
        //     Principal::anonymous(),
        //     "initialize_reserve",
        //     encode_one(()).unwrap(),
        // );

        // call get_reserve_data (case.asset) -> store in  reserve_data variable

        let result = pic.query_call(
            backend_canister,
            Principal::anonymous(),
            "get_asset_principal",
            encode_one(case.asset.clone()).unwrap(),
        );

        // Handle the result and store the Ok value in asset_canister
        let asset_canister = match result {
            Ok(WasmResult::Reply(response_data)) => {
                match decode_one::<Result<Principal, String>>(&response_data) {
                    Ok(Ok(principal)) => {
                        // Successfully retrieved the principal
                        Some(principal)
                    }
                    Ok(Err(err)) => {
                        // Handle the error returned by get_asset_principal
                        println!("Error retrieving asset principal: {}", err);
                        None
                    }
                    Err(decode_err) => {
                        // Handle the error while decoding the response
                        println!("Error decoding the response: {}", decode_err);
                        None
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                // Handle the rejection message from the WasmResult
                println!("Query call rejected: {}", reject_message);
                None
            }
            Err(call_err) => {
                // Handle the error from the query call itself
                println!("Query call failed: {}", call_err);
                None
            }
        };
        let asset_principal = asset_canister.unwrap();

        let reserve_data = pic.query_call(
            backend_canister,
            Principal::anonymous(),
            "get_reserve_data",
            encode_one(case.asset.clone()).unwrap(),
        );

        // Approve before deposit
        let approve_args = ApproveArgs {
            fee: None,
            memo: None,
            from_subaccount: None,
            created_at_time: None,
            amount: Nat::from(10_000_000u64), //alternative
            expected_allowance: None,
            expires_at: None,
            spender: Account {
                owner: backend_canister,
                subaccount: None,
            },
        };

        let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");

        // Call the `approve` method on `ckbtc_canister`
        let approve_result = pic.update_call(
            asset_principal, //asset_canister variable
            Principal::anonymous(),
            "icrc2_approve",
            args_encoded,
        );

        // Handle the result of the approve call
        match approve_result {
            Ok(WasmResult::Reply(reply)) => {
                let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
                match approve_response {
                    Ok(ApproveResult::Ok(block_index)) => {
                        println!("Approve succeeded, block index: {}", block_index);
                    }
                    Ok(ApproveResult::Err(error)) => {
                        println!("Approve failed with error: {:?}", error);
                        continue;
                    }
                    Err(e) => {
                        println!("Failed to decode ApproveResult: {:?}", e);
                        continue;
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                println!("Approve call rejected: {}", reject_message);
                continue;
            }
            Err(e) => {
                println!("Error during approve call: {:?}", e);
                continue;
            }
        }

        // Now call the deposit function
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "supply", //change
            encode_args((case.asset.clone(), case.amount, case.is_collateral)).unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
                let deposit_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode deposit response");

                match deposit_response {
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

        // if case.expect_success {
        //     let user_principal = Principal::anonymous();
        //     // let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
        //     // let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

        //     // let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);

        //     // println!("User balance after deposit: {}", user_balance_after);
        //     // println!("Backend balance after deposit: {}", backend_balance_after);
        //     // println!("User Dtoken balance after deposit: {}", user_dtoken_balance_after);

        //     // assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after deposit");
        //     // assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after deposit");
        // }
        println!();
        println!("****************************************************************************");
        println!();
    }
}

//===============Borrow ==============
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
                "Reserve not found for asset: nonexistent_asset".to_string(),
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

        // if case.expect_success {
        //     let user_principal = Principal::anonymous();
        //     let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
        //     let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

        //    // let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);
        //     let user_debttoken_balance_after = check_balance(&pic, debttoken_canister, user_principal);

        //     println!("User balance after deposit: {}", user_balance_after);
        //     println!("Backend balance after deposit: {}", backend_balance_after);
        //    // println!("User Dtoken balance after deposit: {}", user_dtoken_balance_after);
        //     println!("User Debttoken balance after deposit: {}", user_debttoken_balance_after);

        //     assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after deposit");
        //     assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after deposit");
        // }
        println!();
        println!("****************************************************************************");
        println!();
    }
}

//===============Withdraw ==============
#[test]
fn test_withdraw() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u128,
        on_behalf_of: Option<String>,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid deposit case
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1000,
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some(
                "Reserve not found for asset: nonexistent_asset".to_string(),
            ),
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 7_000, // Large amount
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_00_000, // Valid amount but insufficient balance
        //     on_behalf_of: None,
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("InsufficientFunds { balance: Nat(2000) }".to_string()), // change it later on
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
    ];

    let (pic, backend_canister) = setup();
    // transfer_dtoken_to_anonymous(&pic, backend_canister, backend_canister);
    println!();
    println!("****************************************************************************");
    println!();
    for (i, case) in test_cases.iter().enumerate() {
        // Print the case number
        println!("Running test case no: {}", i + 1);
        println!();
        println!("Test case details: {:?}", case);
        println!();

        // Now call the deposit function
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "withdraw",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.on_behalf_of.clone(),
                case.is_collateral,
            ))
            .unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
                let withdraw_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode withdraw response");

                match withdraw_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("withdraw succeeded for case: {:?}", i + 1);
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
                    println!("withdraw rejected as expected: {}", reject_message);
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

        // if case.expect_success {
        //     let user_principal = Principal::anonymous();
        //     let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
        //     let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

        //     let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);

        //     println!("User balance after withdraw: {}", user_balance_after);
        //     println!("Backend balance after withdraw: {}", backend_balance_after);
        //     println!("User Dtoken balance after withdraw: {}", user_dtoken_balance_after);

        //     assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after withdraw");
        //     assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after withdraw"); //
        // }
        println!();
        println!("****************************************************************************");
        println!();
    }
}

// ================ Repay =============

#[test]
fn test_repay() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u128,
        on_behalf_of: Option<String>,

        expect_success: bool,
        expected_error_message: Option<String>,
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
    }

    let test_cases = vec![
        // Valid deposit case
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1000,
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some(
                "Reserve not found for asset: nonexistent_asset".to_string(),
            ),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 7_000, // Large amount
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 70_000, // Valid amount but insufficient balance
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("InsufficientFunds { balance: Nat(32000) }".to_string()), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    let (pic, backend_canister) = setup();
    let platform_principal = backend_canister; // Example

    // Call the transfer function to transfer dtoken to an anonymous user
    // transfer_debttoken_to_anonymous(&pic, debttoken_canister, backend_canister);
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
        // Approve before deposit
        let approve_args = ApproveArgs {
            fee: None,
            memo: None,
            from_subaccount: None,
            created_at_time: None,
            amount: Nat::from(10_000_000u64), //alternative
            expected_allowance: None,
            expires_at: None,
            spender: Account {
                owner: backend_canister,
                subaccount: None,
            },
        };

        let result = pic.query_call(
            platform_principal,
            Principal::anonymous(),
            "get_asset_principal",
            encode_one(case.asset.clone()).unwrap(),
        );

        // Handle the result and store the Ok value in asset_canister
        let asset_canister = match result {
            Ok(WasmResult::Reply(response_data)) => {
                match decode_one::<Result<Principal, String>>(&response_data) {
                    Ok(Ok(principal)) => {
                        // Successfully retrieved the principal
                        Some(principal)
                    }
                    Ok(Err(err)) => {
                        // Handle the error returned by get_asset_principal
                        println!("Error retrieving asset principal: {}", err);
                        None
                    }
                    Err(decode_err) => {
                        // Handle the error while decoding the response
                        println!("Error decoding the response: {}", decode_err);
                        None
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                // Handle the rejection message from the WasmResult
                println!("Query call rejected: {}", reject_message);
                None
            }
            Err(call_err) => {
                // Handle the error from the query call itself
                println!("Query call failed: {}", call_err);
                None
            }
        };

        let asset_principal = asset_canister.unwrap();

        let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");

        // Call the `approve` method on `ckbtc_canister`
        let approve_result = pic.update_call(
            asset_principal,
            Principal::anonymous(),
            "icrc2_approve",
            args_encoded,
        );

        // Handle the result of the approve call
        match approve_result {
            Ok(WasmResult::Reply(reply)) => {
                let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
                match approve_response {
                    Ok(ApproveResult::Ok(block_index)) => {
                        println!("Approve succeeded, block index: {}", block_index);
                    }
                    Ok(ApproveResult::Err(error)) => {
                        println!("Approve failed with error: {:?}", error);
                        continue;
                    }
                    Err(e) => {
                        println!("Failed to decode ApproveResult: {:?}", e);
                        continue;
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                println!("Approve call rejected: {}", reject_message);
                continue;
            }
            Err(e) => {
                println!("Error during approve call: {:?}", e);
                continue;
            }
        }

        // Now call the deposit function
        let result = pic.update_call(
            backend_canister,
            Principal::anonymous(),
            "repay",
            encode_args((case.asset.clone(), case.amount, case.on_behalf_of.clone())).unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
                let repay_response: Result<(), String> =
                    candid::decode_one(&response).expect("Failed to decode repay response");

                match repay_response {
                    Ok(()) => {
                        if case.expect_success {
                            println!("repay succeeded for case: {:?}", case);
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
                            println!("repay failed as expected with error: {:?}", e);
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
                    println!("repay rejected as expected: {}", reject_message);
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

        // if case.expect_success {
        //     let user_principal = Principal::anonymous();
        //     let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
        //     let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

        //     let user_debttoken_balance_after = check_balance(&pic, debttoken_canister, user_principal);

        //     println!("User balance after repay: {}", user_balance_after);
        //     println!("Backend balance after repay: {}", backend_balance_after);
        //     println!("User Dtoken balance after repay: {}", user_debttoken_balance_after);

        //     assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after repay");
        //     assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after repay");
        // }
        println!();
        println!("****************************************************************************");
        println!();
    }
}
