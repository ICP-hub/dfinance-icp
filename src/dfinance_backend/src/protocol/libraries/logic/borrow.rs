use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::*;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::INITIAL_DEBT_INDEX;
use crate::declarations::assets::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::update_reserves_price;
use candid::{Nat, Principal};
use ic_cdk::update;

// -------------------------------------
// ----------- BORROW LOGIC ------------
// -------------------------------------
#[update]
pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<Nat, Error> {
    if params.asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if params.asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if params.amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {:?}", user_principal);

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::AnonymousPrincipal);
    }

    let ledger_canister_id = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let platform_principal = ic_cdk::api::id();

    let debttoken_canister = read_state(|state| {
        let asset_index = &state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.debt_token_canister.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;
    ic_cdk::println!("Debt canister ID: {:?}", debttoken_canister);

    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let mut reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset: {:?}", data);
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    if reserve_data.asset_borrow == Nat::from(0u128) {
        *&mut reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }
    ic_cdk::println!(
        "Updated debt index for reserve data: {:?}",
        reserve_data.debt_index
    );

    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    if let Err(e) = ValidationLogic::validate_borrow(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await
    {
        ic_cdk::println!("Borrow validation failed: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("Borrow validated successfully");
    
     // ----------- Update logic here -------------
     if let Err(e) = UpdateLogic::update_user_data_borrow(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await {
        ic_cdk::println!("Failed to update user data: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("User data updated successfully");

    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
    ic_cdk::println!("Current debt: {:?}", reserve_cache.curr_debt);

    if let Err(e) = reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(),
        Nat::from(0u128),
    )
    .await {
        ic_cdk::println!("Failed to update interest rates: {:?}", e);
        return Err(e);
    } 

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // Transfers borrow amount from the pool to the user
    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        params.amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                new_balance
            );
            Ok(new_balance)
        }
        Err(e) => {
             //Rollback user state
             let repay_param = ExecuteRepayParams {
                asset: params.asset.clone(),
                amount: params.amount,
                on_behalf_of: None, 
            };
            if let Err(e) = UpdateLogic::update_user_data_repay(
                user_principal,
                &reserve_cache,
                repay_param,
                &mut reserve_data,
            )
            .await
            {
                ic_cdk::println!("Failed to rollback user state: {:?}", e);
                return Err(Error::ErrorRollBack);
            };
            mutate_state(|state| {
                let asset_index = &mut state.asset_index;
                asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
            });
            ic_cdk::println!("Asset transfer failed, mint debt token. Error: {:?}", e);
            return Err(Error::ErrorMintDebtTokens);
        }
    }
}

// -------------------------------------
// ------------ REPAY LOGIC ------------
// -------------------------------------
#[update]
pub async fn execute_repay(
    params: ExecuteRepayParams
) -> Result<Nat, Error> {
    if params.asset.trim().is_empty() {
        ic_cdk::println!("Asset cannot be an empty string");
        return Err(Error::EmptyAsset);
    }

    if params.asset.len() > 7 {
        ic_cdk::println!("Asset must have a maximum length of 7 characters");
        return Err(Error::InvalidAssetLength);
    }

    if params.amount <= Nat::from(0u128) {
        ic_cdk::println!("Amount cannot be zero");
        return Err(Error::InvalidAmount);
    }

    if let Some(principal) = params.on_behalf_of {
        if principal == Principal::anonymous() {
            ic_cdk::println!("Anonymous principals are not allowed");
            return Err(Error::AnonymousPrincipal);
        }
    }

    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            let liquidator_principal = ic_cdk::caller();
            if liquidator_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::AnonymousPrincipal);
            }
            ic_cdk::println!("Caller is: {:?}", user_principal.to_string());
            (user_principal, None)
        };

    let ledger_canister_id = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    let platform_principal = ic_cdk::api::id();

    let repay_amount = params.amount.clone();
    ic_cdk::println!("Repay amount: {:?}", repay_amount);

    // Determines the sender principal
    let transfer_from_principal = if let Some(liquidator) = liquidator_principal {
        ic_cdk::println!("Liquidator principal: {:?}", liquidator);
        liquidator
    } else {
        user_principal
    };
    ic_cdk::println!("Transfer from principal: {:?}", transfer_from_principal.to_string());

    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    });

    let mut reserve_data = match reserve_data_result {
        Ok(data) => {
            ic_cdk::println!("Reserve data found for asset");
            data
        }
        Err(e) => {
            return Err(e);
        }
    };

    if reserve_data.debt_index == Nat::from(0u128) {
        reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    // Validates repay using the reserve_data
    if let Err(e) = ValidationLogic::validate_repay(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        liquidator_principal,
        ledger_canister_id,
    )
    .await {
        ic_cdk::println!("Repay validation failed: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("Repay validated successfully");

    if let Err(e) = update_reserves_price().await {
        ic_cdk::println!("Failed to update reserves price: {:?}", e);
        return Err(e);
    }
    
    ic_cdk::println!("Asset borrow: {:?}", reserve_data.asset_borrow);

    // ----------- Update logic here -------------
    if let Err(e) = UpdateLogic::update_user_data_repay(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await {
        ic_cdk::println!("Failed to update user data: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("User data updated successfully");
    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
    ic_cdk::println!("Current debt: {:?}", reserve_cache.curr_debt);
    if let Err(e) = reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        Nat::from(0u128),
        params.amount.clone(),
    )
    .await {
        ic_cdk::println!("Failed to update interest rates: {:?}", e);
        return Err(e);
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // Transfers the asset from the user to our backend canister
    match asset_transfer_from(
        ledger_canister_id,
        transfer_from_principal,
        platform_principal,
        repay_amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            ic_cdk::println!(
                "Asset transfer from user to backend executed successfully, new balance: {:?}",
                new_balance
            );
            Ok(new_balance)
        }
        Err(e) => {
             //Rollback user state
             let borrow_param = ExecuteBorrowParams {
                asset: params.asset.clone(),
                amount: params.amount, 
            };
            if let Err(e) = UpdateLogic::update_user_data_borrow(
                user_principal,
                &reserve_cache,
                borrow_param,
                &mut reserve_data,
            )
            .await
            {
                ic_cdk::println!("Failed to rollback user state: {:?}", e);
                return Err(Error::ErrorRollBack);
            };
            mutate_state(|state| {
                let asset_index = &mut state.asset_index;
                asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
            });
            ic_cdk::println!("Asset transfer failed, error: {:?}", e);
            return Err(Error::ErrorBurnDebtTokens);
        }
    }
}
