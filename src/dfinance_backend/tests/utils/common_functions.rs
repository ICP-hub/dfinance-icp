use crate::utils::constant_variables::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use tracing_subscriber::fmt;
use tracing::{info,error};

/*
 * @title Initialize Tracing
 * @notice Configures and initializes the tracing subscriber for logging.
 * @dev Sets maximum log level to INFO and customizes the log format without timestamps, targets, or levels.
 * @functionality Enables structured logging output for diagnostics and monitoring during execution.
 */
pub fn init_tracing() {
    let _ = fmt()
        .with_max_level(tracing::Level::INFO)
        .with_test_writer()
        .event_format(fmt::format().compact().without_time().with_target(false).with_level(false))
        .try_init();
}

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
/*
 * @title Get User Principal
 * @notice Returns a predefined principal ID.
 * @dev Converts a fixed text representation into a Principal type.
 * @functionality Returns a predefined principal for the user.
 */
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
#[allow(clippy::cmp_owned)]
pub fn get_users_principal(index: Nat) -> Result<Principal, String> {
    if index == Nat::from(1u32) {
        Ok(Principal::from_text(TESTER_1).unwrap())
    } else if index == Nat::from(2u32) {
        Ok(Principal::from_text(TESTER_4).unwrap())
    } else if index == Nat::from(3u32) {
        Ok(Principal::from_text(TESTER_5).unwrap())
    } else if index == Nat::from(4u32) {
        Ok(Principal::from_text(TESTER_6).unwrap())
    } else if index == Nat::from(5u32) {
        Ok(Principal::from_text(TESTER_7).unwrap())
    } else if index == Nat::from(6u32) {
        Ok(Principal::from_text(TESTER_8).unwrap())
    } else {
        info!("No valid input.");
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
    vec![TESTER_1, TESTER_2, TESTER_3, TESTER_4, TESTER_5]
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
    let result = pic.query_call(
        backend_canister,
        Principal::anonymous(),
        "get_asset_principal_certified", // This should return a tuple (Principal, Certificate)
        encode_one(asset.clone()).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(response_data)) => {
            // Try to decode the tuple: (Principal, Certificate)
            match decode_one::<Result<(Principal, Certificate), errors::Error>>(&response_data) {
                Ok(Ok((principal, _certificate))) => Some(principal),
                Ok(Err(err)) => {
                    info!("Error retrieving asset principal: {:?}\n", err.message());
                    None
                }
                Err(decode_err) => {
                    info!(
                        "Error decoding asset principal response: {:?}\n",
                        decode_err
                    );
                    None
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            info!("Query call rejected: {}", reject_message);
            None
        }
        Err(call_err) => {
            info!("Query call failed: {}", call_err);
            None
        }
    }
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
    info!("🟦 ICRC2 Approving ...");
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
                    info!("☑️  Approve succeeded, block index: {}\n", block_index);
                    info!("---------------------------------------------------\n");
                    true
                }
                Ok(ApproveResult::Err(error)) => {
                    info!("Output Error: Approve failed with error: {:?}", error);
                    false
                }
                Err(e) => {
                    info!("Output Error: Failed to decode ApproveResult: {:?}", e);
                    false
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            info!("Output Error: Approve call rejected: {}", reject_message);
            false
        }
        Err(e) => {
            info!("Output Error: Error during approve call: {:?}", e);
            false
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
        user_principal: get_users_principal(Nat::from(2u32)).unwrap(),
        asset_supply: "ckETH".to_string(),
        asset_borrow: "ckETH".to_string(),
        supply_tokens: Nat::from(14_000_000u128), // 0.14 cketh
        borrow_tokens: Nat::from(12_000_000u128), // 0.12 cketh
    });
    // Pushing third user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(3u32)).unwrap(),
        asset_supply: "ckBTC".to_string(),
        asset_borrow: "ckBTC".to_string(),
        supply_tokens: Nat::from(440_000u128), // 0.0044 btc
        borrow_tokens: Nat::from(410_000u128), // 0.0041 btc
    });
    // Pushing 4th user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(4u32)).unwrap(),
        asset_supply: "ckUSDC".to_string(),
        asset_borrow: "ckUSDC".to_string(),
        supply_tokens: Nat::from(44_000_000_000u128), // 440 usdc
        borrow_tokens: Nat::from(40_000_000_000u128), // 400 usdt
    });
    // // Pushing 5th user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(5u32)).unwrap(),
        asset_supply: "ckUSDT".to_string(),
        asset_borrow: "ckUSDT".to_string(),
        supply_tokens: Nat::from(29_000_000_000u128), // 290 USDT
        borrow_tokens: Nat::from(25_000_000_000u128), // 250 USDT
    });

    for user in &users_with_low_health {
        let asset_principal =
            match test_get_asset_principal(user.asset_supply.clone(), pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    continue;
                }
            };
        info!("user : {:?}", user.user_principal.to_string());
        let approved = test_icrc2_aprove(
            user.user_principal,
            asset_principal,
            pic,
            backend_canister,
            user.supply_tokens.clone()

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
                        info!(
                            "✅ Create_user_reserve_with_low_health function succeeded"
                        );
                    }
                    Err(e) => {
                        info!(
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
        "add_admin_test",
        encode_args(("tester".to_string(), tester_principal)).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let add_tester_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match add_tester_response {
                Ok(_e) => {
                    info!("✅ Add Tester function succeeded");
                }
                Err(e) => {
                    info!("Add Tester function failed as expected with error: {:?}", e);
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
    let result = pic.query_call(
        backend_canister,
        get_user_principal(),
        "get_reserve_data_certified",
        encode_one(asset.to_string()).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            // Decode as: Result<(ReserveData, Certificate), Error>
            let decoded_result =
                decode_one::<Result<(ReserveData, Certificate), errors::Error>>(&reply);

            match decoded_result {
                Ok(Ok((balance, _certificate))) => {
                    info!(
                        "Reserve Data - Last Update Timestamp for {}: {:?}",
                        asset,
                        balance.last_update_timestamp
                    );
                    info!(
                        "Reserve Data - Asset Supply for {}: {:?}",
                        asset,
                        balance.asset_supply
                    );
                    info!(
                        "Reserve Data - Asset Borrow for {}: {:?}",
                        asset,
                        balance.asset_borrow
                    );
                    info!(
                        "Reserve Data - Debt Index for {}: {:?}",
                        asset,
                        balance.debt_index
                    );
                    info!(
                        "Reserve Data - Liquidity Index for {}: {:?}",
                        asset,
                        balance.liquidity_index
                    );
                    info!(
                        "Reserve Data - Borrow Rate for {}: {:?}",
                        asset,
                        balance.borrow_rate
                    );
                    info!(
                        "Reserve Data - Current Liquidity Rate for {}: {:?}",
                        asset,
                        balance.current_liquidity_rate
                    );
                }
                Ok(Err(error)) => {
                    info!(
                        "Backend returned an error for {}: {:?}",
                        asset,
                        error.message()
                    );
                }
                Err(decode_error) => {
                    info!("Decoding error for {}: {:?}", asset, decode_error);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            info!("Query rejected for {}: {}", asset, reject_message);
        }
        Err(e) => {
            info!("Error retrieving reserve data for {}: {:?}", asset, e);
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
    let result = pic.query_call(
        backend_canister,
        *user_principal,
        "get_user_data",
        encode_one(*user_principal).unwrap(),
    );

    match result {
        Ok(WasmResult::Reply(reply)) => {
            // Decode response as Result<(UserData, Certificate), Error>
            let decoded_result =
                candid::decode_one::<Result<(UserData, Certificate), errors::Error>>(&reply);

            match decoded_result {
                Ok(Ok((user_data, _certificate))) => {
                    if let Some(reserves) = &user_data.reserves {
                        if let Some((_, reserve_data)) =
                            reserves.iter().find(|(name, _)| name == asset)
                        {
                            info!(
                                "✅ User Data (Certified) for {} | Last Update Timestamp: {:?}",
                                asset,
                                reserve_data.last_update_timestamp
                            );
                            info!(
                                "dToken Balance: {:?}, Debt Token Balance: {:?}",
                                reserve_data.d_token_balance,
                                reserve_data.debt_token_balance
                            );
                            info!(
                                "Liquidity Index: {:?}, Variable Borrow Index: {:?}",
                                reserve_data.liquidity_index,
                                reserve_data.variable_borrow_index
                            );
                        } else {
                            info!("No reserve data found for asset: {}", asset);
                        }
                    } else {
                        info!("No reserves found in user data.");
                    }
                }
                Ok(Err(error)) => {
                    error!(
                        "Error fetching user data for {}: {}",
                        user_principal,
                        error.message()
                    );
                }
                Err(decode_error) => {
                    error!(
                        "❌ Failed to decode certified user data for {}: {:?}",
                        user_principal,
                        decode_error
                    );
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            error!(
                "❌ Certified query rejected for {}: {}",
                user_principal,
                reject_message
            );
        }
        Err(e) => {
            error!(
                "❌ Query call error while retrieving certified user data for {}: {:?}",
                user_principal,
                e
            );
        }
    }
}

