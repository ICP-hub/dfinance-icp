use candid::{CandidType, Encode, Nat, Principal};
use ic_cdk::api::management_canister::main::{CanisterInstallMode, CanisterSettings};
use serde::Deserialize;
use std::borrow::Cow;
use crate::constants::asset_address::DEFAULT;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::{ACCOUNTS_OVERFLOW_TRIM_QUANTITY, CYCLES_FOR_ARCHIVE_CREATION, DECIMALS, DEFAULT_CYCLES, MAX_MEMO_LENGTH, MAX_MESSAGE_SIZE_BYTES, MAX_NUMBER_OF_ACCOUNTS, MAX_TRANSACTIONS_PER_RESPONSE, NODE_MAX_MEMORY_SIZE_BYTES, NUM_BLOCKS_TO_ARCHIVE, TEST_ACCOUNTS_OVERFLOW_TRIM_QUANTITY, TEST_CYCLES_FOR_ARCHIVE_CREATION, TEST_DECIMALS, TEST_DEFAULT_CYCLES, TEST_MAX_MEMO_LENGTH, TEST_MAX_MESSAGE_SIZE_BYTES, TEST_MAX_NUMBER_OF_ACCOUNTS, TEST_MAX_TRANSACTIONS_PER_RESPONSE, TEST_NODE_MAX_MEMORY_SIZE_BYTES, TEST_NUM_BLOCKS_TO_ARCHIVE, TEST_TRANSFER_FEE, TEST_TRIGGER_THRESHOLD, TRANSFER_FEE, TRIGGER_THRESHOLD};
use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;
use ic_cdk_macros::update;
/*
 * @title Initialization Arguments for Token Canister
 * @dev Structure containing necessary parameters for initializing a token canister.
 */
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
/*
 * @title Archive Options
 * @dev Configuration parameters for transaction archival.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct ArchiveOptions {
    pub trigger_threshold: usize,
    pub num_blocks_to_archive: usize,
    pub node_max_memory_size_bytes: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub controller_id: Principal,
    #[serde(default)]
    pub more_controller_ids: Option<Vec<Principal>>,
    #[serde(default)]
    pub cycles_for_archive_creation: Option<u64>,
    #[serde(default)]
    pub max_transactions_per_response: Option<u64>,
}

#[derive(Debug, Deserialize, CandidType)]

pub struct UpgradeArgs {}
/*
 * @title Ledger Arguments
 * @dev Enum defining initialization and upgrade options for the ledger canister.
 */

#[derive(Debug, Deserialize, CandidType)]
pub enum LedgerArg {
    Init(InitArgs),
    Upgrade(Option<UpgradeArgs>),
}
/*
 * @title Feature Flags
 * @dev Enables or disables token features like ICRC2.
 */
#[derive(Debug, CandidType, Deserialize)]
pub struct FeatureFlags {
    icrc2: bool,
}
/*
 * @title Load Token Ledger WASM
 * @dev Loads the compiled WebAssembly binary for the token ledger.
 */
fn ledger_wasm() -> Cow<'static, [u8]> {
    Cow::Borrowed(include_bytes!(
        "../../../target/wasm32-unknown-unknown/release/dtoken.wasm"
    ))
}
/*
 * @title Load Test Token Ledger WASM
 * @dev Loads the compiled WebAssembly binary for the test token ledger.
 */
fn test_ledger_wasm() -> Cow<'static, [u8]> {
    Cow::Borrowed(include_bytes!(
        "../../../target/wasm32-unknown-unknown/release/token_ledger.wasm"
    ))
}
/*
 * @title Create Token Canister
 * @dev Deploys a new token canister with given name and symbol.
 * @param token_name Name of the new token.
 * @param token_symbol Symbol for the token.
 * @returns Principal ID of the created token canister.
 */
pub async fn create_token_canister(
    token_name: String,
    token_symbol: String,
) -> Result<Principal, Error> {
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

    let transfer_fee = Nat::from(TRANSFER_FEE);
    let decimals = Some(DECIMALS);
    let max_memo_length = Some(MAX_MEMO_LENGTH);
    let metadata = vec![(
        "icrc1_name".to_string(),
        Value::Text(token_name.to_string()),
    )];

    let initial_balances = vec![];

    let feature_flags = Some(FeatureFlags { icrc2: true });
    let maximum_number_of_accounts = Some(MAX_NUMBER_OF_ACCOUNTS);
    let accounts_overflow_trim_quantity = Some(ACCOUNTS_OVERFLOW_TRIM_QUANTITY);

    let archive_options = ArchiveOptions {
        num_blocks_to_archive: NUM_BLOCKS_TO_ARCHIVE,
        max_transactions_per_response: Some(MAX_TRANSACTIONS_PER_RESPONSE),
        trigger_threshold: TRIGGER_THRESHOLD,
        max_message_size_bytes: Some(MAX_MESSAGE_SIZE_BYTES),
        cycles_for_archive_creation: Some(CYCLES_FOR_ARCHIVE_CREATION),
        node_max_memory_size_bytes: Some(NODE_MAX_MEMORY_SIZE_BYTES),
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
            //TODO remove this and change return type
            return Err(Error::ErrorEncoding);
        }
    };

    let canister_id = ic_cdk::api::management_canister::main::create_canister(arg, DEFAULT_CYCLES)
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
    Ok(canister_id)
}
/*
 * @title Create Test Token Canister
 * @dev Deploys a new test token canister with a given name and symbol.
 *      It initializes the token and installs the test ledger WASM code.
 *
 * @param token_name - The name of the token to be created.
 * @param token_symbol - The symbol of the token.
 *
 * @returns The `Principal` ID of the newly created test token canister.
 */
pub async fn create_testtoken_canister(token_name: String, token_symbol: String) -> Result<Principal,Error> {
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

    let transfer_fee = Nat::from(TEST_TRANSFER_FEE);
    let decimals = Some(TEST_DECIMALS);
    let max_memo_length = Some(TEST_MAX_MEMO_LENGTH);
    let metadata = vec![(
        "icrc1_name".to_string(),
        Value::Text(token_name.to_string()),
    )];

    let initial_balances = vec![(
        Account {
            owner: ic_cdk::api::id(),

            subaccount: None,
        },
        Nat::from(100_000_000_000_000u64),
    )];

    let feature_flags = Some(FeatureFlags { icrc2: true });
    let maximum_number_of_accounts = Some(TEST_MAX_NUMBER_OF_ACCOUNTS);
    let accounts_overflow_trim_quantity = Some(TEST_ACCOUNTS_OVERFLOW_TRIM_QUANTITY);

    let archive_options = ArchiveOptions {
        num_blocks_to_archive: TEST_NUM_BLOCKS_TO_ARCHIVE,
        max_transactions_per_response: Some(TEST_MAX_TRANSACTIONS_PER_RESPONSE),
        trigger_threshold: TEST_TRIGGER_THRESHOLD,
        max_message_size_bytes: Some(TEST_MAX_MESSAGE_SIZE_BYTES),
        cycles_for_archive_creation: Some(TEST_CYCLES_FOR_ARCHIVE_CREATION),
        node_max_memory_size_bytes: Some(TEST_NODE_MAX_MEMORY_SIZE_BYTES),
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
            return Err(Error::ErrorEncoding);
        }
    };

    let canister_id = ic_cdk::api::management_canister::main::create_canister(arg, TEST_DEFAULT_CYCLES)
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
    Ok(canister_id)
}
