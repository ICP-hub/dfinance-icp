// SPDX-License-Identifier: MIT

use ic_cdk::api::{call::CallResult, call::RejectionCode, caller, ic_cdk};
use ic_cdk::export::Principal;
use std::vec::Vec;

pub struct Address;

impl Address {
    // Returns true if `account` is a contract.
    pub fn is_contract(account: Principal) -> bool {
        // This is a simplified check for the existence of a principal.
        // A more robust check would require querying the state of the principal.
        account.to_text().starts_with("a")
    }

    // Sends `amount` cycles to `recipient`, reverting on errors.
    pub async fn send_value(recipient: Principal, amount: u64) -> Result<(), String> {
        let result: CallResult<()> = ic_cdk::api::call::call_with_payment(recipient, "receive", (), amount).await;
        match result {
            Ok(_) => Ok(()),
            Err((rejection_code, message)) => Err(format!("Failed to send value: {:?}, {}", rejection_code, message)),
        }
    }

    // Performs a low level `call`.
    pub async fn function_call(target: Principal, method: &str, args: Vec<u8>) -> Result<Vec<u8>, String> {
        let result: CallResult<Vec<u8>> = ic_cdk::api::call::call(target, method, args).await;
        Self::verify_call_result(result, "Address: low-level call failed")
    }

    // Same as `function_call`, but with a custom error message.
    pub async fn function_call_with_error_message(
        target: Principal,
        method: &str,
        args: Vec<u8>,
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        let result: CallResult<Vec<u8>> = ic_cdk::api::call::call(target, method, args).await;
        Self::verify_call_result(result, error_message)
    }

    // Same as `function_call`, but also transferring `value` cycles to `target`.
    pub async fn function_call_with_value(
        target: Principal,
        method: &str,
        args: Vec<u8>,
        value: u64,
    ) -> Result<Vec<u8>, String> {
        let result: CallResult<Vec<u8>> = ic_cdk::api::call::call_with_payment(target, method, args, value).await;
        Self::verify_call_result(result, "Address: low-level call with value failed")
    }

    // Same as `function_call_with_value`, but with a custom error message.
    pub async fn function_call_with_value_and_error_message(
        target: Principal,
        method: &str,
        args: Vec<u8>,
        value: u64,
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        let result: CallResult<Vec<u8>> = ic_cdk::api::call::call_with_payment(target, method, args, value).await;
        Self::verify_call_result(result, error_message)
    }

    // Verifies that a low level call was successful, and reverts if it wasn't.
    pub fn verify_call_result(
        result: CallResult<Vec<u8>>,
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        match result {
            Ok(returndata) => Ok(returndata),
            Err((rejection_code, message)) => Err(format!("{}: {:?}, {}", error_message, rejection_code, message)),
        }
    }
}
