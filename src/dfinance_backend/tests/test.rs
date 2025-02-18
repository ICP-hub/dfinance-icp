use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;
mod error;
use error as errors;
use std::collections::HashMap;


const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct ReserveData {
    pub asset_name: Option<String>,
    pub id: u16,
    pub d_token_canister: Option<String>,
    pub debt_token_canister: Option<String>,
    pub borrow_rate: Nat,
    pub current_liquidity_rate: Nat,
    pub asset_supply: Nat,
    pub asset_borrow: Nat,
    pub liquidity_index: Nat,
    pub debt_index: Nat,
    pub configuration: ReserveConfiguration,
    pub can_be_collateral: Option<bool>,
    pub last_update_timestamp: u64,
    pub accure_to_platform: Nat,
}

#[derive(Default, CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ReserveConfiguration {
    pub ltv: Nat,
    pub liquidation_threshold: Nat,
    pub liquidation_bonus: Nat,
    pub borrowing_enabled: bool,
    pub borrow_cap: Nat,
    pub supply_cap: Nat,
    pub liquidation_protocol_fee: Nat,
    pub active: bool,
    pub frozen: bool,
    pub paused: bool,
    pub reserve_factor: Nat,
}
#[derive(CandidType, Deserialize)]
pub struct TransferFromArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: TransferAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: TransferAccount,
    pub fee: Option<u64>,
    pub spender_subaccount: Option<Vec<u8>>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferAccount {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromResult {
    Ok(Nat),
    Err(TransferFromError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferFromError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    InsufficientAllowance { allowance: Nat },
    BadBurn { min_burn_amount: Nat },
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    CreatedInFuture { ledger_time: u64 },
    TooOld,
    InsufficientFunds { balance: Nat },
}

#[derive(CandidType)]
pub enum LedgerArgument {
    Init(InitArgs),
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct ArchiveOptions {
    num_blocks_to_archive: u64,
    max_transactions_per_response: Option<u64>,
    trigger_threshold: u64,
    more_controller_ids: Option<Vec<Principal>>,
    max_message_size_bytes: Option<u64>,
    cycles_for_archive_creation: Option<u64>,
    node_max_memory_size_bytes: Option<u64>,
    controller_id: Principal,
}

#[derive(CandidType, Deserialize, Serialize)]
struct FeatureFlags {
    icrc2: bool,
}

#[derive(CandidType, Deserialize, Serialize)]
struct InitArgs {
    token_symbol: String,
    token_name: String,
    transfer_fee: Nat,
    metadata: Vec<(String, String)>,
    minting_account: Account,
    initial_balances: Vec<(Account, Nat)>,
    archive_options: ArchiveOptions,
    feature_flags: Option<FeatureFlags>,
}

#[derive(CandidType, Deserialize, Serialize)]
struct ApproveArgs {
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    from_subaccount: Option<Vec<u8>>,
    created_at_time: Option<u64>,
    amount: Nat,
    expected_allowance: Option<Nat>,
    expires_at: Option<u64>,
    spender: Account,
}

#[derive(CandidType, Deserialize, Serialize, Debug)]
enum ApproveError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: Nat },
    BadFee { expected_fee: Nat },
    AllowanceChanged { current_allowance: Nat },
    CreatedInFuture { ledger_time: Nat },
    TooOld,
    Expired { ledger_time: Nat },
    InsufficientFunds { balance: Nat },
}

#[derive(CandidType, Deserialize, Serialize)]
enum ApproveResult {
    Ok(Nat),
    Err(ApproveError),
}

#[derive(CandidType)]
pub struct ExecuteSupplyParams {
    pub asset: String,
    pub amount: Nat,
    pub is_collateral: bool,
}

#[derive(CandidType)]
pub struct ExecuteBorrowParams {
    pub asset: String,
    pub amount: Nat,
}

#[derive(CandidType)]
pub struct ExecuteRepayParams {
    pub asset: String,
    pub amount: Nat,
    pub on_behalf_of: Option<Principal>,
}

#[derive(CandidType)]
pub struct ExecuteLiquidationParams {
    pub debt_asset: String,
    pub collateral_asset: String,
    pub amount: Nat,
    pub on_behalf_of: Principal,
    pub reward_amount: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ExecuteWithdrawParams {
    pub asset: String,
    pub amount: Nat,
    pub on_behalf_of: Option<Principal>,
    pub is_collateral: bool,
}
/*
 * @title User Reserve Data
 * @dev Stores the user's balance and reserve-related details.
 */
#[derive(CandidType, Deserialize, Serialize, Debug, Clone)]
pub struct UserReserveData {
    pub reserve: String,
    pub last_update_timestamp: u64,
    pub liquidity_index: Nat,
    pub variable_borrow_index: Nat,
    pub asset_supply: Nat,
    pub asset_borrow: Nat,
    pub is_using_as_collateral_or_borrow: bool,
    pub is_collateral: bool,
    pub is_borrowed: bool,
    pub faucet_usage: Nat,
    pub faucet_limit: Nat,
    pub d_token_balance: Nat,
    pub debt_token_blance: Nat,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UserData {
    pub user_id: Option<String>,
    pub total_collateral: Option<Nat>,
    pub total_debt: Option<Nat>,
    pub reserves: Option<Vec<(String, UserReserveData)>>,
}

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
                let initialize_response: Result<UserData, errors::Error> =
                    candid::decode_one(&response)
                        .expect("Failed to decode create_user_reserve_with_low_health response");

                match initialize_response {
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


fn test_add_tester(pic: &PocketIc, backend_canister: Principal, user_principal: Principal,tester_principal:Principal){
    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args((tester_principal.to_string(),tester_principal)).unwrap(),
    );

    // Decode the response
    match add_tester_result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<(), errors::Error> =
                candid::decode_one(&response).expect("Failed to decode add tester response");

            match initialize_response {
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

fn test_register_user(pic: &PocketIc, backend_canister: Principal, user_principal: Principal){

    let result = pic.update_call(
        backend_canister,
        user_principal,
        "register_user",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<String, errors::Error> =
                candid::decode_one(&response).expect("Failed to decode register user response");

            match initialize_response {
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


fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();

    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 5_000_000_000_000_000);
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    ic_cdk::println!("Backend canister: {}", backend_canister);
    pic.install_canister(
        backend_canister,
        wasm,
        candid::encode_one(Principal::anonymous()).unwrap(),
        Some(Principal::anonymous()),
    );

    let _ = pocket_ic::PocketIc::set_controllers(
        &pic,
        backend_canister,
        Some(Principal::anonymous()),
        vec![user_principal],
    );

    // 🔹 Define test input (token name + reserve data)
    let ICP_token_name = "ICP".to_string();
    let ICP_reserve_data = ReserveData {
        asset_name: Some(ICP_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(5800000000u128),
            liquidation_threshold: Nat::from(6300000000u128),
            liquidation_bonus: Nat::from(100000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, 
        accure_to_platform: Nat::from(0u128), 
    };

    let ckBTC_token_name = "ckBTC".to_string();
    let ckBTC_reserve_data = ReserveData {
        asset_name: Some(ckBTC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), 
        current_liquidity_rate: Nat::from(0u128), 
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7300000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckETH_token_name = "ckETH".to_string();
    let ckETH_reserve_data = ReserveData {
        asset_name: Some(ckETH_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), 
        current_liquidity_rate: Nat::from(0u128), 
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(8000000000u128),
            liquidation_threshold: Nat::from(8300000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckUSDC_token_name = "ckUSDC".to_string();
    let ckUSDC_reserve_data = ReserveData {
        asset_name: Some(ckUSDC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(1u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(500000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let ckUSDT_token_name = "ckUSDT".to_string();
    let ckUSDT_reserve_data = ReserveData {
        asset_name: Some(ckUSDT_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128),
        current_liquidity_rate: Nat::from(0u128),
        asset_supply: Nat::from(0u128),
        asset_borrow: Nat::from(0u128),
        liquidity_index: Nat::from(100000000u128),
        debt_index: Nat::from(0u128),
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),
            liquidation_threshold: Nat::from(7800000000u128),
            liquidation_bonus: Nat::from(450000000u128),
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128),
            supply_cap: Nat::from(10_000_000_000u128),
            liquidation_protocol_fee: Nat::from(0u128),
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128),
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1,
        accure_to_platform: Nat::from(0u128),
    };

    let mut reserve_tokens_map: HashMap<String, ReserveData> = HashMap::new();

    reserve_tokens_map.insert(ICP_token_name, ICP_reserve_data);
    reserve_tokens_map.insert(ckBTC_token_name, ckBTC_reserve_data);
    reserve_tokens_map.insert(ckETH_token_name, ckETH_reserve_data);
    reserve_tokens_map.insert(ckUSDC_token_name, ckUSDC_reserve_data);
    reserve_tokens_map.insert(ckUSDT_token_name, ckUSDT_reserve_data);

    //================= Initialize ==================
    // 🔹 Call the `initialize` function

    ic_cdk::println!("things are working:");
    for (token_name, reserve_data) in &reserve_tokens_map {
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "initialize",
            encode_args((token_name, reserve_data)).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let initialize_response: Result<(), errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode initialize response");

                match initialize_response {
                    Ok(()) => {
                        ic_cdk::println!("✅ Initialize function succeeded for {:?}", token_name);
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "❌ Initialize function failed as expected with error: {:?}",
                            e
                        );
                        panic!("🚨 Expected success but got error: {:?}", e);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                panic!("🚨 Initialize function was rejected: {:?}", reject_message);
            }
            Err(e) => {
                panic!("🚨 Error calling initialize function: {:?}", e);
            }
        }
    }

    // adding testers
    test_add_tester(&pic, backend_canister, user_principal, user_principal);
    for num in 1..=5 {
        let index: u32 = num as u32;
        test_add_tester(&pic, backend_canister, user_principal, get_users_principal(Nat::from(index)).unwrap());
    }

    let result = pic.update_call(
        backend_canister,
        user_principal,
        "update_reserve_price_test",
        encode_one(()).unwrap(),
    );

    // 🔹 Decode the response
    match result {
        Ok(WasmResult::Reply(response)) => {
            let initialize_response: Result<(), errors::Error> = candid::decode_one(&response)
                .expect("Failed to decode reserve price cache response");

            match initialize_response {
                Ok(_message) => {
                    ic_cdk::println!("✅ update reserve price function succeeded");
                }
                Err(e) => {
                    ic_cdk::println!(
                        "update reserve price function failed as expected with error: {:?}",
                        e
                    );
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!(
                "🚨update reserve price function was rejected: {:?}",
                reject_message
            );
        }
        Err(e) => {
            panic!("🚨 Error calling update reserve price function: {:?}", e);
        }
    }

    //registering users
    test_register_user(&pic, backend_canister,user_principal);
    for num in 1..=5 {
        let index: u32 = num as u32;
        test_register_user(&pic, backend_canister,get_users_principal(Nat::from(index)).unwrap());
    }

    (pic, backend_canister)
}

#[test]
fn call_test_function() {
    let (pic, backend_canister) = setup();
    test_faucet(&pic, backend_canister);
    test_supply(&pic, backend_canister);
    test_borrow(&pic, backend_canister);
    test_repay(&pic, backend_canister);
    test_withdraw(&pic, backend_canister);
    test_liquidation(&pic, backend_canister);
}


fn test_faucet(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        //  Valid faucet request for each asset
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(5_000_000_000u128), // 50 ICP
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(450_000u128), // 0.0045 ckBTC
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(45_000_000_000u128), //   450 usdc
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(30_000_000_000u128), // 300 ckUSDT
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(14000000u128), //  0.14 ckETH
            expect_success: true,
            expected_error_message: None,
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100000u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50000u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(10_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Amount is too much".to_string()),
        },
        // Boundry amount
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Faucet Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Faucet Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        // Simulate faucet request
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "faucet",
            encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }

        for num in 1..=5 {
            let index: u32 = num as u32;
            // Simulate faucet request
            let result = pic.update_call(
                backend_canister,
                get_users_principal(Nat::from(index)).unwrap(),
                "faucet",
                encode_args((case.asset.clone(), Nat::from(case.amount.clone()))).unwrap(),
            );

            match result {
                Ok(WasmResult::Reply(reply)) => {
                    let decoded_response: Result<Nat, errors::Error> =
                        candid::decode_one(&reply).expect("Failed to decode faucet response");

                    match decoded_response {
                        Ok(balance) => {
                            if !case.expect_success {
                                ic_cdk::println!(
                                    "❌ IC Test Case {} Failed: Expected failure but got success.",
                                    i + 1
                                );
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Faucet successful. New Balance: {}",
                                i + 1,
                                balance
                            );
                        }
                        Err(error) => {
                            if !case.expect_success {
                                if case.expected_error_message.as_deref() != Some(error.message()) {
                                    println!(
                                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                        i + 1,
                                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                        error.message()
                                    );                            
                                    continue;
                                }
                                ic_cdk::println!(
                                    "✅ IC Test Case {} Passed: Faucet rejected as expected with message: {:?}",
                                    i + 1,
                                    error
                                );
                            } else {
                                ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                                continue;
                            }
                        }
                    }
                }
                Ok(WasmResult::Reject(reject_message)) => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                        i + 1,
                        reject_message
                    );
                    continue;
                }
                Err(e) => {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Error during faucet function call: {:?}",
                        i + 1,
                        e
                    );
                    continue;
                }
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Faucet Tests Completed ========================\n"
    );
}

fn test_supply(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid Test Cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(4_000_000_000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        //  Invalid Test Cases
        // Empty assets name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(1000000000000000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        //  low wallet amount
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(100000000u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some(
                "Amount must be less than user available balance".to_string(),
            ),
        },
        // // testcase will work only if this asset has not been faucet
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: Nat::from(1000000000u128),
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("Amount must be less than user available balance".to_string()),
        // },

        // Zero amount request
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(0u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some(
                "Asset must have a maximum length of 7 characters".to_string(),
            ),
        },
        // Non-existent asset
        TestCase {
            asset: "ckXYZ".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Supply Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Supply Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let asset_principal =
            match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply rejected as expected",
                            i + 1,
                        );
                    } else {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Expected success but got rejection",
                            i + 1
                        );
                    }
                    continue;
                }
            };
   
        let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister,  case.amount.clone());
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                    );                            
                    continue;
                }
                ic_cdk::println!(
                    "✅ IC Test Case {} Passed: Supply rejected as expected",
                    i + 1,
                );
            } else {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }

        let supply_params = ExecuteSupplyParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            is_collateral: case.is_collateral,
        };

        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_supply",
            encode_one(supply_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let supply_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get supply response");

                match supply_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Supply rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during supply function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Supply Tests Completed ========================\n"
    );
}

fn test_borrow(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // valid test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500u128),
            expect_success: true,
            expected_error_message: None,
        },

        // Invalid Cases 
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckETHEREUM".to_string(),
            amount: Nat::from(50u128),
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Large amount
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(100_000_000_000u128),
            expect_success: false,
            expected_error_message: Some("Amount is too much".to_string()),
        },
    ];

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Borrow Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let borrow_params = ExecuteBorrowParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
        };

        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_borrow",
            encode_one(borrow_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let borrow_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC borrow response");

                match borrow_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Borrow successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during borrow function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Borrow Tests Completed ========================\n"
    );
}

fn test_withdraw(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        is_collateral: bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(3_800_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(40000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(5000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(10000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(2000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // Valid Collateral Withdrawals
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128),
            on_behalf_of: None,
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid Cases (General Failures)
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100_000_000_000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Withdraw cannot be more than supply".to_string()),
        },
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "ckXYZ_long".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
    ];

    ic_cdk::println!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Withdraw Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!(
            "On Behalf Of: {}",
            case.on_behalf_of
                .as_ref()
                .map_or("None".to_string(), |p| p.to_text())
        );
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of,
            is_collateral: case.is_collateral.clone(),
        };
        // Now call the withdraw function 
        let result = pic.update_call(
            backend_canister,
            get_user_principal(),
            "execute_withdraw",
            encode_one(withdraw_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let withdraw_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC withdraw response");

                match withdraw_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Withdraw successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, error);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during withdraw function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }

    ic_cdk::println!(
        "\n======================== IC Withdraw Tests Completed ========================\n"
    );
}

fn test_repay(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        asset: String,
        amount: Nat,
        on_behalf_of: Option<Principal>,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases: Vec<TestCase> = vec![
        // Valid  test cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(20000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(200u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(500u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(500u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        // Invalid cases
        // Empty asset name
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        // Asset length exceeds 7 characters
        TestCase {
            asset: "TooLongAsset".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Lenght of the asset is invalid".to_string()),
        },
        // Zero amount request
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },
        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(50000000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no canister id found".to_string()),
        },
        // Large amount exceeding wallet balance
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(50_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("wallet balance is low".to_string()),
        },
        // repay on no borrow
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(1_000_000_000u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("no debt to repay".to_string()),
        },
    ];

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Repay Tests ========================\n"
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Repay Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        if let Some(ref principal) = case.on_behalf_of {
            ic_cdk::println!("On Behalf Of: {}", principal);
        }
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let asset_principal =
            match test_get_asset_principal(case.asset.clone(), &pic, backend_canister) {
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Supply rejected as expected",
                            i + 1,
                        );
                    } else {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Expected success but got rejection",
                            i + 1
                        );
                        
                    }
                    continue;
                }
            };
        let approved = test_icrc2_aprove(user_principal, asset_principal, &pic, backend_canister, Nat::from(case.amount.clone()));
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                    );                            
                    continue;
                }
                ic_cdk::println!(
                    "✅ IC Test Case {} Passed: Supply rejected as expected",
                    i + 1,
                );
            } else {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }

        let repay_params = ExecuteRepayParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
        };

        // Now call the repay function
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "execute_repay",
            encode_one(repay_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let repay_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC repay response");

                match repay_response {
                    Ok(balance) => {
                        if !case.expect_success {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success.",
                                i + 1
                            );
                            continue;
                        }
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(error.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    error.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Repay rejected as expected with message: {:?}",
                                i + 1,
                                error
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}",
                                i + 1,
                                error
                            );
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during repay function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Repay Tests Completed ========================\n"
    );
}

fn test_liquidation(pic: &PocketIc, backend_canister: Principal) {
    #[derive(Debug, Clone)]
    struct TestCase {
        debt_asset: String,
        collateral_asset: String,
        amount: Nat,
        on_behalf_of: Principal,
        reward_amount: Nat,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid cases with sufficient collateral
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(1u32)).unwrap(),
            reward_amount: Nat::from(40400_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(210000u128),
            on_behalf_of: get_users_principal(Nat::from(3u32)).unwrap(),
            reward_amount: Nat::from(220500u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDC".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(200_00_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(4u32)).unwrap(),
            reward_amount: Nat::from(210_00_000_000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            debt_asset: "ckUSDT".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(12500000000u128),
            on_behalf_of: get_users_principal(Nat::from(5u32)).unwrap(),
            reward_amount: Nat::from(13062500000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // Edge case: Minimal possible amount
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Invalid burn amount".to_string()),
        },

        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(6_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5250000u128),
            expect_success: true,
            expected_error_message: None,
        },
        

        // Very large amounts (stress test)
        TestCase {
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(5_000_000u128), 
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(5250000u128),
            expect_success: false,
            expected_error_message: Some("Health factor is falling below 1, will lead to liquidation".to_string()),
        },


        //  Invalid asset
        TestCase {
            debt_asset: "XYZ".to_string(),
            collateral_asset: "XYZ".to_string(),
            amount: Nat::from(40_000_000u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(), 
            reward_amount: Nat::from(40400_000u128),
            expect_success: false,
            expected_error_message: Some("No principal found for asset".to_string()),
        },

        // Anonymous principals are not allowed
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        },

        // Zero amount 
        TestCase {
            debt_asset: "ICP".to_string(),
            collateral_asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: get_users_principal(Nat::from(2u32)).unwrap(),
            reward_amount: Nat::from(150u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than 0".to_string()),
        },

    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );
    test_create_user_reserve_with_low_health(&pic, backend_canister);

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("🔵 IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset);
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
        let amount_u128: u64 = case.amount.clone().0.try_into().unwrap();
        let amount_float = amount_u128 as f64;
        ic_cdk::println!("Amount: {}", amount_float / 100000000.0);
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let asset_principal =
            match test_get_asset_principal(case.debt_asset.clone(), &pic, backend_canister){
                Some(principal) => principal,
                None => {
                    if !case.expect_success {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Liquidation rejected as expected",
                            i + 1,
                        );
                    } else {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Expected success but got rejection",
                            i + 1
                        );
                    }
                    continue;
                }
            };

        let approved =test_icrc2_aprove(
            get_users_principal(Nat::from(1u128)).unwrap(),
            asset_principal,
            &pic,
            backend_canister,
            Nat::from(case.amount.clone()),
        );
        if !approved {
            if !case.expect_success {
                if case.expected_error_message.as_deref() != Some("icrc2 not approved") {
                    println!(
                        "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: icrc2 not approved",
                        i + 1,
                        case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                    );                            
                    continue;
                }
                ic_cdk::println!(
                    "✅ IC Test Case {} Passed: Supply rejected as expected",
                    i + 1,
                );
            } else {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Expected success but got rejection",
                    i + 1
                );
            }
            continue;
        }

        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
            reward_amount: case.reward_amount.clone(),
        };

        let result = pic.update_call(
            backend_canister,
            get_users_principal(Nat::from(1u32)).unwrap(),
            "execute_liquidation",
            encode_one(liquidation_params).unwrap(),
        );

        match result {
            Ok(WasmResult::Reply(response)) => {
                let liquidation_response: Result<Nat, errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode liquidation response");

                match liquidation_response {
                    Ok(_) => {
                        if case.expect_success {
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation completed successfully",
                                i + 1
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ IC Test Case {} Failed: Expected failure but got success",
                                i + 1
                            );
                        }
                    }
                    Err(e) => {
                        if !case.expect_success {
                            if case.expected_error_message.as_deref() != Some(e.message()) {
                                println!(
                                    "❌ IC Test Case {} Failed: Error message mismatch.\nExpected: {}\nActual: {}",
                                    i + 1,
                                    case.expected_error_message.as_deref().unwrap_or("Error msg not given").to_string(),
                                    e.message()
                                );                            
                                continue;
                            }
                            ic_cdk::println!(
                                "✅ IC Test Case {} Passed: Liquidation rejected as expected with message: {:?}",
                                i + 1,
                                e
                            );
                        } else {
                            ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {:?}", i + 1, e);
                            continue;
                        }
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Function call rejected with message: {}",
                    i + 1,
                    reject_message
                );
                continue;
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during liquidation function call: {:?}",
                    i + 1,
                    e
                );
                continue;
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}