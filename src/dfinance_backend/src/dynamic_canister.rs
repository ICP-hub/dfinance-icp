use candid::{CandidType, Encode, Nat, Principal};
use ic_cdk::api::management_canister::main::{CanisterInstallMode, CanisterSettings};
use ic_cdk_macros::update;

use serde::Deserialize;
use std::borrow::Cow;

use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;

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
        "../../../target/wasm32-unknown-unknown/release/atoken.wasm"
    ))
}

#[update]
async fn new_canister() -> Principal {
    let arg = ic_cdk::api::management_canister::main::CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![
                Principal::from_text(
                    "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
                )
                .unwrap(),
                Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
            ]),
            memory_allocation: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            freezing_threshold: None,
        }),
    };

    let minting_account = Account {
        owner: Principal::from_text(
            "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
        )
        .unwrap(),
        subaccount: None,
    };

    let fee_collector_account = Some(Account {
        owner: Principal::from_text(
            "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
        )
        .unwrap(),
        subaccount: None,
    });

    let transfer_fee = Nat::from(1000u64);
    let decimals = Some(8);
    let max_memo_length = Some(256);
    let token_symbol = "REO".to_string();
    let token_name = "Reorg".to_string();
    let metadata = vec![("icrc1_name".to_string(), Value::Text("REORG".to_string()))];

    let initial_balances = vec![(
        Account {
            owner: Principal::from_text(
                "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
            )
            .unwrap(),
            subaccount: None,
            // Initialize the Account fields as needed
        },
        Nat::from(1000u64),
    )];

    let feature_flags = Some(FeatureFlags { icrc2: true });
    let maximum_number_of_accounts = Some(1000);
    let accounts_overflow_trim_quantity = Some(100);

    let archive_options = ArchiveOptions {
        num_blocks_to_archive: 500,
        max_transactions_per_response: Some(200),
        trigger_threshold: 1000,
        max_message_size_bytes: Some(1024),
        cycles_for_archive_creation: Some(10),
        node_max_memory_size_bytes: Some(2000),
        controller_id: Principal::anonymous(),
        more_controller_ids: Some(vec![Principal::anonymous()]),
    };

    let init_args = InitArgs {
        minting_account,
        fee_collector_account,
        transfer_fee,
        decimals,
        max_memo_length,
        token_symbol,
        token_name,
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
    let canister_id = ic_cdk::api::management_canister::main::create_canister(arg, 100_000_000_000)
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

    ic_cdk::print(format!("Install config: {:?}", install_config));

    ic_cdk::api::management_canister::main::install_code(install_config)
        .await
        .unwrap();
    canister_id
}
