

// let total_supply: CallResult<(Nat,)> = call(
// Principal::from_text(debt_token_canister_id).expect("Invalid principal"),
// "icrc1_total_supply",
// (),
// )
// .await;
use candid::{CandidType, Nat, Principal};

use ic_cdk::api::call::call;
use ic_cdk::api::management_canister::main::CanisterId;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use ic_cdk::api::call::CallResult;

#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct VariableDebtToken {
    pub scaled_total_supply: u128,
    // Add other fields as necessary
}

impl VariableDebtToken {
    // Function to get the scaled total supply of the variable debt token
    pub async fn scaled_total_supply(debt_token_canister_id: CanisterId) -> Result<u128> {
        let result: CallResult<(u128)> = call(Principal::from_text(debt_token_canister_id).expect("Invalid principal"), "icrc1_total_supply", ()).await;
        // result.map(|(supply,)| supply).map_err(|e| format!("Call failed: {:?}", e))
    }
}