use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::*;
use crate::constants::asset_address::{
    BACKEND_CANISTER, CKBTC_LEDGER_CANISTER, DEBTTOKEN_CANISTER,
};
use crate::declarations::assets::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::declarations::transfer::*;
use crate::protocol::libraries::logic::reserve;
use candid::{Nat, Principal};
use dotenv::dotenv;
use ic_cdk::api::call::call;

// -------------------------------------
// ----------- BORROW LOGIC ------------
// -------------------------------------

pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<(), String> {
    dotenv().ok();
    ic_cdk::println!("Starting execute_supply with params: {:?}", params);

    // Fetched canister ids, user principal and amount
    let ledger_canister_id = Principal::from_text(CKBTC_LEDGER_CANISTER)
        .map_err(|_| "Invalid ledger canister ID".to_string())?;

    let debttoken_canister_id = Principal::from_text(DEBTTOKEN_CANISTER)
        .map_err(|_| "Invalid debttoken canister ID".to_string())?;

    let user_principal = ic_cdk::caller();
    
    let platform_principal = Principal::from_text(BACKEND_CANISTER)
        .map_err(|_| "Invalid platform canister ID".to_string())?;

    let amount_nat = Nat::from(params.amount);

    ic_cdk::println!("Canister ids, principal and amount successfully");

    // Reads the reserve_data from the ASSET_INDEX using the asset key
    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
    });

    // Unwrap the Result to get ReserveData
    let reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {}", e);
            return Err(e);
        }
    };

    // Fetches the reserve logic cache having the current values
    let reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // // Updates the liquidity and borrow index
    // reserve::update_state(&mut reserve_data, &mut reserve_cache);
    // ic_cdk::println!("Reserve state updated successfully");
    // // Validates supply using the reserve_data
    // ValidationLogic::validate_supply(&reserve_cache, &reserve_data, params.amount);
    // ic_cdk::println!("Supply validated successfully");
    // let mut current_stable_rate: u128 = 0;
    // let is_first_borrowing = false;
    // if params.interestRateMode == InterestRateMode::Stable {
    //     current_stable_rate = reserve_cache.curr_avg_stable_borrow_rate;
    //     // Mints the debt token
    //     asset_transfer_from(
    //         debttoken_ledger_canister_id,
    //         platform_principal,
    //         user_principal,
    //         amount_nat.clone(),
    //     ).await.map_err(|e| e.to_string())?;
    // } else {
    //     asset_transfer_from(
    //         debttoken_ledger_canister_id,
    //         platform_principal,
    //         user_principal,
    //         amount_nat.clone(),
    //     ).await.map_err(|e| e.to_string())?;
    // if is_first_borrowing {
    //     userConfig.setBorrowing(reserve_data.id, true);
    // }
    //     reserve::update_state(&mut reserve_data, &mut reserve_cache);
    // ic_cdk::println!("Reserve state updated successfully");
    //     // Transfers the asset from the user to our backend canister
    //     if params.release_underlying {
    //         asset_transfer_from(
    //             ledger_canister_id,
    //             user_principal,
    //             platform_principal,
    //             amount_nat.clone(),
    //         ).await.map_err(|e| e.to_string())?;
    //     }
    // }
    // asset_transfer_from(
    //     ledger_canister_id,
    //     platform_principal,
    //     user_principal,
    //     amount_nat.clone(),
    // ).await.map_err(|e| e.to_string())?;

    // Transfers borrow amount from the pool to the user
    let args = TransferFromArgs {
        to: TransferAccount {
            owner: user_principal,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        from: TransferAccount {
            owner: platform_principal,
            subaccount: None,
        },
        memo: None,
        created_at_time: None,
        amount: amount_nat.clone(),
    };
    let (result,): (TransferFromResult,) = call(ledger_canister_id, "icrc2_transfer_from", (args,))
        .await
        .map_err(|e| e.1)?;

    match result {
        TransferFromResult::Ok(balance) => Ok(()),
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    };
    


    let debttoken_args = TransferArgs {
        to: TransferAccount {
            owner: user_principal,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: amount_nat.clone(),
    };
     
    let (new_result,): (TransferFromResult,) = call(
        debttoken_canister_id,
        "icrc1_transfer",
        (debttoken_args, false, Some(platform_principal)),
    )
    .await
    .map_err(|e| e.1)?;

    match new_result {
        TransferFromResult::Ok(new_balance) => {
            ic_cdk::println!("Debttoken transfer from backend to user executed successfully {:?}", new_balance);
            Ok(())
        }
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    }

    // ---------- User updation logic here -----------
}

// -------------------------------------
// ------------ REPAY LOGIC ------------
// -------------------------------------

pub async fn execute_repay(params: ExecuteRepayParams) -> Result<(), String> {
    ic_cdk::println!("Starting execute_repay with params: {:?}", params);

    let (user_principal, liquidator_principal) = if let Some(on_behalf_of) = params.on_behalf_of {
        let user_principal = Principal::from_text(on_behalf_of)
            .map_err(|_| "Invalid user canister ID".to_string())?;
        let liquidator_principal = ic_cdk::caller();
        (user_principal, Some(liquidator_principal))
    } else {
        let user_principal = ic_cdk::caller();
        ic_cdk::println!("Caller is: {:?}", user_principal.to_string());
        (user_principal, None)
    };

    let ledger_canister_id = Principal::from_text(CKBTC_LEDGER_CANISTER)
        .map_err(|_| "Invalid ledger canister ID".to_string())?;

    let platform_principal = Principal::from_text(BACKEND_CANISTER)
        .map_err(|_| "Invalid platform canister ID".to_string())?;

    let debttoken_canister_id = Principal::from_text(DEBTTOKEN_CANISTER)
        .map_err(|_| "Invalid debttoken canister ID".to_string())?;

    // Reads the reserve data from the asset
    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
    });

    let mut reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            ic_cdk::println!("Error: {}", e);
            return Err(e);
        }
    };

    // ---------- Update state() ----------

    // ---------- Validate repay() ----------

    let repay_amount = Nat::from(params.amount);

    // Determines the sender principal
    let transfer_from_principal = if let Some(liquidator) = liquidator_principal {
        liquidator
    } else {
        user_principal
    };

    // Transfers the asset from the user to our backend cansiter
    asset_transfer_from(
        ledger_canister_id,
        transfer_from_principal,
        platform_principal,
        repay_amount.clone(),
    )
    .await
    .map_err(|e| format!("Asset transfer failed: {:?}", e))?;

    ic_cdk::println!("Asset transfer from user to backend canister executed successfully");

    // ---------- debttoken logic that will reduce the user debt ----------
    
    let debttoken_args = TransferArgs {
        to: TransferAccount {
            owner: platform_principal,
            subaccount: None,
        },
        fee: None,
        spender_subaccount: None,
        memo: None,
        created_at_time: None,
        amount: repay_amount.clone(),
    };

    let (new_result,): (TransferFromResult,) = call(
        debttoken_canister_id,
        "icrc1_transfer",
        (debttoken_args, false, Some(user_principal)),
    )
    .await
    .map_err(|e| e.1)?;

    match new_result {
        TransferFromResult::Ok(new_balance) => {
            ic_cdk::println!("Debttoken transfer from backend to user executed successfully {:?}", new_balance);
            Ok(())
        }
        TransferFromResult::Err(err) => Err(format!("{:?}", err)),
    }
    // ---------- Update reserve data ----------

    // ---------- Update user data ----------

    // Ok(())
}
