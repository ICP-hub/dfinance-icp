use crate::{
    constants::constant_variables::constants::DEFAULT_MAX_RETRIES,
    constants::errors::Error,
    declarations::structs::RollbackParamsVariant,
    declarations::datatypes::RollbackRetryJob,
    protocol::libraries::{reserve::{self, get_reserve_data}, update::UpdateLogic},
    stable_storage::{
        state_handler::{insert_certified_value, mutate_state},
        storable::Candid,
    },
    protocol::utils::log::{log_internal, LogLevel},
};
use crate::{debug, info, error};
use candid::Principal;


// --- Helper for Timestamp ---
pub fn current_timestamp_ns() -> u64 {
    ic_cdk::api::time()
}

pub async fn rollback_retry_all() -> Result<(), Error> {
    let current_time = current_timestamp_ns();

    // Collect all principals with rollback jobs
    let jobs: Vec<(Principal, RollbackRetryJob)> = mutate_state(|state| {
        state
            .pending_rollback
            .iter()
            .map(|(k, v)| (k.clone(), v.0.clone()))
            .collect()
    });

    for (user_principal, mut job) in jobs {

        job.retry_attempt += 1;
        if job.retry_attempt > DEFAULT_MAX_RETRIES {
            debug!(
                "[ROLLBACK RETRY BLOCKED] for user {} has reached max retries.",
                user_principal
            );
            continue;
        }

        debug!("[Rollback Retry PROCESS] Attempting for user {}", user_principal);
        job.last_attempt_at = current_time;

        let mut reserve_data_rollback = match get_reserve_data(job.asset_name.clone()) {
            Ok(rd) => rd,
            Err(e) => {
                let err_msg = format!(
                    "ROLLBACK: Failed to fetch ReserveData for asset {}: {:?}",
                    job.asset_name, e
                );
                job.last_error_message = Some(err_msg);
                mutate_state(|state| {
                    state.pending_rollback.insert(user_principal, Candid(job.clone()));
                });
                continue;
            }
        };

        let reserve_cache_rollback = reserve::cache(&reserve_data_rollback);

        let execution_result = match job.rollback_params.clone() {
            RollbackParamsVariant::WithdrawAsRollback(withdraw_params) => {
                UpdateLogic::update_user_data_withdraw(
                    job.user_principal,
                    &reserve_cache_rollback,
                    withdraw_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::SupplyAsRollback(supply_params) => {
                UpdateLogic::update_user_data_supply(
                    job.user_principal,
                    &reserve_cache_rollback,
                    supply_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::RepayAsRollback(repay_params) => {
                UpdateLogic::update_user_data_repay(
                    job.user_principal,
                    &reserve_cache_rollback,
                    repay_params,
                    &mut reserve_data_rollback,
                )
                .await
            }
            RollbackParamsVariant::BorrowAsRollback(borrow_params) => {
                UpdateLogic::update_user_data_borrow(
                    job.user_principal,
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
                job.user_principal,
                job.asset_name,
                job.retry_attempt
            );

            let asset = job.asset_name.clone();

            mutate_state(|state| {
                state
                    .asset_index
                    .insert(asset.clone(), Candid(reserve_data_rollback.clone()));
                state.pending_rollback.remove(&user_principal);
            });

            insert_certified_value(asset, reserve_data_rollback);
        } else {
            let error = execution_result.unwrap_err();
            error!(
                "[ROLLBACK FAIL] for user {} attempt {} failed. Error: {:?}",
                job.user_principal,
                job.retry_attempt,
                error
            );

            job.last_error_message = Some(format!("{:?}", error));
            mutate_state(|state| {
                state.pending_rollback.insert(user_principal, Candid(job.clone()));
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
        retry_attempt: 0, // First attempt will be in heartbeat
        last_error_message: Some(format!("{:?}", current_error)),
        created_at: current_timestamp_ns(),
        last_attempt_at: current_timestamp_ns(),
    };

    mutate_state(|state|{
        state.pending_rollback.insert(user_principal, Candid(new_job.clone()));
    });

    debug!("[NEW JOB FOR ROLLBACK] . User: {}, Asset: {}. Initial Error: {:?}",
         new_job.user_principal, new_job.asset_name, new_job.last_error_message);
    Ok(())
}