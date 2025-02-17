use candid::{decode_one, encode_args, encode_one, Principal};
use candid::{CandidType, Deserialize, Nat};
use pocket_ic::{PocketIc, WasmResult};
use serde::Serialize;
use std::fs;
mod error;
use error as errors;
use std::collections::HashMap;

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

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";

fn get_user_principal() -> Principal {
    Principal::from_text("zcfkh-4mzoh-shpaw-tthfa-ak7s5-oavgv-vwjhz-tdupg-3bxbo-2p2je-7ae").unwrap()
}

fn get_users_principal(index: Nat) -> Result<Principal, String> {
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
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),   // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(5800000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(6300000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(100000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckBTC_token_name = "ckBTC".to_string();
    let ckBTC_reserve_data = ReserveData {
        asset_name: Some(ckBTC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7300000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckETH_token_name = "ckETH".to_string();
    let ckETH_reserve_data = ReserveData {
        asset_name: Some(ckETH_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(8000000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(8300000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckUSDC_token_name = "ckUSDC".to_string();
    let ckUSDC_reserve_data = ReserveData {
        asset_name: Some(ckUSDC_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(1u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(500000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
    };

    let ckUSDT_token_name = "ckUSDT".to_string();
    let ckUSDT_reserve_data = ReserveData {
        asset_name: Some(ckUSDT_token_name.clone()),
        id: 1,
        d_token_canister: None,
        debt_token_canister: None,
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
        configuration: ReserveConfiguration {
            ltv: Nat::from(7500000000u128),                   // Nat format for ltv
            liquidation_threshold: Nat::from(7800000000u128), // Nat format for liquidation_threshold
            liquidation_bonus: Nat::from(450000000u128),      // Nat format for liquidation_bonus
            borrowing_enabled: true,
            borrow_cap: Nat::from(10_000_000_000u128), // Nat format for borrow_cap
            supply_cap: Nat::from(10_000_000_000u128), // Nat format for supply_cap
            liquidation_protocol_fee: Nat::from(0u128), // Nat format for liquidation_protocol_fee
            frozen: false,
            active: true,
            paused: false,
            reserve_factor: Nat::from(1500000000u128), // Nat format for reserve_factor
        },
        can_be_collateral: Some(true),
        last_update_timestamp: 1, // Nat format for last_update_timestamp
        accure_to_platform: Nat::from(0u128), // Nat format for accure_to_platform
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

    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args(("tester".to_string(), user_principal.clone())).unwrap(),
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
                    ic_cdk::println!("Add Tester function failed as expected with error: {:?}", e);
                    panic!("🚨 Expected success but got error: {:?}", e);
                }
            }
        }
        Ok(WasmResult::Reject(reject_message)) => {
            panic!("🚨 Add Tester function was rejected: {:?}", reject_message);
        }
        Err(e) => {
            panic!("🚨 Error calling Add Tester function: {:?}", e);
        }
    }

     
    let add_tester_result = pic.update_call(
        backend_canister,
        user_principal,
        "add_tester",
        encode_args(("tester2".to_string(), get_users_principal(Nat::from(2u32)).unwrap())).unwrap(),
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
    let result = pic.update_call(
        backend_canister,
        get_users_principal(Nat::from(1u32)).unwrap(),
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

    let result = pic.update_call(
        backend_canister,
        get_users_principal(Nat::from(2u32)).unwrap(),
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

fn test_get_asset_principal(
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

fn test_icrc2_aprove(
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

fn test_create_user_reserve_with_low_health(pic: &PocketIc, backend_canister: Principal) {
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
                        ic_cdk::println!("user reserve data : {:?}", data);
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
