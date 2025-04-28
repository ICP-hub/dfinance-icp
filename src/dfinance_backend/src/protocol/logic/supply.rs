use crate::api::inter_canister::asset_transfer_from;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::interest_variables::constants::TOKEN_TRANSFER_FEE;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::stable_storage::storable::Candid;
use crate::declarations::structs::{ExecuteSupplyParams, ExecuteWithdrawParams};
use crate::guards::access_control::guard_prevent_anonymous;
use crate::protocol::libraries::reserve::{self};
use crate::protocol::libraries::update::UpdateLogic;
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::math_utils::ScalingMath;
use crate::protocol::utils::price::update_token_price;
use crate::api::query::{get_cached_exchange_rate, reserve_ledger_canister_id};
use candid::{Nat, Principal};
use ic_cdk::update;
use crate::guards::locks_handler::CallerGuard;
use crate::guards::api_limiter::request_limiter;

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
 *      1. Validates input parameters (asset name, amount, and caller's identity).
 *      2. Acquires a lock to ensure only one operation per user at a time.
 *      3. Updates the reserve data and user profile state.
 *      4. Validates the supply request against platform rules (e.g., limits, reserves).
 *      5. Transfers the asset from the user to the platform.
 *      6. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the supply operation:
 *               - `asset`: The name of the asset being supplied.
 *               - `amount`: The amount of the asset being supplied.
 *               - `is_collateral`: Flag indicating if the asset is collateral.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_supply(mut params: ExecuteSupplyParams) -> Result<Nat, Error> {
    request_limiter()?;
    // prevent anonymous call
    guard_prevent_anonymous()?;
    let user_principal = ic_cdk::caller();
    //todo- add comment here
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;
    //valid params
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;
    //fetch param.asset canister id
    let ledger_canister_id = reserve_ledger_canister_id(params.asset.clone())?;
    //fetch backend canister id
    let platform_principal = ic_cdk::api::id();
    

    let amount_nat = params.amount.clone(); //check
    //fetch reserve data for the asset
    let mut reserve_data = mutate_state(|state| {
        state
            .asset_index
            .get(&params.asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
            .ok_or_else(|| Error::NoReserveDataFound)
    })?;

    //initialize a asset reserve cache for temp changes
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache); //info
    //update the reserve cache state
    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    //validat the supply request
    ValidationLogic::validate_supply(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await?;

    ic_cdk::println!("Supply validated successfully");//info

    // updating the price cached in the state
    let _ = update_token_price(params.asset.clone()).await;
    //fetching the price of the asset in USD
    let asset_price = get_cached_exchange_rate(params.asset.clone())?;
    
    //TODO : 96 to 104 can be common
    //Calculating Transfer fee in usd
    let transfer_token_fee = Nat::from(TOKEN_TRANSFER_FEE).scaled_div(asset_price);
    ic_cdk::println!("Transfer token fee: {:?}", transfer_token_fee); //debug
    
    if params.amount.clone() < transfer_token_fee {
        ic_cdk::println!("Amount is less than the transfer token fee"); //error
        return Err(Error::FeeExceedsAmount);
    }
    //updating params.amount with the actual amount of tokens to be supplied
    params.amount = params.amount.clone() - transfer_token_fee.clone();
    

    let liq_added = params.amount.clone();
    let liq_taken = zero_nat_value();
    //Updating the APYs
    reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, liq_taken, liq_added)
        .await?;

    ic_cdk::println!("Interest rates updated successfully"); //info  
    //intializing and updating user state and minting the dtokens to the user
    UpdateLogic::update_user_data_supply(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    ic_cdk::println!("Dtoken Mint and user state updated successfully for supplied asset"); //info
    //updating the reserve data in the state
    mutate_state(|state| {
        state
            .asset_index
            .insert(params.asset.clone(), Candid(reserve_data.clone()))
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
            ic_cdk::println!("Error in asset transfer from user to backend canister"); //error
            //Rollback user state and burning dtokens
            //NOTE: transfer fee is not returned to the user
            //TODO: ask from vinayak sir whether to keep the transfer fee or return it back to the user 
            let withdraw_param = ExecuteWithdrawParams {
                asset: params.asset.clone(),
                is_collateral: params.is_collateral,
                on_behalf_of: None,
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
            ic_cdk::println!("Dtoken Burn and user state reverted successfully for supplied asset"); //info
            //revert the reserve data changes 
            //TODO: check if we need to revert the reserve data changes
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            ic_cdk::println!("Rollback successfull");//info

            //return the error
            return Err(Error::ErrorMintTokens); //TODO: jyotirmay change the error message it should be ErrorSupplyTokens
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
 *      1. Validates input parameters (asset name, amount, and caller's identity).
 *      2. Acquires a lock to ensure only one operation per user at a time.
 *      3. Updates the reserve data and user profile state.
 *      4. Validates the withdrawal request against platform rules (e.g., limits, available assets).
 *      5. Transfers the requested asset from the platform to the user or liquidator.
 *      6. Rolls back any changes and releases resources if an error occurs.
 *
 * @param params Parameters for the withdraw operation:
 *               - `asset`: The name of the asset being withdrawn.
 *               - `amount`: The amount of the asset being withdrawn.
 *               - `is_collateral`: Flag indicating if the asset is collateral.
 *               - `on_behalf_of`: Optional principal requesting the withdrawal on behalf of another user.
 *
 * @return Result<Nat, Error> Returns the user's new balance after transfer or an error if the operation fails.
 */
#[update]
pub async fn execute_withdraw(params: ExecuteWithdrawParams) -> Result<Nat, Error> {
    request_limiter()?;
    // prevent anonymous for caller
    guard_prevent_anonymous()?;

    // prevent anonymous on behalf of
    if params.on_behalf_of == Some(Principal::anonymous()) {
        return Err(Error::AnonymousPrincipal);
    }

    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            let liquidator_principal = ic_cdk::caller();
            (user_principal, Some(liquidator_principal))
        } else {
            let user_principal = ic_cdk::caller();
            (user_principal, None)
        };

    let _guard = CallerGuard::lock_principal(user_principal.clone())?;
    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;
    let ledger_canister_id = reserve_ledger_canister_id(params.asset.clone())?;

    let transfer_to_principal: Principal = liquidator_principal.unwrap_or(user_principal);

    let mut reserve_data = read_state(|state| {
        state
            .asset_index
            .get(&params.asset.to_string().clone())
            .map(|reserve| reserve.0.clone())
    })
    .ok_or_else(|| Error::NoReserveDataFound)?;

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    ic_cdk::println!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;

    ic_cdk::println!("Reserve state updated successfully");

    ValidationLogic::validate_withdraw(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
        
    )
    .await?;

    let withdraw_amount = params.amount.clone();

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(), //amount to withdraw
        zero_nat_value(),
    )
    .await?;

    // ----------- Update logic here -------------
    UpdateLogic::update_user_data_withdraw(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;

    mutate_state(|state| {
        state
            .asset_index
            .insert(params.asset.clone(), Candid(reserve_data.clone()))
    });

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
            println!("Asset transfer from backend to user executed successfully");
            return Ok(new_balance);
        }
        Err(_) => {
            let supply_param = ExecuteSupplyParams {
                asset: params.asset.clone(),
                amount: params.amount.clone(),
                is_collateral: params.is_collateral,
            };

            UpdateLogic::update_user_data_supply(
                user_principal,
                &reserve_cache,
                supply_param,
                &mut reserve_data,
            )
            .await?;

            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            return Err(Error::ErrorBurnTokens);
        }
    }
}
