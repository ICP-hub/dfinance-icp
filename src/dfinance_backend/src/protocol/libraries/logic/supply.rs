use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::{mutate_state, read_state};
use crate::constants::errors::Error;
use crate::declarations::assets::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::update_reserves_price;
use candid::{Nat, Principal};
use ic_cdk::update;

// -------------------------------------
// ----------- SUPPLY LOGIC ------------
// -------------------------------------

#[update]
pub async fn execute_supply(params: ExecuteSupplyParams) -> Result<Nat, Error> {
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

    if user_principal == Principal::anonymous() {
        ic_cdk::println!("Anonymous principals are not allowed");
        return Err(Error::InvalidPrincipal);
    }

    let ledger_canister_id = read_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| Error::NoCanisterIdFound)
    })?;

    //TODO: check if need to add a check for the platoform principal.
    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let amount_nat = params.amount.clone();

    //TODO create a comman func to get asset reserve data in mutate state
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

    // if let Err(e) = update_reserves_price().await {
    //     ic_cdk::println!("Failed to update reserves price: {:?}", e);
    //     return Err(e);
    // }

    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    // Validates supply using the reserve_data
    if let Err(e) = ValidationLogic::validate_supply(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await
    {
        ic_cdk::println!("supply validation failed: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("Supply validated successfully");

    //TODO call mint function here

    let liq_added = params.amount.clone();
    let liq_taken = Nat::from(0u128);

    if let Err(e) =
        reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, liq_taken, liq_added)
            .await
    {
        ic_cdk::println!("Failed to update interest rates: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("Interest rates updated successfully");

    if let Err(e) = UpdateLogic::update_user_data_supply(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await
    {
        ic_cdk::println!("Failed to update user data: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("User data supply updated");

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // Transfers the asset from the user to our backend cansiter
    match asset_transfer_from(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            println!("Asset transfer from user to backend canister executed successfully");
            Ok(new_balance)
        }
        Err(_) => {
            //TODO add burn function here
            return Err(Error::ErrorMintTokens);
        }
    }
}

// -------------------------------------
// ---------- WITHDRAW LOGIC -----------
// -------------------------------------

#[update]
pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<Nat, Error> {
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
            return Err(Error::InvalidPrincipal);
        }
    }

    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            let liquidator_principal = ic_cdk::caller();
            if liquidator_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::InvalidPrincipal);
            }
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            if user_principal == Principal::anonymous() {
                ic_cdk::println!("Anonymous principals are not allowed");
                return Err(Error::InvalidPrincipal);
            }
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
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let withdraw_amount = Nat::from(params.amount.clone());
    ic_cdk::println!("Withdraw amount: {:?}", withdraw_amount);

    // Determines the receiver principal
    let transfer_to_principal = if let Some(liquidator) = liquidator_principal {
        ic_cdk::println!("Transferring to liquidator: {:?}", liquidator);
        liquidator
    } else {
        ic_cdk::println!("Transferring to user: {:?}", user_principal);
        user_principal
    };

    // Reads the reserve data from the asset
    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
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

    // if let Err(e) = update_reserves_price().await {
    //     ic_cdk::println!("Failed to update reserves price: {:?}", e);
    //     return Err(e);
    // }

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    if let Err(e) = ValidationLogic::validate_withdraw(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await
    {
        ic_cdk::println!("Repay validation failed: {:?}", e);
        return Err(e);
    }
    ic_cdk::println!("Withdraw validated successfully");

    if let Err(e) = reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(),
        Nat::from(0u128),
    )
    .await
    {
        ic_cdk::println!("Failed to update interest rates: {:?}", e);
        return Err(e);
    }

    // ----------- Update logic here -------------
    if let Err(e) = UpdateLogic::update_user_data_withdraw(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await
    {
        ic_cdk::println!("Failed to update user data: {:?}", e);
        return Err(e);
    }

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });
    // Transfers the asset from the user to our backend cansiter
    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        transfer_to_principal,
        withdraw_amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            println!("Asset transfer from backend to user executed successfully");

            Ok(new_balance)
        }
        Err(_) => {
            //TODO mint the dtoken back to user
            return Err(Error::ErrorBurnTokens);
        }
    }
}
