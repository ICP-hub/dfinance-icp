use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::constant_variables::*;


/*
 * @title Get User Principal
 * @notice Returns a predefined principal ID.
 * @dev Converts a fixed text representation into a Principal type.
 * @functionality Returns a predefined principal for the user.
 */
#[allow(dead_code)]
pub fn get_user_principal() -> Principal {
    Principal::from_text(TESTER_2).unwrap()
}

#[allow(dead_code)]
pub fn get_user_principal2() -> Principal {
    Principal::from_text(TESTER_3).unwrap()
}

/*
 * @title Generate Principals
 * @notice Creates a list of unique Principal IDs.
 * @dev Generates `count` principals using a sequential byte pattern.
 * @functionality Generates a list of unique Principal IDs based on a count.
 */
#[allow(dead_code)]
pub fn generate_principals(count: usize) -> Vec<Principal> {
    (1..=count)
        .map(|i| Principal::from_slice(&[i as u8; 29])) // 29-byte unique Principal
        .collect()
}

/*
 * @title Get User Principal
 * @notice Retrieves a predefined Principal based on the given index.
 * @dev Returns an error if the index is out of the predefined range.
 * @functionality Retrieves a user principal based on an index value.
 */
#[allow(dead_code)]
pub fn get_users_principal(index: Nat) -> Result<Principal, String> {
    if index == Nat::from(1u32) {
        Ok(
            Principal::from_text(TESTER_1)
                .unwrap(),
        )
    } else if index == Nat::from(2u32) {
        Ok(
            Principal::from_text(TESTER_2)
                .unwrap(),
        )
    } else if index == Nat::from(3u32) {
        Ok(
            Principal::from_text(TESTER_3)
                .unwrap(),
        )
    } else if index == Nat::from(4u32) {
        Ok(
            Principal::from_text(TESTER_4)
                .unwrap(),
        )
    } else if index == Nat::from(5u32) {
        Ok(
            Principal::from_text(TESTER_5)
                .unwrap(),
        )
    }else if index == Nat::from(6u32) {
        Ok(
            Principal::from_text(TESTER_6)
                .unwrap(),
        )
    }
    else if index == Nat::from(7u32) {
        Ok(
            Principal::from_text(TESTER_7)
                .unwrap(),
        )
    }
     else {
        ic_cdk::println!("No valid input.");
        return Err("No valid input".to_string());
    }
}

/*
 * @title Get Users Principals Vector
 * @notice Returns a vector of predefined Principal identifiers.
 * @dev Filters out any invalid Principal conversions and collects valid ones into a vector.
 * @functionality Retrieves a vector of predefined user principals.
 */
#[allow(dead_code)]
pub fn get_users_principals_vector() -> Vec<Principal> {
    vec![
        TESTER_1,
        TESTER_2,
        TESTER_3,
        TESTER_4,
        TESTER_5,
    ]
    .into_iter()
    .filter_map(|s| Principal::from_text(s).ok()) // Convert each string into a Principal
    .collect()
}

/*
 * @title Test Get Asset Principal
 * @notice Queries the backend canister to retrieve the principal of a given asset.
 * @param asset The name or identifier of the asset to query.
 * @param pic A reference to the PocketIc instance for performing the query.
 * @param backend_canister The principal of the backend canister handling asset queries.
 * @return An Option<Principal> containing the asset's principal if found, otherwise None.
 * @dev Handles multiple error cases including query rejection, decoding failure, and backend errors.
 * @functionality Queries the backend canister to get the principal of an asset.
 */
#[allow(dead_code)]
pub fn test_get_asset_principal(
    asset: String,
    pic: &PocketIc,
    backend_canister: Principal,
) -> Option<Principal> {
    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
        "get_asset_principal",
        encode_one(asset.clone()).unwrap(),
    );

    let asset_canister_id = match result {
        Ok(WasmResult::Reply(response_data)) => {
            match decode_one::<Result<Principal, errors::Error>>(&response_data) {
                Ok(Ok(principal)) => Some(principal),
                Ok(Err(err)) => {
                    ic_cdk::println!("Output error: Error retrieving asset principal: {:?}", err);
                    None
                }
                Err(decode_err) => {
                    ic_cdk::println!(
                        "Output error: Error retrieving asset principal with error: {:?}",
                        decode_err
                    );
                    None
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            println!("Query call rejected: {}", reject_message);
            None
        }
        Err(call_err) => {
            println!("Query call failed: {}", call_err);
            None
        }
    };
    return asset_canister_id;
}

/*
 * @title ICRC-2 Approve Function
 * @notice Allows a user to approve a backend canister to spend a specified amount of an asset on their behalf.
 * @param user_principal The principal of the user granting approval.
 * @param asset_principal The principal of the asset canister handling the token.
 * @param pic A reference to the PocketIc instance for executing the approve call.
 * @param backend_canister The principal of the backend canister that will be approved as the spender.
 * @param amount The amount of tokens to be approved for spending.
 * @return A boolean indicating whether the approval was successful.
 * @dev This function encodes the approval arguments, sends an update call, and processes the response.
 * @dev It handles multiple error scenarios such as rejection, decoding failure, and transaction errors.
 * @functionality Approves a backend canister to spend a specified amount of an asset on behalf of the user.
 */
#[allow(dead_code)]
pub fn test_icrc2_aprove(
    user_principal: Principal,
    asset_principal: Principal,
    pic: &PocketIc,
    backend_canister: Principal,
    amount: Nat,
) -> bool {
    let approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount,
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: backend_canister,
            subaccount: None,
        },
    };

    let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");
    ic_cdk::println!("🟦 ICRC2 Approving ...");
    let approve_result = pic.update_call(
        asset_principal,
        user_principal,
        "icrc2_approve",
        args_encoded,
    );

    // Handle the result of the approve call
    match approve_result {
        Ok(WasmResult::Reply(reply)) => {
            let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
            match approve_response {
                Ok(ApproveResult::Ok(block_index)) => {
                    ic_cdk::println!("☑️  Approve succeeded, block index: {}", block_index);
                    return true;
                }
                Ok(ApproveResult::Err(error)) => {
                    ic_cdk::println!("Output Error: Approve failed with error: {:?}", error);
                    return false;
                }
                Err(e) => {
                    ic_cdk::println!("Output Error: Failed to decode ApproveResult: {:?}", e);
                    return false;
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            ic_cdk::println!("Output Error: Approve call rejected: {}", reject_message);
            return false;
        }
        Err(e) => {
            ic_cdk::println!("Output Error: Error during approve call: {:?}", e);
            return false;
        }
    }
}

/*
 * @title Test Creating User Reserve with Low Health
 * @notice This function tests the creation of user reserves with low health factors.
 * @dev
 * - The function simulates users supplying and borrowing assets close to the liquidation threshold.
 * - It ensures that the approval process for ICRC2 transfers is validated before supply operations.
 * - Each user is assigned an asset to supply and borrow with predefined amounts.
 * - The function also verifies the expected behavior and error handling in case of failures.
 * @functionality Tests creating a user reserve with a low health factor by simulating supply and borrow operations.
 */
#[allow(dead_code)]
pub fn test_create_user_reserve_with_low_health(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, CandidType, Deserialize, Clone)]
    struct LowHealthUsersData {
        user_principal: Principal,
        asset_supply: String,
        asset_borrow: String,
        supply_tokens: Nat,
        borrow_tokens: Nat,
    }

    let mut users_with_low_health: Vec<LowHealthUsersData> = Vec::new();
    // Pushing first user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(1u32)).unwrap(),
        asset_supply: "ICP".to_string(),
        asset_borrow: "ICP".to_string(),
        supply_tokens: Nat::from(100_000_000u128), // 1 icp
        borrow_tokens: Nat::from(90_000_000u128),  // 0.9 icp
    });

    // Pushing second user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(4u32)).unwrap(),
        asset_supply: "ckETH".to_string(),
        asset_borrow: "ckETH".to_string(),
        supply_tokens: Nat::from(14_000_000u128), // 0.14 cketh
        borrow_tokens: Nat::from(12_000_000u128), // 0.12 cketh
    });
    // // Pushing third user data
    // users_with_low_health.push(LowHealthUsersData {
    //     user_principal: get_users_principal(Nat::from(5u32)).unwrap(),
    //     asset_supply: "ckBTC".to_string(),
    //     asset_borrow: "ckBTC".to_string(),
    //     supply_tokens: Nat::from(450_000u128), // 0.0045 btc
    //     borrow_tokens: Nat::from(420_000u128), // 0.0042 btc
    // });
    // // Pushing 4th user data
    // users_with_low_health.push(LowHealthUsersData {
    //     user_principal: get_users_principal(Nat::from(6u32)).unwrap(),
    //     asset_supply: "ckUSDC".to_string(),
    //     asset_borrow: "ckUSDC".to_string(),
    //     supply_tokens: Nat::from(45_000_000_000u128), // 450 usdc
    //     borrow_tokens: Nat::from(40_000_000_000u128), // 400 usdt
    // });
    // // Pushing 5th user data
    // users_with_low_health.push(LowHealthUsersData {
    //     user_principal: get_users_principal(Nat::from(7u32)).unwrap(),
    //     asset_supply: "ckUSDT".to_string(),
    //     asset_borrow: "ckUSDT".to_string(),
    //     supply_tokens: Nat::from(30_000_000_000u128), // 300 USDT
    //     borrow_tokens: Nat::from(25_000_000_000u128), // 250 USDT
    // });

    for user in &users_with_low_health {
        let asset_principal =
            match test_get_asset_principal(user.asset_supply.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    continue;
                }
            };
        ic_cdk::println!("user : {:?}", user.user_principal.to_string());
        let approved = test_icrc2_aprove(
            user.user_principal,
            asset_principal,
            &pic,
            backend_canister,
            Nat::from(user.supply_tokens.clone()),
        );
        if !approved {
            continue;
        }

        let result = pic.update_call(
            backend_canister,
            user.user_principal,
            "create_user_reserve_with_low_health",
            encode_args((
                user.asset_supply.clone(),
                user.asset_borrow.clone(),
                user.supply_tokens.clone(),
                user.borrow_tokens.clone(),
            ))
            .unwrap(),
        );

        // Decode the response
        match result {
            Ok(WasmResult::Reply(response)) => {
                let create_user_response: Result<UserData, errors::Error> =
                    candid::decode_one(&response)
                        .expect("Failed to decode create_user_reserve_with_low_health response");

                match create_user_response {
                    Ok(_) => {
                        ic_cdk::println!(
                            "✅ Create_user_reserve_with_low_health function succeeded"
                        );
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "Output Error: Create_user_reserve_with_low_health function failed as expected with error: {:?}",
                            e
                        );
                        panic!("🚨 Expected success but got error: {:?}", e);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                panic!(
                    "🚨 Create_user_reserve_with_low_health function was rejected: {:?}",
                    reject_message
                );
            }
            Err(e) => {
                panic!(
                    "🚨 Error calling Create_user_reserve_with_low_health function: {:?}",
                    e
                );
            }
        }
    }
}

/*
 * Adds a tester to the backend canister.
 * @param pic - PocketIc instance for executing the call.
 * @param backend_canister - Backend canister's principal.
 * @param user_principal - Principal of the caller.
 * @param tester_principal - Principal of the tester to add.
 * @dev Encodes the tester principal and sends an update call to add the tester.
 * @dev Handles errors and panics on failure to ensure test visibility.
 * @functionality Adds a new tester principal to the backend canister and verifies the operation.
 */
#[allow(dead_code)]
pub fn test_add_tester(
    pic: &PocketIc,
    backend_canister: Principal,
    user_principal: Principal,
    tester_principal: Principal,
) {
    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args((tester_principal.to_string(), tester_principal)).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let add_tester_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match add_tester_response {
                Ok(()) => {
                    ic_cdk::println!("✅ Add Tester function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!("Add Tester function failed as expected with error: {:?}", e);
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!("🚨 Add Tester function was rejected: {:?}", reject_message);
        }
        Err(e) => {
            panic!("🚨 Error calling Add Tester function: {:?}", e);
        }
    }
}

/*
 * Fetches reserve data for a given asset.
 * @param pic - PocketIc instance for executing the query.
 * @param backend_canister - Backend canister's principal.
 * @param asset - Asset identifier.
 * @dev Sends a query to fetch reserve metrics like supply, borrow, and indices.
 * @functionality Retrieves and logs current reserve state for a specified asset from the backend canister.
 */
#[allow(dead_code)]
pub fn fetch_reserve_data(pic: &PocketIc, backend_canister: Principal, asset: &str) {
    let result = pic.update_call(
        backend_canister,
        get_user_principal(),
        "get_reserve_data",
        encode_one(asset.to_string()).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            let supply_response: Result<ReserveData, errors::Error> =
                candid::decode_one(&reply).expect("Failed to decode reserve data response");

            match supply_response {
                Ok(balance) => {
                    ic_cdk::println!(
                        "Reserve Data - Last Update Timestamp for {}: {:?}",
                        asset,
                        balance.last_update_timestamp
                    );
                    ic_cdk::println!(
                        "Reserve Data - Asset Supply for {}: {:?}",
                        asset,
                        balance.asset_supply
                    );
                    ic_cdk::println!(
                        "Reserve Data - Asset Borrow for {}: {:?}",
                        asset,
                        balance.asset_borrow
                    );
                    ic_cdk::println!(
                        "Reserve Data - Debt Index for {}: {:?}",
                        asset,
                        balance.debt_index
                    );
                    ic_cdk::println!(
                        "Reserve Data - Liquidity Index for {}: {:?}",
                        asset,
                        balance.liquidity_index
                    );
                }
                Err(error) => {
                    ic_cdk::println!("Failed to retrieve reserve data for {}: {:?}", asset, error);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            ic_cdk::println!("Query rejected for {}: {}", asset, reject_message);
        }
        Err(e) => {
            ic_cdk::println!("Error retrieving reserve data for {}: {:?}", asset, e);
        }
    }
}

/*
 * Fetches user data for a given asset.
 * @param pic - PocketIc instance for executing the query.
 * @param backend_canister - Backend canister's principal.
 * @param user_principal - User's principal.
 * @param asset - Asset identifier.
 * @dev Retrieves user-specific reserve metrics like balances and indices.
 * @functionality Queries and logs user's asset-related reserve data from the backend canister.
 */
#[allow(dead_code)]
pub fn fetch_user_data(
    pic: &PocketIc,
    backend_canister: Principal,
    user_principal: &Principal,
    asset: &str,
) {
    let result = pic.update_call(
        backend_canister,
        *user_principal,
        "get_user_data",
        encode_one(*user_principal).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            let user_response: Result<UserData, errors::Error> =
                candid::decode_one(&reply).expect("Failed to decode user data response");

            match user_response {
                Ok(user_data) => {
                    if let Some(reserves) = &user_data.reserves {
                        for (reserve_asset, reserve_data) in reserves {
                            if reserve_asset == asset {
                                ic_cdk::println!(
                                    "User Data for Asset: {} | Last Update Timestamp: {:?}",
                                    asset,
                                    reserve_data.last_update_timestamp
                                );
                                ic_cdk::println!(
                                    "User Data for Asset: {} | dToken Balance: {:?}",
                                    asset,
                                    reserve_data.d_token_balance
                                );
                                ic_cdk::println!(
                                    "User Data for Asset: {} | Debt Token Balance: {:?}",
                                    asset,
                                    reserve_data.debt_token_blance
                                );
                                ic_cdk::println!(
                                    "User Data for Asset: {} | Liquidity Index: {:?}",
                                    asset,
                                    reserve_data.liquidity_index
                                );
                                ic_cdk::println!(
                                    "User Data for Asset: {} | Variable Borrow Index: {:?}",
                                    asset,
                                    reserve_data.variable_borrow_index
                                );
                            }
                        }
                    } else {
                        ic_cdk::println!("No reserve data found for user.");
                    }
                }
                Err(error) => {
                    ic_cdk::println!(
                        "Failed to retrieve user data for {}: {:?}",
                        user_principal,
                        error
                    );
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            ic_cdk::println!("Query rejected for {}: {}", user_principal, reject_message);
        }
        Err(e) => {
            ic_cdk::println!("Error retrieving user data for {}: {:?}", user_principal, e);
        }
    }
}













/// Fetches the ReserveData struct for a specific asset.
/// Returns Ok(ReserveData) on success, or Err(String) on failure.
pub fn get_reserve_data_struct(
    pic: &PocketIc,
    user_principal: &Principal,
    backend_canister: Principal,
    asset: &str,
) -> Result<ReserveData, String> { 
    let result = pic.update_call( 
        backend_canister,
        *user_principal, 
        "get_reserve_data",
        encode_one(asset.to_string()).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            match candid::decode_one::<Result<ReserveData, errors::Error>>(&reply) {
                Ok(Ok(data)) => Ok(data), 
                Ok(Err(backend_err)) => Err(format!("Backend returned error for {}: {:?}", asset, backend_err)),
                Err(decode_err) => Err(format!("Failed to decode ReserveData response for {}: {:?}", asset, decode_err)),
            }
        }
        Ok(WasmResult::Reject(reject_message)) => Err(format!("Call rejected for {}: {}", asset, reject_message)),
        Err(e) => Err(format!("Error calling get_reserve_data for {}: {:?}", asset, e)),
    }
}




/// Fetches the specific UserReserveData for a user and asset.
/// Returns Ok(UserReserveData) if found, or Err(String) if user or reserve not found.
pub fn get_user_reserve_state(
    pic: &PocketIc,
    backend_canister: Principal,
    user_principal: Principal,
    asset_name: &str,
) -> Result<UserReserveData, String> {

    // Call get_user_data (assuming it's a query)
    let result = pic.query_call(
        backend_canister,
        user_principal, // Call as the user themselves
        "get_user_data",
        encode_one(user_principal).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            match candid::decode_one::<Result<UserData, errors::Error>>(&reply) {
                Ok(Ok(user_data)) => {
                    if let Some(reserves) = user_data.reserves {
                        if let Some((_, reserve_data)) = reserves.iter().find(|(name, _)| name == asset_name) {
                            Ok(reserve_data.clone()) 
                        } else {
                            Err(format!("User reserve data not found for asset '{}'", asset_name))
                        }
                    } else {
                        Err(format!("User has no reserves data structure"))
                    }
                }
                Ok(Err(backend_err)) => Err(format!("Backend error fetching UserData for {}: {:?}", user_principal, backend_err)),
                Err(decode_err) => Err(format!("Failed to decode UserData response for {}: {:?}", user_principal, decode_err)),
            }
        }
        Ok(WasmResult::Reject(reject_message)) => Err(format!("get_user_data call rejected for {}: {}", user_principal, reject_message)),
        Err(e) => Err(format!("Error calling get_user_data for {}: {:?}", user_principal, e)),
    }
}






pub fn check_ledger_balances(
    pic: &PocketIc,
    backend_canister: Principal,
    users_to_check: &[Principal],
    assets_to_check: &[String],
) {}

/// @title Verify Ledger Balances
/// @notice Queries the ICRC1 balance for multiple users across multiple assets.
/// @dev Iterates through users and assets, calls `icrc1_balance_of` on the respective
///      ledger canister using a query call, and prints the results or errors.
///
/// @param pic A reference to the PocketIc instance.
/// @param backend_canister The principal of the main backend canister (used to find ledger IDs).
/// @param users_to_check A slice of user Principals whose balances need checking.
/// @param assets_to_check A slice of asset name Strings to check for each user.
pub fn fetch_balance(
    pic: &PocketIc,
    backend_canister: Principal,
    users_to_check: &[Principal],
    assets_to_check: &[String],
) -> f64 {

    for user_principal in users_to_check {
        ic_cdk::println!("--- Checking balances for user: {} ---", user_principal);
        for asset_name in assets_to_check {
            ic_cdk::println!(" Checking {} balance... ", asset_name);

            //Get the ledger canister Principal for this asset
            let ledger_principal = match test_get_asset_principal(asset_name.clone(), pic, backend_canister) {
                Some(p) => p,
                None => {
                    ic_cdk::println!("Failed to get ledger principal for {}. Skipping.", asset_name);
                    continue; 
                }
            };

            //Prepare the argument for icrc1_balance_of
            let account_arg = Account {
                owner: *user_principal,
                subaccount: None, 
            };
            let encoded_arg = match encode_one(&account_arg) {
                 Ok(arg) => arg,
                 Err(e) => {
                     ic_cdk::println!("Failed to encode account arg for {}: {:?}. Skipping.", asset_name, e);
                     continue; 
                 }
            };

            //Make the query call using the helper
            let balance_result = pic.update_call( 
                ledger_principal,
                Principal::anonymous(), 
                "icrc1_balance_of",
                encoded_arg,
            );

            // 4. Decode and print the result
            match balance_result {
                Ok(WasmResult::Reply(reply)) => {
                    match decode_one::<Nat>(&reply) {
                        Ok(balance) => {
                            let amount_u128: u64 = balance.clone().0.try_into().unwrap();
                            let amount_float = amount_u128 as f64;
                            return amount_float / 100000000.0;
                        }
                        Err(e) => {
                            ic_cdk::println!("Failed to decode balance response for {}: {:?}", asset_name, e);
                        }
                    }
                }
                Ok(WasmResult::Reject(msg)) => {
                    ic_cdk::println!("Balance query rejected for {}: {}", asset_name, msg);
                }
                Err(e) => {
                    ic_cdk::println!("Error calling balance query for {}: {:?}", asset_name, e);
                }
            }
        } 
    } 
    0.0
}

// Ensure Account struct is defined or imported correctly above
// #[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
// pub struct Account {
//     pub owner: Principal,
//     pub subaccount: Option<Vec<u8>>,
// }

// Placeholder for ApproveArgs if not defined in structs.rs
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApproveArgs {
   pub fee: Option<Nat>,
   pub memo: Option<Vec<u8>>,
   pub from_subaccount: Option<Vec<u8>>,
   pub created_at_time: Option<u64>,
   pub amount: Nat,
   pub expected_allowance: Option<Nat>,
   pub expires_at: Option<u64>,
   pub spender: Account,
}

// Placeholder for ApproveResult if not defined (adjust based on actual implementation)
#[derive(CandidType, Deserialize, Debug)]
pub enum ApproveResult {
   Ok(Nat),
   Err(ApproveError), // Replace ApproveError with the actual error enum/type
}

// Placeholder for ApproveError (replace with actual type)
#[derive(CandidType, Deserialize, Debug)]
pub enum ApproveError {
    GenericError{ error_code: Nat, message: String },
    TemporarilyUnavailable,
    Duplicate{ duplicate_of: Nat },
    BadFee{ expected_fee: Nat },
    AllowanceChanged{ current_allowance: Nat },
    CreatedInFuture{ ledger_time: u64 },
    TooOld,
    Expired{ ledger_time: u64 },
    InsufficientFunds{ balance: Nat },
}