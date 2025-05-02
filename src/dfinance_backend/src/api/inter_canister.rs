use crate::constants::errors::Error;
use crate::declarations::structs::TransferFromResult;
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::{error, info};
use candid::{decode_one, encode_args};
use candid::{Nat, Principal};
use ic_cdk::{call, query};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::{icrc1::transfer::TransferArg, icrc2::transfer_from::TransferFromArgs};

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

    let args = TransferFromArgs {
        to: Account {
            owner: to,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        from: Account {
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
                info!("icrc2 transfer from successful. New balance: {:?}", balance);
                Ok(balance)
            }
            TransferFromResult::Err(err) => {
                error!("icrc2 transfer from failed with error: {:?}", err);
                Err(format!("{:?}", err))
            }
        },
        Err(e) => {
            error!("Call to ledger canister failed: {:?}", e.1);
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
    let token_args = TransferArg {
        to: Account {
            owner: to,
            subaccount: None,
        },
        fee: None,
        from_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: amount.clone(),
    };

    let (new_result,): (TransferFromResult,) =
        call(ledger, "icrc1_transfer", (token_args, false, Some(from)))
            .await
            .map_err(|e| e.1)?;

    match new_result {
        TransferFromResult::Ok(balance) => {
            info!("icrc1 transfer successful. New balance: {:?}", balance);
            Ok(balance)
        }
        TransferFromResult::Err(err) => {
            error!("icrc1 transfer failed with error: {:?}", err);
            Err(format!("{:?}", err))
        }
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
            error!("Error encoding arguments of get balance: {:?}", err);
            return Err(Error::ErrorEncoding);
        }
    };

    let raw_response_result =
        ic_cdk::api::call::call_raw(canister, "icrc1_balance_of", &encoded_args, 0).await;
    let raw_response = match raw_response_result {
        Ok(response) => {
            info!("Call succeeded with response of get balance: {:?}", response);
            response
        }
        Err((code, message)) => {
            error!("get balance call failed with code: {:?}, message: {}", code, message);
            return Err(Error::ErrorRawResponse);
        }
    };

    let balance_result = decode_one(&raw_response);
    let balance = match balance_result {
        Ok(bal) => bal,
        Err(err) => {
            error!("Error decoding balance of get balance: {:?}", err);
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
            error!("Error calling icrc1_total_supply: {:?}", e);
            Err(Error::ErrorRawResponse)
        }
    }
}
