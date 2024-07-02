use ic_cdk::api::call::{call, call_with_payment, CallResult};
use candid::Principal;
use std::future::Future;

pub struct Address {}

impl Address {
    /// Returns true if `account` is a contract.
    ///
    /// This function attempts to call a specific method (`is_contract`) on the account. If the call fails,
    /// it is assumed that the account is not a contract.
    pub async fn is_contract(account: Principal) -> bool {
        let result: CallResult<()> = call(account, "is_contract", ()).await;
        result.is_ok()
    }

    /// Sends `amount` cycles to `recipient`, forwarding all available gas and reverting on errors.
    ///
    /// Care must be taken to avoid reentrancy vulnerabilities.
    pub async fn send_value(recipient: Principal, amount: u64) -> Result<(), String> {
        let result: CallResult<()> = call_with_payment(recipient, "receive", (), amount).await;
        if result.is_ok() {
            Ok(())
        } else {
            Err("Address: unable to send value, recipient may have reverted".to_string())
        }
    }

    /// Performs a function call using a low-level call. 
    pub async fn function_call(target: Principal, data: &[u8]) -> Result<Vec<u8>, String> {
        Self::function_call_with_value(target, data, 0, "Address: low-level call failed").await
    }

    /// Same as `function_call`, but with a custom error message.
    pub async fn function_call_with_message(
        target: Principal,
        data: &[u8],
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        Self::function_call_with_value(target, data, 0, error_message).await
    }

    /// Same as `function_call`, but also transferring `value` cycles to `target`.
    pub async fn function_call_with_value(
        target: Principal,
        data: &[u8],
        value: u64,
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        if !Self::is_contract(target).await {
            return Err("Address: call to non-contract".to_string());
        }

        let result: CallResult<Vec<u8>> = call_with_payment(target, "call", (data,), value).await;
        Self::verify_call_result(result, error_message)
    }

    /// Same as `function_call`, but performing a static call.
    pub async fn function_static_call(target: Principal, data: &[u8]) -> Result<Vec<u8>, String> {
        Self::function_static_call_with_message(target, data, "Address: low-level static call failed").await
    }

    /// Same as `function_static_call`, but with a custom error message.
    pub async fn function_static_call_with_message(
        target: Principal,
        data: &[u8],
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        if !Self::is_contract(target).await {
            return Err("Address: static call to non-contract".to_string());
        }

        let result: CallResult<Vec<u8>> = call(target, "static_call", (data,)).await;
        Self::verify_call_result(result, error_message)
    }

    /// Same as `function_call`, but performing a delegate call.
    pub async fn function_delegate_call(target: Principal, data: &[u8]) -> Result<Vec<u8>, String> {
        Self::function_delegate_call_with_message(target, data, "Address: low-level delegate call failed").await
    }

    /// Same as `function_delegate_call`, but with a custom error message.
    pub async fn function_delegate_call_with_message(
        target: Principal,
        data: &[u8],
        error_message: &str,
    ) -> Result<Vec<u8>, String> {
        if !Self::is_contract(target).await {
            return Err("Address: delegate call to non-contract".to_string());
        }

        let result: CallResult<Vec<u8>> = call(target, "delegate_call", (data,)).await;
        Self::verify_call_result(result, error_message)
    }

    /// Tool to verify that a low-level call was successful and revert if it wasn't.
    pub fn verify_call_result(result: CallResult<Vec<u8>>, error_message: &str) -> Result<Vec<u8>, String> {
        match result {
            Ok(returndata) => Ok(returndata),
            Err(_) => Err(error_message.to_string()),
        }
    }
}
