use crate::api::resource_manager::{acquire_lock, release_lock};
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::get_cached_exchange_rate;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::api;
use ic_cdk::api::time;
use ic_cdk::{call, query};
use ic_cdk_macros::update;
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

// Define a struct to hold request count and last request time
#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct RequestTracker {
    count: u32,
    last_request_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct BlockedUserDetails {
    blocked_time: u64,
}

/*
 * @title Asset Transfer From Function
 * @notice Transfers assets from one principal to another using the ICRC-2 standard.
 * @dev This function interacts with the specified ledger canister to execute a `icrc2_transfer_from` call.
 *      It enables asset transfers between users, with optional memo and timestamp settings.
 *
 * # Parameters
 * - `ledger_canister_id` - The Principal of the ledger canister handling the asset.
 * - `from` - The Principal of the sender account.
 * - `to` - The Principal of the recipient account.
 * - `amount` - The amount of the asset to transfer.
 *
 * # Returns
 * Returns the transferred amount as `Nat` if successful, otherwise returns an error message.
 */
pub async fn asset_transfer_from(
    ledger_canister_id: Principal,
    from: Principal,
    to: Principal,
    amount: Nat,
) -> Result<Nat, String> {
    ic_cdk::println!(
        "Initiating asset transfer from {:?} to {:?} of amount {:?} via ledger_canister_id {:?}",
        from,
        to,
        amount,
        ledger_canister_id
    );

    let args = TransferFromArgs {
        to: TransferAccount {
            owner: to,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        from: TransferAccount {
            owner: from,
            subaccount: None,
        },
        memo: None,
        created_at_time: None,
        amount,
    };

    match call(ledger_canister_id, "icrc2_transfer_from", (args,)).await {
        Ok((result,)) => match result {
            TransferFromResult::Ok(balance) => {
                ic_cdk::println!("Transfer successful. New balance: {:?}", balance);
                Ok(balance)
            }
            TransferFromResult::Err(err) => {
                ic_cdk::println!("Transfer failed with error: {:?}", err);
                Err(format!("{:?}", err))
            }
        },
        Err(e) => {
            ic_cdk::println!("Call to ledger canister failed: {:?}", e.1);
            Err(e.1)
        }
    }
}

/*
 * @title Asset Transfer Function
 * @notice Transfers assets to a specified principal using the ICRC-1 standard.
 * @dev Calls the ledger canister to execute `icrc1_transfer`, allowing direct asset transfers.
 *
 * # Parameters
 * - `to` - The Principal of the recipient.
 * - `ledger` - The Principal of the ledger canister handling the asset.
 * - `from` - The Principal of the sender account.
 * - `amount` - The amount of the asset to transfer.
 *
 * # Returns
 * Returns the transferred amount as `Nat` if successful, otherwise returns an error message.
 */
pub async fn asset_transfer(
    to: Principal,
    ledger: Principal,
    from: Principal,
    amount: Nat,
) -> Result<Nat, String> {
    let token_args = TransferArgs {
        to: TransferAccount {
            owner: to,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: amount.clone(),
    };

    let (new_result,): (TransferFromResult,) =
        call(ledger, "icrc1_transfer", (token_args, false, Some(from)))
            .await
            .map_err(|e| e.1)?;
    ic_cdk::println!(
        "asset_transfer executed successfully and the call result : {:?}",
        new_result
    );
    match new_result {
        TransferFromResult::Ok(balance) => Ok(balance),
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    }
}

/*
 * @title Get Account Balance
 * @notice Fetches the balance of a given principal from a specified ledger canister.
 * @dev Calls `icrc1_balance_of` on the ledger canister to retrieve the balance of the provided principal.
 *      Uses `call_raw` for efficient interaction with the canister.
 *
 * # Parameters
 * - `canister` - The Principal of the ledger canister.
 * - `principal` - The Principal of the account whose balance is being queried.
 *
 * # Returns
 * Returns the account balance as `Nat` if successful, otherwise returns an `Error`.
 */
pub async fn get_balance(canister: Principal, principal: Principal) -> Result<Nat, Error> {
    if canister == Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
    }

    // Validate the principal
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
    }
    let account = Account {
        owner: principal,
        subaccount: None,
    };

    let encoded_args_result = encode_args((account,));
    let encoded_args = match encoded_args_result {
        Ok(args) => args,
        Err(err) => {
            ic_cdk::println!("Error encoding arguments: {:?}", err);
            return Err(Error::ErrorEncoding);
        }
    };

    let raw_response_result =
        ic_cdk::api::call::call_raw(canister, "icrc1_balance_of", &encoded_args, 0).await;
    let raw_response = match raw_response_result {
        Ok(response) => {
            ic_cdk::println!("Call succeeded with response: {:?}", response);
            response
        }
        Err((code, message)) => {
            ic_cdk::println!("Call failed with code: {:?}, message: {}", code, message);
            return Err(Error::ErrorRawResponse);
        }
    };

    let balance_result = decode_one(&raw_response);
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            ic_cdk::println!("Error decoding balance: {:?}", err);
            return Err(Error::ErrorDecoding);
        }
    };
    Ok(balance)
}

/*
 * @title Retrieve Total Token Supply
 * @notice Queries the total supply of tokens from a specified ledger canister.
 * @dev Calls the `icrc1_total_supply` method of the given `canister_id` to fetch the total supply.
 *      Ensures that the provided `canister_id` is valid and not an anonymous principal.
 *
 * # Parameters
 * - `canister_id` - The principal of the ledger canister from which to retrieve the total supply.
 *
 * # Returns
 * Returns the total supply of tokens as `Nat`.
 */
#[query]
pub async fn get_total_supply(canister_id: Principal) -> Result<Nat, Error> {
    if canister_id == Principal::anonymous() {
        return Err(Error::AnonymousPrincipal);
    }

    let raw_response: Result<(Nat,), _> =
        ic_cdk::api::call::call(canister_id, "icrc1_total_supply", ()).await;

    match raw_response {
        Ok((balance,)) => Ok(balance),
        Err(e) => {
            ic_cdk::println!("Error calling icrc1_total_supply: {:?}", e);
            Err(Error::ErrorRawResponse)
        }
    }
}

/*
 * @title Token Faucet
 * @notice This function allows users to request tokens from the faucet for a specified asset and amount.
 * @dev The function performs several validation checks, updates user data, and transfers tokens from the platform to the user.
 *
 * # Parameters
 * - `asset` - The asset symbol (e.g., "ETH", "BTC"). Must be non-empty and <= 7 characters.
 * - `amount` - The amount of tokens to request. Must be greater than zero.
 *
 * # Returns
 * - `Ok(Nat)` - The new balance after the transfer.
 */
#[update]
pub async fn faucet(asset: String, amount: Nat) -> Result<Nat, Error> {
    ic_cdk::println!("Starting faucet with params: {:?} {:?}", asset, amount);

    if asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }


    #[cfg(feature = "canbench-rs")]
    let user_principal = Principal::from_text("lona2-5tsnx-yhmi2-nidyd-foxvu-4fpvi-gfqn2-ufwlm-7rrqy-ulxua-2ae").unwrap();

    #[cfg(not(feature = "canbench-rs"))]
    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    ic_cdk::println!("user ledger id {:?}", user_principal.to_string());

    if let Err(e) = request_limiter("faucet") {
        ic_cdk::println!("Error limiting error: {:?}", e);
        return Err(e);
    }

    let operation_key = user_principal;
    // Acquire the lock
    {
        if let Err(e) = acquire_lock(&operation_key) {
            ic_cdk::println!("Lock acquisition failed: {:?}", e);
            return Err(Error::LockAcquisitionFailed);
        }
    }

    let result = async {
        let user_data_result = user_data(user_principal);

        let mut user_data = match user_data_result {
            Ok(data) => {
                ic_cdk::println!("User found");
                data
            }
            Err(e) => {
                return Err(e);
            }
        };

        let ledger_canister_id = mutate_state(|state| {
            let reserve_list = &state.reserve_list;
            reserve_list
                .get(&asset.to_string().clone())
                .map(|principal| principal.clone())
                .ok_or_else(|| Error::NoCanisterIdFound)
        })?;

        let platform_principal = ic_cdk::api::id();
        ic_cdk::println!("Platform principal: {:?}", platform_principal);

        let balance_result = get_balance(ledger_canister_id, platform_principal).await;
        let balance = match balance_result {
            Ok(bal) => bal,
            Err(e) => {
                return Err(e);
            }
        };

        ic_cdk::println!("balance of wallet = {}", balance);

        if amount > balance {
            ic_cdk::println!("wallet balance is low");
            return Err(Error::LowWalletBalance);
        }

        let mut rate: Option<Nat> = None;

        match get_cached_exchange_rate(asset.clone()) {
            Ok(price_cache) => {
                if let Some(cached_price) = price_cache.cache.get(&asset) {
                    let amount = cached_price.price.clone();
                    rate = Some(amount);
                    ic_cdk::println!("Fetched exchange rate for {}: {:?}", asset, rate);
                } else {
                    ic_cdk::println!("No cached price found for {}", asset);
                    rate = None;
                }
            }
            Err(err) => {
                ic_cdk::println!("Error fetching exchange rate for {}: {:?}", asset, err);
                rate = None;
            }
        }

        let usd_amount = ScalingMath::scaled_mul(amount.clone(), rate.clone().unwrap());

        ic_cdk::println!(
            "usd amount of the facut = {}, {}",
            usd_amount,
            rate.unwrap()
        );

        let user_reserve = user_reserve(&mut user_data, &asset);
        ic_cdk::println!("user reserve = {:?}", user_reserve);

        if let Some((_, user_reserve_data)) = user_reserve {
            ic_cdk::println!("inside if statement");
            ic_cdk::println!(
                "faucet user_reserve_data.faucet_limit = {}",
                user_reserve_data.faucet_limit
            );
            if usd_amount.clone() > user_reserve_data.faucet_limit {
                ic_cdk::println!("amount is too much");
                return Err(Error::AmountExceedsLimit);
            }

            if (user_reserve_data.faucet_usage.clone() + usd_amount.clone())
                > user_reserve_data.faucet_limit
            {
                ic_cdk::println!("amount is too much second");
                return Err(Error::ExceedsRemainingLimit);
            }
            user_reserve_data.faucet_usage += usd_amount;
            ic_cdk::println!("if faucet usage = {}", user_reserve_data.faucet_usage);
        } else {
            let mut new_reserve = UserReserveData {
                reserve: asset.clone(),
                is_collateral: true,
                ..Default::default()
            };

            if usd_amount > new_reserve.faucet_limit {
                ic_cdk::println!("amount is too much");
                return Err(Error::AmountExceedsLimit);
            }

            if (new_reserve.faucet_usage.clone() + usd_amount.clone())
                > new_reserve.faucet_limit.clone()
            {
                ic_cdk::println!("amount is too much second");
                return Err(Error::ExceedsRemainingLimit);
            }

            new_reserve.faucet_usage += usd_amount;
            ic_cdk::println!("else faucet usage = {}", new_reserve.faucet_usage);

            if let Some(ref mut reserves) = user_data.reserves {
                reserves.push((asset.clone(), new_reserve.clone()));
            } else {
                user_data.reserves = Some(vec![(asset.clone(), new_reserve.clone())]);
            }

            ic_cdk::println!(
                "faucet new_reserve.faucet_usage = {}",
                new_reserve.faucet_usage
            );
        }

        ic_cdk::println!("user data before submit = {:?}", user_data);

        // Ask: dont you think that this should be on the last of the code.
        mutate_state(|state| {
            state
                .user_profile
                .insert(user_principal, Candid(user_data.clone()));
        });

        ic_cdk::println!("updated user data = {:?}", user_data);

        match asset_transfer_from(
            ledger_canister_id,
            platform_principal,
            user_principal,
            amount.clone(),
        )
        .await
        {
            Ok(new_balance) => {
                ic_cdk::println!("Asset transfer from backend to user executed successfully");
                Ok(new_balance)
            }
            Err(_) => {
                return Err(Error::ErrorFaucetTokens);
            }
        }
    }
    .await;

    ic_cdk::println!("Faucet result: {:?}", result);

    // Release the lock
    if let Err(e) = release_lock(&operation_key) {
        ic_cdk::println!("Failed to release lock: {:?}", e);
        return Err(e);
    }

    result
}

/*
 * @title Reset Faucet Usage
 * @notice This function resets the faucet usage for a specified user by setting their faucet usage to zero.
 * @dev It validates the caller, retrieves the user data, resets the faucet usage, and updates the state.
 *
 * # Parameters
 * - `user_principal` - The principal of the user whose faucet usage is to be reset.
 *
 * # Returns
 * - `Ok(())` - If the faucet usage is successfully reset.
 */
pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {
    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found");
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    // Access and mutate reserves
    if let Some(user_data_reserves) = user_data.reserves.as_mut() {
        for (_reserve_name, user_reserve_data) in user_data_reserves.iter_mut() {
            user_reserve_data.faucet_usage = Nat::from(0u128);
        }
    } else {
        return Err(Error::NoUserReserveDataFound);
    }

    ic_cdk::println!("User data after faucet reset = {:?}", user_data);

    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

    ic_cdk::println!("updated user data after facuet reset = {:?}", user_data);
    Ok(())
}

/*
 * @title Cycle Checker
 * @notice Retrieves the current cycle balance of the canister.
 * @dev Uses `canister_balance128` API to fetch the balance and return it as a `Nat`.
 *
 * # Returns
 * - `Nat` - The current cycle balance of the canister.
 */
#[query]
pub async fn cycle_checker() -> Result<Nat, Error> {
    #[cfg(feature = "canbench-rs")]
    let caller = Principal::from_text("lona2-5tsnx-yhmi2-nidyd-foxvu-4fpvi-gfqn2-ufwlm-7rrqy-ulxua-2ae").unwrap();

    #[cfg(not(feature = "canbench-rs"))]
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() || !ic_cdk::api::is_controller(&ic_cdk::api::caller()) {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }
    Ok(Nat::from(api::canister_balance128()))
}

const REQUEST_LIMIT: u32 = 100;// Maximum allowed requests within the defined time window
const TIME_WINDOW: u64 = 3600; // Time window in seconds (one hour)
const BLOCK_DURATION: u64 = 4300; // Block duration in seconds (12 hours = 43200 seconds)

pub fn request_limiter(function_name: &str) -> Result<(), Error> {
    let caller_id = ic_cdk::caller();
    let current_time_stamp = current_timestamp();

    ic_cdk::println!(
        "[RequestLimiter] Caller: {:?}, Function: {}, Timestamp: {}",
        caller_id,
        function_name,
        current_time_stamp
    );

    // Check if user is blocked for this specific function
    let is_blocked = mutate_state(|state| {
        state
            .blocked_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(function_name).cloned())
            .map(|details| details.blocked_time > current_time_stamp)
            .unwrap_or(false)
    });

   let tocheck=   read_state(|state| {
        state
            .blocked_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(function_name).cloned())
    });

    ic_cdk::println!("tocheck request limiter = {:?}", tocheck);

    if is_blocked {
        ic_cdk::println!(
            "[RequestLimiter] User {:?} is blocked from '{}' until further notice",
            caller_id,
            function_name
        );
        return Err(Error::BLOCKEDFORONEHOUR);
    }

    // Retrieve user's request history
    let mut user_requests = mutate_state(|state| {
        state
            .requests
            .get(&caller_id)
            .map(|candid| candid.0.clone())
            .unwrap_or_default()
    });

    // Get the request tracker for the specific function or initialize it
    let mut entry = user_requests
        .get(function_name)
        .cloned()
        .unwrap_or(RequestTracker {
            count: 0,
            last_request_time: current_time_stamp,
        });

    // Reset request count if outside the time window
    if current_time_stamp - entry.last_request_time > TIME_WINDOW {
        ic_cdk::println!(
            "[RequestLimiter] Resetting count for function: {}",
            function_name
        );
        entry.count = 0;
        entry.last_request_time = current_time_stamp;
    }

    // Increment the request count
    entry.count += 1;
    ic_cdk::println!(
        "[RequestLimiter] Updated count for '{}': {}",
        function_name,
        entry.count
    );

    if entry.count > REQUEST_LIMIT {
        ic_cdk::println!(
            "[RequestLimiter] Blocking user {:?} from calling '{}' for {} seconds",
            caller_id,
            function_name,
            BLOCK_DURATION
        );

        // Retrieve existing blocked functions or create new map
        let mut blocked_functions = mutate_state(|state| {
            state
                .blocked_users
                .get(&caller_id)
                .map(|candid| candid.0.clone())
                .unwrap_or_default()
        });

        // Block only this function
        blocked_functions.insert(
            function_name.to_string(),
            BlockedUserDetails {
                blocked_time: current_time_stamp + BLOCK_DURATION,
            },
        );

        // Save updated blocked functions list
        mutate_state(|state| {
            state
                .blocked_users
                .insert(caller_id, Candid(blocked_functions));
        });

        // Remove tracking data for this function only, not all requests
        user_requests.remove(function_name);

        // Save updated request history
        mutate_state(|state| {
            state.requests.insert(caller_id, Candid(user_requests));
        });

        return Err(Error::BLOCKEDFORONEHOUR);
    }

    // Update the function's request tracker in the BTreeMap
    user_requests.insert(function_name.to_string(), entry);

    // Save the updated request history
    mutate_state(|state| {
        state.requests.insert(caller_id, Candid(user_requests));
    });

    ic_cdk::println!(
        "[RequestLimiter] Request successfully stored for '{}' by {:?}",
        function_name,
        caller_id
    );
    Ok(())
}

//TODO: remove it later.
#[query]
pub fn retrieve_request_info(caller_id: Principal) -> Vec<(String, u32)> {
    // let caller_id = ic_cdk::caller();
    read_state(|state| {
        state
            .requests
            .get(&caller_id)
            .map(|candid| {
                candid
                    .0
                    .iter()
                    .map(|(function, tracker)| (function.clone(), tracker.count)) // Extract only function name & count
                    .collect::<Vec<(String, u32)>>()
            })
            .unwrap_or_default()
    })
}

// #[update]
// pub fn unblock_user(user_id: Principal) -> String {
//     let caller = ic_cdk::caller();

//     if caller == Principal::anonymous() || !ic_cdk::api::is_controller(&ic_cdk::api::caller()) {
//         ic_cdk::println!("Unauthorized access attempt");
//         return "Unauthorized: Only the controller can unblock users.".to_string();
//     }

//     let removed = mutate_state(|state| state.blocked_users.remove(&user_id));

//     if removed.is_some() {
//         format!("User {} has been unblocked successfully.", user_id)
//     } else {
//         format!("User {} was not in the blocked list.", user_id)
//     }
// }

fn current_timestamp() -> u64 {
    time() / 1_000_000_000
}

// async fn send_admin_notifications(stage: &str, asset: String) -> Result<(), Error> {
//     let message = match stage {
//         "initial" => format!("Dear Admin,\n\nThe platform's faucet balance for {} is low. Immediate action is required to mint more tokens.\n\nBest regards,\nYour Platform Team", asset),
//         "mid" => format!("Dear Admin,\n\nUrgent: The platform's faucet balance for {} is 0. Please ensure tokens are minted soon to avoid user disruption.\n\nBest regards,\nYour Platform Team", asset),
//         "final" => format!("Dear Admin,\n\nReminder: The platform's faucet balance for {} is nearly depleted. Immediate minting of tokens is necessary to prevent users from being unable to claim tokens.\n\nBest regards,\nYour Platform Team", asset),
//         _ => "".to_string(),
//     };

//     let subject = "Faucet Amount Low - Mint More Tokens".to_string();
//     if let Err(e) = send_email_via_sendgrid(subject, message).await {
//         ic_cdk::println!("Failed to send email: {:?}", e);
//         return Err(e);
//     }
//     Ok(())
// }

// pub async fn send_email_via_sendgrid(subject: String, message: String) -> Result<String, Error> {
//     let url = "https://api.sendgrid.com/v3/mail/send";
//     let api_key = "";

//     let request_headers = vec![
//         HttpHeader {
//             name: "Authorization".to_string(),
//             value: format!("Bearer {}", api_key),
//         },
//         HttpHeader {
//             name: "Content-Type".to_string(),
//             value: "application/json".to_string(),
//         },
//     ];

//     ic_cdk::println!("Headers prepared: {:?}", request_headers);

//     let email_data = json!( {
//         "personalizations": [
//             {
//                 "to": [{"email": "sativikverma@gmail.com"}],
//                 "subject": subject
//             }
//         ],
//         "from": { "email": "jyotirmay2000gupta@gmail.com" },
//         "content": [
//             {
//                 "type": "text/plain",
//                 "value": message,
//             }
//         ]
//     });

//     ic_cdk::println!("Email data prepared: {}", email_data);

//     let request_body: Option<Vec<u8>> = Some(email_data.to_string().as_bytes().to_vec());

//     let request = CanisterHttpRequestArgument {
//         url: url.to_string(),
//         method: HttpMethod::POST,
//         body: request_body,
//         max_response_bytes: None,
//         transform: None,
//         headers: request_headers,
//     };

//     ic_cdk::println!("Request prepared: {:?}", request);

//     // Send the HTTP request to SendGrid
//     let timeout = 120_000_000_000;
//     ic_cdk::println!("Sending HTTP request with timeout: {}", timeout);

//     match http_request(request, timeout).await {
//         Ok((response,)) => {
//             let response_body =
//                 String::from_utf8(response.body).expect("Response body is not UTF-8 encoded.");
//             ic_cdk::println!("Email sent successfully. Response body: {}", response_body);
//             Ok("Email sent successfully".to_string())
//         }
//         Err((r, m)) => {
//             ic_cdk::println!("Error sending email. RejectionCode: {:?}, Error: {}", r, m);
//             Err(Error::EmailError)
//         }
//     }
// }
