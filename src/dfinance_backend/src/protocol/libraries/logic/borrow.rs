use candid::{Nat, Principal};
use ic_cdk::api::call::{call, CallResult};
use ic_cdk::caller;
use std::env;

use crate::api::deposit::asset_transfer_from;
use crate::api::state_handler::*;
use crate::declarations::assets::ExecuteBorrowParams;
use crate::protocol::libraries::logic::{reserve::ReserveLogic, validation::ValidationLogic};
use crate::declarations::assets::InterestRateMode;
use crate::declarations::assets::ExecuteRepayParams;

pub async fn execute_borrow(params: ExecuteBorrowParams) {
// // Fetches the canister ids, user principal and amount from env
    let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
        .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
    let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
        .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
    let dtoken_canister_id =
        env::var("CANISTER_ID_DTOKEN").expect("CANISTER_ID_DTOKEN environment variable not set");

    let debttoken_canister_id =
        env::var("CANISTER_ID_DEBTTOKEN").expect("CANISTER_ID_DEBTTOKEN environment variable not set");

    let ledger_canister_id =
        Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
let debttoken_ledger_canister_id =
        Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
    let user_principal = caller();
    let platform_principal =
        Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
    let amount_nat = Nat::from(params.amount);

    // Reads the reserve_data from the ASSET_INDEX using the asset key
    let reserve_data = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset)
            .expect("Reserve not found")
            .clone()
    });

    // Fetches the reserve logic cache having the current values
    let reserve_cache = ReserveLogic::cache(reserve_data.clone());

    // Updates the liquidity and borrow index
    ReserveLogic::update_state(&reserve_data, &reserve_cache);

    // Validates supply using the reserve_data
    ValidationLogic::validate_borrow(&reserve_cache, &reserve_data, params.amount);

let currentStableRate : Nat = 0;
let isFirstBorrowing = false;

if (params.interestRateMode == InterestRateMode::Stable) {
    currentStableRate = reserve.currentStableBorrowRate;

// // mints the debt token
asset_transfer_from(
        debttoken_ledger_canister_id,
        platform_principal,
        user_principal,
        amount_nat.clone(),
    )
    .await;
  } else {
asset_transfer_from(
    debttoken_ledger_canister_id,
    platform_principal,
    user_principal,
    amount_nat.clone(),
)
.await;

  if (isFirstBorrowing) {
    userConfig.setBorrowing(reserve.id, true);
  }

    // Updates inetrest rates with the assets and the amount
    ReserveLogic::update_interest_rates(
        &reserve_data,
        &reserve_cache,
        params.asset,
        params.amount,
        0,
    );

    // Transfers the asset from the user to our backend cansiter
if (params.release_underlying){

    asset_transfer_from(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat.clone(),
    )
    .await;
}
    // Inter canister call to execute dtoken transfer

    // --------- Isolation mode logic (TODO) ---------
    // If first_supply == true : Validate automatic use as collateral
    // If first_supply == false : Set using as collateral
}

fn  executeRepay(params: ExecuteRepayParams)  {

// // Fetches the canister ids, user principal and amount from env
    let canister_id_ckbtc_ledger = env::var("CANISTER_ID_CKBTC_LEDGER")
        .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
    let canister_id_dfinance_backend = env::var("CANISTER_ID_DFINANCE_BACKEND")
        .expect("CANISTER_ID_CKBTC_LEDGER environment variable not set");
    let dtoken_canister_id =
        env::var("CANISTER_ID_DTOKEN").expect("CANISTER_ID_DTOKEN environment variable not set");

    let debttoken_canister_id =
        env::var("CANISTER_ID_DEBTTOKEN").expect("CANISTER_ID_DEBTTOKEN environment variable not set");

    let ledger_canister_id =
        Principal::from_text(canister_id_ckbtc_ledger).expect("Invalid ledger canister ID");
let debttoken_ledger_canister_id =
        Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
    let user_principal = caller();
    let platform_principal =
        Principal::from_text(canister_id_dfinance_backend).expect("Invalid platform principal");
let dtoken_ledger_canister_id =
        Principal::from_text(dtoken_canister_id).expect("Invalid ledger canister ID");
    let amount_nat = Nat::from(params.amount);

    let reserve_data = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset)
            .expect("Reserve not found")
            .clone()
    });

    // Fetches the reserve logic cache having the current values
    let reserve_cache = ReserveLogic::cache(reserve_data.clone());

    // Updates the liquidity and borrow index
    ReserveLogic::update_state(&reserve_data, &reserve_cache);

    // Validates supply using the reserve_data
    ValidationLogic::validate_repay(&reserve_cache, &reserve_data, params.amount);

if let paybackAmount :Nat = params.interestRateMode == InterestRateMode::Stable{
    reserve.currentStableDebt;
}else{
    reserve.currentVariableDebt;

}
let args = Account {
    owner: ic_cdk::caller(),
    subaccount: None, // Or Some(subaccount_bytes) if you have a subaccount
};

let (result,): (TransferFromResult,) = call(dtoken, "icrc1_balanceOf", (args,))
    .await
    .map_err(|e| e.1)?;

params.amount = result.amount;

  if (params.amount < paybackAmount) {
    paybackAmount = params.amount;
  }

// burn the tokens

if (params.interestRateMode == InterestRateMode::Stable) {
    currentStableRate = reserve.currentStableBorrowRate;

asset_transfer_from(
        debttoken_ledger_canister_id,
        user_principal,
        platform_principal,

        amount_nat.clone(),
    )
    .await;
  } else {
asset_transfer_from(
    debttoken_ledger_canister_id,
    user_principal,
    platform_principal,
    amount_nat.clone(),
)
.await;

// burn the token
if(params.use_dtokens){

asset_transfer_from(
    dtoken_ledger_canister_id,
    user_principal,
    platform_principal,
    amount_nat.clone(),
)
.await;

}else{

    asset_transfer_from(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat.clone(),
    )
    .await;
}

}

  }

use crate::api::state_handler::read_state;
use crate::declarations::assets::ReserveData;

use ic_cdk_macros::query;

#[query]
pub fn get_asset_data() -> ReserveData {
    read_state(|state| {
        let asset_index = &state.asset_index;
        asset_index
            .get(&"ckbtc".to_string())
            .expect("Reserve not found")
            .0
    })
}
