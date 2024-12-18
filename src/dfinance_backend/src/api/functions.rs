use std::string;

use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::math::calculate::get_exchange_rates;
use crate::protocol::libraries::math::math_utils::ScalingMath;
use crate::protocol::libraries::types::datatypes::UserReserveData;
use crate::{get_asset_principal, get_cached_exchange_rate};
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::{call, query};
use ic_cdk_macros::update;
use serde::Serialize;
// use ic_cdk::api::call::{call_after};
// // use ic_cdk::prelude::*;
// use ic_cdk::time::current_time;
// use std::time::Duration;

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
pub async fn get_balance(canister: Principal, principal: Principal) -> Nat {
    let account = Account {
        owner: principal,
        subaccount: None,
    };

    let encoded_args = encode_args((account,)).unwrap();

    let raw_response = ic_cdk::api::call::call_raw(canister, "icrc1_balance_of", &encoded_args, 0)
        .await
        .unwrap();

    let balance: Nat = decode_one(&raw_response).expect("Failed to decode balance");

    balance
}

#[update]
pub async fn update_balance(
    canister: Principal,
    principal: Principal,
    amount: u128,
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
pub async fn faucet(asset: String, amount: u128) -> Result<Nat, String> {
    ic_cdk::println!("Starting faucet with params: {:?} {:?}", asset, amount);

    // validate asset
    if asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err("Asset cannot be an empty string.".to_string());
    }

    let user_principal = ic_cdk::caller();

    // Validate user principal (avoid anonymous principal)
    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err("Anonymous principals are not allowed.".to_string());
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
            return Err(format!("Error: {}", e));
        }
    };

    let mut rate: Option<u128> = None;

    match get_cached_exchange_rate(asset.clone()) {
        Ok(price_cache) => {
            if let Some(cached_price) = price_cache.cache.get(&asset) {
                let amount = cached_price.price; 
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

    let usd_amount = ScalingMath::scaled_mul(amount, rate.unwrap());

    ic_cdk::println!("usd amount of the facut = {}", usd_amount);

    // Function to check if the user has a reserve for the asset
    let user_reserve = user_reserve(&mut user_data, &asset);
    ic_cdk::println!("user reserve = {:?}", user_reserve);

    if let Some((_, user_reserve_data)) = user_reserve {
       
        ic_cdk::println!(
            "faucet user_reserve_data.faucet_limit = {}",
            user_reserve_data.faucet_limit
        );

        if (user_reserve_data.faucet_usage + usd_amount) > user_reserve_data.faucet_limit {
            ic_cdk::println!("faucet limit exceeded");
            return Err("faucet limit exceeded".to_string());
        }
        user_reserve_data.faucet_usage += usd_amount;
        ic_cdk::println!("new faucet usage = {}", user_reserve_data.faucet_usage);
    } else {
        let mut new_reserve = UserReserveData {
            reserve: asset.clone(),
            ..Default::default()
        };
        //TODO remove the repeatation of code
        if (new_reserve.faucet_usage + usd_amount) > new_reserve.faucet_limit {
            ic_cdk::println!("faucet limit exceeded");
            return Err("faucet limit exceeded".to_string());
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

    //TODO use it in read_state

    // Fetched canister ids, user principal and amount
    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| format!("No canister ID found for asset: {}", asset))
    })?;
    ic_cdk::println!("ledger id {:?}", ledger_canister_id.to_string());

    // Validate ledger canister ID
    if ledger_canister_id.to_text().trim().is_empty() {
        return Err("Ledger canister ID is invalid.".to_string());
    }

    let platform_principal = ic_cdk::api::id();
    let amount_nat = Nat::from(amount as u128);

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
        amount_nat.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!("Asset transfer from backend to user executed successfully");
            Ok(new_balance)
        }
        Err(e) => {
            return Err(format!(
                "Asset transfer failed, burned debttoken. Error: {:?}",
                e
            ));
        }
    }
}

#[update] //TODO check if this func need to be a update function
pub async fn reset_faucet_usage(user_principal: Principal) -> Result<(), String> {
    // let user_principal = ic_cdk::caller();

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err("Anonymous principals are not allowed.".to_string());
    }

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found");
            data
        }
        Err(e) => {
            return Err(format!("Error: {}", e));
        }
    };

    // Access and mutate reserves
    if let Some(user_data_reserves) = user_data.reserves.as_mut() {
        for (_reserve_name, user_reserve_data) in user_data_reserves.iter_mut() {
            user_reserve_data.faucet_usage = 0;
        }
    } else {
        return Err("Reserves not found for user".to_string());
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
