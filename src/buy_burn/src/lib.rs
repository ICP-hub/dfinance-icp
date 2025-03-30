use ic_cdk_macros::{update, query, init, pre_upgrade, post_upgrade};
use candid::{Nat, Principal};
use std::collections::HashMap;
use std::cell::RefCell;
use ic_cdk::export_candid;
use candid::candid_method;

type BurnLedger = HashMap<Principal, Nat>;

thread_local! {
    static LEDGER: RefCell<BurnLedger> = RefCell::new(HashMap::new());
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(String),
}

// TODO: access controls need to be there.


/// Initializes the canister and sets up an empty ledger.
#[init]
fn init() {
    LEDGER.with(|ledger| ledger.borrow_mut().clear());
}

/// Stores the ledger in stable memory before an upgrade.
#[pre_upgrade]
fn pre_upgrade() {
    LEDGER.with(|ledger| {
        let ledger = ledger.borrow();
        ic_cdk::storage::stable_save((ledger.clone(),)).expect("Failed to save ledger");
    });
}

/// Restores the ledger from stable memory after an upgrade.
#[post_upgrade]
fn post_upgrade() {
    let (ledger,): (BurnLedger,) = ic_cdk::storage::stable_restore().expect("Failed to restore ledger");
    LEDGER.with(|cell| {
        let mut ledger_ref = cell.borrow_mut();
        ledger_ref.extend(ledger);
    });
}

/// Burns ICP and records the amount in the ledger.
#[update]
#[candid_method(update)]
fn add_balance(token_canister: Principal, amount: Nat) -> TransferFromResult {
    LEDGER.with(|ledger| {
        let mut ledger = ledger.borrow_mut();
        let entry = ledger.entry(token_canister).or_insert(Nat::from(0u128));
        *entry += amount.clone();
    });

    TransferFromResult::Ok(amount)  // Return the expected type instead of a string
}


/// Retrieves the burn amount for a specific token canister.
#[query]
fn get_balance(token_canister: Principal) -> Nat {
    LEDGER.with(|ledger| {
        let ledger = ledger.borrow();
        ledger.get(&token_canister).unwrap_or(&Nat::from(0u128)).clone()
    })
}

export_candid!();
