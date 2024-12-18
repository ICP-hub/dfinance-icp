use crate::api::functions::asset_transfer_from;
use crate::api::state_handler::*;
use crate::declarations::assets::{ExecuteBorrowParams, ExecuteRepayParams};
use crate::protocol::libraries::logic::reserve::{self};
use crate::protocol::libraries::logic::update::UpdateLogic;
use crate::protocol::libraries::logic::validation::ValidationLogic;
use crate::declarations::storable::Candid;
use crate::protocol::libraries::math::calculate::get_exchange_rates;
use candid::{Nat, Principal};


// -------------------------------------
// ----------- BORROW LOGIC ------------
// -------------------------------------

pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<Nat, String> {
    ic_cdk::println!("Starting execute_borrow with params: {:?}", params);
    //TODO fetch readable state
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
    //TODO fetch readable state
    let debttoken_canister = mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index
            .get(&params.asset.to_string().clone())
            .and_then(|reserve_data| reserve_data.debt_token_canister.clone())
            .ok_or_else(|| format!("No debt_token_canister found for asset: {}", params.asset))
    })?;
    ic_cdk::println!("Debt canister ID: {:?}", debttoken_canister);

    let amount_nat = Nat::from(params.amount);
    ic_cdk::println!("Borrow amount in Nat: {:?}", amount_nat);

    
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

    if reserve_data.asset_borrow == 0 {
        *&mut reserve_data.debt_index = 100000000;
    }
    ic_cdk::println!("Updated debt index for reserve data: {:?}", reserve_data.debt_index);

    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");


    // TODO replace validate code from backend-three
    ValidationLogic::validate_borrow(&reserve_data, params.amount, user_principal).await;
    ic_cdk::println!("Borrow validated successfully");
    //TODO mint debt tokens here
    // let mut user_reserve = user_reserve(&mut user_data, &params.asset);
    //     ic_cdk::println!("User reserve: {:?}", user_reserve);


    //     let mut user_reserve_data = match user_reserve.as_mut() {
    //         Some((_, reserve_data)) => reserve_data,
    //         None => return Err("No reserve found for the user".to_string()), // or handle appropriately
    //     };
        
    //     let minted_result = mint_scaled(
    //         reserve,
    //         &mut user_reserve_data,
    //         params.amount,
    //         reserve_cache.next_debt_index,
    //         user_principal,
    //         Principal::from_text(reserve.debt_token_canister.clone().unwrap()).unwrap(),
    //         platform_principal,
    //         false
    //     )
    //     .await;

    //     match minted_result {
    //         Ok(()) => {
    //             ic_cdk::println!("Minting dtokens successfully");
    //         }
    //         Err(e) => {
    //             panic!("Get error in minting the dtokens {:?}", e);
    //         }
    //     }
    // let total_borrow = reserve_data.asset_borrow + params.amount;
    // let total_supplies = reserve_data.asset_supply;
    //TODO keep liq_taken = 0
    let _ = reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, params.amount, 0u128).await;
    
    ic_cdk::println!("Interest rates updated successfully. Total borrowed: {:?}", reserve_data.total_borrowed);

  

    // ----------- Update logic here -------------
    let _ = UpdateLogic::update_user_data_borrow(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    ).await;
    ic_cdk::println!("User data updated successfully");

    mutate_state(|state| {
        let asset_index = &mut state.asset_index;
        asset_index.insert(params.asset.clone(), Candid(reserve_data.clone()));
    });

    // Transfers borrow amount from the pool to the user
    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        amount_nat.clone(),
    ).await
    {
        Ok(new_balance) => {
            ic_cdk::println!("Asset transfer from backend to user executed successfully. New balance: {:?}", new_balance);
            Ok(new_balance)
        }
        Err(e) => {
            //TODO burn debttoken
            ic_cdk::println!("Asset transfer failed, burned debt token. Error: {:?}", e);
            Err(format!("Asset transfer failed, burned debt token. Error: {:?}", e))
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
            let user_principal = Principal::from_text(on_behalf_of)
                .map_err(|_| "Invalid user canister ID".to_string())?;
            let liquidator_principal = ic_cdk::caller();
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            ic_cdk::println!("Caller is: {:?}", user_principal.to_string());
            (user_principal, None)
        };
    //TODO fetch readable state
    let ledger_canister_id = mutate_state(|state| {
        let reserve_list = &state.reserve_list;
        reserve_list
            .get(&params.asset.to_string().clone())
            .map(|principal| principal.clone())
            .ok_or_else(|| format!("No canister ID found for asset: {}", params.asset))
    })?;
    ic_cdk::println!("Ledger canister ID: {:?}", ledger_canister_id);

    let platform_principal = ic_cdk::api::id();
    ic_cdk::println!("Platform principal: {:?}", platform_principal);

    let repay_amount = Nat::from(params.amount);
    ic_cdk::println!("Repay amount: {:?}", repay_amount);

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

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache);
    ic_cdk::println!("Reserve state updated successfully");

    // Validates repay using the reserve_data
    //TODO replace it with bbackend-three code
    ValidationLogic::validate_repay(
        &reserve_data,
        params.amount,
        user_principal,
        ledger_canister_id,
    )
    .await;
    ic_cdk::println!("Repay validated successfully");
    ic_cdk::println!("Asset borrow: {:?}", reserve_data.asset_borrow);

    // let total_borrow = reserve_data.asset_borrow - params.amount;
    // let total_supplies = reserve_data.asset_supply;
    // ic_cdk::println!("Total borrow after repay: {:?}", total_borrow);
    // ic_cdk::println!("Total supplies: {:?}", total_supplies);
    
    //TODO call burn function here

    let _ = reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, 0u128, params.amount).await;
   

    // ----------- Update logic here -------------
    let _ = UpdateLogic::update_user_data_repay(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await;
    ic_cdk::println!("User data updated successfully");


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
            ic_cdk::println!("Asset transfer from user to backend executed successfully, new balance: {:?}", new_balance);
            Ok(new_balance)
        }
        Err(e) => {
            //TODO mint debttoken back to user
            ic_cdk::println!("Asset transfer failed, error: {:?}", e);
            Err(format!("Asset transfer failed, minted debt token. Error: {:?}", e))
        }
    }
}
