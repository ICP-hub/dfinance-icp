use crate::declarations::transfer::*;
use candid::{decode_one, encode_args, CandidType, Deserialize};
use candid::{Nat, Principal};
use ic_cdk::call;
use crate::api::state_handler::{mutate_state, read_state};
use ic_cdk_macros::update;
use serde::Serialize;

// Icrc2_transfer_from inter canister call
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

// Icrc1_balance inter canister call
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

// Icrc1_fee inter canister call
pub async fn get_fees(canister: Principal) -> Nat {
    // Serialize the input arguments (empty in this case)
    let empty_arg = candid::encode_one(()).unwrap();

    // Make the inter-canister call
    let raw_response = ic_cdk::api::call::call_raw(canister, "icrc1_fee", &empty_arg, 0)
        .await
        .unwrap();

    // Decode the response
    let fees: Nat = decode_one(&raw_response).expect("Failed to decode fees");

    fees
}

// Icrc1_transfer inter canister call
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
pub async fn faucet(asset: String, amount: u64) -> Result<Nat, String> {
   
    ic_cdk::println!("Starting fraucet with params: {:?} {:?}", asset, amount );

    // Fetched canister ids, user principal and amount
    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| format!("No canister ID found for asset: {}", asset))
    })?;

    let user_principal = ic_cdk::caller();

    let platform_principal = ic_cdk::api::id();
    let amount_nat = Nat::from(amount);

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