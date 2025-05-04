use crate::utils::error as errors;
use candid::{encode_one, Principal};
use pocket_ic::{PocketIc, WasmResult};

/*
 * @title Register User
 * @notice Calls `register_user` in the backend and logs the result.
 *
 * @dev Steps:
 *      1. Calls the `register_user` function in the backend canister.
 *      2. Decodes and processes the response.
 *      3. Logs the success or failure based on the response.
 *
 * @param pic PocketIc instance used for interacting with the Internet Computer.
 * @param backend_canister Principal of the backend canister to be called.
 * @param user_principal Principal of the user who is being registered.
 */
#[allow(dead_code)]
pub fn test_register_user(pic: &PocketIc, backend_canister: Principal, user_principal: Principal) {
    // Call the register_user method on the backend canister
    let result = pic.update_call(
        backend_canister,
        user_principal,
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response to determine success or failure
    match result {
        Ok(WasmResult::Reply(response)) => {
            // Decode the response into a String message
            let register_user_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            // Handle the decoded response
            match register_user_response {
                Ok(_message) => {
                    // Success: Log that the registration was successful
                    ic_cdk::println!("✅ Register user function succeeded");
                }
                Err(e) => {
                    // Failure: Log the error and panic, as it was expected
                    ic_cdk::println!(
                        "❌ Register user function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            // If the function call was rejected, panic and log the rejection message
            panic!(
                "🚨 Register user function was rejected with message: {:?}",
                reject_message
            );
        }
        Err(e) => {
            // Handle any errors that occurred during the function call
            panic!("🚨 Error calling register user function: {:?}", e);
        }
    }
}
