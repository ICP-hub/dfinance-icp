

use ic_cdk::api::call::call;
use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};


#[derive(Debug, CandidType, Deserialize, Serialize)]
pub struct VariableDebtToken {
    pub variable_debt_token_address: Principal,
}

// impl VariableDebtToken {
//     // Function to get the scaled total supply of the variable debt token
//     pub async fn scaled_total_supply(debt_token_principal: Principal) -> Result<Nat, String> {
//         let result: Result<(Nat,), (ic_cdk::api::call::RejectionCode, String)> = call(debt_token_principal, "icrc1_total_supply", ()).await;
//         match result {
//             Ok((supply,)) => Ok(supply),
//             Err((_, msg)) => Err(format!("Call failed: {}", msg)),
//         }
//     }
// }

impl VariableDebtToken {
    // Function to get the scaled total supply of the variable debt token
    pub async fn scaled_total_supply(debt_token_principal: Principal) -> Result<u128, String> {
        let result: Result<(Nat,), (ic_cdk::api::call::RejectionCode, String)> = call(debt_token_principal, "icrc1_total_supply", ()).await;
        match result {
            Ok((supply,)) => nat_to_u128(&supply).ok_or_else(|| "Conversion to u128 failed".to_string()),
            Err((_, msg)) => Err(format!("Call failed: {}", msg)),
        }
    }
}

// Helper function to convert Nat to u128 manually
fn nat_to_u128(nat: &Nat) -> Option<u128> {
    let bytes = nat.0.to_bytes_be(); // Nat is a wrapper around BigUint
    if bytes.len() <= 16 {
        let mut result = [0u8; 16];
        let start = 16 - bytes.len();
        result[start..].copy_from_slice(&bytes);
        Some(u128::from_be_bytes(result))
    } else {
        None
    }
}