use crate::declarations::transfer::*;
use candid::{Nat, Principal};
use ic_cdk::call;

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
