use pocket_ic::{PocketIc, WasmResult};
use candid::Nat;
use candid::{encode_args, encode_one, Principal};
use crate::utils::constant_variables::*;
use crate::utils::error as errors;
use crate::utils::structs::*;
use crate::utils::common_functions::*;
/*
 * @title Register User
 * @notice Calls `register_user` in the backend and logs the result.
 *
 * @dev Steps:
 *      1. Calls `register_user`.
 *      2. Decodes and processes response.
 *      3. Logs success or failure.
 *
 * @param pic PocketIc instance.
 * @param backend_canister Backend canister principal.
 * @param user_principal User principal.
 */
pub fn test_register_user(pic: &PocketIc, backend_canister: Principal, user_principal: Principal) {
    let result = pic.update_call(
        backend_canister,
        user_principal,
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let register_user_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match register_user_response {
                Ok(_message) => {
                    ic_cdk::println!("✅ Register user function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!(
                        "Register user function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Register user function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling register user function: {:?}", e);
        }
    }
}

