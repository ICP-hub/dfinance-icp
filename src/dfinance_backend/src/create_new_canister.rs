use candid::{encode_one, Principal};
use crate::{new_canister::{create_new_canister, deposit_cycles_in_canister, install_code_in_canister}, new_types::{CanisterInstallMode, CanisterSettings, CreateCanisterArgument, InstallCodeArgument}};
use ic_cdk_macros::update;

use serde::Deserialize;
use std::borrow::Cow;

use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;
use crate::constants::asset_address::DEFAULT;
use candid::{CandidType, Encode, Nat};


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

pub async fn create_ledger_canister() -> Result<Principal, String> {
    // add dao canister id as controller
    // add factory canister id as controller

    let arg = CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![ic_cdk::api::id()]),
            memory_allocation: None,
            reserved_cycles_limit: None,
            // log_visibility: None,
            // wasm_memory_limit: None,
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
    let metadata = vec![("icrc1_name".to_string(), Value::Text("ckBTC".to_string()))];

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
        token_symbol: "abcd".to_string(),
        token_name: "ff".to_string(),
        metadata,
        initial_balances,
        feature_flags,
        maximum_number_of_accounts,
        accounts_overflow_trim_quantity,
        archive_options,
    };

    let token = LedgerArg::Init(init_args);

    let ledger_args_bytes: Vec<u8> = encode_one(arg).map_err(|er| er.to_string())?;

    let controllers: Vec<Principal> = vec![ic_cdk::api::caller(), ic_cdk::api::id()];

    let controller_settings = CanisterSettings {
        controllers: Some(controllers),
        ..Default::default()
    };

    let arg = CreateCanisterArgument {
        settings: Some(controller_settings),
    };

    let (canister_id,) = match create_new_canister(arg).await {
        Ok(id) => id,
        Err((_, err_string)) => {
            return Err(format!(
                "{} {}",
                "abcd",
                err_string
            ));
        }
    };

    let _add_cycles = deposit_cycles_in_canister(canister_id, 150_000_000_000)
        .await
        .unwrap();

    let wasm_module: Vec<u8> = include_bytes!(
        "../../../.dfx/local/canisters/token_ledger/token_ledger.wasm"
    )
    .to_vec();

    // let wasm_module: Vec<u8> =
    //     include_bytes!("../../../wasm_modules/icrc1_ledger_canister.wasm").to_vec();

    let canister_id_principal = canister_id.canister_id;

    let arg1 = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id: canister_id_principal,
        // wasm_module: vec![],
        wasm_module: wasm_module.clone(),
        arg: ledger_args_bytes,
    };

    ic_cdk::println!("next is installcode");

    install_code_in_canister(arg1, wasm_module).await.unwrap();

    //  let wasm_module_sample: Vec<u8> =
    //     include_bytes!("../../../../.dfx/local/canisters/icrc1_ledger_canister/icrc1_ledger_canister.wasm").to_vec();

    // CANISTER BNA BRO
    // let (canister_id,) = match create_new_canister(CreateCanisterArgument {
    //     settings: Some(controller_settings),
    // })
    // .await
    // {
    //     Ok(id) => id,
    //     Err((_, err_str)) => {
    //         return Err(err_str)
    //     }
    // };

    // Ok(format!("Ledger created, id: {}", canister_id_principal))
    Ok(canister_id_principal)
    // Ok(canister_id_principal.tos)
}
