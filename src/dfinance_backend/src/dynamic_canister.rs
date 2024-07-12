use candid::{encode_one, CandidType, Encode, Nat, Principal};
use ic_cdk::api::call::call;
use ic_cdk::api::management_canister::main::CreateCanisterArgument;
use ic_cdk::api::management_canister::main::LogVisibility;
use ic_cdk::api::management_canister::main::{
    CanisterIdRecord, CanisterInstallMode, CanisterSettings, InstallCodeArgument,
    UpdateSettingsArgument,
};
use ic_cdk_macros::update;
use icrc_ledger_types::icrc1::account::Account;
use serde::Deserialize;
use std::borrow::Cow;
#[derive(CandidType, Deserialize)]
struct InitArgs {
    decimals: Option<u8>,
    token_symbol: String,
    transfer_fee: u64,
    metadata: Vec<MetadataRecord>,
    minting_account: Account,
    initial_balances: Vec<InitialBalanceRecord>,
    maximum_number_of_accounts: Option<u64>,
    accounts_overflow_trim_quantity: Option<u64>,
    fee_collector_account: Option<Account>,
    archive_options: ArchiveOptions,
    max_memo_length: Option<u16>,
    token_name: String,
    feature_flags: Option<FeatureFlags>,
}

#[derive(CandidType, Deserialize)]
struct InitialBalanceRecord {
    account: Account,
    balance: u64,
}

#[derive(CandidType, Deserialize)]
struct MetadataRecord {
    key: String,
    value: MetadataValue,
}

#[derive(CandidType, Deserialize)]
enum MetadataValue {
    Int(i64),
    Nat(u64),
    Blob(Vec<u8>),
    Text(String),
}

#[derive(CandidType, Deserialize)]
struct FeatureFlags {
    icrc2: bool,
}

#[derive(CandidType, Deserialize)]
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

    let archives = ArchiveOptions {
        num_blocks_to_archive: 1000,
        max_transactions_per_response: None,
        trigger_threshold: 2000,
        more_controller_ids: Some(vec![
            Principal::from_text("uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae")
                .unwrap(),
            Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
        ]),
        max_message_size_bytes: None,
        cycles_for_archive_creation: Some(10000000000000),
        node_max_memory_size_bytes: None,
        controller_id: Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
    };

    let init_args = InitArgs {
        decimals: Some(8),
        token_symbol: "LICP".to_string(),
        transfer_fee: 10_000, // Transfer fee example
        metadata: vec![MetadataRecord {
            key: "key".to_string(),
            value: MetadataValue::Text("value".to_string()),
        }],
        minting_account: Account {
            owner: Principal::from_text(
                "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
            )
            .unwrap(),
            subaccount: None,
        },
        initial_balances: vec![InitialBalanceRecord {
            account: Account {
                owner: Principal::from_text(
                    "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
                )
                .unwrap(),
                subaccount: None,
            },
            balance: 10_000_000_000,
        }],
        maximum_number_of_accounts: None,
        accounts_overflow_trim_quantity: None,
        fee_collector_account: None,
        archive_options: archives,
        max_memo_length: None,
        token_name: "Local ICP".to_string(),
        feature_flags: Some(FeatureFlags { icrc2: false }),
    };

    let args = match Encode!(&(init_args)) {
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

// #[derive(CandidType, Debug, Clone, Deserialize)]
// pub struct CreateCanisterSettings {
//     pub controllers: Option<Vec<Principal>>,
//     pub compute_allocation: Option<Nat>,
//     pub memory_allocation: Option<Nat>,
//     pub freezing_threshold: Option<Nat>,
// }

// #[derive(CandidType, Clone, Deserialize, Debug)]
// pub struct CanisterIdRecord {
//     pub canister_id: Principal,
// }

// #[derive(CandidType, Clone, Deserialize)]
// pub struct CreateCanisterArgs {
//     pub cycles: u64,
//     pub settings: CreateCanisterSettings,
// }

// #[derive(CandidType, Deserialize)]
// enum InstallMode {
//     #[serde(rename = "install")]
//     Install,
//     #[serde(rename = "reinstall")]
//     Reinstall,
//     #[serde(rename = "upgrade")]
//     Upgrade,
// }

// #[derive(CandidType, Deserialize)]
// struct CanisterInstall {
//     mode: InstallMode,
//     canister_id: Principal,
//     #[serde(with = "serde_bytes")]
//     wasm_module: Vec<u8>,
//     #[serde(with = "serde_bytes")]
//     arg: Vec<u8>,
// }

// fn prep_canister_create() -> CreateCanisterArgs {
//     let controller_id = Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap();

//     // Add your own principal as a controller, in case manual control is needed
//     CreateCanisterArgs {
//         cycles: 100_000_000_000,
//         settings: CreateCanisterSettings {
//             controllers: Some(vec![
//                 controller_id,
//                 Principal::from_text("dmalx-m4aaa-aaaaa-qaanq-cai").unwrap(),
//             ]),
//             compute_allocation: None,
//             memory_allocation: None,
//             freezing_threshold: None,
//         },
//     }
// }

// async fn call_canister_create(canister_create_args: CreateCanisterArgs) -> Principal {
//     ic_cdk::print("creating canister...");

//     #[derive(CandidType)]
//     struct In {
//         settings: Option<CreateCanisterSettings>,
//     }

//     let in_arg = In {
//         settings: Some(canister_create_args.settings),
//     };

//     let (create_result,): (CanisterIdRecord,) = match ic_cdk::api::call::call_with_payment(
//         Principal::management_canister(),
//         "create_canister",
//         (in_arg,),
//         canister_create_args.cycles,
//     )
//     .await
//     {
//         Ok(x) => x,
//         Err((code, msg)) => {
//             ic_cdk::print(format!(
//                 "An error happened during the call: {}: {}",
//                 code as u8, msg
//             ));

//             (CanisterIdRecord {
//                 canister_id: Principal::anonymous(),
//             },)
//         }
//     };

//     // print(format!("{}", create_result.canister_id.to_text()));

//     create_result.canister_id
// }

// async fn call_canister_install(canister_id: &Principal, canister_install_args: Vec<u8>) -> bool {
//     let install_config = ic_cdk::api::management_canister::main::InstallCodeArgument {
//         mode: ic_cdk::api::management_canister::main::CanisterInstallMode::Install,
//         canister_id: canister_id.clone(),
//         wasm_module: LEDGER_WASM.to_vec(),
//         arg: [].to_vec(),
//     };

//     match ic_cdk::api::call::call(
//         Principal::management_canister(),
//         "install_code",
//         (install_config,),
//     )
//     .await
//     {
//         Ok(x) => x,
//         Err((code, msg)) => {
//             ic_cdk::print(format!(
//                 "An error happened during the call: {}: {}",
//                 code as u8, msg
//             ));
//             return false;
//         }
//     };

//     true
// }

// #[derive(CandidType, Deserialize)]
// struct LedgerInitArgs {
//     token_symbol: String,
//     token_name: String,
//     minting_account: MintingAccount,
//     transfer_fee: u64,
//     metadata: Vec<Metadata>,
//     feature_flags: Option<FeatureFlags>,
//     initial_balances: Vec<InitialBalance>,
//     archive_options: ArchiveOptions,
// }

// #[derive(CandidType, Deserialize)]
// struct MintingAccount {
//     owner: Principal,
// }

// #[derive(CandidType, Deserialize)]
// struct Metadata;

// #[derive(CandidType, Deserialize)]
// struct FeatureFlags {
//     icrc2: bool,
// }

// #[derive(CandidType, Deserialize)]
// struct InitialBalance {
//     owner: Principal,
//     amount: u64,
// }

// #[derive(CandidType, Deserialize)]
// struct ArchiveOptions {
//     num_blocks_to_archive: u64,
//     trigger_threshold: u64,
//     controller_id: Principal,
//     cycles_for_archive_creation: Option<u64>,
// }

// fn prepare_ledger_init_args(
//     token_symbol: String,
//     token_name: String,
//     minter: Principal,
//     transfer_fee: u64,
//     feature_flags: Option<FeatureFlags>,
//     initial_balances: Vec<InitialBalance>,
//     archive_options: ArchiveOptions,
// ) -> LedgerInitArgs {
//     LedgerInitArgs {
//         token_symbol,
//         token_name,
//         minting_account: MintingAccount { owner: minter },
//         transfer_fee,
//         metadata: vec![],
//         feature_flags,
//         initial_balances,
//         archive_options,
//     }
// }

// #[derive(CandidType, Deserialize)]
// struct CanisterInstallSendArgs {
//     greet: String,
//     controllers: Vec<Principal>,
// }

// #[update]
// async fn create_and_install_ledger_canister() -> Result<Principal, String> {
//     let additional_controllers = vec![Principal::from_text(
//         "uj6by-mtpxf-dwssj-ai4xh-32ka3-hiuu7-cquzy-eszdh-k4apf-fq6wj-iae",
//     )
//     .unwrap()];

//     let create_args = prep_canister_create();

//     let canister_id = call_canister_create(create_args).await;
//     ic_cdk::println!("canister id is :- {}", canister_id);
//     if canister_id == Principal::anonymous() {
//         return Err("Failed to create canister".to_string());
//     }

//     let ledger_init_args = prepare_ledger_init_args(
//         "Rohan".to_string(),
//         "ROH".to_string(),
//         Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
//         10000, // Transfer fee example
//         Some(FeatureFlags { icrc2: false }),
//         vec![InitialBalance {
//             owner: Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
//             amount: 100_000_000_000,
//         }],
//         ArchiveOptions {
//             num_blocks_to_archive: 1000,
//             trigger_threshold: 2000,
//             controller_id: Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai").unwrap(),
//             cycles_for_archive_creation: Some(100_000_000),
//         },
//     );

//     let canister_install_args = Encode!(&CanisterInstallSendArgs {
//         greet: "Hello from Index".to_string(),
//         controllers: vec![Principal::from_text("cinef-v4aaa-aaaaa-qaalq-cai",).unwrap(),],
//     })
//     .unwrap();

//     let install_result = call_canister_install(&canister_id, canister_install_args).await;
//     if !install_result {
//         return Err("Failed to install canister".to_string());
//     }

//     Ok(canister_id)
// }
