use candid::{decode_args, decode_one, encode_args, encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use std::fs;
use candid::{CandidType, Deserialize, Nat};
use serde::Serialize;
use std::fs::OpenOptions;
use std::io::{Read, Write};
use serde_bytes::ByteBuf;



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

const CKBTC_WASM: &str = "../../.dfx/local/canisters/ckbtc_ledger/ckbtc_ledger.wasm";
const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";
const DTOKEN_WASM: &str = "../../target/wasm32-unknown-unknown/release/dtoken.wasm";
const DEBTTOKEN_WASM: &str = "../../target/wasm32-unknown-unknown/release/debttoken.wasm";
const CKETH_WASM: &str = "../../.dfx/local/canisters/cketh_ledger/cketh_ledger.wasm";


fn setup() -> (PocketIc, Principal, Principal, Principal, Principal, Principal) {
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
        transfer_fee: Nat::from(100u64),
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
    println!("CKBTC canister: {}", ckbtc_canister);

    // ====================== ckETH canister ========================
    let cketh_canister = pic.create_canister();
    pic.add_cycles(cketh_canister, 2_000_000_000_000); // 2T Cycles
    let cketh_wasm = fs::read(CKETH_WASM).expect("Wasm file not found, run 'dfx build'.");
    
    let cketh_args = InitArgs {
        token_symbol: String::from("CKETH"),
        token_name: String::from("CKETH"),
        transfer_fee: Nat::from(100u64),
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

    
    pic.install_canister(cketh_canister, cketh_wasm, cketh_args_encoded, None); 
    println!("CKETH canister: {}", cketh_canister);

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
    println!("Dtoken canister: {}", dtoken_canister);
    // ========== Debt Token ============
    let debttoken_canister = pic.create_canister();
    pic.add_cycles(debttoken_canister, 2_000_000_000_000); // 2T Cycles
    let debt_wasm = fs::read(DEBTTOKEN_WASM).expect("Wasm file not found, run 'dfx build'.");
    let debt_args = InitArgs {
        token_symbol: String::from("dckBTC"),
        token_name: String::from("dckBTC"),
        transfer_fee: Nat::from(10u64), 
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
    println!("Debttoken canister: {}", debttoken_canister);


    let transfer_args = TransferFromArgs {
        to: TransferAccount {
            owner: backend_canister,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        from: TransferAccount {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        memo: None,
        created_at_time: None,
        amount: Nat::from(90_000u64),
    };

    // Encode the TransferArg
    let transfer_args_encoded = encode_args((transfer_args, false, Option::<Principal>::None)).expect("Failed to encode arguments");

    // Call the icrc1_transfer method on the ckbtc_canister
    let transfer_result = pic.update_call(
        ckbtc_canister,           
        Principal::anonymous(),   
        "icrc2_transfer_from",        
        transfer_args_encoded,          
    );
    

    match transfer_result {
        Ok(WasmResult::Reply(reply)) => {
            let transfer_from_result: Result<TransferFromResult, _> = candid::decode_one(&reply);
            
            match transfer_from_result {
                Ok(TransferFromResult::Ok(amount_transferred)) => {
                    println!("Transfer succeeded, amount transferred: {}", amount_transferred);
                }
                Ok(TransferFromResult::Err(transfer_error)) => {
                    match transfer_error {
                        TransferFromError::InsufficientFunds { balance } => {
                            eprintln!("Transfer failed: Insufficient funds. Available balance: {}", balance);
                        }
                        TransferFromError::BadFee { expected_fee } => {
                            eprintln!("Transfer failed: Incorrect fee. Expected fee: {}", expected_fee);
                        }
                        TransferFromError::TemporarilyUnavailable => {
                            eprintln!("Transfer failed: The ledger is temporarily unavailable.");
                        }
                        TransferFromError::TooOld => {
                            eprintln!("Transfer failed: The request is too old.");
                        }
                        TransferFromError::Duplicate { duplicate_of } => {
                            eprintln!("Transfer failed: Duplicate transaction. Duplicate of: {}", duplicate_of);
                        }
                        TransferFromError::GenericError { message, error_code } => {
                            eprintln!("Transfer failed: {} (error code: {})", message, error_code);
                        }
                        _ => {
                            eprintln!("Transfer failed: An unknown error occurred.");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to decode transfer result: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            eprintln!("Transfer call rejected: {}", reject_message);
        }
        Err(e) => {
            eprintln!("Error during transfer call: {:?}", e);
        }
    }


    (pic, backend_canister, ckbtc_canister, cketh_canister, dtoken_canister, debttoken_canister) 
    // (pic, backend_canister, ckbtc_canister, dtoken_canister)
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
    // let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
    let (pic, backend_canister, ckbtc_canister,cketh_canister, dtoken_canister, debttoken_canister) = setup(); 

    
    let user1_principal = Principal::anonymous(); 
    let backend_canister_principal = backend_canister; 
    let liquidator_principal = Principal::from_text("uxwks-hn4uu-3jljk-gl3n3-re7fx-oup6o-wcrwq-uf2wj-csuab-rxnry-jae")
                                   .expect("Failed to create new user principal");
    println!("liquidator principal: {}", liquidator_principal);
    
    let user1_balance_after = check_balance(&pic, ckbtc_canister, user1_principal);
    let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister_principal);
    let liq_balance_after = check_balance(&pic, ckbtc_canister, liquidator_principal);
    println!("User1 balance after: {}", user1_balance_after);
    println!("Backend balance after: {}", backend_balance_after);
    println!("Liquidator balance after liquidation: {}", liq_balance_after);
    
    assert!(user1_balance_after > Nat::from(0u64), "User1 balance should be greater than 0");
    assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0");
}




#[test]
fn test_asset_list_func() {
    // let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
    let (pic, backend_canister, ckbtc_canister,cketh_canister, dtoken_canister, debttoken_canister) = setup(); 
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



fn update_canister_constants(ckbtc_id: String, cketh_id: String, dtoken_id: String, debttoken_id:String, backend_id: String, ) {
    
    let constants_file_path = "./src/constants/asset_address.rs";  

    
    let mut file_content = String::new();
    fs::File::open(constants_file_path)
        .expect("Unable to open file")
        .read_to_string(&mut file_content)
        .expect("Unable to read file");

    
    let updated_content = file_content
        .replace("c2lt4-zmaaa-aaaaa-qaaiq-cai", &ckbtc_id)
        // .replace("ctiya-peaaa-aaaaa-qaaja-cai", cketh_id)
        .replace("c5kvi-uuaaa-aaaaa-qaaia-cai", &dtoken_id)
        // .replace("cuj6u-c4aaa-aaaaa-qaajq-cai", debttoken_id)
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

// #[test]
// fn test_update_canister_ids_in_rs_file() {
//     let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
    
//     update_canister_constants(
//         ckbtc_canister.to_string(),
       
//         dtoken_canister.to_string(),
//         backend_canister.to_string(),
//     );

   
// }

fn transfer_ckbtc_to_liquidator(
    pic: &PocketIc, 
    liquidator_principal: Principal, 
    ckbtc_canister: Principal
) {
    let transfer_args = TransferFromArgs {
        to: TransferAccount {
            owner: liquidator_principal,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        from: TransferAccount {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        memo: None,
        created_at_time: None,
        amount: Nat::from(50_000u64),
    };

    // Encode the TransferArg
    let transfer_args_encoded = encode_args((transfer_args, false, Option::<Principal>::None)).expect("Failed to encode arguments");

    // Call the icrc1_transfer method on the ckbtc_canister
    let transfer_result = pic.update_call(
        ckbtc_canister,           
        Principal::anonymous(),   
        "icrc2_transfer_from",        
        transfer_args_encoded,          
    );
    

    match transfer_result {
        Ok(WasmResult::Reply(reply)) => {
            let transfer_from_result: Result<TransferFromResult, _> = candid::decode_one(&reply);
            
            match transfer_from_result {
                Ok(TransferFromResult::Ok(amount_transferred)) => {
                    println!("Transfer succeeded, amount transferred: {}", amount_transferred);
                }
                Ok(TransferFromResult::Err(transfer_error)) => {
                    match transfer_error {
                        TransferFromError::InsufficientFunds { balance } => {
                            eprintln!("Transfer failed: Insufficient funds. Available balance: {}", balance);
                        }
                        TransferFromError::BadFee { expected_fee } => {
                            eprintln!("Transfer failed: Incorrect fee. Expected fee: {}", expected_fee);
                        }
                        TransferFromError::TemporarilyUnavailable => {
                            eprintln!("Transfer failed: The ledger is temporarily unavailable.");
                        }
                        TransferFromError::TooOld => {
                            eprintln!("Transfer failed: The request is too old.");
                        }
                        TransferFromError::Duplicate { duplicate_of } => {
                            eprintln!("Transfer failed: Duplicate transaction. Duplicate of: {}", duplicate_of);
                        }
                        TransferFromError::GenericError { message, error_code } => {
                            eprintln!("Transfer failed: {} (error code: {})", message, error_code);
                        }
                        _ => {
                            eprintln!("Transfer failed: An unknown error occurred.");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to decode transfer result: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            eprintln!("Transfer call rejected: {}", reject_message);
        }
        Err(e) => {
            eprintln!("Error during transfer call: {:?}", e);
        }
    }
}

//==========================transfer debttoken ====================================
fn transfer_debttoken_to_anonymous(
    pic: &PocketIc, 
    debttoken_canister: Principal, 
    platform_principal: Principal
) {
    // Prepare the TransferArgs for transferring dtoken to an anonymous user
    let debttoken_args = TransferArgs {
        to: TransferAccount {
            owner: Principal::anonymous(), // Transfer to anonymous principal
            subaccount: None,
        },
        fee: None, // No fee
        spender_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: Nat::from(10_000u64), // Amount of dtoken to transfer
    };

    // Encode the TransferArgs
    let debttoken_args_encoded = encode_args((debttoken_args, false, Some(platform_principal)))

        .expect("Failed to encode dtoken transfer arguments");

    // Call the `icrc2_transfer` method on the dtoken canister
    let transfer_result = pic.update_call(
        debttoken_canister,         // Canister you're calling (dtoken canister)
        platform_principal,      // Caller (platform principal that initiates the transfer)
        "icrc1_transfer",        // Method name
        debttoken_args_encoded,     // Encoded arguments
    );

    // Handle the result of the transfer
    match transfer_result {
        Ok(WasmResult::Reply(reply)) => {
            let transfer_from_result: Result<TransferFromResult, _> = candid::decode_one(&reply);
            
            match transfer_from_result {
                Ok(TransferFromResult::Ok(amount_transferred)) => {
                    println!("Transfer succeeded, amount transferred: {}", amount_transferred);
                }
                Ok(TransferFromResult::Err(transfer_error)) => {
                    match transfer_error {
                        TransferFromError::InsufficientFunds { balance } => {
                            eprintln!("Transfer failed: Insufficient funds. Available balance: {}", balance);
                        }
                        TransferFromError::BadFee { expected_fee } => {
                            eprintln!("Transfer failed: Incorrect fee. Expected fee: {}", expected_fee);
                        }
                        TransferFromError::TemporarilyUnavailable => {
                            eprintln!("Transfer failed: The ledger is temporarily unavailable.");
                        }
                        TransferFromError::TooOld => {
                            eprintln!("Transfer failed: The request is too old.");
                        }
                        TransferFromError::Duplicate { duplicate_of } => {
                            eprintln!("Transfer failed: Duplicate transaction. Duplicate of: {}", duplicate_of);
                        }
                        TransferFromError::GenericError { message, error_code } => {
                            eprintln!("Transfer failed: {} (error code: {})", message, error_code);
                        }
                        _ => {
                            eprintln!("Transfer failed: An unknown error occurred.");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to decode transfer result: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            eprintln!("Transfer call rejected: {}", reject_message);
        }
        Err(e) => {
            eprintln!("Error during transfer call: {:?}", e);
        }
    }

}
//==========================transfer dtoken ====================================

fn transfer_dtoken_to_anonymous(
    pic: &PocketIc, 
    dtoken_canister: Principal, 
    platform_principal: Principal
) {
    // Prepare the TransferArgs for transferring dtoken to an anonymous user
    let dtoken_args = TransferArgs {
        to: TransferAccount {
            owner: Principal::anonymous(), // Transfer to anonymous principal
            subaccount: None,
        },
        fee: None, // No fee
        spender_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: Nat::from(10_000u64), // Amount of dtoken to transfer
    };

    // Encode the TransferArgs
    let dtoken_args_encoded = encode_args((dtoken_args, false, Some(platform_principal)))

        .expect("Failed to encode dtoken transfer arguments");

    // Call the `icrc2_transfer` method on the dtoken canister
    let transfer_result = pic.update_call(
        dtoken_canister,         // Canister you're calling (dtoken canister)
        platform_principal,      // Caller (platform principal that initiates the transfer)
        "icrc1_transfer",        // Method name
        dtoken_args_encoded,     // Encoded arguments
    );

    // Handle the result of the transfer
    match transfer_result {
        Ok(WasmResult::Reply(reply)) => {
            let transfer_from_result: Result<TransferFromResult, _> = candid::decode_one(&reply);
            
            match transfer_from_result {
                Ok(TransferFromResult::Ok(amount_transferred)) => {
                    println!("Transfer succeeded, amount transferred: {}", amount_transferred);
                }
                Ok(TransferFromResult::Err(transfer_error)) => {
                    match transfer_error {
                        TransferFromError::InsufficientFunds { balance } => {
                            eprintln!("Transfer failed: Insufficient funds. Available balance: {}", balance);
                        }
                        TransferFromError::BadFee { expected_fee } => {
                            eprintln!("Transfer failed: Incorrect fee. Expected fee: {}", expected_fee);
                        }
                        TransferFromError::TemporarilyUnavailable => {
                            eprintln!("Transfer failed: The ledger is temporarily unavailable.");
                        }
                        TransferFromError::TooOld => {
                            eprintln!("Transfer failed: The request is too old.");
                        }
                        TransferFromError::Duplicate { duplicate_of } => {
                            eprintln!("Transfer failed: Duplicate transaction. Duplicate of: {}", duplicate_of);
                        }
                        TransferFromError::GenericError { message, error_code } => {
                            eprintln!("Transfer failed: {} (error code: {})", message, error_code);
                        }
                        _ => {
                            eprintln!("Transfer failed: An unknown error occurred.");
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to decode transfer result: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            eprintln!("Transfer call rejected: {}", reject_message);
        }
        Err(e) => {
            eprintln!("Error during transfer call: {:?}", e);
        }
    }

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

    // let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
    let (pic, backend_canister, ckbtc_canister,cketh_canister, dtoken_canister, debttoken_canister) = setup(); 
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
            expected_error_message: Some("Reserve not found for asset: nonexistent_asset".to_string()),
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
            amount: 10_000, // Valid amount but insufficient balance
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("InsufficientFunds { balance: Nat(2000) }".to_string()), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    let (pic, backend_canister, ckbtc_canister,cketh_caniste ,dtoken_canister,debttoken_canister) = setup();
    let platform_principal = backend_canister; // Example

    // Call the transfer function to transfer dtoken to an anonymous user
        transfer_debttoken_to_anonymous(&pic, debttoken_canister, backend_canister);
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
            "repay",
            encode_args((
                case.asset.clone(),
                case.amount,
                case.on_behalf_of.clone(),
                
            )).unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
               
                let repay_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode repay response");
        
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
            },
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
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during repay function call: {:?}", e);
            }
        }
        
        
        
        if case.expect_success {
            let user_principal = Principal::anonymous(); 
            let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
            let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

           
            let user_debttoken_balance_after = check_balance(&pic, debttoken_canister, user_principal);

            
            println!("User balance after repay: {}", user_balance_after);
            println!("Backend balance after repay: {}", backend_balance_after);
            println!("User Dtoken balance after repay: {}", user_debttoken_balance_after); 

            
            assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after repay");
            assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after repay");
        }
        println!();
        println!("****************************************************************************"); 
            println!();
    }
}

//=============== Borrow =============
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
            expected_error_message: Some("Reserve not found for asset: nonexistent_asset".to_string()),
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

    let (pic, backend_canister, ckbtc_canister,cketh_canister,dtoken_canister,debttoken_canister) = setup(); 

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
            )).unwrap(),
        );
        
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
        simulate_insufficient_balance: bool,
        simulate_dtoken_transfer_failure: bool,
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
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: 500,
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Reserve not found for asset: nonexistent_asset".to_string()),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        
        // Large amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 7_000, // Large amount
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
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

    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();
    transfer_dtoken_to_anonymous(&pic, dtoken_canister, backend_canister);
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
    // for case in test_cases {
        // Approve before withdraw
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

        // // Call the `approve` method on `ckbtc_canister`
        // let approve_result = pic.update_call(
        //     ckbtc_canister,
        //     Principal::anonymous(),
        //     "icrc2_approve",
        //     args_encoded,
        // );

        // // Handle the result of the approve call
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
            )).unwrap(),
        );
        match result {
            Ok(WasmResult::Reply(response)) => {
               
                let withdraw_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode withdraw response");
        
                match withdraw_response {
                    Ok(()) => {
                        if case.expect_success {
                           
                            println!("withdraw succeeded for case: {:?}", i+1);
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
            },
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
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during withdraw function call: {:?}", e);
            }
        }
        
        
        
        if case.expect_success {
            let user_principal = Principal::anonymous(); 
            let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
            let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);

           
            let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);

            
            println!("User balance after withdraw: {}", user_balance_after);
            println!("Backend balance after withdraw: {}", backend_balance_after);
            println!("User Dtoken balance after withdraw: {}", user_dtoken_balance_after); 

            
            assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after withdraw");
            assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after withdraw"); //
        }
        println!();
        println!("****************************************************************************"); 
        println!();
    }
    
    
}



// ===============Liquidation ===============

#[test]
fn test_Liquidation() {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: u128, 
        on_behalf_of: Option<String>, 
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
            on_behalf_of: Some(Principal::anonymous().to_text()),
            // liquidator: Some(Principal::anonymous().to_text()),
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
            on_behalf_of: Some(Principal::anonymous().to_text()),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Reserve not found for asset: nonexistent_asset ".to_string()),
            simulate_insufficient_balance: false,
            simulate_dtoken_transfer_failure: false,
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: 1, // Minimum valid amount
            on_behalf_of: Some(Principal::anonymous().to_text()),
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
            on_behalf_of: Some(Principal::anonymous().to_text()),
            // liquidator: Some(Principal::anonymous().to_text()),
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
            on_behalf_of: Some(Principal::anonymous().to_text()),
            // liquidator: Some(Principal::anonymous().to_text()),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
            simulate_insufficient_balance: true,
            simulate_dtoken_transfer_failure: false,
        },
    ];

    let (pic, backend_canister, ckbtc_canister,cketh_canister ,dtoken_canister,debttoken_canister) = setup();
    let liquidator_principal = Principal::from_text("uxwks-hn4uu-3jljk-gl3n3-re7fx-oup6o-wcrwq-uf2wj-csuab-rxnry-jae")
                                   .expect("Failed to create new user principal");
    println!("liquidator principal: {}", liquidator_principal);
    transfer_ckbtc_to_liquidator(&pic, liquidator_principal, ckbtc_canister);
    transfer_dtoken_to_anonymous(&pic, dtoken_canister, backend_canister);
    transfer_debttoken_to_anonymous(&pic, debttoken_canister, backend_canister);
    for case in test_cases {
        // Approve before liquidation
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
            liquidator_principal,
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

        
        
        // Re-pay-Result --------
        let repay_result = pic.update_call(
            backend_canister,
            liquidator_principal,
            "repay",   
            encode_args((
                case.asset.clone(),
                case.amount, //cnahged here
                case.on_behalf_of.clone(),
               
            )).unwrap(),
        );
        match repay_result {
            Ok(WasmResult::Reply(response)) => {
               
                let repay_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode liqudation response");
        
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
            },
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
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during repay function call: {:?}", e);
            }
        }



         // withdraw-result-----------
         let withdraw_result = pic.update_call(
            backend_canister,
            liquidator_principal,
            "withdraw",   
            encode_args((
                case.asset.clone(),
                case.amount,
                case.on_behalf_of.clone(),
                case.is_collateral,
            )).unwrap(),
        );
        match withdraw_result {
            Ok(WasmResult::Reply(response)) => {
               
                let withdraw_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode liqudation response");
        
                match withdraw_response {
                    Ok(()) => {
                        if case.expect_success {
                           
                            println!("withdraw succeeded for case: {:?}", case);
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
                            println!("withdraw failed as expected with error: {:?}", e);
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
                    println!("withdraw rejected as expected: {}", reject_message);
                } else {
                    
                    panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
                }
            },
            Err(e) => {
                
                panic!("Error during withdraw function call: {:?}", e);
            }
        }
          
        
        
        if case.expect_success {
            let user_principal = Principal::anonymous(); 
            let user_balance_after = check_balance(&pic, ckbtc_canister, user_principal);
            let backend_balance_after = check_balance(&pic, ckbtc_canister, backend_canister);
           

            let liquidator_balance_after=check_balance(&pic, ckbtc_canister, liquidator_principal);
           
            let user_dtoken_balance_after = check_balance(&pic, dtoken_canister, user_principal);
            let user_debttoken_balance_after = check_balance(&pic, debttoken_canister, user_principal);
            println!("Liquidator balance after liquidation: {}", liquidator_balance_after);
            println!("User balance after liquidation: {}", user_balance_after);
            println!("Backend balance after liquidation: {}", backend_balance_after);
            println!("User Dtoken balance after liquidation: {}", user_dtoken_balance_after); 
            println!("User Debttoken balance after liquidation: {}", user_debttoken_balance_after); 
            
            assert!(user_balance_after > Nat::from(0u64), "User balance should be greater than 0 after liquidation");
            assert!(backend_balance_after > Nat::from(0u64), "Backend balance should be greater than 0 after liquidation"); 
        }
    }
}

