use candid::{decode_args, decode_one, encode_args, encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};
use std::fs;
use candid::{CandidType, Deserialize, Nat};
use serde::{Deserialize as SerdeDeserialize, Serialize};
const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";
const ICRC_WASM: &str = "../../.dfx/local/canisters/ckbtc_ledger/ckbtc_ledger.wasm";  // Path to ckBTC WASM


fn setup() -> (PocketIc, Principal, Principal) {
    let pic = PocketIc::new();

    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 2_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(backend_canister, wasm, vec![], None);
    println!("ckETH Canister ID: {}", backend_canister);

    let ledger_canister_id = Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai").unwrap();
    let ckbtc_canister = pic.create_canister();
    // let ckbtc_canister = pic.create_canister_with_id(None, None, ledger_canister_id)
    // .unwrap(); // Create ckBTC canister
    pic.add_cycles(ckbtc_canister, 2_000_000_000_000);
    let ckbtc_wasm = fs::read(ICRC_WASM).expect("ckBTC WASM file not found, run 'dfx build'.");
    pic.install_canister(ckbtc_canister, ckbtc_wasm, vec![], None);
    println!("ckBTC Canister ID: {}", ckbtc_canister);
    // let cketh_canister = pic.create_canister(); // Create ckETH canister
    // pic.add_cycles(cketh_canister, 2_000_000_000_000); // Add cycles to ckETH canister
    // println!("ckETH Canister ID: {}", cketh_canister);
    // // Install WASM for ckBTC and ckETH canisters
    // // let ckbtc_wasm = fs::read(ICRC_WASM).expect("ckBTC WASM file not found, run 'dfx build'.");
    // // pic.install_canister(ckbtc_canister, ckbtc_wasm, vec![], None);  // Install ckBTC WASM
    // // println!("ckBTC Canister ID: {}", ckbtc_canister);
    // let cketh_wasm = fs::read(ICRC_WASM).expect("ckETH WASM file not found, run 'dfx build'.");
    // pic.install_canister(cketh_canister, cketh_wasm, vec![], None);  // Install ckETH WASM
    // println!("ckETH Canister ID: {}", cketh_canister);


    let _ = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve_list",
        encode_one(vec![
            ("ckBTC".to_string(), ckbtc_canister),
            // ("ckETH".to_string(), cketh_canister)
        ]).unwrap(),
    );
    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "initialize_reserve",
        encode_one(()).unwrap(),
    );
    (pic, backend_canister, ckbtc_canister)
}

#[test]
fn test_asset_list_func() {
    let (pic, backend_canister, ckbtc_canister) = setup();

    let Ok(WasmResult::Reply(response)) = pic.query_call(
        backend_canister,
        Principal::anonymous(),
        "get_all_assets",
        encode_one(()).unwrap(),
    ) else {
        panic!("Expected reply");
    };
    let result: Vec<String> = decode_one(&response).unwrap();
    assert_eq!(result, vec!["ckBTC"]);
}




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
        // TestCase {
        //     asset: "nonexistent_asset".to_string(),
        //     amount: 500,
        //     on_behalf_of: "user2".to_string(),
        //     is_collateral: false,
        //     expect_success: false,
        //     expected_error_message: Some("No canister ID found for asset: nonexistent_asset".to_string()),
        //     simulate_insufficient_balance: false,
        //     simulate_dtoken_transfer_failure: false,
        // },
        // Invalid amount (zero)
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: 0, // Invalid amount
        //     on_behalf_of: "user3".to_string(),
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: Invalid deposit amount".to_string()),
        //     simulate_insufficient_balance: false,
        //     simulate_dtoken_transfer_failure: false,
        // },
        // Minimum valid amount
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 1, // Minimum valid amount
        //     on_behalf_of: "user4".to_string(),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        //     simulate_insufficient_balance: false,
        //     simulate_dtoken_transfer_failure: false,
        // },
        // // Large amount
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 10_000_000, // Large amount
        //     on_behalf_of: "user5".to_string(),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        //     simulate_insufficient_balance: false,
        //     simulate_dtoken_transfer_failure: false,
        // },
        // // Insufficient balance
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 1000, // Valid amount
        //     on_behalf_of: "user6".to_string(),
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("Asset transfer failed: Insufficient balance for deposit".to_string()),
        //     simulate_insufficient_balance: true,
        //     simulate_dtoken_transfer_failure: false,
        // },
        // DToken transfer failure
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: 500,
        //     on_behalf_of: "user7".to_string(),
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("DToken transfer failed".to_string()),
        //     simulate_insufficient_balance: false,
        //     simulate_dtoken_transfer_failure: true,
        // },
    ];

    let (pic, backend_canister, ckbtc_canister) = setup();

    for case in test_cases {
        
       
    //     let Ok(WasmResult::Reply(response)) =  pic.update_call(
    //         backend_canister,
    //         Principal::anonymous(),
    //         "deposit",
    //         encode_args((
    //             "ckBTC".to_string(),
    //             case.amount,
    //             "user2".to_string(),
    //             case.is_collateral,
    //         )).unwrap(),
    //     ) else {
    //         panic!("Unexpected reply");
    //     };
        
    //     let result = decode_one(&response).unwrap();
    //     match result {
    //         Ok(WasmResult::Reply(_)) if case.expect_success => {
    //             println!("Deposit succeeded for case: {:?}", case);
    //         },
    //         Ok(WasmResult::Reply(_)) if !case.expect_success => {
    //             panic!("Expected failure but got success for case: {:?}", case);
    //         },
    //         Ok(WasmResult::Reject(error)) if !case.expect_success => {
    //             assert_eq!(error, case.expected_error_message.clone().unwrap(), "Error message mismatch for case: {:?}", case);
    //         },
    //         Err(e) => {
    //             panic!("Unexpected error: {:?}", e);
    //         },
    //         _ => {
    //             panic!("Unexpected result for case: {:?}", case);
    //         }
    //     }
    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "deposit",
        encode_args((
            case.asset.clone(),
            case.amount.clone(),
            case.on_behalf_of.clone(),
            case.is_collateral,
        )).unwrap(),
    );
    
    // Print the result of the deposit function call
    match result {
        Ok(WasmResult::Reply(response)) => {
            // Decode and print the success response
            println!("Deposit function succeeded. Response: {:?}", response);
            // Optionally decode the response if necessary
            let decoded: Result<(), String> = decode_one(&response).unwrap();
            println!("Decoded Response: {:?}", decoded);
        },
        Ok(WasmResult::Reject(message)) => {
            // Print the rejection message if the canister call was rejected
            println!("Deposit function rejected. Message: {}", message);
        },
        Err(e) => {
            // Print any error that occurred during the call
            println!("Error during deposit function call: {:?}", e);
        },
    }
    
    }
}