use crate::api::inter_canister::{asset_transfer_from, get_transfer_fee};
use crate::constants::constant_variables::constants::INITIAL_DEBT_INDEX;
use crate::constants::data_types::zero_nat_value;
use crate::constants::errors::Error;
use crate::constants::validators::{validate_asset_name, validate_zero_value};
use crate::declarations::structs::{ExecuteBorrowParams, ExecuteRepayParams, OriginalFailedOperationType, RollbackJobStatus, RollbackParamsVariant, RollbackRetryJob};
use crate::guards::api_limiter::request_limiter;
use crate::guards::locks_handler::CallerGuard;
use crate::protocol::libraries::reserve::{self, get_asset_principal, get_reserve_data};
use crate::protocol::libraries::update::UpdateLogic;
use crate::protocol::libraries::user::get_asset_debt;
use crate::protocol::logic::helper::{
    apply_user_asset_restriction, check_user_asset_restriction, schedule_rollback
};
use crate::protocol::logic::validation::ValidationLogic;
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::protocol::utils::price::{
 calculate_transfer_fee, update_token_price
};
use crate::stable_storage::state_handler::*;
use crate::stable_storage::storable::Candid;
use crate::{debug, error, info};
use candid::{Nat, Principal};
use ic_cdk::update;

/*
-------------------------------------
----------- BORROW LOGIC ------------
-------------------------------------
 */

/**
 * @functionality This function allows users to borrow a specified amount of an asset. It performs
 * a series of checks, validations, state updates, and transfers:
 * - Validates the asset and amount parameters.
 * - Ensures that the caller is authenticated and not anonymous.
 * - Acquires a lock to prevent concurrent operations on the same user.
 * - Validates the borrowing request and updates relevant data (reserve and user state).
 * - Transfers the borrowed amount to the user's wallet.
 * - Implements a rollback mechanism in case of any failure during the transaction.
 *
 * @title Execute Borrow Function
 *
 * @notice Allows users to borrow a specified amount of assets while performing necessary checks,
 *         state updates, and validations. The function:
 *         - Validates input parameters.
 *         - Checks the caller's identity.
 *         - Acquires a lock.
 *         - Validates the borrow request.
 *         - Updates user and reserve data.
 *         - Transfers the asset to the user.
 *         - Rolls back changes if any operation fails.
 *
 * @dev The function follows a structured workflow:
 *      1. **Input validation**: Ensures a valid asset name, a positive amount, and a known caller.
 *      2. **Lock acquisition**: Ensures only one operation can proceed at a time for a user.
 *      3. **State mutation**: Updates reserve data and the user's profile in the canister's state.
 *      4. **Borrow validation**: Verifies that the request complies with platform rules (e.g., limits, availability).
 *      5. **Asset transfer**: Moves the requested amount from the platform's reserve to the user's wallet.
 *      6. **Rollback mechanism**: If any step fails, reverts all changes and releases resources.
 *
 * @param params The parameters required to execute the borrow operation:
 *               - `asset`: The name of the asset to be borrowed.
 *               - `amount`: The amount of the asset to be borrowed.
 *
 * @return Result<Nat, Error> The user's new balance after a successful transaction or an error code if the operation fails.
 */
#[update]
pub async fn execute_borrow(params: ExecuteBorrowParams) -> Result<Nat, Error> {
    request_limiter()?;

    let user_principal = ic_cdk::caller();
    debug!("User principal: {:?}", user_principal.to_text());
    let _guard = CallerGuard::lock_principal(user_principal.clone())?;

    check_user_asset_restriction(user_principal.clone(), params.asset.clone())?;

    // input validations

    validate_asset_name(&params.asset)?;
    validate_zero_value(&params.amount)?;

    let borrow_amount = params.amount.clone();
    debug!("borrow amount = {}", borrow_amount);

    let ledger_canister_id = get_asset_principal(params.asset.clone())?;

    let platform_principal = ic_cdk::api::id();

    let mut reserve_data = get_reserve_data(params.asset.clone())?;

    if reserve_data.asset_borrow == zero_nat_value() {
        reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }

    let mut reserve_cache = reserve::cache(&reserve_data);
    info!("Reserve cache fetched successfully: {:?}", reserve_cache);

    // Updates the liquidity and borrow index
    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    info!("Reserve state updated successfully");

    ValidationLogic::validate_borrow(&reserve_data, params.amount.clone(), ledger_canister_id)
        .await?;

    let _ = update_token_price(params.asset.clone()).await;

    let transfer_token_fee = calculate_transfer_fee(&params.asset, params.amount.clone())?;
    let borrow_amount = params.amount.clone() - transfer_token_fee.clone();
    debug!("borrow amount = {}", borrow_amount);

    // ----------- Update logic here -------------
    UpdateLogic::update_user_data_borrow(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    info!("User data updated successfully");

    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
    debug!("Current debt: {:?}", reserve_cache.curr_debt);

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        params.amount.clone(),
        zero_nat_value(),
    )
    .await?;
    info!("Interest rates updated successfully");

    debug!("updated Reserve data: {:?}", reserve_data);

    // Transfers borrow amount from the pool to the user
    match asset_transfer_from(
        ledger_canister_id,
        platform_principal,
        user_principal,
        borrow_amount.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            info!(
                "Asset transfer from backend to user executed successfully. New balance: {:?}",
                new_balance
            );
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            Ok(new_balance)
        }
        // Err(_) => {
        //     error!("error in asset transfer from backend to user");
        //     //Rollback user state
        // let repay_param = ExecuteRepayParams {
        //     asset: params.asset.clone(),
        //     amount: params.amount.clone(),
        //     on_behalf_of: None,
        // };

        //     UpdateLogic::update_user_data_repay(
        //         user_principal,
        //         &reserve_cache,
        //         repay_param,
        //         &mut reserve_data,
        //     )
        //     .await?;
        //     info!("Rollback user and reserve state executed successfully");
        //     return Err(Error::ErrorMintDebtTokens);
        // }
        Err(_) => {
            error!(
        "Error in asset transfer from user to backend canister for supply (Asset: {}, User: {}). Initiating rollback.",
        params.asset, user_principal
    );
            let repay_param = ExecuteRepayParams {
                asset: params.asset.clone(),
                amount: params.amount.clone(),
                on_behalf_of: None,
            };

            match UpdateLogic::update_user_data_repay(
                user_principal,
                &reserve_cache.clone(),
                repay_param.clone(),
                &mut reserve_data.clone(),
            )
            .await
            {
                Ok(_) => {
                    info!("Rollback successfully executed");
                    error!("Error in asset transfer from user to backend canister");
                    return Err(Error::ErrorMintDebtTokens);
                }
                Err(first_rollback_failed_error) => {
                    // --- Direct Rollback Failed: Schedule for Retry ---
                    error!(
                "Direct rollback (WithdrawLogic for failed Repay) FAILED for User: {}, Asset: {}: {:?}. Scheduling retry job.",
                user_principal, params.asset, first_rollback_failed_error
            );
                    let repay_param = ExecuteRepayParams {
                        asset: params.asset.clone(),
                        amount: params.amount.clone(),
                        on_behalf_of: None,
                    };

                    let repay_rollback =
                        RollbackParamsVariant::RepayAsRollback(repay_param.clone());

                    let mut job_params = RollbackRetryJob {
                        job_id: 0,
                        user_principal,
                        asset_name: params.asset.clone(),
                        original_operation: OriginalFailedOperationType::Repay,
                        rollback_params: repay_rollback.clone(),
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
                        OriginalFailedOperationType::Repay,
                        repay_rollback,
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
                                &OriginalFailedOperationType::Repay,
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
------------ REPAY LOGIC ------------
-------------------------------------
 */
/**
 * @notice Executes the repay operation for a given asset and amount.
 *         This function validates parameters, checks asset conditions,
 *         and updates the user's debt position in the reserve system.
 *         It ensures that only valid principals can perform the operation
 *         and manages locking to prevent race conditions.
 *         If the operation fails at any step, the state is rolled back to maintain consistency.
 *
 * @param params The parameters required for the repay operation:
 *               - `asset`: The name of the asset to be repaid (string).
 *               - `amount`: The amount of the asset to repay (Nat).
 *               - `on_behalf_of`: The principal ID of the user being repaid on behalf of (Optional, Principal).
 *
 * @return Result<Nat, Error> The updated balance (Nat) after successful repayment,
 *         or an error (Error) indicating why the repayment failed.
 *
 * @dev The function follows these steps:
 *      - Validates the input parameters (asset, amount, on-behalf-of principal).
 *      - Acquires a lock to prevent re-entrancy during the repayment process.
 *      - Fetches reserve data and ensures the repayment can proceed.
 *      - Updates the user’s debt position in the reserve system.
 *      - Transfers the tokens from the user or liquidator to the platform canister.
 *      - Rolls back changes if any step fails to maintain system consistency.
 *
 * @functionality:
 *      - Validates input parameters like asset name, amount, and optional on-behalf-of principal.
 *      - Handles locking mechanism to prevent re-entrancy during repayment.
 *      - Fetches and updates reserve data to reflect the repayment.
 *      - Transfers assets from user or liquidator and ensures consistency.
 *      - Rolls back any changes if any step fails during the repayment process.
 */
pub async fn repay(mut params: ExecuteRepayParams) -> Result<Nat, Error> {
    let (user_principal, liquidator_principal) =
        if let Some(on_behalf_of) = params.on_behalf_of.clone() {
            let user_principal = on_behalf_of;
            (user_principal, Some(ic_cdk::caller()))
        } else {
            (ic_cdk::caller(), None)
        };

    check_user_asset_restriction(user_principal.clone(), params.asset.clone())?;

    let ledger_canister_id = get_asset_principal(params.asset.clone())?;
    let ledger_fee = get_transfer_fee(ledger_canister_id).await?;
    let platform_principal = ic_cdk::api::id();

    let repay_amount = params.amount.clone();
    debug!("Repay amount: {:?}", repay_amount);

    // Determines the sender principal
    let transfer_from_principal = if let Some(liquidator) = liquidator_principal {
        liquidator
    } else {
        user_principal
    };

    let mut reserve_data = get_reserve_data(params.asset.clone())?;

    if reserve_data.debt_index == zero_nat_value() {
        reserve_data.debt_index = Nat::from(INITIAL_DEBT_INDEX);
    }

    // Fetches the reserve logic cache having the current values
    let mut reserve_cache = reserve::cache(&reserve_data);
    info!("Reserve cache fetched successfully: {:?}", reserve_cache);

    reserve::update_state(&mut reserve_data, &mut reserve_cache)?;
    info!("Reserve state updated successfully");

    // Validates repay using the reserve_data
    ValidationLogic::validate_repay(
        &reserve_data,
        params.amount.clone(),
        user_principal,
        liquidator_principal,
        ledger_canister_id,
    )
    .await?;
    info!("Repay validated successfully");

    let _ = update_token_price(params.asset.clone()).await;
    let transfer_token_fee = calculate_transfer_fee(&params.asset, params.amount.clone())?;
    params.amount = params.amount - (transfer_token_fee.clone() + ledger_fee.clone());

    let user_current_debt: Nat = get_asset_debt(params.asset.clone(), Some(user_principal)).await?;

    debug!("User current debt: {:?}", user_current_debt);
    if user_current_debt == zero_nat_value() {
        error!("User has no debt to repay");
        return Err(Error::NoDebtToRepay);
    }

    if params.amount.clone() > user_current_debt {
        error!("Repay amount exceeds current debt");
        return Err(Error::RepayMoreThanDebt);
    }

    // ----------- Update logic here -------------
    UpdateLogic::update_user_data_repay(
        user_principal,
        &reserve_cache,
        params.clone(),
        &mut reserve_data,
    )
    .await?;
    info!("User data updated successfully");

    reserve_cache.curr_debt = reserve_data.asset_borrow.clone();
    debug!("Current debt: {:?}", reserve_cache.curr_debt);

    reserve::update_interest_rates(
        &mut reserve_data,
        &mut reserve_cache,
        zero_nat_value(),
        params.amount.clone(),
    )
    .await?;
    info!("Interest rates updated successfully");

    debug!("Updated Reserve data: {:?}", reserve_data);

    // Transfers the asset from the user to our backend canister
    match asset_transfer_from(
        ledger_canister_id,
        transfer_from_principal,
        platform_principal,
        repay_amount.clone() - ledger_fee.clone(),
    )
    .await
    {
        Ok(new_balance) => {
            info!(
                "Asset transfer from user to backend executed successfully, new balance: {:?}",
                new_balance
            );
            mutate_state(|state| {
                state
                    .asset_index
                    .insert(params.asset.clone(), Candid(reserve_data.clone()))
            });
            Ok(new_balance)
        }
        // Err(_) => {
        //     error!("Error in asset transfer from user to backend");
        //     //Rollback user state
        // let borrow_param = ExecuteBorrowParams {
        //     asset: params.asset.clone(),
        //     amount: params.amount.clone(),
        // };

        //     UpdateLogic::update_user_data_borrow(
        //         user_principal,
        //         &reserve_cache,
        //         borrow_param,
        //         &mut reserve_data,
        //     )
        //     .await?;
        //     info!("Rollback user and reserve state executed successfully");
        //     return Err(Error::ErrorBurnDebtTokens);
        // }
        Err(_) => {
            error!(
        "Error in asset transfer from user to backend canister for supply (Asset: {}, User: {}). Initiating rollback.",
        params.asset, user_principal
    );
            let borrow_param = ExecuteBorrowParams {
                asset: params.asset.clone(),
                amount: params.amount.clone(),
            };

            match UpdateLogic::update_user_data_borrow(
                user_principal,
                &reserve_cache.clone(),
                borrow_param.clone(),
                &mut reserve_data.clone(),
            )
            .await
            {
                Ok(_) => {
                    info!("Rollback successfully executed");
                    error!("Error in asset transfer from user to backend canister");
                    return Err(Error::ErrorBurnDebtTokens);
                }
                Err(first_rollback_failed_error) => {
                    // --- Direct Rollback Failed: Schedule for Retry ---
                    error!(
                "Direct rollback (WithdrawLogic for failed Borrow) FAILED for User: {}, Asset: {}: {:?}. Scheduling retry job.",
                user_principal, params.asset, first_rollback_failed_error
            );
                    let borrow_param = ExecuteBorrowParams {
                        asset: params.asset.clone(),
                        amount: params.amount.clone(),
                    };

                    let borrow_rollback =
                        RollbackParamsVariant::BorrowAsRollback(borrow_param.clone());

                    let mut job_params = RollbackRetryJob {
                        job_id: 0,
                        user_principal,
                        asset_name: params.asset.clone(),
                        original_operation: OriginalFailedOperationType::Borrow,
                        rollback_params: borrow_rollback.clone(),
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
                        OriginalFailedOperationType::Repay,
                        borrow_rollback,
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
                                &OriginalFailedOperationType::Borrow,
                            );
                            return Err(Error::RollbackFailedAdminActionRequired);
                        }
                    }
                }
            }
        }
    }
}
