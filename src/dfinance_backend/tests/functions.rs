use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;


use crate::error as errors;

// mod structs;
// use structs as struct;
use structs::*;

pub fn get_user_principal() -> Principal {
    Principal::from_text("zcfkh-4mzoh-shpaw-tthfa-ak7s5-oavgv-vwjhz-tdupg-3bxbo-2p2je-7ae").unwrap()
}

pub fn get_users_principal(index: Nat) -> Result<Principal, String> {
    if index == Nat::from(1u32) {
        Ok(
            Principal::from_text("d3xlc-xvjnt-uj2f3-jfuct-cn2aj-w32qa-qzqc4-jyjiq-sv6qd-s7zr7-vqe")
                .unwrap(),
        )
    } else if index == Nat::from(2u32) {
        Ok(
            Principal::from_text("a4q4s-xga7n-4rdq4-omxar-uoaxs-vugpu-5vd2b-5naaq-62wll-46mir-aae")
                .unwrap(),
        )
    } else {
        ic_cdk::println!("No valid input.");
        return Err("No valid input".to_string());
    }
}

pub fn test_get_asset_principal(
    asset: String,
    pic: &PocketIc,
    backend_canister: Principal,
) -> Option<Principal> {
    let result = pic.query_call(
        backend_canister,
        Principal::anonymous(),
        "get_asset_principal",
        encode_one(asset.clone()).unwrap(),
    );

    let asset_canister_id = match result {
        Ok(WasmResult::Reply(response_data)) => {
            match decode_one::<Result<Principal, errors::Error>>(&response_data) {
                Ok(Ok(principal)) => Some(principal),
                Ok(Err(err)) => {
                    ic_cdk::println!("❌ Error retrieving asset principal: {:?}", err);
                    None
                }
                Err(decode_err) => {
                    ic_cdk::println!("❌ Supply failed with error: {:?}", decode_err);
                    None
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            println!("❌ Query call rejected: {}", reject_message);
            None
        }
        Err(call_err) => {
            println!("❌ Query call failed: {}", call_err);
            None
        }
    };
    return asset_canister_id;
}

pub fn test_icrc2_aprove(
    user_principal: Principal,
    asset_principal: Principal,
    pic: &PocketIc,
    backend_canister: Principal,
) -> bool {
    let approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount: Nat::from(1000_0000_000u128),
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: backend_canister,
            subaccount: None,
        },
    };

    let args_encoded = encode_one(approve_args).expect("❌ Failed to encode approve arguments");
    ic_cdk::println!("🟦 ICRC2 Approving ...");
    let approve_result = pic.update_call(
        asset_principal,
        user_principal,
        "icrc2_approve",
        args_encoded,
    );

    // Handle the result of the approve call
    match approve_result {
        Ok(WasmResult::Reply(reply)) => {
            let approve_response: Result<ApproveResult, _> = candid::decode_one(&reply);
            match approve_response {
                Ok(ApproveResult::Ok(block_index)) => {
                    ic_cdk::println!("☑️  Approve succeeded, block index: {}", block_index);
                    return true;
                }
                Ok(ApproveResult::Err(error)) => {
                    ic_cdk::println!("❌ Approve failed with error: {:?}", error);
                    return false;
                }
                Err(e) => {
                    ic_cdk::println!("❌  Failed to decode ApproveResult: {:?}", e);
                    return false;
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            ic_cdk::println!("❌  Approve call rejected: {}", reject_message);
            return false;
        }
        Err(e) => {
            ic_cdk::println!("❌  Error during approve call: {:?}", e);
            return false;
        }
    }
    return false;
}


pub fn test_create_user_reserve_with_low_health(pic: &PocketIc, backend_canister: Principal) {
    struct LowHealthUsers {
        asset_supply: String,
        asset_borrow: String,
        supply_tokens: Nat,
        borrow_tokens: Nat,
    }

    let mut users_with_low_health: Vec<LowHealthUsers> = Vec::new();
    // Pushing first user data
    users_with_low_health.push(LowHealthUsers {
        asset_supply: "ICP".to_string(),
        asset_borrow: "ICP".to_string(),
        supply_tokens: Nat::from(100_000_000u128),
        borrow_tokens: Nat::from(90_000_000u128),
    });

    // Pushing second user data
    // users_with_low_health.push(LowHealthUsers {
    //     asset_supply: "ckETH".to_string(),
    //     asset_borrow: "ckBTC".to_string(),
    //     supply_tokens: Nat::from(1_000_000u128), // 0.01
    //     borrow_tokens: Nat::from(200_00u128),// 0.00002
    // });

    let user_principal = get_users_principal(Nat::from(2u32)).unwrap();
    for user in &users_with_low_health {
        let asset_principal =
            match test_get_asset_principal(user.asset_supply.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    continue;
                }
            };
        let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister);
        if !approved {
            continue;
        }

        let result = pic.update_call(
            backend_canister,
            user_principal,
            "create_user_reserve_with_low_health",
            encode_args((
                user.asset_supply.clone(),
                user.asset_borrow.clone(),
                user.supply_tokens.clone(),
                user.borrow_tokens.clone(),
            ))
            .unwrap(),
        );

        // Decode the response
        match result {
            Ok(WasmResult::Reply(response)) => {
                let initialize_response: Result<UserData, errors::Error> =
                    candid::decode_one(&response)
                        .expect("Failed to decode create_user_reserve_with_low_health response");

                match initialize_response {
                    Ok(data) => {
                        // ic_cdk::println!("user reserve data : {:?}", data);
                        ic_cdk::println!(
                            "✅ Create_user_reserve_with_low_health function succeeded"
                        );
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "Create_user_reserve_with_low_health function failed as expected with error: {:?}",
                            e
                        );
                        panic!("🚨 Expected success but got error: {:?}", e);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                panic!(
                    "🚨 Create_user_reserve_with_low_health function was rejected: {:?}",
                    reject_message
                );
            }
            Err(e) => {
                panic!(
                    "🚨 Error calling Create_user_reserve_with_low_health function: {:?}",
                    e
                );
            }
        }
    }
}