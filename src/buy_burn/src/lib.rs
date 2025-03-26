use candid::candid_method;
use ic_cdk::{update,query,init};
use ic_cdk::export_candid;

#[candid_method(init)]
#[init]
fn init() {
    ic_cdk::println!("buy_burn canister initialized");
}

#[query]
#[candid_method(query)]
fn get_status() -> String {
    "Buy & Burn canister is running".to_string()
}


#[update]
#[candid_method(update)]
fn buy_and_burn(amount: u64) -> String {
    format!("Burned {} tokens", amount)
}

export_candid!();