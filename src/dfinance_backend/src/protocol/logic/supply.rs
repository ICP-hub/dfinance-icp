use crate::api::inter_canister::{asset_transfer_from, get_transfer_fee};
use crate::stable_storage::state_handler::{insert_certified_value, mutate_state};
use crate::constants::{
    data_types::zero_nat_value,
    errors::Error,
    validators::{validate_asset_name, validate_zero_value},
};
use crate::declarations::structs::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::guards::api_limiter::request_limiter;
use crate::guards::locks_handler::CallerGuard;
use crate::protocol::libraries::{
    reserve::{self, get_asset_principal, get_reserve_data},
    update::UpdateLogic,
};
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::{
    log::{log_internal, LogLevel, LogFlusher},
    price::{calculate_transfer_fee, update_token_price},
};
use crate::stable_storage::storable::Candid;
use crate::{debug, error, info};
use candid::{Nat, Principal};
use ic_cdk::update;

/*
-------------------------------------
----------- SUPPLY LOGIC ------------
-------------------------------------
 */

/*
 * @title Execute Supply Function
 * @functionality Asset supply processing
 * @notice Allows users to supply assets to the platform, handling validation, state updates, and asset transfer.
 *         Ensures proper checks, updates, and error handling, including rollback if any step fails.
 *
 * @dev The function follows these steps:
 *      1. Checks if the user is rate-limited.
 *      2. Validates input parameters (asset name, amount, and caller's identity).
 *      3. Acquires a lock to ensure only one operation per user at a time.
 *      4. Updates the reserve data and user profile state.
 *      5. Validates the supply request against platform rules (e.g., limits, reserves).
 *      6. Transfers the asset from the user to the platform.
 *      7. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the supply operation:
 *               - `asset`: The name of the asset being supplied.
 *               - `amount`: The amount of the asset being supplied.
 *               - `can_be_collateral`: Flag indicating if the asset is collateral.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_supply(mut params: ExecuteSupplyParams) -> Result<Nat, Error> {
    request_limiter()?;

    let user_principal = ic_cdk::caller();
  
    let _guard: CallerGuard = CallerGuard::lock_principal(user_principal.clone())?;
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(), // or whatever user_key you need
    };
    //valid param
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

   
    let ledger_canister_id = get_asset_principal(params.asset.clone())?; //fetch param.asset canister id
    let platform_principal = ic_cdk::api::id();  //fetch backend canister id

    let amount_nat = params.amount.clone();
    //fetch reserve data state for the asset

    let mut reserve_data = get_reserve_data(params.asset.clone())?;

    //initialize a asset reserve cache for temp changes
    let mut reserve_cache = reserve::cache(&reserve_data);
    info!("Reserve cache fetched successfully: {:?}", reserve_cache); 
    //update the reserve cache state
    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    info!("Reserve state updated successfully"); 

    //validat the supply request
    ValidationLogic::validate_supply(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await?;
    info!("Supply info validated successfully"); 

    // updating the price cached in the state
    let _ = update_token_price(params.asset.clone()).await;
    //fetching the price of the asset in USD

    let transfer_token_fee = calculate_transfer_fee(&params.asset, params.amount.clone())?;
    let ledger_fee = get_transfer_fee(ledger_canister_id).await?;
    //updating params.amount with the actual amount of tokens to be supplied
    params.amount = params.amount.clone() - (transfer_token_fee.clone() + ledger_fee.clone());
    UpdateLogic::update_user_data_supply(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    info!("udpate user data supply called successfully"); 
    let liq_added = params.amount.clone();
    let liq_taken = zero_nat_value();
    //Updating the APYs
    reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, liq_taken, liq_added)
        .await?;

    info!("Interest rates updated successfully");
    //intializing and updating user state and minting the dtokens to the user
    

    //updating the reserve data in the state
    mutate_state(|state| {
        state
            .asset_index
            .insert(params.asset.clone(), Candid(reserve_data.clone()))
    });
    insert_certified_value(params.asset.clone(), reserve_data.clone());
    // Transfers the asset from the user to our backend cansiter
    match asset_transfer_from(
        ledger_canister_id,
        user_principal,
        platform_principal,
        amount_nat.clone() - ledger_fee.clone(), 
    )
    .await
    {
        Ok(block_index) => {
            info!("Asset transfer from user to backend canister executed successfully");
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            Ok(block_index)
        }
        Err(_) => {
            error!("Error in asset transfer from user to backend canister"); 
            //Rollback user state and burning dtokens
                                                                            
            let withdraw_param = ExecuteWithdrawParams {
                asset: params.asset.clone(),
                can_be_collateral: params.can_be_collateral,
                amount: params.amount.clone(),
            };
            //for burning and reverting the supplied amount
            UpdateLogic::update_user_data_withdraw(
                user_principal,
                &reserve_cache,
                withdraw_param.clone(),
                &mut reserve_data,
            )
            .await?;
            
            info!("Rollback successfully executed");

            error!("Error in asset transfer from user to backend canister");
            return Err(Error::ErrorSupplyToken);
        }
    }
}

/*
-------------------------------------
---------- WITHDRAW LOGIC -----------
-------------------------------------
*/

/*
 * @title Execute Withdraw Function
 * @functionality Asset withdrawal processing
 * @notice Allows users to withdraw assets from the platform, handling validation, state updates, and asset transfer.
 *         Ensures proper checks, updates, and error handling, including rollback if any step fails.
 *
 * @dev The function follows these steps:
 *      1. Checks if the user is rate-limited.
 *      2. Validates input parameters (asset name, amount, and caller's identity).
 *      3. Acquires a lock to ensure only one operation per user at a time.
 *      4. Updates the reserve data and user profile state.
 *      5. Validates the withdrawal request against platform rules (e.g., limits, available assets).
 *      6. Transfers the requested asset from the platform to the user.
 *      7. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the withdraw operation:
 *               - `asset`: The name of the asset being withdrawn.
 *               - `amount`: The amount of the asset being withdrawn.
 *               - `can_be_collateral`: Flag indicating if the asset is collateral.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<Nat, Error> {
    request_limiter()?;

    let user_principal = ic_cdk::caller();
  
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(), // or whatever user_key you need
    };
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;
    let ledger_canister_id = get_asset_principal(params.asset.clone())?;

    
    let transfer_to_principal: Principal = user_principal.clone();
    let mut reserve_data = get_reserve_data(params.asset.clone())?;
    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    info!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    info!("Reserve state updated successfully");

    ValidationLogic::validate_withdraw(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
        
    )
    .await?;
    info!("Withdraw validated successfully");


    let transfer_token_fee= calculate_transfer_fee(&params.asset, params.amount.clone())?;
    let withdraw_amount = params.amount.clone() - transfer_token_fee.clone();
    debug!("Withdraw amount: {:?}", withdraw_amount);
     // ----------- Update logic here -------------
     UpdateLogic::update_user_data_withdraw(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    info!("User state updated successfully for withdraw asset");

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(), //amount to withdraw
        zero_nat_value(),
    )
    .await?;
    info!("Interest rates updated successfully");


    // Transfers the asset from the user to our backend cansiter
    match asset_transfer_from(
        ledger_canister_id,
        ic_cdk::api::id(),
        transfer_to_principal,
        withdraw_amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            info!("Asset transfer from backend to user executed successfully");
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            return Ok(new_balance);
        }
        Err(_) => {
            
            let supply_param = ExecuteSupplyParams {
                asset: params.asset.clone(),
                amount: params.amount.clone(),
                can_be_collateral: params.can_be_collateral,
            };

            UpdateLogic::update_user_data_supply(
                user_principal,
                &reserve_cache,
                supply_param,
                &mut reserve_data,
            )
            .await?;

            info!("Rollback successfully executed"); 
            error!("Error in asset transfer from backend to user"); 
            return Err(Error::ErrorBurnTokens);
        }
    }
}
