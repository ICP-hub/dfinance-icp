use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::{
    ACCOUNTS_OVERFLOW_TRIM_QUANTITY, CYCLES_FOR_ARCHIVE_CREATION, DECIMALS, DEFAULT_CYCLES,
    MAX_MEMO_LENGTH, MAX_MESSAGE_SIZE_BYTES, MAX_NUMBER_OF_ACCOUNTS, MAX_TRANSACTIONS_PER_RESPONSE,
    NODE_MAX_MEMORY_SIZE_BYTES, NUM_BLOCKS_TO_ARCHIVE, TEST_ACCOUNTS_OVERFLOW_TRIM_QUANTITY,
    TEST_CYCLES_FOR_ARCHIVE_CREATION, TEST_DECIMALS, TEST_DEFAULT_CYCLES, TEST_MAX_MEMO_LENGTH,
    TEST_MAX_MESSAGE_SIZE_BYTES, TEST_MAX_NUMBER_OF_ACCOUNTS, TEST_MAX_TRANSACTIONS_PER_RESPONSE,
    TEST_NODE_MAX_MEMORY_SIZE_BYTES, TEST_NUM_BLOCKS_TO_ARCHIVE, TEST_TRANSFER_FEE,
    TEST_TRIGGER_THRESHOLD, TRANSFER_FEE, TRIGGER_THRESHOLD,
};
use crate::constants::constant_variables::constants::INITIAL_TEST_TOKEN_BALANCE;
use crate::guards::access_control::to_check_controller;
use candid::{Encode, Nat, Principal};
use ic_cdk::api::management_canister::main::{
    update_settings, CanisterInstallMode, CanisterSettings,
};
use ic_cdk_macros::update;
use icrc_ledger_types::icrc::generic_value::Value;
use icrc_ledger_types::icrc1::account::Account;
use std::borrow::Cow;
use crate::declarations::structs::{DynamicCanisterInitArgs, LedgerArg, ArchiveOptions, FeatureFlags};
use crate::api::query::get_controller;
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

fn default() -> Result<Principal, Error> {
    let default_var = match get_controller() {
        Ok(init_args) => init_args.controller_id,
        Err(e) => {
            return Err(e);
        }
    };

    Ok(default_var)
}

/*
 * @title Create Token Canister
 * @dev Deploys a new token canister with given name and symbol.
 * @param token_name Name of the new token.
 * @param token_symbol Symbol for the token.
 * @returns Principal ID of the created token canister.
 * @functionality Creates a new token canister with specific configurations.
 */
pub async fn create_token_canister(
    token_name: String,
    token_symbol: String,
) -> Result<Principal, Error> {
    let arg = ic_cdk::api::management_canister::main::CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![ic_cdk::api::id(), default().unwrap()]),
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
        more_controller_ids: Some(vec![default().unwrap()]),
    };

    let init_args = DynamicCanisterInitArgs {
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
 * @functionality Creates a test token canister with predefined configurations.
 */
pub async fn create_testtoken_canister(token_name: String, token_symbol: String) -> Result<Principal,Error> {
    let arg = ic_cdk::api::management_canister::main::CreateCanisterArgument {
        settings: Some(CanisterSettings {
            compute_allocation: None,
            controllers: Some(vec![ic_cdk::api::id(), default().unwrap()]),
            memory_allocation: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            freezing_threshold: None,
        }),
    };

    let minting_account = Account {
        owner: default().unwrap(),

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
        Nat::from(INITIAL_TEST_TOKEN_BALANCE),
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

        more_controller_ids: Some(vec![default().unwrap()]),
    };

    let init_args = DynamicCanisterInitArgs {
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

    let canister_id =
        ic_cdk::api::management_canister::main::create_canister(arg, TEST_DEFAULT_CYCLES)
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

/*
 * @title Add Controllers to Canister
 * @dev This function allows adding a user as a controller to a specific canister. 
 *      Only the current controller of the canister can invoke this function. 
 *      The function updates the canister settings to include the new user as a controller,
 *      alongside the caller.
 * 
 * @param canister_id The principal ID of the canister to which the controllers should be added.
 * @param user The principal ID of the user to be added as a controller.
 * 
 * @returns 
 *      - `Ok("done")`: If the controllers were successfully added.
 *      - `Ok("principals are not allowed")`: If the caller is not a controller of the canister.
 * @functionality Adds a new user as a controller of the specified canister.
 */
#[update]
pub async fn add_controllers(canister_id: Principal, user: Principal) -> Result<String, String> {
    if !to_check_controller() {
        ic_cdk::println!("principals are not allowed");
        return Ok("principals are not allowed".to_string());
    }

    let update_canister_args = ic_cdk::api::management_canister::main::UpdateSettingsArgument {
        canister_id,
        settings: CanisterSettings {
            controllers: Some(vec![user, ic_cdk::api::id()]),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
        },
    };

    update_settings(update_canister_args).await.unwrap();

    Ok("done".to_string())
}
