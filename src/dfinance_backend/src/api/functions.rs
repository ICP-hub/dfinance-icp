use crate::api::state_handler::mutate_state;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::SCALING_FACTOR;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::get_cached_exchange_rate;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use ic_cdk::{call, query};
use ic_cdk_macros::update;
use serde::Serialize;
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
            Err(Error::ErrorRawResponse)
        }
    }
}

// not used now so error hanling later
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

pub async fn get_fees(canister: Principal) -> Result<Nat,Error> {

     if canister == Principal::anonymous() {
        return Err(Error::InvalidCanister);
    }
    let empty_arg_result = candid::encode_one(());
    let empty_arg = match empty_arg_result {
        Ok(args) => args,
        Err(err) => {
            ic_cdk::println!("Error encoding arguments: {:?}", err);
            return Err(Error::ErrorEncoding);
        }
    };

    let raw_response_result = ic_cdk::api::call::call_raw(canister, "icrc1_fee", &empty_arg, 0)
        .await;
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

    let fees_result = decode_one(&raw_response);
    let fees = match fees_result {
        Ok(fee) => fee,
        Err(err) => {
            ic_cdk::println!("Error decoding balance: {:?}", err);
            return Err(Error::ErrorDecoding);
        }
    };

    Ok(fees)
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

    let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    ic_cdk::println!("user ledger id {:?}", user_principal.to_string());

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
        send_admin_notifications("initial", asset.clone()).await;
        return Err(Error::LowWalletBalance);
    }

    if (balance.clone() - amount.clone()) == Nat::from(0u128) {
        ic_cdk::println!("wallet balance is low");
        send_admin_notifications("mid", asset.clone()).await;
    }

    if (balance.clone() - amount.clone())
        <= Nat::from(1000u128).scaled_mul(Nat::from(SCALING_FACTOR))
    {
        ic_cdk::println!("wallet balance is low");
        send_admin_notifications("final", asset.clone()).await;
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

    let usd_amount = ScalingMath::scaled_mul(amount.clone(), rate.unwrap());

    ic_cdk::println!("usd amount of the facut = {}", usd_amount);

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
            return Err(Error::AmountTooMuch);
        }

        if (user_reserve_data.faucet_usage.clone() + usd_amount.clone())
            > user_reserve_data.faucet_limit
        {
            ic_cdk::println!("amount is too much second");
            return Err(Error::AmountTooMuch);
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
            return Err(Error::AmountTooMuch);
        }

        if (new_reserve.faucet_usage.clone() + usd_amount.clone())
            > new_reserve.faucet_limit.clone()
        {
            ic_cdk::println!("amount is too much second");
            return Err(Error::AmountTooMuch);
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

pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), Error> {

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

async fn send_admin_notifications(stage: &str, asset: String) {
    let message = match stage {
        "initial" => format!("Dear Admin,\n\nThe platform's faucet balance for {} is low. Immediate action is required to mint more tokens.\n\nBest regards,\nYour Platform Team", asset),
        "mid" => format!("Dear Admin,\n\nUrgent: The platform's faucet balance for {} is 0. Please ensure tokens are minted soon to avoid user disruption.\n\nBest regards,\nYour Platform Team", asset),
        "final" => format!("Dear Admin,\n\nReminder: The platform's faucet balance for {} is nearly depleted. Immediate minting of tokens is necessary to prevent users from being unable to claim tokens.\n\nBest regards,\nYour Platform Team", asset),
        _ => "".to_string(),
    };
    send_email_via_sendgrid(message).await;
}

pub async fn send_email_via_sendgrid(message: String) -> String {
    let url = "https://api.sendgrid.com/v3/mail/send";
    let api_key = "";

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

    let email_data = json!( {
        "personalizations": [
            {
                "to": [{"email": "sm6047787@gmail.com"}],
                "subject": "Faucet Amount Low - Mint More Tokens"
            }
        ],
        "from": { "email": "jyotirmay2000gupta@gmail.com" },
        "content": [
            {
                "type": "text/plain",
                "value": message,
            }
        ]
    });

    ic_cdk::println!("Email data prepared: {}", email_data);

    let request_body: Option<Vec<u8>> = Some(email_data.to_string().as_bytes().to_vec());

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::POST,
        body: request_body,
        max_response_bytes: None,
        transform: None,
        headers: request_headers,
    };

    ic_cdk::println!("Request prepared: {:?}", request);

    // Send the HTTP request to SendGrid
    let timeout = 120_000_000_000;
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
