// to create canisters

use std::borrow::Borrow;
use std::fmt::format;

use ic_cdk::api::call::{call_with_payment128, CallResult};
use ic_cdk::api::canister_version;
// use crate::api::canister_version;
// use crate::routes::{delete_canister, stop_canister, upload_image};
use crate::new_types::{
    CanisterIdRecord, CanisterInstallMode, CreateCanisterArgument, CreateCanisterArgumentExtended,
    InstallCodeArgument, InstallCodeArgumentExtended,
};

// use crate::types::{DaoInput, Profileinput, UserProfile};
// use crate::{guards::*, CanisterSettings, DaoCanisterInput};
// use crate::{routes, with_state, DaoDetails, DaoResponse, ImageData};
use candid::{encode_one, Principal};
use ic_cdk::api;
// use ic_cdk::api::management_canister::main::CanisterSettings;
use ic_cdk::println;
use ic_cdk::{query, update};
use serde_bytes::ByteBuf;

pub async fn create_new_canister(
    arg: CreateCanisterArgument, // cycles: u128,
) -> CallResult<(CanisterIdRecord,)> {
    let extended_arg = CreateCanisterArgumentExtended {
        settings: arg.settings,
        sender_canister_version: Some(canister_version()),
    };
    let cycles: u128 = 100_000_000_000;
    call_with_payment128(
        Principal::management_canister(),
        "create_canister",
        (extended_arg,),
        cycles,
    )
    .await
}

pub async fn deposit_cycles_in_canister(arg: CanisterIdRecord, cycles: u128) -> CallResult<()> {
    call_with_payment128(
        Principal::management_canister(),
        "deposit_cycles",
        (arg,),
        cycles,
    )
    .await
}

pub async fn install_code_in_canister(
    arg: InstallCodeArgument,
    wasm_module: Vec<u8>,
) -> CallResult<()> {
    let cycles: u128 = 100_000_000_000;

    let extended_arg = InstallCodeArgumentExtended {
        mode: arg.mode,
        canister_id: arg.canister_id,
        wasm_module: wasm_module,
        arg: arg.arg,
        sender_canister_version: Some(canister_version()),
    };
 
    call_with_payment128(
        Principal::management_canister(),
        "install_code",
        (extended_arg,),
        cycles,
    )
    .await
}

