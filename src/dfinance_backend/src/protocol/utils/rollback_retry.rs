use candid::{Nat, Principal};
use ic_cdk::{query, update};

use crate::{
    constants::{constant_variables::constants::DEFAULT_MAX_RETRIES, errors::Error}, declarations::{
        datatypes::RollbackRetryJob,
        structs::RollbackParamsVariant,
    }, guards::access_control::guard_admin_only, protocol::{
        libraries::{
            reserve::{self, get_reserve_data},
            update::UpdateLogic,
        },
        utils::log::{log_internal, LogLevel},
    }, stable_storage::{
        state_handler::{insert_certified_value, mutate_state, read_state},
        storable::Candid,
    }
};
use crate::{debug, error, info};

/* * @title Rollback Retry Function
 * @dev This function retries all rollback jobs that are pending in the system.
 *      It processes each job, updating user data based on the rollback parameters.
 *      If a job exceeds the maximum retry limit, it is moved to critical rollback.
 * @returns Result<(), Error>
 */
pub async fn rollback_retry_all() -> Result<(), Error> {
    let current_time = ic_cdk::api::time();

    // Collect all rollback jobs.
    let rollback_jobs: Vec<(u64, RollbackRetryJob)> = mutate_state(|state| {
        state
            .pending_rollback
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });

    for (job_id, mut rollback_job) in rollback_jobs {
        rollback_job.retry_attempt += 1;
        if rollback_job.retry_attempt > DEFAULT_MAX_RETRIES {
            debug!(
                "[ROLLBACK RETRY BLOCKED] for user {} has reached max retries.",
                rollback_job.user_principal
            );
            mutate_state(|state| {
                let next_id = match state.critical_rollback.last_key_value() {
                    Some((max_id, _)) => max_id + 1,
                    None => 1,
                };
                state
                    .critical_rollback
                    .insert(next_id, Candid(rollback_job.clone()));
                state.pending_rollback.remove(&job_id);
            });
            continue;
        }

        rollback_job.last_attempt_at = current_time;

        let mut reserve_data_rollback = match get_reserve_data(rollback_job.asset_name.clone()) {
            Ok(rd) => rd,
            Err(e) => {
                let err_msg = format!(
                    "ROLLBACK: Failed to fetch ReserveData for asset {}: {:?}",
                    rollback_job.asset_name, e
                );
                rollback_job.last_error_message = Some(err_msg);
                mutate_state(|state| {
                    state
                        .pending_rollback
                        .insert(job_id, Candid(rollback_job.clone()));
                });
                continue;
            }
        };

        let reserve_cache_rollback = reserve::cache(&reserve_data_rollback);

        let execution_result = match rollback_job.rollback_params.clone() {
            RollbackParamsVariant::WithdrawAsRollback(withdraw_params) => {
                UpdateLogic::update_user_data_withdraw(
                    rollback_job.user_principal,
                    &reserve_cache_rollback,
                    withdraw_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::SupplyAsRollback(supply_params) => {
                UpdateLogic::update_user_data_supply(
                    rollback_job.user_principal,
                    &reserve_cache_rollback,
                    supply_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::RepayAsRollback(repay_params) => {
                UpdateLogic::update_user_data_repay(
                    rollback_job.user_principal,
                    &reserve_cache_rollback,
                    repay_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::BorrowAsRollback(borrow_params) => {
                UpdateLogic::update_user_data_borrow(
                    rollback_job.user_principal,
                    &reserve_cache_rollback,
                    borrow_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
        };

        if execution_result.is_ok() {
            info!(
                "[ROLLBACK RETRY SUCCESS] for user {} asset {} on attempt {}.",
                rollback_job.user_principal, rollback_job.asset_name, rollback_job.retry_attempt
            );

            let asset = rollback_job.asset_name.clone();

            mutate_state(|state| {
                state
                    .asset_index
                    .insert(asset.clone(), Candid(reserve_data_rollback.clone()));
                state.pending_rollback.remove(&job_id);
            });

            insert_certified_value(asset, reserve_data_rollback);
        } else {
            let error = execution_result.unwrap_err();
            error!(
                "[ROLLBACK FAIL] for user {} attempt {} failed. Error: {:?}",
                rollback_job.user_principal, rollback_job.retry_attempt, error
            );

            rollback_job.last_error_message = Some(format!("{:?}", error));
            mutate_state(|state| {
                state
                    .pending_rollback
                    .insert(job_id, Candid(rollback_job.clone()));
            });
        }
    }
    Ok(())
}

/**
 * @title Store Rollback Job
 * @dev This function stores a new rollback job in the pending rollback map.
 *      It initializes the job with the user principal, asset name, original operation type,
 *      rollback parameters, and the current error message.
 * @param user_principal The principal of the user who initiated the rollback.
 * @param asset_name The name of the asset for which the rollback is being requested.
 * @param original_op_type The type of the original operation that is being rolled back.
 * @param params_variant The parameters for the rollback operation.
 * @param current_error The error encountered during the original operation.
 * @returns Result<(), Error>
 */
pub fn store_rollback_job(
    user_principal: Principal,
    asset_name: String,
    original_op_type: String,
    params_variant: RollbackParamsVariant,
    current_error: Error,
) -> Result<(), Error> {
    let new_job = RollbackRetryJob {
        user_principal: user_principal,
        asset_name: asset_name.clone(),
        original_operation: original_op_type.clone(),
        rollback_params: params_variant,
        retry_attempt: 0,
        last_error_message: Some(format!("{:?}", current_error)),
        created_at: ic_cdk::api::time(),
        last_attempt_at: ic_cdk::api::time(),
    };

    mutate_state(|state| {
        let next_id = match state.pending_rollback.last_key_value() {
            Some((max_id, _)) => max_id + 1,
            None => 1,
        };
        state
            .pending_rollback
            .insert(next_id, Candid(new_job.clone()));
    });

    debug!(
        "[NEW JOB FOR ROLLBACK] . User: {}, Asset: {}. Initial Error: {:?}",
        new_job.user_principal, new_job.asset_name, new_job.last_error_message
    );
    Ok(())
}

/*
 * @title Admin Store Rollback Job
 * @dev This function allows an admin to store a rollback job with a specified amount.
 *      It checks if the amount is valid and updates the critical rollback map accordingly.
 * @param critical_rollback_id The ID of the critical rollback job.
 * @param amount The amount to be used for the rollback.
 * @returns Result<(), Error>
 */
#[update]
pub fn admin_store_rollback_job(
    critical_rollback_id: u64,
    amount: Nat,
) -> Result<(), Error> {
    guard_admin_only()?; 

    mutate_state(|state| {
        
        let critical_job_candid = state.critical_rollback.get(&critical_rollback_id)
            .ok_or_else(|| Error::InvalidRollbackId)?;

        let mut critical_job = critical_job_candid.0.clone();

        // Extract the amount from the rollback params
        let job_amount = match &critical_job.rollback_params {
            RollbackParamsVariant::WithdrawAsRollback(params) => params.amount.clone(),
            RollbackParamsVariant::SupplyAsRollback(params) => params.amount.clone(),
            RollbackParamsVariant::RepayAsRollback(params) => params.amount.clone(),
            RollbackParamsVariant::BorrowAsRollback(params) => params.amount.clone(),
        };

        if amount > job_amount {
            return Err(Error::InvalidAmount);
        }

        // Insert a new rollback retry job into the pending map
        let new_job = RollbackRetryJob {
            user_principal: critical_job.user_principal.clone(),
            asset_name: critical_job.asset_name.clone(),
            original_operation: critical_job.original_operation.clone(),
            rollback_params: critical_job.rollback_params.clone(),
            retry_attempt: 0,
            last_error_message: Some("Rollback retry failed".into()),
            created_at: ic_cdk::api::time(),
            last_attempt_at: ic_cdk::api::time(),
        };

        let next_id = match state.pending_rollback.last_key_value() {
            Some((max_id, _)) => max_id + 1,
            None => 1,
        };

        state.pending_rollback.insert(next_id, Candid(new_job.clone()));

        if amount == job_amount {
            // Full amount used: remove from critical rollback
            state.critical_rollback.remove(&critical_rollback_id);
        } else {
            // Partial amount used: subtract and update the remaining amount
            match &mut critical_job.rollback_params {
                RollbackParamsVariant::WithdrawAsRollback(params) => params.amount -= amount.clone(),
                RollbackParamsVariant::SupplyAsRollback(params) => params.amount -= amount.clone(),
                RollbackParamsVariant::RepayAsRollback(params) => params.amount -= amount.clone(),
                RollbackParamsVariant::BorrowAsRollback(params) => params.amount -= amount.clone(),
            }
            state.critical_rollback.insert(critical_rollback_id, Candid(critical_job));
        }

        debug!(
            "[NEW JOB FOR ROLLBACK] User: {}, Asset: {}, Amount: {}",
            new_job.user_principal, new_job.asset_name, amount
        );

        Ok(())
    })
}

/*
 * @title Get All Critical Rollbacks
 * @dev This function retrieves all critical rollback jobs from the state.
 *      It is intended for admin use only.
 * @returns Result<Vec<(u64, RollbackRetryJob)>, Error>
 */
#[query]
pub fn get_all_critical_rollbacks() -> Result<Vec<(u64, RollbackRetryJob)>, Error> {
    guard_admin_only()?;

    let result = read_state(|state| {
        state
            .critical_rollback
            .iter()
            .map(|(id, candid_wrapped_job)| (id, candid_wrapped_job.0.clone()))
            .collect::<Vec<_>>()
    });

    Ok(result)
}

/*
 * @title Delete Critical Rollback
 * @dev This function allows an admin to delete a critical rollback job by its ID.
 *      It checks if the ID exists and removes it from the critical rollback map.
 * @param critical_rollback_id The ID of the critical rollback job to be deleted.
 * @returns Result<(), Error>
 */
#[update]
pub fn delete_critical_rollback(critical_rollback_id: u64) -> Result<(), Error> {
    guard_admin_only()?; 

    mutate_state(|state| {
        match state.critical_rollback.remove(&critical_rollback_id) {
            Some(_) => {
                debug!(
                    "[CRITICAL ROLLBACK DELETED] ID: {}",
                    critical_rollback_id
                );
                Ok(())
            }
            None => Err(Error::InvalidRollbackId),
        }
    })
}


/**
 * @title Get Pending Repay Amount
 * @dev This function retrieves the total amount pending for repayment for the caller.
 *      It sums up all the amounts from pending rollback jobs that are of type RepayAsRollback.
 * @returns Nat The total amount pending for repayment.
 */
pub fn get_pending_repay_amount() -> Nat {
    let user = ic_cdk::caller();
    info!("get pending repay amount for user {}", user);
    //get total amount to repay for user
    let total_amount = read_state(|state| {
        state
            .pending_rollback
            .iter()
            .filter(|(_, job)| job.user_principal == user)
            .map(|(_, job)| {
                match &job.rollback_params {
                    RollbackParamsVariant::RepayAsRollback(repay_params) => {
                        repay_params.amount.clone()
                    }
                    _ => Nat::from(0u64), 
                }
            })
            .fold(Nat::from(0u64), |acc, x| acc + x)
    });
    return total_amount;
}
