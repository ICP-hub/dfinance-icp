use candid::candid_method;
use ic_cdk::{update,query,init};
use ic_cdk::export_candid;

#[candid_method(init)]
#[init]
fn init() {
    ic_cdk::println!("lp_pool canister initialized");
}

#[query]
#[candid_method(query)]
fn get_status() -> String {
    "lp_pool canister is running".to_string()
}


#[update]
#[candid_method(update)]
fn lp_pool(amount: u64) -> String {
    format!("lp_pool {} tokens", amount)
}

export_candid!();