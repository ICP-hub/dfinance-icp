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
    pub borrow_cap: Nat, //TODO set it according to borrow
    pub supply_cap: Nat, //set it according to supply
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

const BACKEND_WASM: &str = "../../target/wasm32-unknown-unknown/release/dfinance_backend.wasm";
const XRC_WASM: &str = "../../target/wasm32-unknown-unknown/release/xrc.wasm";

fn get_user_principal() -> Principal {
    Principal::from_text("zcfkh-4mzoh-shpaw-tthfa-ak7s5-oavgv-vwjhz-tdupg-3bxbo-2p2je-7ae").unwrap()
}

fn setup() -> (PocketIc, Principal) {
    let pic = PocketIc::new();
    let user_principal = get_user_principal();

    //================== backend canister =====================
    let backend_canister = pic.create_canister();
    pic.add_cycles(backend_canister, 5_000_000_000_000_000); // 2T Cycles
    let wasm = fs::read(BACKEND_WASM).expect("Wasm file not found, run 'dfx build'.");
    ic_cdk::println!("Backend canister: {}", backend_canister);
    pic.install_canister(
        backend_canister,
        wasm,
        candid::encode_one(Principal::anonymous()).unwrap(),
        Some(Principal::anonymous()),
    );

    let xrc_canister = pic.create_canister();
    pic.add_cycles(xrc_canister, 5_000_000_000_000_000); // 2T Cycles
    let wasm = fs::read(XRC_WASM).expect("Wasm file not found, run 'dfx build'.");
    pic.install_canister(xrc_canister, wasm, vec![], None);

    ic_cdk::println!("xrc canister: {}", xrc_canister);
    ic_cdk::println!("backend cycles = {}", pic.cycle_balance(backend_canister));
    ic_cdk::println!("cycles = {}", pic.cycle_balance(xrc_canister));

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
        borrow_rate: Nat::from(0u128), // Nat format for borrow_rate
        current_liquidity_rate: Nat::from(0u128), // Nat format for current_liquidity_rate
        asset_supply: Nat::from(0u128), // Nat format for asset_supply
        asset_borrow: Nat::from(0u128), // Nat format for asset_borrow
        liquidity_index: Nat::from(100000000u128), // Nat format for liquidity_index
        debt_index: Nat::from(0u128),  // Nat format for debt_index
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
            liquidation_bonus: Nat::from(450000000u128),     // Nat format for liquidation_bonus
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
        // 🔹 Call the `initialize` function
        let result = pic.update_call(
            backend_canister,
            user_principal,
            "initialize",
            encode_args((token_name, reserve_data)).unwrap(),
        );

        // 🔹 Decode the response
        match result {
            Ok(WasmResult::Reply(response)) => {
                let initialize_response: Result<(), errors::Error> =
                    candid::decode_one(&response).expect("Failed to decode initialize response");

                match initialize_response {
                    Ok(()) => {
                        ic_cdk::println!("✅ Initialize function succeeded for test case");
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

    let result = pic.update_call(
        backend_canister,
        Principal::anonymous(),
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
    (pic, backend_canister)
}

#[test]
fn call_test_function() {
    let (pic, backend_canister) = setup();
    test_faucet(&pic, backend_canister);
    // test_supply(&pic, backend_canister);
    // test_withdraw(&pic, backend_canister);
    // test_borrow(&pic, backend_canister);
    // test_repay(&pic, backend_canister);
    // test_liquidation(&pic, backend_canister);
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
            amount: Nat::from(800000000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: Nat::from(50000u128),
            expect_success: false,
            expected_error_message: Some("Asset not found: nonexistent_asset".to_string()),
        },
        // Minimum valid amount
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(400000000u128), // Minimum valid amount
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(200u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(100u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(500u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        //  Asset length exceeds 7 characters
        TestCase {
            asset: "ckETH_long".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Asset must have a maximum length of 7 characters".to_string()),
        },

        // Non-existent asset
        TestCase {
            asset: "XYZ".to_string(),
            amount: Nat::from(500u128),
            expect_success: false,
            expected_error_message: Some("No canister ID found".to_string()),
        },

        // Zero amount request
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount cannot be zero".to_string()),
        },

        // // Large amount exceeding wallet balance
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(10_000_000_000u128),
        //     expect_success: false,
        //     expected_error_message: Some("wallet balance is low".to_string()),
        // },

        // Faucet limit exceeded
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(1_000_000_000u128),
        //     expect_success: false,
        //     expected_error_message: Some("amount is too much".to_string()),
        // },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Faucet Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Faucet Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        ic_cdk::println!("Amount: {}", case.amount);
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
        // ic_cdk::println!("Faucet request result: {:?}", errors::Error::);

        match result {
            Ok(WasmResult::Reply(reply)) => {
                let decoded_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to decode faucet response");

                match decoded_response {
                    Ok(balance) => {
                        ic_cdk::println!("Faucet succeeded. New balance: {}", balance);
                    }
                    Ok(error) => {
                        ic_cdk::println!("Faucet failed with error: {:?}", error);
                    }
                    Err(decode_err) => {
                        ic_cdk::println!("Failed to decode faucet response: {:?}", decode_err);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    ic_cdk::println!("Faucet rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during faucet function call: {:?}", e);
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
            amount: Nat::from(600000000u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDC".to_string(),
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(500u128),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(1u128),
        //     is_collateral: true,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(250u128),
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        //  Invalid Test Cases
        //  Input Validation Failures
        TestCase {
            asset: "".to_string(), // Empty asset
            amount: Nat::from(100u128),
            is_collateral: true,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        TestCase {
            asset: "ckETH".to_string(),
            amount: Nat::from(60u128),
            is_collateral: true,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(0u128), // Zero amount
        //     is_collateral: true,
        //     expect_success: false,
        //     expected_error_message: Some("Amount cannot be zero".to_string()),
        // },

        // Reserve & State Failures
        TestCase {
            asset: "ckXYZ".to_string(), // Non-existent asset
            amount: Nat::from(100u128),
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("No reserve data found".to_string()),
        },
    ];

    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Supply Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Supply Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        ic_cdk::println!("Amount: {}", case.amount);
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");

        let result  = pic.query_call(
            backend_canister,
            Principal::anonymous(),
            "get_asset_principal",
            encode_one(case.asset.clone()).unwrap(),
        );

       let asset_canister_id =  match result {
            Ok(WasmResult::Reply(response_data)) => {
                match decode_one::<Result<Principal, errors::Error>>(&response_data) {
                    Ok(Ok(principal)) => {
                        // Successfully retrieved the principal
                        Some(principal)
                    }
                    Ok(Err(err)) => {
                        // Handle the error returned by get_asset_principal
                        ic_cdk::println!("Error retrieving asset principal: {:?}", err);
                        None
                    }
                    Err(decode_err) => {
                        // Handle the error while decoding the response
                        ic_cdk::println!("Error decoding the response: {}", decode_err);
                        None
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                // Handle the rejection message from the WasmResult
                println!("Query call rejected: {}", reject_message);
                None
            }
            Err(call_err) => {
                // Handle the error from the query call itself
                println!("Query call failed: {}", call_err);
                None
            }
        };

        let asset_principal = match asset_canister_id {
            Some(principal) => principal,
            None => {
                // Handle the case where the asset principal was not found
                // println!("{:?}", case.expected_error_message);
                continue;
            }
        };

        let approve_args = ApproveArgs {
            fee: None,
            memo: None,
            from_subaccount: None,
            created_at_time: None,
            amount: Nat::from(1000_0000_000u128), //alternative
            expected_allowance: None,
            expires_at: None,
            spender: Account {
                owner: backend_canister,
                subaccount: None,
            },
        };

        let args_encoded = encode_one(approve_args).expect("Failed to encode approve arguments");

        // Call the `approve` method on `ckbtc_canister`
        let approve_result = pic.update_call(
            asset_principal, //asset_canister variable
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
                        ic_cdk::println!("Approve succeeded, block index: {}", block_index);
                    }
                    Ok(ApproveResult::Err(error)) => {
                        ic_cdk::println!("Approve failed with error: {:?}", error);
                        continue;
                    }
                    Err(e) => {
                        ic_cdk::println!("Failed to decode ApproveResult: {:?}", e);
                        continue;
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
               ic_cdk:: println!("Approve call rejected: {}", reject_message);
                continue;
            }
            Err(e) => {
                ic_cdk::println!("Error during approve call: {:?}", e);
                continue;
            }
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
                        ic_cdk::println!("Supply succeeded. New balance: {}", balance);
                    }
                    Ok(error) => {
                        ic_cdk::println!("Supply failed with error: {:?}", error);
                    }
                    Err(decode_err) => {
                        ic_cdk::println!("Failed to decode Supply response: {:?}", decode_err);
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "Error message mismatch for case: {:?}",
                        case
                    );
                    ic_cdk::println!("Supply rejected as expected: {}", reject_message);
                } else {
                    panic!(
                        "Expected success but got rejection for case: {:?} with message: {}",
                        case, reject_message
                    );
                }
            }
            Err(e) => {
                panic!("Error during supply function call: {:?}", e);
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
        // Valid Test Cases (Normal Withdrawals)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(300000000u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ckUSDT".to_string(),
            amount: Nat::from(1000u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(50u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(500u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        
    
        // Boundary Cases (Minimum and Maximum Withdrawals)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128),
            expect_success: true,
            expected_error_message: None,
        },
    
        // Invalid Cases (General Failures)
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        TestCase {
            asset: "INVALID".to_string(),
            amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("No reserve data found for the asset".to_string()),
        },
        TestCase {
            asset: "ckBTC".to_string(),
            amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount cannot be zero".to_string()),
        },
    
        // Case: Asset Name Too Long
        TestCase {
            asset: "ckETHEREUM".to_string(), // More than 7 characters
            amount: Nat::from(50u128),
            expect_success: false,
            expected_error_message: Some("Asset must have a maximum length of 7 characters".to_string()),
        },
        // //  Edge Cases (Special Conditions)
        // TestCase {
        //     asset: "ICP".to_string(),
        //     amount: Nat::from(100u128),
        //     expect_success: false,
        //     expected_error_message: Some("User is not allowed to perform such transaction".to_string()),
        // },
    
        // // Error Cases (Withdrawal Limits and Errors)
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(100_000_000_000u128), // Excessively large amount
        //     expect_success: false,
        //     expected_error_message: Some("Withdraw validation failed".to_string()),
        // },
    
        // // Case: Principal Validation (Anonymous)
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(150u128),
        //     expect_success: false,
        //     expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        // },
    ];
    

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Borrow Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Borrow Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        ic_cdk::println!("Amount: {}", case.amount);
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
                let supply_response: Result<Nat, errors::Error> =
                    candid::decode_one(&reply).expect("Failed to get IC borrow response");

                match supply_response {
                    Ok(balance) => {
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Borrow successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Borrow failed with error: {:?}",
                            i + 1,
                            error
                        );
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "❌ IC Test Case {} Failed: Error message mismatch.",
                        i + 1
                    );
                    ic_cdk::println!(
                        "✅ IC Test Case {} Passed: Borrow rejected as expected with message: {}",
                        i + 1,
                        reject_message
                    );
                } else {
                    ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {}", i + 1, reject_message);
                    panic!("Unexpected rejection.");
                }
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Function call error.");
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
        is_collateral:bool,
        expect_success: bool,
        expected_error_message: Option<String>,
    }

    let test_cases = vec![
        // Valid Withdrawals (Direct)
        TestCase {
            asset: "ICP".to_string(), //
            amount: Nat::from(300000000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        //Non-existent asset case
        TestCase {
            asset: "nonexistent_asset".to_string(),
            amount: Nat::from(50000u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    
        // Valid Collateral Withdrawals
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128), // Minimum valid amount
            on_behalf_of: None,
            is_collateral: true, // Withdrawing collateral
            expect_success: true,
            expected_error_message: None,
        },
    
        // Valid Withdrawal on Behalf of Another User
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(500u128),
        //     on_behalf_of: Some(Principal::anonymous()), // Assuming valid delegation
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    
        // Boundary Cases (Minimum and Maximum Withdrawals)
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(10_000_000u128), // Large amount
            on_behalf_of: None,
            is_collateral: false,
            expect_success: true,
            expected_error_message: None,
        },
    
        // Invalid Cases (General Failures)
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        TestCase {
            asset: "INVALID".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            is_collateral: false,
            expect_success: false,
            expected_error_message: Some("No reserve data found for the asset".to_string()),
        },

    
        // // Anonymous Principal Withdrawal Attempt
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(150u128),
        //     on_behalf_of: Some(Principal::anonymous()), // Anonymous user
        //     is_collateral: false,
        //     expect_success: false,
        //     expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        // },
    
        // // Insufficient Reserve
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(1000000u128),
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: false,
        //     expected_error_message: Some("Insufficient reserve balance".to_string()),
        // },
    
        // // Valid Case: Withdraw Exact Reserve Amount
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(500u128), // Assuming 500 is exactly the reserve balance
        //     on_behalf_of: None,
        //     is_collateral: false,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    
    ];
    
    

    ic_cdk::println!(
        "\n======================== Starting IC Withdraw Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Withdraw Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        ic_cdk::println!("Amount: {}", case.amount);
        ic_cdk::println!("On Behalf Of: {}", 
            case.on_behalf_of.as_ref().map_or("None".to_string(), |p| p.to_text()));
        ic_cdk::println!("Is Collateral: {}", case.is_collateral);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");


        let withdraw_params = ExecuteWithdrawParams {
            asset: case.asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of:case.on_behalf_of,
            is_collateral:case.is_collateral.clone()
        };
        // Now call the withdraw function  ///
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
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Withdraw successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Withdraw failed with error: {:?}",
                            i + 1,
                            error
                        );
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "❌ IC Test Case {} Failed: Error message mismatch.",
                        i + 1
                    );
                    ic_cdk::println!(
                        "✅ IC Test Case {} Passed: Withdraw rejected as expected with message: {}",
                        i + 1,
                        reject_message
                    );
                } else {
                    ic_cdk::println!("❌ IC Test Case {} Failed: Expected success but got rejection with message: {}", i + 1, reject_message);
                    panic!("Unexpected rejection.");
                }
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Function call error.");
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
        // Valid cases
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(100000000u128),
            on_behalf_of: None,
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase {
        //     asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(500u128),
        //     on_behalf_of: Some(Principal::from_text("bbbbb-bb").unwrap()),
        //     expect_success: true,
        //     expected_error_message: None,
        // },
        // TestCase {
        //     asset: "ckUSDT".to_string(),
        //     amount: Nat::from(300u128),
        //     on_behalf_of: None,
        //     expect_success: true,
        //     expected_error_message: None,
        // },
    
        // Invalid cases
        TestCase {
            asset: "".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Asset cannot be an empty string".to_string()),
        },
        TestCase {
            asset: "TooLongAsset".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Asset must have a maximum length of 7 characters".to_string()),
        },
        TestCase {
            asset: "ICP".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: None,
            expect_success: false,
            expected_error_message: Some("Amount cannot be zero".to_string()),
        },
        // TestCase {
        //     asset: "ckBTC".to_string(),
        //     amount: Nat::from(100u128),
        //     on_behalf_of: Some(Principal::anonymous()),
        //     expect_success: false,
        //     expected_error_message: Some("Anonymous principals are not allowed".to_string()),
        // },
        // TestCase {
        //     asset: "ckUSDC".to_string(),
        //     amount: Nat::from(5u128),
        //     on_behalf_of: None,
        //     expect_success: false,
        //     expected_error_message: Some("Repay validation failed".to_string()),
        // },
    
        
    ];
    

    let user_principal = get_user_principal();

    ic_cdk::println!(
        "\n======================== Starting IC Repay Tests ========================\n"
    );

    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Repay Request", i + 1);
        ic_cdk::println!("Asset: {}", case.asset);
        ic_cdk::println!("Amount: {}", case.amount);
        if let Some(ref principal) = case.on_behalf_of {
            ic_cdk::println!("On Behalf Of: {}", principal);
        }
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");


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
                        ic_cdk::println!(
                            "✅ IC Test Case {} Passed: Repay successful. New Balance: {}",
                            i + 1,
                            balance
                        );
                    }
                    Err(error) => {
                        ic_cdk::println!(
                            "❌ IC Test Case {} Failed: Repay failed with error: {:?}",
                            i + 1,
                            error
                        );
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "❌ IC Test Case {} Failed: Error message mismatch.",
                        i + 1
                    );
                    ic_cdk::println!(
                        "✅ IC Test Case {} Passed: Repay rejected as expected with message: {}",
                        i + 1,
                        reject_message
                    );
                } else {
                    ic_cdk::println!(
                        "❌ IC Test Case {} Failed: Expected success but got rejection with message: {}",
                        i + 1,
                        reject_message
                    );
                    panic!("Unexpected rejection.");
                }
            }
            Err(e) => {
                ic_cdk::println!(
                    "❌ IC Test Case {} Failed: Error during function call: {:?}",
                    i + 1,
                    e
                );
                panic!("Function call error.");
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
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(500u128),
            expect_success: true,
            expected_error_message: None,
        },
        TestCase { 
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(1u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(1045u128),
            expect_success: true,
            expected_error_message: None,
        },
        // TestCase { 
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckUSDT".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(50u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },

        // Unsupported asset pairs
        TestCase { 
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckBTC".to_string(),
            amount: Nat::from(50u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(100u128),
            expect_success: false,
            expected_error_message: Some("Invalid collateral-debt pair".to_string()),
        },

        // Zero amount (invalid scenario)
        TestCase { 
            debt_asset: "ckETH".to_string(),
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(0u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Amount must be greater than zero".to_string()),
        },

        // Very large amounts (stress test)
        // TestCase { 
        //     debt_asset: "ckBTC".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(u128::MAX), // Max possible amount
        //     on_behalf_of: Principal::anonymous(),
        //     reward_amount: Nat::from(u128::MAX),
        //     expect_success: false,
        //     expected_error_message: Some("Amount exceeds maximum limit".to_string()),
        // },

        // Edge case: Minimal possible amount
        TestCase { 
            debt_asset: "ICP".to_string(),
            collateral_asset: "ckUSDT".to_string(),
            amount: Nat::from(1u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(10u128),
            expect_success: true,
            expected_error_message: None,
        },

        //  Invalid principal (malformed or blocked user)
        // TestCase { 
        //     debt_asset: "ckUSDC".to_string(),
        //     collateral_asset: "ckBTC".to_string(),
        //     amount: Nat::from(50u128),
        //     on_behalf_of: Principal::from_slice(&[0; 29]), // Malformed principal
        //     reward_amount: Nat::from(5u128),
        //     expect_success: false,
        //     expected_error_message: Some("Invalid principal ID".to_string()),
        // },

        // Zero reward amount (could be invalid depending on system logic)
        TestCase { 
            debt_asset: "ckBTC".to_string(),
            collateral_asset: "ckETH".to_string(),
            amount: Nat::from(10u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(0u128),
            expect_success: false,
            expected_error_message: Some("Reward amount must be greater than zero".to_string()),
        },

        // Edge case: Borrowing with a different valid principal
        // TestCase { 
        //     debt_asset: "ICP".to_string(),
        //     collateral_asset: "ckETH".to_string(),
        //     amount: Nat::from(200u128),
        //     on_behalf_of: Principal::from_text("w4xhj-lyaaa-aaaaa-qaaca-cai").unwrap(),
        //     reward_amount: Nat::from(150u128),
        //     expect_success: true,
        //     expected_error_message: None,
        // },


        // Borrowing against an unlisted or unknown asset (hypothetical scenario)
        TestCase { 
            debt_asset: "XYZCoin".to_string(), // Unsupported coin
            collateral_asset: "ckUSDC".to_string(),
            amount: Nat::from(100u128),
            on_behalf_of: Principal::anonymous(),
            reward_amount: Nat::from(30u128),
            expect_success: false,
            expected_error_message: Some("Unsupported debt asset".to_string()),
        },

    ];


    let user_principal = get_user_principal();
    ic_cdk::println!(
        "\n======================== Starting IC Liquidation Tests ========================\n"
    );
    for (i, case) in test_cases.iter().enumerate() {
        ic_cdk::println!("\n------------------------------------------------------------");
        ic_cdk::println!("IC Test Case {}: Executing Liquidation Request", i + 1);
        ic_cdk::println!("Debt Asset: {}", case.debt_asset);
        ic_cdk::println!("Collateral Asset: {}", case.collateral_asset);
        ic_cdk::println!("Amount: {}", case.amount);
        ic_cdk::println!("On Behalf Of: {}", case.on_behalf_of);
        ic_cdk::println!("Reward Amount: {}", case.reward_amount);
        ic_cdk::println!("Expected Success: {}", case.expect_success);
        if let Some(ref msg) = case.expected_error_message {
            ic_cdk::println!("Expected Error Message: {}", msg);
        }
        ic_cdk::println!("------------------------------------------------------------\n");


        let liquidation_params = ExecuteLiquidationParams {
            debt_asset: case.debt_asset.clone(),
            collateral_asset: case.collateral_asset.clone(),
            amount: case.amount.clone(),
            on_behalf_of: case.on_behalf_of.clone(),
            reward_amount: case.reward_amount.clone(),
        };

        let result = pic.update_call(
            backend_canister,
            user_principal,
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
                                "✅ SUCCESS: Liquidation completed successfully for test case #{}",
                                i + 1
                            );
                        } else {
                            ic_cdk::println!(
                                "❌ ERROR: Expected failure but got success for test case #{}",
                                i + 1
                            );
                        }
                    }
                    Err(e) => {
                        ic_cdk::println!(
                            "❌ UNEXPECTED FAILURE: Expected success but got error: {:?}",
                            e
                        );
                    }
                }
            }
            Ok(WasmResult::Reject(reject_message)) => {
                if !case.expect_success {
                    ic_cdk::println!(
                        "✅ EXPECTED REJECTION: Liquidation rejected as expected: {}",
                        reject_message
                    );
                    assert_eq!(
                        case.expected_error_message.as_deref(),
                        Some(reject_message.as_str()),
                        "🔴 ERROR: Mismatch in rejection message for test case #{}",
                        i + 1
                    );
                } else {
                    ic_cdk::println!("❌ UNEXPECTED REJECTION: Expected success but got rejection with message: {}", reject_message);
                }
            }
            Err(e) => {
                ic_cdk::println!(
                    "🔥 CRITICAL ERROR: Execution failure during liquidation call: {:?}",
                    e
                );
            }
        }
    }
    ic_cdk::println!(
        "\n======================== IC Liquidation Tests Completed ========================\n"
    );
}
