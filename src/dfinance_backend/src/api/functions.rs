use std::string;

use crate::api::state_handler::mutate_state;
use crate::declarations::storable::Candid;
use crate::declarations::transfer::*;
use crate::get_asset_principal;
use crate::protocol::libraries::logic::update::{user_data, user_reserve};
use crate::protocol::libraries::math::calculate::get_exchange_rates;
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::{call, query};
use ic_cdk_macros::update;
use serde::Serialize;

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

// #[update]
// pub async fn update_balance(canister: Principal, principal: Principal) -> Nat {
//     let account = Account {
//         owner: principal,
//         subaccount: None,
//     };

//     let encoded_args = encode_args((account,)).unwrap();

//     let raw_response =
//         ic_cdk::api::call::call_raw(canister, "icrc1_update_balance_of", &encoded_args, 0)
//             .await
//             .unwrap();

//     let balance: Nat = decode_one(&raw_response).expect("Failed to decode balance");

//     balance
// }
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

//#[update] //TODO need to a update func or not (i think it was implemented for pocketic, if not then what is the need of this function) -- done
// if dont use then comment it out. --- need to look it again.
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
pub async fn faucet(asset: String, amount: u64) -> Result<Nat, String> {
    ic_cdk::println!("Starting fraucet with params: {:?} {:?}", asset, amount);

    // validate amount
    if amount <= 0 {
        return Err("Amount must be greater than zero.".to_string());
    }

    // validate asset
    if asset.trim().is_empty() {
        return Err("Asset cannot be an empty string.".to_string());
    }

    // Validate user principal (avoid anonymous principal)
    let user_principal = ic_cdk::caller();

    // Validate user principal (avoid anonymous principal)
    if user_principal == Principal::anonymous() {
        return Err("Anonymous principals are not allowed.".to_string());
    }
    ic_cdk::println!("user ledger id {:?}", user_principal.to_string());

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found: {:?}", data);
            data
        }
        Err(e) => {
            return Err(format!("Error: {}", e));
        }
    };

    // Ask : is it right way to convert it to the usd amount.
    let mut usd_amount: Option<u128> = None;
    match get_exchange_rates(asset.clone(), None, amount as u128).await {
        Ok((amount, _timestamp)) => {
            usd_amount = Some(amount);
        }
        Err(err) => {
            println!("getting error in the conversion {}", err);
        }
    }

    ic_cdk::println!("usd amount of the facut = {}", usd_amount.unwrap());

    // Function to check if the user has a reserve for the asset
    let user_reserve = user_reserve(&mut user_data, &asset);

    if let Some((_, user_reserve_data)) = user_reserve {
        if usd_amount.unwrap() > user_reserve_data.faucet_limit {
            return Err("amount is too much".to_string());
        }

        if (user_reserve_data.faucet_usage + usd_amount.unwrap()) > user_reserve_data.faucet_limit {
            return Err("amount is too much".to_string());
        }
        user_reserve_data.faucet_usage += usd_amount.unwrap();
    }

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

    // Need to ask from anshika -- > should i implement these two comments for the validation purpose.
    // Check if the user has already claimed within a certain period --- need to use.
    // Check if the platform has sufficient balance -- need to use.

    // Save the updated user data back to state
    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });

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

#[update]
pub fn reset_faucet_usage(asset: String) -> Result<(), String> {
    let user_principal = ic_cdk::caller();

    //Retrieve user data.
    let user_data_result = user_data(user_principal);

    let mut user_data = match user_data_result {
        Ok(data) => {
            ic_cdk::println!("User found: {:?}", data);
            data
        }
        Err(e) => {
            return Err(format!("Error: {}", e));
        }
    };

    // Function to check if the user has a reserve for the asset
    let user_reserve = user_reserve(&mut user_data, &asset);

    if let Some((_, user_reserve_data)) = user_reserve {
        user_reserve_data.faucet_usage = 0;
    };

    // Save the updated user data back to state
    mutate_state(|state| {
        state
            .user_profile
            .insert(user_principal, Candid(user_data.clone()));
    });
    Ok(())
}
