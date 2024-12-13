use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::*;
use crate::declarations::assets::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::declarations::storable::Candid;
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::protocol::libraries::math::calculate::{get_exchange_rates, update_reserves_price};
use candid::{Nat, Principal};

// -------------------------------------
// ----------- BORROW LOGIC ------------
// -------------------------------------

pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<Nat, String> {
    ic_cdk::println!("Starting execute_borrow with params: {:?}", params);

    // Fetch canister ids, user principal, and amount
    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
    })?;

    let user_principal = ic_cdk::caller();
    ic_cdk::println!("User principal: {:?}", user_principal);

    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let debttoken_canister = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.debt_token_canister.clone())
            .ok_or_else(|| format!("No debt_token_canister found for asset: {}", params.asset))
    })?;
    ic_cdk::println!("Debt canister ID: {:?}", debttoken_canister);

    //let amount_nat = Nat::from(params.amount);
    //ic_cdk::println!("Borrow amount in Nat: {:?}", amount_nat);

    update_reserves_price().await;

    let mut usd_amount =Nat::from(0u128);
    let borrow_amount_to_usd: Result<(Nat, u64), String> =
        get_exchange_rates(params.asset.clone(), None, params.amount.clone()).await;
    match borrow_amount_to_usd {
        Ok((amount_in_usd, _timestamp)) => {
            usd_amount = amount_in_usd;
            ic_cdk::println!("Borrow amount in USD: {:?}", usd_amount);
        }
        Err(e) => {
            ic_cdk::println!("Error getting exchange rate: {:?}", e);
        }
    }
    ic_cdk::println!("Final borrow amount in USD: {:?}", usd_amount);

    let reserve_data_result = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| format!("Reserve not found for asset: {}", params.asset.to_string()))
    });

    // Unwrap the Result to get ReserveData
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

    if reserve_data.asset_borrow == Nat::from(0u128) {
        *&mut reserve_data.debt_index = Nat::from(100000000u128);
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

    // Converting asset to USDT value
    if let Some(userlist) = &mut reserve_data.userlist {
        if !userlist
            .iter()
            .any(|(principal, _)| principal == &user_principal.to_string())
        {
            userlist.push((user_principal.to_string(), true));
        }
    } else {
        reserve_data.userlist = Some(vec![(user_principal.to_string(), true)]);
    }
    ic_cdk::println!("User list of reserve: {:?}", reserve_data.userlist.clone());

    // Validates supply using the reserve_data
    let _ = ValidationLogic::validate_borrow(&reserve_data, params.amount.clone(), user_principal).await;
    ic_cdk::println!("Borrow validated successfully");

    let total_borrow = reserve_data.asset_borrow.clone() + params.amount.clone();
    let total_supplies = reserve_data.asset_supply.clone();
    let _ = reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        total_borrow,
        total_supplies,
    )
    .await;
    reserve_data.total_borrowed += usd_amount;
    ic_cdk::println!(
        "Interest rates updated successfully. Total borrowed: {:?}",
        reserve_data.total_borrowed
    );

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // ----------- Update logic here -------------
    let _ = UpdateLogic::update_user_data_borrow(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
       // usd_amount,
    )
    .await;
    ic_cdk::println!("User data updated successfully");

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
            ic_cdk::println!("Asset transfer failed, burned debt token. Error: {:?}", e);
            Err(format!(
                "Asset transfer failed, burned debt token. Error: {:?}",
                e
            ))
        }
    }
}

// -------------------------------------
// ------------ REPAY LOGIC ------------
// -------------------------------------

pub async fn execute_repay(params: ExecuteRepayParams) -> Result<Nat, String> {
    ic_cdk::println!("Starting execute_repay with params: {:?}", params);

    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            let liquidator_principal = ic_cdk::caller();
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            ic_cdk::println!("Caller is: {:?}", user_principal.to_string());
            (user_principal, None)
        };

    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
    })?;

    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let repay_amount = params.amount.clone();
    ic_cdk::println!("Repay amount: {:?}", repay_amount);

    update_reserves_price().await;

    // Converting asset value to usdt
    let mut usd_amount = Nat::from(0u128);
    let repay_amount_to_usd = get_exchange_rates(params.asset.clone(), None, params.amount.clone()).await;
    match repay_amount_to_usd {
        Ok((amount_in_usd, _timestamp)) => {
            // Extracted the amount in USD
            usd_amount = amount_in_usd;
            ic_cdk::println!("Repay amount in USD: {:?}", usd_amount);
        }
        Err(e) => {
            ic_cdk::println!("Error getting exchange rate: {:?}", e);
        }
    }

    ic_cdk::println!("Repay amount in USD: {:?}", usd_amount);

    // Determines the sender principal
    let transfer_from_principal = if let Some(liquidator) = liquidator_principal {
        ic_cdk::println!("Liquidator principal: {:?}", liquidator);
        liquidator
    } else {
        user_principal
    };
    ic_cdk::println!("Transfer from principal: {:?}", transfer_from_principal);

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

    if reserve_data.debt_index == Nat::from(0u128) {
        reserve_data.debt_index = Nat::from(100000000u128);
    }

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    // Validates repay using the reserve_data
    let _ = ValidationLogic::validate_repay(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await;
    ic_cdk::println!("Repay validated successfully");
    ic_cdk::println!("Asset borrow: {:?}", reserve_data.asset_borrow);

    let total_borrow = reserve_data.asset_borrow.clone() - params.amount.clone();
    let total_supplies = reserve_data.asset_supply.clone();
    ic_cdk::println!("Total borrow after repay: {:?}", total_borrow);
    ic_cdk::println!("Total supplies: {:?}", total_supplies);

    let _ = reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        total_borrow,
        total_supplies,
    )
    .await;
    reserve_data.total_borrowed =
        (reserve_data.total_borrowed - usd_amount ).max(Nat::from(0u128));
    ic_cdk::println!(
        "Total borrowed after updating interest rates: {:?}",
        reserve_data.total_borrowed
    );

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // ----------- Update logic here -------------
    let _ = UpdateLogic::update_user_data_repay(
        user_principal,
        &reserve_cache,
        params.clone(),
        &reserve_data,
       // usd_amount,
    )
    .await;
    ic_cdk::println!("User data updated successfully");

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
            ic_cdk::println!("Asset transfer failed, error: {:?}", e);
            Err(format!(
                "Asset transfer failed, minted debt token. Error: {:?}",
                e
            ))
        }
    }
}
