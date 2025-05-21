use crate::api::inter_canister::asset_transfer_from;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::structs::{ExecuteSupplyParams, ExecuteWithdrawParams, OriginalFailedOperationType, RollbackJobStatus, RollbackParamsVariant, RollbackRetryJob};
use crate::guards::api_limiter::request_limiter;
use crate::guards::locks_handler::CallerGuard;
use crate::protocol::libraries::reserve::{self, get_asset_principal, get_reserve_data};
use crate::protocol::libraries::update::UpdateLogic;
use crate::protocol::logic::helper::{
    apply_user_asset_restriction, check_user_asset_restriction, schedule_rollback
};
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::log::{log_internal, LogFlusher, LogLevel};
use crate::protocol::utils::price::{calculate_transfer_fee, update_token_price};
use crate::stable_storage::state_handler::{insert_certified_value, mutate_state};
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

    let user_principal = ic_cdk::caller();

    let _guard: CallerGuard = CallerGuard::lock_principal(user_principal.clone())?;
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(), // or whatever user_key you need
    };
    //valid param
    check_user_asset_restriction(user_principal.clone(), params.asset.clone())?;

    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

    let ledger_canister_id = get_asset_principal(params.asset.clone())?; //fetch param.asset canister id
    let platform_principal = ic_cdk::api::id(); //fetch backend canister id

    let amount_nat = params.amount.clone(); //check
                                            //fetch reserve data state for the asset

    let mut reserve_data = get_reserve_data(params.asset.clone())?;

    //initialize a asset reserve cache for temp changes
    let mut reserve_cache = reserve::cache(&reserve_data);
    info!("Reserve cache fetched successfully: {:?}", reserve_cache); //info
                                                                      //update the reserve cache state
    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    info!("Reserve state updated successfully"); //info

    //validat the supply request
    ValidationLogic::validate_supply(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        ledger_canister_id,
    )
    .await?;
    info!("Supply info validated successfully"); //info

    // updating the price cached in the state
    let _ = update_token_price(params.asset.clone()).await;
    //fetching the price of the asset in USD

    let transfer_token_fee = calculate_transfer_fee(&params.asset, params.amount.clone())?;
    //updating params.amount with the actual amount of tokens to be supplied
    params.amount = params.amount.clone() - transfer_token_fee.clone();
    UpdateLogic::update_user_data_supply(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    info!("udpate user data supply called successfully"); //info
    let liq_added = params.amount.clone();
    let liq_taken = zero_nat_value();
    //Updating the APYs
    reserve::update_interest_rates(&mut reserve_data, &mut reserve_cache, liq_taken, liq_added)
        .await?;

    info!("Interest rates updated successfully");
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
            info!("Asset transfer from user to backend canister executed successfully");
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            Ok(new_balance)
        }
        Err(_) => {
            error!(
                    "Error in asset transfer from user to backend canister for supply (Asset: {}, User: {}). Initiating rollback.",
                    params.asset, user_principal
                );
            let withdraw_param = ExecuteWithdrawParams {
                asset: params.asset.clone(),
                is_collateral: params.is_collateral,
                amount: params.amount.clone(),
            };

            match UpdateLogic::update_user_data_withdraw(
                user_principal,
                &reserve_cache.clone(),
                withdraw_param.clone(),
                &mut reserve_data.clone(),
            )
            .await
            {
                Ok(_) => {
                    info!("Rollback successfully executed");
                    error!("Error in asset transfer from user to backend canister");
                    return Err(Error::ErrorSupplyToken);
                }
                Err(first_rollback_failed_error) => {
                    // --- Direct Rollback Failed: Schedule for Retry ---
                    error!(
                            "Direct rollback (WithdrawLogic for failed Supply) FAILED for User: {}, Asset: {}: {:?}. Scheduling retry job.",
                            user_principal, params.asset, first_rollback_failed_error
                        );
                    let withdraw_param = ExecuteWithdrawParams {
                        asset: params.asset.clone(),
                        is_collateral: params.is_collateral,
                        amount: params.amount.clone(),
                    };

                    let rollback_params_variant =
                        RollbackParamsVariant::WithdrawAsRollback(withdraw_param.clone());

                    let mut job_params = RollbackRetryJob {
                        job_id: 0,
                        user_principal,
                        asset_name: params.asset.clone(),
                        original_operation: OriginalFailedOperationType::Supply,
                        rollback_params: rollback_params_variant.clone(),
                        reserve_cache: reserve_cache.clone(),
                        retry_attempt: 0,
                        max_retries: 0,
                        last_error_message: None,
                        status: RollbackJobStatus::RetryScheduled,
                        created_at: 0,
                        last_attempt_at: 0,
                        next_attempt_timestamp: 0,
                    };

                    match schedule_rollback(
                        None,
                        &mut job_params,
                        first_rollback_failed_error.clone(),
                        user_principal,
                        params.asset.clone(),
                        OriginalFailedOperationType::Supply,
                        rollback_params_variant,
                        reserve_cache.clone(),
                    )
                    .await
                    {
                        Ok(job_id) => {
                        info!(
                            "Rollback retry job {} scheduled for failed supply (User: {}, Asset: {}). User restricted.",
                            job_id, user_principal, params.asset
                        );
                        return Err(Error::RollbackPending); // Indicate primary op failed, rollback is pending

                        }
                        Err(schedule_err) => {
                        error!(
                            "CRITICAL: Failed to schedule rollback retry job for User: {}, Asset: {}: {:?}. Initial error: {:?}",
                            user_principal, params.asset, schedule_err, first_rollback_failed_error
                            );

                        apply_user_asset_restriction(
                            user_principal,
                            params.asset.clone(),
                            0,
                            &OriginalFailedOperationType::Supply,
                            );
                        return Err(Error::RollbackFailedAdminActionRequired);
                        }
                    }
                }
            }
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

    let user_principal = ic_cdk::caller();

    let _guard = CallerGuard::lock_principal(user_principal.clone())?;
    let _log_flusher = LogFlusher {
        user_key: user_principal.to_text(),
    };

    check_user_asset_restriction(user_principal.clone(), params.asset.clone())?;

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

    if let Err(_) = update_token_price(params.asset.clone()).await {}

    let transfer_token_fee = calculate_transfer_fee(&params.asset, params.amount.clone())?;
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
        // Err(_) => {
            // let supply_param = ExecuteSupplyParams {
            //     asset: params.asset.clone(),
            //     amount: params.amount.clone(),
            //     is_collateral: params.is_collateral,
            // };

            // UpdateLogic::update_user_data_supply(
            //     user_principal,
            //     &reserve_cache,
            //     supply_param,
            //     &mut reserve_data,
            // )
            // .await?;

            // info!("Rollback successfully executed"); //info
            // error!("Error in asset transfer from backend to user"); //error
            // return Err(Error::ErrorBurnTokens);
            Err(_) => {
                error!(
                        "Error in asset transfer from user to backend canister for supply (Asset: {}, User: {}). Initiating rollback.",
                        params.asset, user_principal
                    );
                let supply_param = ExecuteSupplyParams {
                    asset: params.asset.clone(),
                    amount: params.amount.clone(),
                    is_collateral: params.is_collateral,
                };

                match UpdateLogic::update_user_data_supply(
                    user_principal,
                    &reserve_cache.clone(),
                    supply_param.clone(),
                    &mut reserve_data.clone(),
                )
                .await
                {
                    Ok(_) => {
                        info!("Rollback successfully executed");
                        error!("Error in asset transfer from user to backend canister");
                        return Err(Error::ErrorSupplyToken);
                    }
                    Err(first_rollback_failed_error) => {
                        // --- Direct Rollback Failed: Schedule for Retry ---
                    error!(
                                "Direct rollback (SupplyLogic for failed Withdrawal) FAILED for User: {}, Asset: {}: {:?}. Scheduling retry job.",
                                user_principal, params.asset, first_rollback_failed_error
                                );
                    let supply_param = ExecuteSupplyParams {
                    asset: params.asset.clone(),
                    amount: params.amount.clone(),
                    is_collateral: params.is_collateral,
                    };

                    let rollback_params_variant =
                            RollbackParamsVariant::SupplyAsRollback(supply_param.clone());

                    let mut job_params = RollbackRetryJob {
                            job_id: 0,
                            user_principal,
                            asset_name: params.asset.clone(),
                            original_operation: OriginalFailedOperationType::Withdraw,
                            rollback_params: rollback_params_variant.clone(),
                            reserve_cache: reserve_cache.clone(),
                            retry_attempt: 0,
                            max_retries: 0,
                            last_error_message: None,
                            status: RollbackJobStatus::RetryScheduled,
                            created_at: 0,
                            last_attempt_at: 0,
                            next_attempt_timestamp: 0,
                        };

                        match schedule_rollback(
                            None,
                            &mut job_params,
                            first_rollback_failed_error.clone(),
                            user_principal,
                            params.asset.clone(),
                            OriginalFailedOperationType::Withdraw,
                            rollback_params_variant,
                            reserve_cache.clone(),
                        )
                        .await
                        {
                            Ok(job_id) => {
                                info!(
                            "Rollback retry job {} scheduled for failed Withdrawal (User: {}, Asset: {}). User restricted.",
                            job_id, user_principal, params.asset
                            );
                                return Err(Error::RollbackPending); // Indicate primary op failed, rollback is pending
                            }
                            Err(schedule_err) => {
                                error!(
                            "CRITICAL: Failed to schedule rollback retry job for User: {}, Asset: {}: {:?}. Initial error: {:?}",
                            user_principal, params.asset, schedule_err, first_rollback_failed_error
                            );

                                apply_user_asset_restriction(
                                    user_principal,
                                    params.asset.clone(),
                                    0,
                                    &OriginalFailedOperationType::Withdraw,
                                );
                                return Err(Error::RollbackFailedAdminActionRequired);
                            }
                        }
                    }
                }
        }
    }
}
