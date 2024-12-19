use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::logic::user::nat_to_u128;
use crate::protocol::libraries::math::calculate::get_exchange_rates;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::{get_asset_principal, get_cached_exchange_rate, get_reserve_data};
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::{call, query};
use ic_cdk_macros::update;
//use reqwest::Client;
use crate::constants::errors::Error;
use serde::Serialize;
// use ic_cdk::api::call::{call_after};
// // use ic_cdk::prelude::*;
// use ic_cdk::time::current_time;
// use std::time::Duration;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use serde_json::json;

// Icrc2_transfer_from inter canister call.
pub async fn asset_transfer_from(
    ledger_canister_id: Principal,
    from: Principal,
    to: Principal,
    amount: Nat,
) -> Result<Nat, String> {
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
    let (result,): (TransferFromResult,) = call(ledger_canister_id, "icrc2_transfer_from", (args,))
        .await
        .map_err(|e| e.1)?;

    match result {
        TransferFromResult::Ok(balance) => Ok(balance),
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

// Icrc1_balance inter canister call.
#[query]
pub async fn get_balance(canister: Principal, principal: Principal) -> Result<Nat, Error> {
    if canister == Principal::anonymous() {
        return Err(Error::InvalidCanister);
    }

    // Validate the principal
    if principal == Principal::anonymous() {
        return Err(Error::InvalidPrincipal);
    }
    let account = Account {
        owner: principal,
        subaccount: None,
    };

    let encoded_args = encode_args((account,)).unwrap();

    let raw_response = ic_cdk::api::call::call_raw(canister, "icrc1_balance_of", &encoded_args, 0)
        .await
        .unwrap();

    let balance: Nat = decode_one(&raw_response).expect("Failed to decode balance");

    Ok(balance)
}

#[query]
pub async fn get_total_supply(canister_id: Principal) -> Result<Nat, Error> {
    if canister_id == Principal::anonymous() {
        return Err(Error::InvalidCanister);
    }

    let raw_response: Result<(Nat,), _> =
        ic_cdk::api::call::call(canister_id, "icrc1_total_supply", ()).await;

    match raw_response {
        Ok((balance,)) => Ok(balance),
        Err(e) => {
            ic_cdk::println!("Error calling icrc1_total_supply: {:?}", e);
            ic_cdk::api::trap(&format!("Failed to call icrc1_total_supply: {:?}", e));
        }
    }
}

pub async fn update_balance(
    canister: Principal,
    principal: Principal,
    amount: Nat,
) -> Result<Nat, String> {
    let account = Account {
        owner: principal,
        subaccount: None,
    };

    let (result,): (Result<Nat, String>,) =
        ic_cdk::api::call::call(canister, "icrc1_update_balance_of", (account, amount))
            .await
            .map_err(|e| format!("Failed to call update_balance: {:?}", e.1))?;

    match result {
        Ok(balance) => {
            ic_cdk::println!("Updated balance successfully: {}", balance);
            Ok(balance)
        }
        Err(err) => {
            ic_cdk::println!("Failed to update balance: {}", err);
            Err(err)
        }
    }
}

pub async fn get_fees(canister: Principal) -> Nat {
    let empty_arg = candid::encode_one(()).unwrap();

    let raw_response = ic_cdk::api::call::call_raw(canister, "icrc1_fee", &empty_arg, 0)
        .await
        .unwrap();

    let fees: Nat = decode_one(&raw_response).expect("Failed to decode fees");

    fees
}

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

//#[update] //TODO need a update func or not (i think it was implemented for pocketic, if not then what is the need of this function) -- done
// if dont use then comment it out. ---might be needed later.
// pub async fn transfer(amount: u128, asset_name: String) -> Result<Nat, String> {
//     let backend_canister_principal = ic_cdk::api::id();
//     //let user_principal = ic_cdk::caller();
//     let nat_convert_amount = Nat::from(amount);

//     let asset_principal: Result<Principal, String> = get_asset_principal(asset_name);

//     let asset_principal_id = match asset_principal {
//         Ok(principal) => principal,
//         Err(err_message) => {
//             ic_cdk::println!("Error retrieving asset Principal: {}", err_message);

//             return Err(format!("Error retrieving asset Principal: {}", err_message));
//         }
//     };

//     let approve_args = ApproveArgs {
//         from_subaccount: None,
//         spender: TransferAccount {
//             owner: backend_canister_principal,
//             subaccount: None,
//         },
//         amount: nat_convert_amount.clone(),
//         expected_allowance: None,
//         expires_at: None,
//         fee: None,
//         memo: None,
//         created_at_time: None,
//     };

//     let (approval_result,): (ApproveResult,) =
//         call(asset_principal_id, "icrc2_approve", (approve_args, false))
//             .await
//             .map_err(|e| e.1)?;

//     ic_cdk::println!(
//         "approve_transfer executed successfully and the call result: {:?}",
//         approval_result
//     );

//     match approval_result {
//         ApproveResult::Ok(balance) => Ok(balance),
//         ApproveResult::Err(err) => Err(format!("{:?}", err)),
//     }
// }

// pub async fn approve_transfer(
//     spender: Principal,
//     from: Principal,
//     ledger: Principal,
//     amount: Nat,
// ) -> Result<Nat, String> {
//     let approve_args = ApproveArgs {
//         from_subaccount: None,
//         spender:  TransferAccount {
//             owner: spender,
//             subaccount: None,
//         },
//         amount: amount.clone(),
//         expected_allowance: None,
//         expires_at: None,
//         fee: None,
//         memo: None,
//         created_at_time: None,
//     };

//     let (approval_result,): (ApproveResult,) =
//         call(ledger, "icrc2_approve", (approve_args, false, Some(from)))
//             .await
//             .map_err(|e| e.1)?;

//     ic_cdk::println!(
//         "approve_transfer executed successfully and the call result: {:?}",
//         approval_result
//     );

//     match approval_result {
//         ApproveResult::Ok(balance) => Ok(balance),
//         ApproveResult::Err(err) => Err(format!("{:?}", err)),
//     }
// }

#[update]
pub async fn faucet(asset: String, amount: Nat) -> Result<Nat, Error> {
    ic_cdk::println!("Starting faucet with params: {:?} {:?}", asset, amount);

    if asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if asset.len() != 6 && asset.len() != 7 {
        ic_cdk::println!("Asset must have a length of 6 or 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    // Validate amount: must be non-negative and non-empty
    if amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    let user_principal = ic_cdk::caller();

    // Validate user principal (avoid anonymous principal)
    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    ic_cdk::println!("user id {:?}", user_principal.to_string());

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found");
            data
        }
        Err(e) => {
            return Err(Error::InvalidUser);
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

    let wallet_value = get_balance(ledger_canister_id, platform_principal).await?;

    ic_cdk::println!("balance of wallet = {}", wallet_value);

    // let youy = "message is going correctly".to_string();
    // send_email_via_sendgrid(youy).await;
    if amount > wallet_value {
        ic_cdk::println!("wallet balance is low");
        send_admin_notifications("initial").await;
        return Err(Error::LowWalletBalance);
    }

    if (wallet_value.clone() - amount.clone()) == Nat::from(0u128) {
        ic_cdk::println!("wallet balance is low");
        send_admin_notifications("mid").await;
    }

    if (wallet_value.clone() - amount.clone())
        <= Nat::from(1000u128).scaled_mul(Nat::from(100000000u128))
    {
        ic_cdk::println!("wallet balance is low");
        send_admin_notifications("final").await;
    }
    // wallet value - amount == 0 ==> urgent need faucet it.
    // wallet value - amount < 1000 ==> low balance   100_000_000

    ic_cdk::println!("amount again = {}", amount);
    // Ask : is it right way to convert it to the usd amount.
    let mut rate: Option<Nat> = None;

    match get_cached_exchange_rate(asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&asset) {
                let amount = cached_price.price.clone(); // Access the `price` field
                rate = Some(amount);
                ic_cdk::println!("Fetched exchange rate for {}: {:?}", asset, rate);
            } else {
                ic_cdk::println!("No cached price found for {}", asset);
                rate = None;
            }
        }
        Err(err) => {
            ic_cdk::println!("Error fetching exchange rate for {}: {}", asset, err);
            rate = None; 
        }
    }

    //TODO: conversion to nat.
    let usd_amount = ScalingMath::scaled_mul(amount.clone(), rate.unwrap());

    ic_cdk::println!("usd amount of the facut = {}", usd_amount);

    // Function to check if the user has a reserve for the asset
    let user_reserve = user_reserve(&mut user_data, &asset);
    ic_cdk::println!("user reserve = {:?}", user_reserve);

    if let Some((_, user_reserve_data)) = user_reserve {
       
        ic_cdk::println!(
            "faucet user_reserve_data.faucet_limit = {}",
            user_reserve_data.faucet_limit
        );
        if usd_amount.clone() > user_reserve_data.faucet_limit {
            ic_cdk::println!("amount is too much");
            return Err(Error::AmountTooMuch);
        }

        if (user_reserve_data.faucet_usage.clone() + usd_amount.clone())
            > user_reserve_data.faucet_limit
        {
            ic_cdk::println!("amount is too much second");
            return Err(Error::AmountTooMuch);
        }
        user_reserve_data.faucet_usage += usd_amount;
        ic_cdk::println!("new faucet usage = {}", user_reserve_data.faucet_usage);
    } else {
        let mut new_reserve = UserReserveData {
            reserve: asset.clone(),
            ..Default::default()
        };

        if usd_amount > new_reserve.faucet_limit {
            ic_cdk::println!("amount is too much");
            return Err(Error::AmountTooMuch);
        }

        if (new_reserve.faucet_usage.clone() + usd_amount.clone())
            > new_reserve.faucet_limit.clone()
        {
            ic_cdk::println!("amount is too much second");
            return Err(Error::AmountTooMuch);
        }

        new_reserve.faucet_usage += usd_amount;
        ic_cdk::println!("new faucet usage = {}", new_reserve.faucet_usage);

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



    // Validate ledger canister ID
    // if ledger_canister_id.to_text().trim().is_empty() {
    //     return Err("Ledger canister ID is invalid.".to_string());
    // }

    // TODO Check if the user has already claimed within a certain period --- need to use.
    //TODO Check if the platform has sufficient balance -- need to use.

    // Save the updated user data back to state
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
        Err(e) => {
            return Err(Error::ErrorBurnDebtTokens);
        }
    }
}

pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {
    // let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found");
            data
        }
        Err(e) => {
            return Err(Error::InvalidUser);
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

    // Save the updated user data back to state
    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

    ic_cdk::println!("updated user data after facuet reset = {:?}", user_data);
    Ok(())
}

async fn send_admin_notifications(stage: &str) {
    let message = match stage {
        "initial" => "Dear Admin,\n\nThe platform's faucet balance is low. Immediate action is required to mint more tokens.\n\nBest regards,\nYour Platform Team".to_string(),
        "mid" => "Dear Admin,\n\nUrgent: The platform's faucet balance is 0. Please ensure tokens are minted soon to avoid user disruption.\n\nBest regards,\nYour Platform Team".to_string(),
        "final" => "Dear Admin,\n\nReminder: The platform's faucet balance is nearly depleted. Immediate minting of tokens is necessary to prevent users from being unable to claim tokens.\n\nBest regards,\nYour Platform Team".to_string(),
        _ => "".to_string(),
    };
    send_email_via_sendgrid(message).await;
}

pub async fn send_email_via_sendgrid(message: String) -> String {
    let url = "https://api.sendgrid.com/v3/mail/send";
    // Add: company sendgrid api key.
    let api_key = "";

    ic_cdk::println!("Preparing to send email via SendGrid...");
    ic_cdk::println!("Using URL: {}", url);

    // Prepare the headers for the SendGrid API request
    let request_headers = vec![
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Bearer {}", api_key),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];

    ic_cdk::println!("Headers prepared: {:?}", request_headers);

    // Prepare the email data (JSON payload)
    let email_data = json!( {
        "personalizations": [
            {
                "to": [{"email": "sm6047787@gmail.com"}],
                "subject": "Faucet Amount Low - Mint More Tokens"
            }
        ],
        "from": { "email": "jyotirmay2000gupta@gmail.com" }, // Sender email address
        "content": [
            {
                "type": "text/plain",
                "value": message,
            }
        ]
    });

    ic_cdk::println!("Email data prepared: {}", email_data);

    // Convert the email data into bytes
    let request_body: Option<Vec<u8>> = Some(email_data.to_string().as_bytes().to_vec());
    ic_cdk::println!("Request body: {:?}", request_body);

    // Prepare the HTTP request for sending the email without the transform
    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::POST,
        body: request_body,
        max_response_bytes: None,
        transform: None, // Removed the transform
        headers: request_headers,
    };

    ic_cdk::println!("Request prepared: {:?}", request);

    // Send the HTTP request to SendGrid
    let timeout = 120_000_000_000; // Increase timeout to 120 seconds
    ic_cdk::println!("Sending HTTP request with timeout: {}", timeout);

    match http_request(request, timeout).await {
        Ok((response,)) => {
            let response_body =
                String::from_utf8(response.body).expect("Response body is not UTF-8 encoded.");
            ic_cdk::println!("Email sent successfully. Response body: {}", response_body);
            format!("Email sent successfully. Response: {}", response_body)
        }
        Err((r, m)) => {
            ic_cdk::println!("Error sending email. RejectionCode: {:?}, Error: {}", r, m);
            format!("Error sending email. RejectionCode: {:?}, Error: {}", r, m)
        }
    }
}
