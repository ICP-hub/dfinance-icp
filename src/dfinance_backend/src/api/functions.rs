use crate::declarations::transfer::*;
use candid::{Nat, Principal};
use ic_cdk::call;
use candid::{decode_one, encode_args, CandidType, Deserialize};
use serde::Serialize;

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
