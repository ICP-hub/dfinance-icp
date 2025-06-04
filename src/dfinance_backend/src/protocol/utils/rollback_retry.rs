use candid::{Principal, Nat};
use ic_cdk::{query,update};

use crate::{
    constants::{constant_variables::constants::DEFAULT_MAX_RETRIES, errors::Error},
    declarations::{datatypes::RollbackRetryJob, structs::{RollbackParamsVariant, ExecuteRepayParams}},
    protocol::{
        libraries::{
            reserve::{self, get_reserve_data},
            update::UpdateLogic,
        },
        utils::log::{log_internal, LogLevel},
    },
    stable_storage::{
        state_handler::{insert_certified_value, mutate_state, read_state},
        storable::Candid,
    },
};
use crate::{debug, error, info};

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

pub fn get_pending_repay_amount()-> Nat {
    let user = ic_cdk::caller();
    info!(
        "get pending repay amount for user {}", user
    );
    //get total amount to repay for user
    let total_amount = read_state(|state| {
        state.pending_rollback.iter()
            .filter(|(_, job)| {
                job.user_principal == user
            })
            .map(|(_, job)| {
                match &job.rollback_params {
                    RollbackParamsVariant::RepayAsRollback(repay_params) => repay_params.amount.clone(),
                    _ => Nat::from(0u64), // Ignore other types
                }
            })
            .fold(Nat::from(0u64), |acc, x| acc + x)
    });
    return total_amount;
}