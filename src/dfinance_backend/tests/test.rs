use candid::{decode_args, decode_one, encode_args, encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use std::fs;
use candid::{CandidType, Deserialize, Nat};
use serde::Serialize;
use std::fs::OpenOptions;
use std::io::{Read, Write};



#[derive(CandidType)]
pub enum LedgerArgument {
    Init(InitArgs),
}

#[derive(CandidType, Deserialize, Serialize)]
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

const CKBTC_WASM: &str = "../../.dfx/local/canisters/ckbtc_ledger/ckbtc_ledger.wasm";
const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";
const DTOKEN_WASM: &str = "../../target/wasm32-unknown-unknown/release/dtoken.wasm";
const DEBTTOKEN_WASM: &str = "../../target/wasm32-unknown-unknown/release/debttoken.wasm";
const CKETH_WASM: &str = "../../.dfx/local/canisters/cketh_ledger/cketh_ledger.wasm";



fn setup() -> (PocketIc, Principal, Principal, Principal,Principal,Principal) {
    let pic = PocketIc::new();
    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 2_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(backend_canister, wasm, vec![], None);
    
    println!("Backend canister: {}", backend_canister);
    
    //====================== ckbtc canister ===============================
    let ckbtc_canister = pic.create_canister();
    pic.add_cycles(ckbtc_canister, 2_000_000_000_000); // 2T Cycles
    let ckbtc_wasm = fs::read(CKBTC_WASM).expect("Wasm file not found, run 'dfx build'.");
    
    let args = InitArgs {
        token_symbol: String::from("CKBTC"),
        token_name: String::from("CKBTC"),
        transfer_fee: Nat::from(1000u64),
        metadata: vec![], 
        minting_account: Account {
            owner: Principal::from_text("xcbu3-qzwyu-iv3oj-2izdz-c6z3o-cmrsw-j66xq-wdu6q-qrjem-2pjji-pae").unwrap(),
            subaccount: None,
        },
        initial_balances: vec![
            (Account {
                owner: Principal::anonymous(),
                subaccount: None,
            }, Nat::from(1_000_000u64)) 
        ],
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 1000,
            max_transactions_per_response: None,
            trigger_threshold: 500,
            more_controller_ids: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: Some(1_000_000),
            node_max_memory_size_bytes: None,
            controller_id: Principal::anonymous(),
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };
    
    let args_encoded = encode_args((LedgerArgument::Init(args),))
        .expect("Failed to encode arguments");

    
    pic.install_canister(ckbtc_canister, ckbtc_wasm, args_encoded, None);

    // ====================== ckETH canister ========================
    let cketh_canister = pic.create_canister();
    pic.add_cycles(cketh_canister, 2_000_000_000_000); // 2T Cycles
    let cketh_wasm = fs::read(CKETH_WASM).expect("Wasm file not found, run 'dfx build'.");
    
    let cketh_args = InitArgs {
        token_symbol: String::from("CKETH"),
        token_name: String::from("CKETH"),
        transfer_fee: Nat::from(1000u64),
        metadata: vec![], 
        minting_account: Account {
            owner: Principal::from_text("xcbu3-qzwyu-iv3oj-2izdz-c6z3o-cmrsw-j66xq-wdu6q-qrjem-2pjji-pae").unwrap(),
            subaccount: None,
        },
        initial_balances: vec![
            (Account {
                owner: Principal::anonymous(),
                subaccount: None,
            }, Nat::from(1_000_000u64)) 
        ],
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 1000,
            max_transactions_per_response: None,
            trigger_threshold: 500,
            more_controller_ids: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: Some(1_000_000),
            node_max_memory_size_bytes: None,
            controller_id: Principal::anonymous(),
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };
    
    let cketh_args_encoded = encode_args((LedgerArgument::Init(cketh_args),))
        .expect("Failed to encode arguments");

    
    pic.install_canister(cketh_canister, cketh_wasm, cketh_args_encoded, None); //replace done

    //=================Reserve Initialize ==================
    let _ = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve_list",
        encode_one(vec![
            ("ckBTC".to_string(), ckbtc_canister),
            ("ckETH".to_string(), cketh_canister)
        ]).unwrap(),
    );
    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve",
        encode_one(()).unwrap(),
    );

    println!("CKBTC canister: {}", ckbtc_canister);
    

    // ========= dtoken canister ===============
    let dtoken_canister = pic.create_canister();
    pic.add_cycles(dtoken_canister, 2_000_000_000_000); // 2T Cycles
    let d_wasm = fs::read(DTOKEN_WASM).expect("Wasm file not found, run 'dfx build'.");
    let d_args = InitArgs {
        token_symbol: String::from("dckBTC"),
        token_name: String::from("dckBTC"),
        transfer_fee: Nat::from(1000u64), 
        metadata: vec![], 
        minting_account: Account {
            
            owner: backend_canister,
            subaccount: None,
        },
        initial_balances: vec![], 
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 1000,
            max_transactions_per_response: None,
            trigger_threshold: 500,
            more_controller_ids: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: Some(1_000_000),
            node_max_memory_size_bytes: None,
            controller_id: backend_canister
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };

   
    let d_args_encoded = encode_args((LedgerArgument::Init(d_args),))
        .expect("Failed to encode arguments");

   
    pic.install_canister(dtoken_canister, d_wasm, d_args_encoded, None);
    
    // ========== Debt Token ============
   
    let debttoken_canister = pic.create_canister();
    pic.add_cycles(debttoken_canister, 2_000_000_000_000); // 2T Cycles
    let debt_wasm = fs::read(DEBTTOKEN_WASM).expect("Wasm file not found, run 'dfx build'.");
    let debt_args = InitArgs {
        token_symbol: String::from("dckBTC"),
        token_name: String::from("dckBTC"),
        transfer_fee: Nat::from(1000u64), 
        metadata: vec![], 
        minting_account: Account {
            
            owner: backend_canister,
            subaccount: None,
        },
        initial_balances: vec![], 
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 1000,
            max_transactions_per_response: None,
            trigger_threshold: 500,
            more_controller_ids: None,
            max_message_size_bytes: None,
            cycles_for_archive_creation: Some(1_000_000),
            node_max_memory_size_bytes: None,
            controller_id: backend_canister
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };

   
    let debt_args_encoded = encode_args((LedgerArgument::Init(debt_args),))
        .expect("Failed to encode arguments");

   
    pic.install_canister(debttoken_canister, debt_wasm, debt_args_encoded, None);
    


    (pic, backend_canister, ckbtc_canister,cketh_canister,dtoken_canister,debttoken_canister)
}


#[test]
fn test_approve() {
   
    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();

   
    let approve_args = ApproveArgs {
        fee: None,  
        memo: None, 
        from_subaccount: None,  
        created_at_time: None, 
        amount: Nat::from(1000u64), 
        expected_allowance: None,  
        expires_at: None,  
        spender: Account {
            owner: backend_canister, 
            subaccount: None,  
        },
    };

    
    let args_encoded = encode_one(approve_args).expect("Failed to encode arguments");

    
    let result = pic.update_call(
        ckbtc_canister,           
        Principal::anonymous(),   
        "icrc2_approve",          
        args_encoded,           
    );

   
    match result {
        Ok(WasmResult::Reply(reply)) => {
            
            let approve_result: Result<ApproveResult, _> = candid::decode_one(&reply);

            match approve_result {
                Ok(ApproveResult::Ok(block_index)) => {
                    println!("Approve succeeded, block index: {}", block_index);
                }
                Ok(ApproveResult::Err(error)) => {
                    match error {
                        ApproveError::GenericError { message, error_code } => {
                            eprintln!("Approve failed: {} (error code: {})", message, error_code);
                        }
                        ApproveError::InsufficientFunds { balance } => {
                            eprintln!("Approve failed: Insufficient funds. Balance: {}", balance);
                        }
                       
                        _ => eprintln!("Approve failed with unknown error"),
                    }
                }
                Err(e) => {
                    eprintln!("Failed to decode ApproveResult: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            eprintln!("Approve call rejected: {}", reject_message);
        }
        Err(e) => {
            eprintln!("Error during approve call: {:?}", e);
        }
    }
}





// Function to check the balance of a specific principal
fn check_balance(pic: &PocketIc, canister: Principal, user_principal: Principal) -> Nat {
    // Encode the balance check arguments as required by the icrc1_balance_of function
    let args_encoded = encode_one(
    Account {
        owner: user_principal,
        subaccount: None,
    }
).expect("Failed to encode arguments");

    // Call the icrc1_balance_of method on the ckbtc_canister
    let result = pic.query_call(
    canister,         // Canister you're calling
        Principal::anonymous(), // Caller (anonymous in this case)
        "icrc1_balance_of",     // Method name
        args_encoded,           // Encoded arguments
    ).expect("Failed to query balance");

    // Match the result to check if it's a successful reply
    match result {
        WasmResult::Reply(response) => {
            // Decode the response to get the balance (expected as u64)
            let balance: Nat = candid::decode_one(&response).expect("Failed to decode balance");
            balance
        }
        WasmResult::Reject(reason) => {
            panic!("Query rejected: {}", reason);
        }
    }
}

#[test]
fn test_check_balances() {
    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();

    
    let user1_principal = Principal::anonymous(); 
    let backend_canister_principal = backend_canister; 

    
    let user1_balance_after = check_balance(&pic, ckbtc_canister, user1_principal);
    let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister_principal);

    println!("User1 balance after: {}", user1_balance_after);
    println!("Backend balance after: {}", backend_balance_after);

    
    assert!(user1_balance_after > Nat::from(0u64), "User1 balance should be greater than 0");
    assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0");
}




#[test]
fn test_asset_list_func() {
    let (pic, backend_canister, ckbtc_canister,cketh_canister, dtoken_canister,debttoken_canister) = setup();

    let Ok(WasmResult::Reply(response)) = pic.query_call(
        backend_canister,
        Principal::anonymous(),
        "get_all_assets",
        encode_one(()).unwrap(),
    ) else {
        panic!("Expected reply");
    };
    let result: Vec<String> = decode_one(&response).unwrap();
    assert_eq!(result, vec!["ckBTC", "ckETH"]);
}



fn update_canister_constants(ckbtc_id: String, dtoken_id: String, backend_id: String, cketh_id:String, debttoken_id:String) {
    
    let constants_file_path = "./src/constants/asset_address.rs";  

    
    let mut file_content = String::new();
    fs::File::open(constants_file_path)
        .expect("Unable to open file")
        .read_to_string(&mut file_content)
        .expect("Unable to read file");

    
    let updated_content = file_content
        .replace("c2lt4-zmaaa-aaaaa-qaaiq-cai", &ckbtc_id)
         .replace("ctiya-peaaa-aaaaa-qaaja-cai", &cketh_id)
        .replace("c5kvi-uuaaa-aaaaa-qaaia-cai", &dtoken_id)
        .replace("cuj6u-c4aaa-aaaaa-qaajq-cai", &debttoken_id)
        .replace("avqkn-guaaa-aaaaa-qaaea-cai", &backend_id);
        // .replace("asrmz-lmaaa-aaaaa-qaaeq-cai", frontend_id);

    
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(constants_file_path)
        .expect("Unable to open file for writing");
    file.write_all(updated_content.as_bytes())
        .expect("Unable to write updated content to file");

    println!("Updated constants file with new canister IDs.");
}

#[test]
fn test_update_canister_ids_in_rs_file() {
    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();
    
    update_canister_constants(
        ckbtc_canister.to_string(),
       
        dtoken_canister.to_string(),
        backend_canister.to_string(),
        cketh_canister.to_string(),
        debttoken_canister.to_string(),

    );

   
}




//=============== Deposit ==========
#[test]
fn test_deposit() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u64,
        on_behalf_of: String,
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
            on_behalf_of: "user1".to_string(),
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
            on_behalf_of: "user2".to_string(),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("No canister ID found for asset: nonexistent_asset".to_string()),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            on_behalf_of: "user4".to_string(),
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
            on_behalf_of: "user5".to_string(),
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
            on_behalf_of: "user6".to_string(),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();

    for case in test_cases {
        // Approve before deposit
        let approve_args = ApproveArgs {
            fee: None,
            memo: None,
            from_subaccount: None,
            created_at_time: None,
            amount: Nat::from(10_000_000u64),  //alternative
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
            ckbtc_canister,
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
            "deposit",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.on_behalf_of.clone(),
                case.is_collateral,
            )).unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
               
                let deposit_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode deposit response");
        
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
            },
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
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during deposit function call: {:?}", e);
            }
        }
        
        
        
        if case.expect_success {
            let user_principal = Principal::anonymous(); 
            let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
            let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

           
            let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);

            
            println!("User balance after deposit: {}", user_balance_after);
            println!("Backend balance after deposit: {}", backend_balance_after);
            println!("User Dtoken balance after deposit: {}", user_dtoken_balance_after); 

            
            assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after deposit");
            assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after deposit");
        }
    }
}

// ================ Repay =============
// asset,
// amount: amount as u128,
// on_behalf_of: on_behalf,
///////////////////////////////
// #[test]
// fn test_repay() {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: u64,
//         on_behalf_of: String,
       
//         expect_success: bool,
//         expected_error_message: Option<String>,
//         simulate_insufficient_balance: bool,
//         simulate_dtoken_transfer_failure: bool,
//     }

//     let test_cases = vec![
//         // Valid deposit case
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 1000,
//             on_behalf_of: "user1".to_string(),
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Non-existent asset case
//         TestCase {
//             asset: "nonexistent_asset".to_string(),
//             amount: 500,
//             on_behalf_of: "user2".to_string(),
//             expect_success: false,
//             expected_error_message: Some("No canister ID found for asset: nonexistent_asset".to_string()),
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Minimum valid amount
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 1, // Minimum valid amount
//             on_behalf_of: "user4".to_string(),
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Large amount
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 100_000, // Large amount
//             on_behalf_of: "user5".to_string(),
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Insufficient balance
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 10_000_000, // Valid amount but insufficient balance
//             on_behalf_of: "user6".to_string(),
//             expect_success: false,
//             expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
//             simulate_insufficient_balance: true,
//             simulate_dtoken_transfer_failure: false,
//         },
//     ];

//     let (pic, backend_canister, ckbtc_canister,cketh_caniste ,dtoken_canister,debttoken_canister) = setup();

//     for case in test_cases {
//         // Approve before deposit
//         let approve_args = ApproveArgs {
//             fee: None,
//             memo: None,
//             from_subaccount: None,
//             created_at_time: None,
//             amount: Nat::from(10_000_000u64),  //alternative
//             expected_allowance: None,
//             expires_at: None,
//             spender: Account {
//                 owner: backend_canister,
//                 subaccount: None,
//             },
//         };

       
//         let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");

//         // Call the `approve` method on `ckbtc_canister`
//         let approve_result = pic.update_call(
//             ckbtc_canister,
//             Principal::anonymous(),
//             "icrc2_approve",
//             args_encoded,
//         );

//         // Handle the result of the approve call
//         match approve_result {
//             Ok(WasmResult::Reply(reply)) => {
//                 let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
//                 match approve_response {
//                     Ok(ApproveResult::Ok(block_index)) => {
//                         println!("Approve succeeded, block index: {}", block_index);
//                     }
//                     Ok(ApproveResult::Err(error)) => {
//                         println!("Approve failed with error: {:?}", error);
//                         continue; 
//                     }
//                     Err(e) => {
//                         println!("Failed to decode ApproveResult: {:?}", e);
//                         continue; 
//                     }
//                 }
//             }
//             Ok(WasmResult::Reject(reject_message)) => {
//                 println!("Approve call rejected: {}", reject_message);
//                 continue;
//             }
//             Err(e) => {
//                 println!("Error during approve call: {:?}", e);
//                 continue; 
//             }
//         }

//         // Now call the deposit function
//         let result = pic.update_call(
//             backend_canister,
//             Principal::anonymous(),
//             "repay",
//             encode_args((
//                 case.asset.clone(),
//                 case.amount,
//                 case.on_behalf_of.clone(),
                
//             )).unwrap(),
//         );
//         match result {
//             Ok(WasmResult::Reply(response)) => {
               
//                 let repay_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode repay response");
        
//                 match repay_response {
//                     Ok(()) => {
//                         if case.expect_success {
                           
//                             println!("repay succeeded for case: {:?}", case);
//                         } else {
                           
//                             panic!("Expected failure but got success for case: {:?}", case);
//                         }
//                     }
//                     Err(e) => {
//                         if !case.expect_success {
                            
//                             assert_eq!(
//                                 case.expected_error_message.as_deref(),
//                                 Some(e.as_str()),
//                                 "Error message mismatch for case: {:?}",
//                                 case
//                             );
//                             println!("repay failed as expected with error: {:?}", e);
//                         } else {
                            
//                             panic!("Expected success but got error: {:?}", e);
//                         }
//                     }
//                 }
//             },
//             Ok(WasmResult::Reject(reject_message)) => {
//                 if !case.expect_success {
                    
//                     assert_eq!(
//                         case.expected_error_message.as_deref(),
//                         Some(reject_message.as_str()), 
//                         "Error message mismatch for case: {:?}",
//                         case
//                     );
//                     println!("repay rejected as expected: {}", reject_message);
//                 } else {
                    
//                     panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
//                 }
//             },
//             Err(e) => {
                
//                 panic!("Error during repay function call: {:?}", e);
//             }
//         }
        
        
        
//         if case.expect_success {
//             let user_principal = Principal::anonymous(); 
//             let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
//             let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

           
//             let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);

            
//             println!("User balance after deposit: {}", user_balance_after);
//             println!("Backend balance after deposit: {}", backend_balance_after);
//             println!("User Dtoken balance after deposit: {}", user_dtoken_balance_after); 

            
//             assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after deposit");
//             assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after deposit");
//         }
//     }
// }
/////////////////////////////

//=============== Borrow ======================================================================================
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
            asset: "ckBTC".to_string(),//
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
            expected_error_message: Some("No canister ID found for asset: nonexistent_asset".to_string()),
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
            amount: 100_000, // Large amount
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user5".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Insufficient balance
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 10_000_000, // Valid amount but insufficient balance
            user: Principal::anonymous().to_string(),
            on_behalf_of: "user6".to_string(),
            interest_rate: Nat::from(0u64),
            expect_success: false,
            expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    let (pic, backend_canister, ckbtc_canister,cketh_canister,dtoken_canister,debttoken_canister) = setup(); 

    for case in test_cases {
        // Approve before deposit
        // let approve_args = ApproveArgs {
        //     fee: None,
        //     memo: None,
        //     from_subaccount: None,
        //     created_at_time: None,
        //     amount: Nat::from(10_000_000u64),  //alternative
        //     expected_allowance: None,
        //     expires_at: None,
        //     spender: Account {
        //         owner: backend_canister,
        //         subaccount: None,
        //     },
        // };

       
        // let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");

        // // // Call the `approve` method on `ckbtc_canister`
        // let approve_result = pic.update_call(
        //     ckbtc_canister,
        //     Principal::anonymous(),
        //     "icrc2_approve",
        //     args_encoded,
        // );

        // Handle the result of the approve call
        // match approve_result {
        //     Ok(WasmResult::Reply(reply)) => {
        //         let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
        //         match approve_response {
        //             Ok(ApproveResult::Ok(block_index)) => {
        //                 println!("Approve succeeded, block index: {}", block_index);
        //             }
        //             Ok(ApproveResult::Err(error)) => {
        //                 println!("Approve failed with error: {:?}", error);
        //                 continue; 
        //             }
        //             Err(e) => {
        //                 println!("Failed to decode ApproveResult: {:?}", e);
        //                 continue; 
        //             }
        //         }
        //     }
        //     Ok(WasmResult::Reject(reject_message)) => {
        //         println!("Approve call rejected: {}", reject_message);
        //         continue;
        //     }
        //     Err(e) => {
        //         println!("Error during approve call: {:?}", e);
        //         continue; 
        //     }
        // }

        // Now call the deposit function  ///
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
            )).unwrap(),
        );
        //
        // asset: String,
        // amount: u64,
        // user: String,
        // on_behalf_of: String,
        // interest_rate: Nat,
        // //
        match result {
            Ok(WasmResult::Reply(response)) => {
               
                let borrow_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode borrow response");
        
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
            },
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
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during borrow function call: {:?}", e);
            }
        }
        
        
        
        if case.expect_success {
            let user_principal = Principal::anonymous(); 
            let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
            let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

           // let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);
            let user_debttoken_balance_after = check_balance(&pic, debttoken_canister, user_principal);

            
            println!("User balance after deposit: {}", user_balance_after);
            println!("Backend balance after deposit: {}", backend_balance_after);
           // println!("User Dtoken balance after deposit: {}", user_dtoken_balance_after); 
            println!("User Debttoken balance after deposit: {}", user_debttoken_balance_after); 

            
            assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after deposit");
            assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after deposit");
        }
    }
}
#[test]
fn test_print_canister_ids() {
    // Call the setup function to create and initialize all canisters
    let (_pic, backend_canister, ckbtc_canister, dtoken_canister,cketh_canister,debttoken_canister) = setup();
    
    // Print the canister IDs to the console
    println!("Backend Canister ID: {}", backend_canister);
    println!("ckBTC Canister ID: {}", ckbtc_canister);
    println!("dToken Canister ID: {}", dtoken_canister);
    println!("cKETH Canister ID: {}", cketh_canister);
    println!("debtToken Canister ID: {}", debttoken_canister);
    
    // You can add assertions here if needed to check the format or validity of the canister
    // assert!(backend_canister.is_valid(), "Backend canister ID is not valid");
    // assert!(ckbtc_canister.is_valid(), "ckBTC canister ID is not valid");
    // assert!(dtoken_canister.is_valid(), "dToken canister ID is not valid");

}





//===============Withdraw ==============

// ===============Liquidation ===============