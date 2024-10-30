use candid::{CandidType, Encode, Nat, Principal};
use ic_cdk::api::management_canister::main::{CanisterInstallMode, CanisterSettings};
use ic_cdk_macros::update;

use serde::Deserialize;
use std::borrow::Cow;

use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;
use crate::constants::asset_address::DEFAULT;

#[derive(Debug, CandidType, Deserialize)]
pub struct InitArgs {
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub transfer_fee: Nat,
    pub decimals: Option<u8>,
    pub token_name: String,
    pub token_symbol: String,
    pub metadata: Vec<(String, Value)>,
    pub archive_options: ArchiveOptions,
    pub max_memo_length: Option<u16>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
}

#[derive(Debug, CandidType, Deserialize)]
pub struct ArchiveOptions {
    /// The number of blocks which, when exceeded, will trigger an archiving
    /// operation.
    pub trigger_threshold: usize,
    /// The number of blocks to archive when trigger threshold is exceeded.
    pub num_blocks_to_archive: usize,
    pub node_max_memory_size_bytes: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub controller_id: Principal,
    // More principals to add as controller of the archive.
    #[serde(default)]
    pub more_controller_ids: Option<Vec<Principal>>,
    // cycles to use for the call to create a new archive canister.
    #[serde(default)]
    pub cycles_for_archive_creation: Option<u64>,
    // Max transactions returned by the [get_transactions] endpoint.
    #[serde(default)]
    pub max_transactions_per_response: Option<u64>,
}

#[derive(Debug, Deserialize, CandidType)]

pub struct UpgradeArgs {}

#[derive(Debug, Deserialize, CandidType)]
pub enum LedgerArg {
    Init(InitArgs),
    Upgrade(Option<UpgradeArgs>),
}

#[derive(Debug, CandidType, Deserialize)]
pub struct FeatureFlags {
    icrc2: bool,
}

fn ledger_wasm() -> Cow<'static, [u8]> {
    Cow::Borrowed(include_bytes!(
        "../../../target/wasm32-unknown-unknown/release/dtoken.wasm"
    ))
}

fn test_ledger_wasm() -> Cow<'static, [u8]> {
    Cow::Borrowed(include_bytes!(
        "../../../target/wasm32-unknown-unknown/release/token_ledger.wasm"
    ))
}

#[update]
async fn create_multiple_canisters() -> Vec<Principal> {
    let mut canister_ids = Vec::new();

    // Define different token names and symbols
    let tokens = vec![
        // ("ckBTC", "ckBTC"),
        ("dckBTC", "dckBTC"),
        ("debtckBTC", "debtckBTC"),
    ];

    for (token_name, token_symbol) in tokens {
        let canister_id = create_token_canister(token_name, token_symbol).await;
        canister_ids.push(canister_id);
    }

    canister_ids
}

pub async fn create_token_canister(token_name: &str, token_symbol: &str) -> Principal {
    let arg = ic_cdk::api::management_canister::main::CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![ic_cdk::api::id()]),
            memory_allocation: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            freezing_threshold: None,
        }),
    };

    let minting_account = Account {
        owner: ic_cdk::api::id(),
        subaccount: None,
    };

    let fee_collector_account = Some(Account {
        owner: ic_cdk::api::id(),
        subaccount: None,
    });

    let transfer_fee = Nat::from(0u64);
    let decimals = Some(8);
    let max_memo_length = Some(256);
    let metadata = vec![("icrc1_name".to_string(), Value::Text(token_name.to_string()))];

    let initial_balances = vec![];

    let feature_flags = Some(FeatureFlags { icrc2: true });
    let maximum_number_of_accounts = Some(1000);
    let accounts_overflow_trim_quantity = Some(100);

    let archive_options = ArchiveOptions {
        num_blocks_to_archive: 1000,
        max_transactions_per_response: Some(200),
        trigger_threshold: 2000,
        max_message_size_bytes: Some(1024),
        cycles_for_archive_creation: Some(100000000000),
        node_max_memory_size_bytes: Some(2000),
        controller_id: ic_cdk::api::id(),
        more_controller_ids: Some(vec![Principal::anonymous()]),
    };

    let init_args = InitArgs {
        minting_account,
        fee_collector_account,
        transfer_fee,
        decimals,
        max_memo_length,
        token_symbol: token_symbol.to_string(),
        token_name: token_name.to_string(),
        metadata,
        initial_balances,
        feature_flags,
        maximum_number_of_accounts,
        accounts_overflow_trim_quantity,
        archive_options,
    };

    let token = LedgerArg::Init(init_args);

    let args = match Encode!(&(token)) {
        Ok(args) => args,
        Err(e) => {
            ic_cdk::print(format!("Failed to serialize InitArgs: {:?}", e));
            return Principal::anonymous();
        }
    };

    let canister_id = ic_cdk::api::management_canister::main::create_canister(arg, 300_000_000_000)
        .await
        .unwrap()
        .0
        .canister_id;

    let install_config = ic_cdk::api::management_canister::main::InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: ledger_wasm().to_vec(),
        arg: args,
    };

    ic_cdk::api::management_canister::main::install_code(install_config)
        .await
        .unwrap();
    ic_cdk::print(format!(
        "Created canister for token '{}' with canister ID: {}",
        token_name, canister_id
    ));
    canister_id
}

pub async fn create_testtoken_canister(token_name: &str, token_symbol: &str) -> Principal {
    let arg = ic_cdk::api::management_canister::main::CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![ic_cdk::api::id()]),
            memory_allocation: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            freezing_threshold: None,
        }),
    };

    let minting_account = Account {
        owner: Principal::from_text(DEFAULT).unwrap(),

        subaccount: None,
    };

    let fee_collector_account = Some(Account {
        owner: ic_cdk::api::id(),
        subaccount: None,
    });

    let transfer_fee = Nat::from(0u64);
    let decimals = Some(8);
    let max_memo_length = Some(256);
    let metadata = vec![("icrc1_name".to_string(), Value::Text(token_name.to_string()))];

    let initial_balances = 
    vec![(
        Account {
            owner: ic_cdk::api::id(),

            subaccount: None,
        },
        Nat::from(100_000_000_000_000u64),
    )];

    let feature_flags = Some(FeatureFlags { icrc2: true });
    let maximum_number_of_accounts = Some(1000);
    let accounts_overflow_trim_quantity = Some(100);

    let archive_options = ArchiveOptions {
        num_blocks_to_archive: 1000,
        max_transactions_per_response: Some(200),
        trigger_threshold: 2000,
        max_message_size_bytes: Some(1024),
        cycles_for_archive_creation: Some(100000000000),
        node_max_memory_size_bytes: Some(2000),
        // controller_id: Principal::from_text("eka6r-djcrm-fekzn-p3zd3-aalh4-hei4m-qthvc-objto-gfqnj-azjvq-hqe").unwrap(),
        controller_id: ic_cdk::api::id(),

        more_controller_ids: Some(vec![Principal::from_text(DEFAULT).unwrap()]),
    };

    let init_args = InitArgs {
        minting_account,
        fee_collector_account,
        transfer_fee,
        decimals,
        max_memo_length,
        token_symbol: token_symbol.to_string(),
        token_name: token_name.to_string(),
        metadata,
        initial_balances,
        feature_flags,
        maximum_number_of_accounts,
        accounts_overflow_trim_quantity,
        archive_options,
    };

    let token = LedgerArg::Init(init_args);

    let args = match Encode!(&(token)) {
        Ok(args) => args,
        Err(e) => {
            ic_cdk::print(format!("Failed to serialize InitArgs: {:?}", e));
            return Principal::anonymous();
        }
    };

    let canister_id = ic_cdk::api::management_canister::main::create_canister(arg, 300_000_000_000)
        .await
        .unwrap()
        .0
        .canister_id;

    let install_config = ic_cdk::api::management_canister::main::InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: test_ledger_wasm().to_vec(),
        arg: args,
    };

    ic_cdk::api::management_canister::main::install_code(install_config)
        .await
        .unwrap();
    ic_cdk::print(format!(
        "Created canister for token '{}' with canister ID: {}",
        token_name, canister_id
    ));
    canister_id
}
