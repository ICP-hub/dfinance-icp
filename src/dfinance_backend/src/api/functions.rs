use crate::api::resource_manager::{acquire_lock, release_lock};
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::MAX_ASSET_LENGTH;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::get_cached_exchange_rate;
use crate::guards::{guard_controller_only, guard_prevent_anonymous, to_check_controller};
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::math::math_utils::{current_timestamp, ScalingMath};
use crate::protocol::libraries::types::datatypes::{RequestTracker,BlockedUserDetails, UserReserveData};
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::api;
use ic_cdk::{call, query};
use ic_cdk_macros::update;
use serde::Serialize;
use crate::constants::constant_variables::constants::{
    REQUEST_LIMIT, TIME_WINDOW, BLOCK_DURATION,
};

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

/*
 * @title Asset Transfer From Function
 * @notice Transfers assets from one principal to another using the ICRC-2 standard.
 * @dev This function interacts with the specified ledger canister to execute a `icrc2_transfer_from` call.
 *      It enables asset transfers between users, with optional memo and timestamp settings.
 * @functionality Token transfer functionality using ICRC-2 standard where a pre-approved spender can transfer tokens from one account to another
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
 * @functionality Direct token transfer functionality using ICRC-1 standard for sending tokens from one account to another
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
 * @functionality Account balance query functionality that allows checking token balances for any account
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
 * @functionality Token metadata functionality that allows querying the total supply of tokens in circulation
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
 * @functionality Test token distribution functionality that provides users with tokens for testing purposes with rate limiting
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

    // prevent anonymous caller
    guard_prevent_anonymous()?;

    ic_cdk::println!("Starting faucet with params: {:?} {:?}", asset, amount);

    // if asset.trim().is_empty() {
    //     ic_cdk::println!("Asset cannot be an empty string");
    //     return Err(Error::EmptyAsset);
    // }

    // if asset.len() > MAX_ASSET_LENGTH {
    //     ic_cdk::println!("Asset must have a maximum length of 7 characters");
    //     return Err(Error::InvalidAssetLength);
    // }
    
    // input asset validator
    validate_asset_name(&asset)?;
    validate_zero_value(&amount)?;

    // if amount <= zero_nat_value() {
    //     ic_cdk::println!("Amount cannot be zero");
    //     return Err(Error::InvalidAmount);
    // }

    let user_principal = ic_cdk::caller();

    // if user_principal == Principal::anonymous() {
    //     ic_cdk::println!("Anonymous principals are not allowed");
    //     return Err(Error::AnonymousPrincipal);
    // }

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

        let asset_price = match get_cached_exchange_rate(asset.clone()) {
            Ok(price) => price,
            Err(e) => {
                ic_cdk::println!("Failed to fetch exchange rate");
                return Err(e);
            }
        };
        ic_cdk::println!("asset price = {}",asset_price);

        let usd_amount = ScalingMath::scaled_mul(amount.clone(),asset_price.clone());

        ic_cdk::println!(
            "usd amount of the facut = {}, {}",
            usd_amount,
            asset_price
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
 * @functionality Administrative functionality that allows resetting a user's faucet usage to enable additional token requests
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
    let mut user_data = user_data(user_principal)?;

    // let mut user_data = match user_data_result {
    //     Ok(data) => {
    //         ic_cdk::println!("User found");
    //         data
    //     }
    //     Err(e) => {
    //         return Err(e);
    //     }
    // };

    // Access and mutate reserves
    if let Some(user_data_reserves) = user_data.reserves.as_mut() {
        for (_reserve_name, user_reserve_data) in user_data_reserves.iter_mut() {
            user_reserve_data.faucet_usage = zero_nat_value();
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
 * @functionality Canister monitoring functionality that allows checking the remaining computational resources
 *
 * # Returns
 * - `Nat` - The current cycle balance of the canister.
 */
#[query]
pub async fn cycle_checker() -> Result<Nat, Error> {
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() || !to_check_controller() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }
    Ok(Nat::from(api::canister_balance128()))
}


/*
 * @title Request Rate Limiter
 * @notice Implements a request rate limiting mechanism to prevent abuse of functions.
 * @dev Tracks request counts per function within a time window and blocks users who exceed limits.
 * @functionality Security functionality that implements rate limiting to prevent API abuse and DDoS attacks
 *
 * # Parameters
 * - `function_name` - The name of the function being called, used to track specific function usage.
 *
 * # Returns
 * - `Ok(())` - If the request is allowed to proceed.
 * - `Err(Error)` - If the user is blocked or exceeds the request limit.
 */
pub fn request_limiter(function_name: &str) -> Result<(), Error> {
    let caller_id = ic_cdk::caller();
    let current_time_stamp = current_timestamp();

    // if caller_id == Principal::anonymous() {
    //     ic_cdk::println!("principals are not allowed");
    //     return Err(Error::InvalidPrincipal);
    // }

    // Check if user is blocked for this specific function
    let is_blocked = mutate_state(|state| {
        state
            .restrict_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(function_name).cloned())
            .map(|details| details.blocked_time > current_time_stamp)
            .unwrap_or(false)
    });

    let tocheck = read_state(|state| {
        state
            .restrict_users
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
            .userrequests
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
                .restrict_users
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
                .restrict_users
                .insert(caller_id, Candid(blocked_functions));
        });

        // Remove tracking data for this function only, not all requests
        user_requests.remove(function_name);

        // Save updated request history
        mutate_state(|state| {
            state.userrequests.insert(caller_id, Candid(user_requests));
        });

        return Err(Error::BLOCKEDFORONEHOUR);
    }

    // Update the function's request tracker in the BTreeMap
    user_requests.insert(function_name.to_string(), entry);

    // Save the updated request history
    mutate_state(|state| {
        state.userrequests.insert(caller_id, Candid(user_requests));
    });

    ic_cdk::println!(
        "[RequestLimiter] Request successfully stored for '{}' by {:?}",
        function_name,
        caller_id
    );
    Ok(())
}

/*
 * @title Retrieve User Request Information
 * @notice Retrieves information about a user's API requests, showing function names and count.
 * @dev Only callable by controllers, returns a vector of function names and their request counts.
 * @functionality Administrative monitoring functionality that allows checking API usage patterns for specific users
 *
 * # Parameters
 * - `caller_id` - The Principal of the user whose request information is being retrieved.
 *
 * # Returns
 * - `Ok(Vec<(String, u32)>)` - Vector of function names and their request counts.
 * - `Err(Error)` - If the caller is not authorized or the principal is invalid.
 */
#[query]
pub fn retrieve_request_info(caller_id: Principal) -> Result<Vec<(String, u32)>, Error> {
    // let caller_id = ic_cdk::caller();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    if !to_check_controller() {
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }

    Ok(read_state(|state| {
        state
            .userrequests
            .get(&caller_id)
            .map(|candid| {
                candid
                    .0
                    .iter()
                    .map(|(function, tracker)| (function.clone(), tracker.count)) // Extract only function name & count
                    .collect::<Vec<(String, u32)>>()
            })
            .unwrap_or_default()
    }))
}



/*
 * @title Retrieve Blocked User Information
 * @notice Retrieves information about functions for which a user is blocked.
 * @dev Only callable by controllers, returns function names and block expiration timestamps.
 * @functionality Administrative security functionality that allows checking which users are currently blocked from specific functions
 *
 * # Parameters
 * - `caller_id` - The Principal of the user whose block information is being retrieved.
 *
 * # Returns
 * - `Ok(Vec<(String, u64)>)` - Vector of function names and block expiration timestamps.
 * - `Err(Error)` - If the caller is not authorized or the principal is invalid.
 */
#[query]
pub fn retrieve_blocked_users(caller_id: Principal) -> Result<Vec<(String, u64)>, Error> {

    // Allow only controller to access this function
    guard_controller_only()?;

    Ok(read_state(|state| {
        state
            .restrict_users
            .get(&caller_id)
            .map(|candid| {
                candid
                    .0
                    .iter()
                    .map(|(function, details)| (function.clone(), details.blocked_time)) // Extract function name & blocked timestamp
                    .collect::<Vec<(String, u64)>>()
            })
            .unwrap_or_default()
    }))
}

/*
 * @title Remove Function Block
 * @notice Removes a block on a specific function for a user.
 * @dev Only callable by controllers, allows administrators to manually unblock user access.
 * @functionality Administrative security functionality that allows removing function-specific blocks for users
 *
 * # Parameters
 * - `caller_id` - The Principal of the user whose block is being removed.
 * - `function_name` - The name of the function to unblock.
 *
 * # Returns
 * - `Ok(())` - If the block was successfully removed.
 * - `Err(Error)` - If the caller is not authorized or the block doesn't exist.
 */
#[update]
pub fn remove_blocked_function(caller_id: Principal, function_name: String) -> Result<(), Error> {

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    if !to_check_controller() {
        ic_cdk::println!("Only controller allowed");
        return Err(Error::ErrorNotController);
    }

    mutate_state(|state| {
        if let Some(mut candid) = state.restrict_users.get(&caller_id) {
            let blocked_functions = &mut candid.0; // Get the inner BTreeMap

            if blocked_functions.remove(&function_name).is_some() {
                ic_cdk::println!(
                    "[RequestLimiter] Unblocked function '{}' for user {:?}",
                    function_name,
                    caller_id
                );

                // If no functions remain blocked, remove the user from the blocked list
                if blocked_functions.is_empty() {
                    state.restrict_users.remove(&caller_id);
                } else {
                    state
                        .restrict_users
                        .insert(caller_id, Candid(blocked_functions.clone()));
                }

                return Ok(());
            }
        }

        ic_cdk::println!(
            "[RequestLimiter] Function '{}' not found in blocked list for user {:?}",
            function_name,
            caller_id
        );
        Err(Error::ErrorNotController)
    })
}
/*
 * @title Check Function Block Status
 * @notice Checks if the caller is blocked from using a specific function.
 * @dev Compares current timestamp with block expiration time to determine if block is active.
 * @functionality User verification functionality that allows users to check if they're currently blocked from using specific functions
 *
 * # Parameters
 * - `function_name` - The name of the function to check.
 *
 * # Returns
 * - `Ok(bool)` - True if blocked, false otherwise.
 * - `Err(Error)` - If the caller is an anonymous principal.
 */
#[query]
pub fn is_function_blocked(function_name: String) ->Result<bool,Error> {
    let caller_id = ic_cdk::caller();
    let current_time_stamp = current_timestamp();

    if caller_id == Principal::anonymous() {
        ic_cdk::println!("principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    Ok(read_state(|state| {
        state
            .restrict_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(&function_name).cloned())
            .map(|details| details.blocked_time > current_time_stamp)
            .unwrap_or(false)
    }))
}
/*
 * @title Inspect Incoming Messages
 * @notice Inspects incoming messages to check if the caller is blocked from using the requested function.
 * @dev Executed before message processing to reject blocked requests early in the execution flow.
 * @functionality Security pre-processing functionality that validates all incoming calls before execution to enforce rate limiting
 *
 * # Note
 * This function is called by the Internet Computer before processing each incoming message,
 * allowing early rejection of requests from blocked users.
 */
#[ic_cdk::inspect_message]
pub fn inspect_message() {
    let method_name = ic_cdk::api::call::method_name();
    let caller_id = ic_cdk::caller();
    let current_time_stamp = current_timestamp();

    ic_cdk::println!(
        "[InspectMessage] Caller: {:?}, Method: {}, Timestamp: {}",
        caller_id,
        method_name,
        current_time_stamp
    );

    // Read state to check if the user is blocked from this function
    let is_blocked = read_state(|state| {
        state
            .restrict_users
            .get(&caller_id)
            .and_then(|candid| candid.0.get(&method_name).cloned())
            .map(|details| details.blocked_time > current_time_stamp)
            .unwrap_or(false)
    });

    ic_cdk::println!("is_blocked = {:?}", is_blocked);

    if is_blocked {
        ic_cdk::println!(
            "[InspectMessage] User {:?} is blocked from '{}' until further notice.",
            caller_id,
            method_name
        );
        ic_cdk::println!("You are temporarily blocked from using this function");
        ic_cdk::api::call::reject("You are temporarily blocked from using this function.");
        return;
    }

    ic_cdk::println!("[InspectMessage] Execution allowed for {}", method_name);
    ic_cdk::api::call::accept_message(); // Explicitly allow the request
}