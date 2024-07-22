
use crate::{api::deposit::transfer_from_ckbtc, constants::asset_address::CKBTC_LEDGER_ADDRESS};
use candid::{Nat, Principal};

// Function to handle deposits
#[ic_cdk_macros::update]
async fn deposit_ckbtc(amount: u64) -> Result<Nat, String> {
    let ledger_canister_id =
        Principal::from_text(CKBTC_LEDGER_ADDRESS).map_err(|e| e.to_string())?;

    ic_cdk::println!("ckbtc canister principal {}", ledger_canister_id);
    let user_principal = Principal::from_text("q7fxq-ursdr-56tib-ppy6j-e4kee-h66pb-jbj52-l2dzo-36xxr-hnoe3-jqe").map_err(|e| e.to_string())?;
    let platform_principal =
        Principal::from_text("bd3sg-teaaa-aaaaa-qaaba-cai").map_err(|e| e.to_string())?;
    ic_cdk::println!("platform canister principal {}", platform_principal);

    let amount_nat = Nat::from(amount);
    transfer_from_ckbtc(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat,
    )
    .await
}

// the function above is just an sample function, deposit function will use validation logic, reserve logic and other checks according to aave








