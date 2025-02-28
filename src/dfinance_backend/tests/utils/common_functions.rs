
use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use crate::utils::error as errors;
use crate::utils::structs::*;


pub fn get_user_principal() -> Principal {
    Principal::from_text("zcfkh-4mzoh-shpaw-tthfa-ak7s5-oavgv-vwjhz-tdupg-3bxbo-2p2je-7ae").unwrap()
}
pub fn generate_principals(count: usize) -> Vec<Principal> {
    (1..=count)
        .map(|i| Principal::from_slice(&[i as u8; 29])) // 29-byte unique Principal
        .collect()
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
    } else if index == Nat::from(3u32) {
        Ok(
            Principal::from_text("vgwvq-vfd6w-fphlc-bbw46-uef3k-pgsdk-4pimw-k4cge-gbzts-wxbuu-tae")
                .unwrap(),
        )
    } else if index == Nat::from(4u32) {
        Ok(
            Principal::from_text("7xhye-kr46o-ar2qe-o6q43-27mej-uicgc-zs5dp-tdp3c-mshcl-ggv2m-yae")
                .unwrap(),
        )
    } else if index == Nat::from(5u32) {
        Ok(
            Principal::from_text("oy3k4-vldva-7vtsc-ngklb-srvb3-7alpx-neqah-exvie-fbaxl-r2je7-rqe")
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
                    ic_cdk::println!("Output error: Error retrieving asset principal: {:?}", err);
                    None
                }
                Err(decode_err) => {
                    ic_cdk::println!("Output error: Error retrieving asset principal with error: {:?}", decode_err);
                    None
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            println!("Query call rejected: {}", reject_message);
            None
        }
        Err(call_err) => {
            println!("Query call failed: {}", call_err);
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
    amount:Nat
) -> bool {
    let approve_args = ApproveArgs {
        fee: None,
        memo: None,
        from_subaccount: None,
        created_at_time: None,
        amount,
        expected_allowance: None,
        expires_at: None,
        spender: Account {
            owner: backend_canister,
            subaccount: None,
        },
    };
    let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");
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
                    ic_cdk::println!("Output Error: Approve failed with error: {:?}", error);
                    return false;
                }
                Err(e) => {
                    ic_cdk::println!("Output Error: Failed to decode ApproveResult: {:?}", e);
                    return false;
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            ic_cdk::println!("Output Error: Approve call rejected: {}", reject_message);
            return false;
        }
        Err(e) => {
            ic_cdk::println!("Output Error: Error during approve call: {:?}", e);
            return false;
        }
    }
    return false;
}


pub fn test_create_user_reserve_with_low_health(pic: &PocketIc, backend_canister: Principal) {

    #[derive(Debug, CandidType, Deserialize, Clone)]
    struct LowHealthUsersData {
        user_principal: Principal,
        asset_supply: String,
        asset_borrow: String,
        supply_tokens: Nat,
        borrow_tokens: Nat,
    }

    let mut users_with_low_health: Vec<LowHealthUsersData> = Vec::new();
    // Pushing first user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal: get_users_principal(Nat::from(1u32)).unwrap(),
        asset_supply: "ICP".to_string(),
        asset_borrow: "ICP".to_string(),
        supply_tokens: Nat::from(100_000_000u128), // 1 icp
        borrow_tokens: Nat::from(90_000_000u128), // 0.9 icp
    });

    // Pushing second user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal:get_users_principal(Nat::from(2u32)).unwrap(),
        asset_supply: "ckETH".to_string(),
        asset_borrow: "ckETH".to_string(),
        supply_tokens: Nat::from(14000000u128), // 0.14 cketh
        borrow_tokens: Nat::from(12000000u128),// 0.12 cketh
    });
    // Pushing third user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal:get_users_principal(Nat::from(3u32)).unwrap(),
        asset_supply: "ckBTC".to_string(),
        asset_borrow: "ckBTC".to_string(),
        supply_tokens: Nat::from(450_000u128), // 0.0045 btc
        borrow_tokens: Nat::from(420_000u128),// 0.0042 btc
    });
    // Pushing 4th user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal:get_users_principal(Nat::from(4u32)).unwrap(),
        asset_supply: "ckUSDC".to_string(),
        asset_borrow: "ckUSDC".to_string(),
        supply_tokens: Nat::from(45_000_000_000u128), // 450 usdc
        borrow_tokens: Nat::from(40_000_000_000u128),// 400 usdt
    });
    // Pushing 5th user data
    users_with_low_health.push(LowHealthUsersData {
        user_principal:get_users_principal(Nat::from(5u32)).unwrap(),
        asset_supply: "ckUSDT".to_string(),
        asset_borrow: "ckUSDT".to_string(),
        supply_tokens: Nat::from(30_000_000_000u128), // 300 USDT
        borrow_tokens: Nat::from(25_000_000_000u128),// 250 USDT
    });

    
    for user in &users_with_low_health {
        let asset_principal =
            match test_get_asset_principal(user.asset_supply.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    continue;
                }
            };
        ic_cdk::println!("user : {:?}", user.user_principal.to_string());
        let approved =
            test_icrc2_aprove(user.user_principal, asset_principal, &pic, backend_canister,Nat::from(user.supply_tokens.clone()));
        if !approved {
            continue;
        }

        let result = pic.update_call(
            backend_canister,
            user.user_principal,
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
                let create_user_response: Result<UserData, errors::Error> =
                    candid::decode_one(&response)
                        .expect("Failed to decode create_user_reserve_with_low_health response");

                match create_user_response {
                    Ok(data) => {
                        ic_cdk::println!(
                            "✅ Create_user_reserve_with_low_health function succeeded"
                        );
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "Output Error: Create_user_reserve_with_low_health function failed as expected with error: {:?}",
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


pub fn test_add_tester(pic: &PocketIc, backend_canister: Principal, user_principal: Principal,tester_principal:Principal){
    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args((tester_principal.to_string(),tester_principal)).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let add_tester_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match add_tester_response {
                Ok(()) => {
                    ic_cdk::println!("✅ Add Tester function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!(
                        "Add Tester function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨 Add Tester function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling Add Tester function: {:?}", e);
        }
    }
}