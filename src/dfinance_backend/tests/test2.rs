// use candid::{decode_args, decode_one, encode_args, encode_one, Principal};
// use pocket_ic::{PocketIc, WasmResult};
// use std::fs;
// use candid::{CandidType, Deserialize, Nat};
// use serde::Serialize;



// const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";



// fn setup() -> (PocketIc, Principal) {
//     let pic = PocketIc::new();
//     //================== backend canister =====================
//     let backend_canister = pic.create_canister();
//     pic.add_cycles(backend_canister, 2_000_000_000_000); // 2T Cycles
//     let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
//     pic.install_canister(backend_canister, wasm, vec![], None);
    
//     println!("Backend canister: {}", backend_canister);
    
   
//     //=================Reserve Initialize ==================
   
//     let _ = pic.update_call(
//         backend_canister,
//         Principal::anonymous(),
//         "initialize_reserve",
//         encode_one(()).unwrap(),
//     );
  

//     (pic, backend_canister) 
// }

// #[test]
// fn test_deposit() {
//     #[derive(Debug, Clone)]
//     struct TestCase {
//         asset: String,
//         amount: u64,
//         is_collateral: bool,
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
//             is_collateral: true,
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Non-existent asset case
//         TestCase {
//             asset: "nonexistent_asset".to_string(),
//             amount: 500,
//             is_collateral: false,
//             expect_success: false,
//             expected_error_message: Some("No canister ID found for asset: nonexistent_asset".to_string()),
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Minimum valid amount
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 1, // Minimum valid amount
//             is_collateral: true,
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Large amount
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 100_000, // Large amount
//             is_collateral: true,
//             expect_success: true,
//             expected_error_message: None,
//             simulate_insufficient_balance: false,
//             simulate_dtoken_transfer_failure: false,
//         },
//         // Insufficient balance
//         TestCase {
//             asset: "ckBTC".to_string(),
//             amount: 10_000_000, // Valid amount but insufficient balance
//             is_collateral: true,
//             expect_success: false,
//             expected_error_message: Some("Asset transfer failed: \"InsufficientAllowance { allowance: Nat(10000000) }\"".to_string()), // change it later on
//             simulate_insufficient_balance: true,
//             simulate_dtoken_transfer_failure: false,
//         },
//     ];

//     // let (pic, backend_canister, ckbtc_canister, dtoken_canister) = setup();
//     let (pic, backend_canister) = setup(); 
//     // for case in test_cases {
//         println!();
//         println!("****************************************************************************"); 
//             println!();
//     for (i, case) in test_cases.iter().enumerate() {
//             // Print the case number
//             println!("Running test case no: {}", i + 1);
//             println!();
//             println!("Test case details: {:?}", case);
//             println!();
//             println!();
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
//             "deposit",
//             encode_args((
//                 case.asset.clone(),
//                 case.amount,
//                 case.is_collateral,
//             )).unwrap(),
//         );
//         match result {
//             Ok(WasmResult::Reply(response)) => {
               
//                 let deposit_response: Result<(), String> = candid::decode_one(&response).expect("Failed to decode deposit response");
        
//                 match deposit_response {
//                     Ok(()) => {
//                         if case.expect_success {
                           
//                             println!("Deposit succeeded for case: {:?}", case);
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
//                             println!("Deposit failed as expected with error: {:?}", e);
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
//                     println!("Deposit rejected as expected: {}", reject_message);
//                 } else {
                    
//                     panic!("Expected success but got rejection for case: {:?} with message: {}", case, reject_message);
//                 }
//             },
//             Err(e) => {
                
//                 panic!("Error during deposit function call: {:?}", e);
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
//         println!();
//         println!("****************************************************************************"); 
//             println!();
//     }
// }

