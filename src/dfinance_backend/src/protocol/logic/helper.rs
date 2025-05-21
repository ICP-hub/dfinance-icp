use crate::{ constants::{constant_variables::constants::{DEFAULT_MAX_RETRIES, MAX_JOBS_PER_HEARTBEAT, RETRY_DELAY_SECONDS}, errors::Error}, debug,
    declarations::{ datatypes::{ReserveCache, ReserveData}, 
    structs::{
        OriginalFailedOperationType, RollbackJobStatus, RollbackParamsVariant, RollbackRetryJob
        },
    },
    error,
    protocol::libraries::{reserve::get_reserve_data, update::UpdateLogic},
    stable_storage::{
        state_handler::{insert_certified_value, mutate_state},
        storable::Candid,
    },
};
use crate::{ info, protocol::utils::log::{log_internal, LogLevel}};
use candid::Principal;
use std::{cell::RefCell, collections::BTreeMap};

// --- Global State for Retry Mechanism ---
thread_local! {
    pub static PENDING_ROLLBACK_JOBS: RefCell<BTreeMap<u64, RollbackRetryJob>> =
        RefCell::new(BTreeMap::new());

    pub static NEXT_BASIC_JOB_ID: RefCell<u64> = RefCell::new(0);

    pub static USER_ACTION_RESTRICTED: RefCell<BTreeMap<(Principal, String), String>> =
        RefCell::new(BTreeMap::new());
}


// --- Helper for Timestamp ---
pub fn current_timestamp_ns() -> u64 {
    ic_cdk::api::time()
}

pub fn calculate_next_attempt_timestamp(retry_attempt: u32) -> u64 {
    let current_time = current_timestamp_ns();
    let exponential_factor = 2_u64.pow(retry_attempt);

    let delay_seconds = RETRY_DELAY_SECONDS * exponential_factor;
    let delay_nanos = delay_seconds * 1_000_000_000; // Convert seconds to nanoseconds

    current_time + delay_nanos
}

// --- User Asset Restriction Helper Functions ---

pub fn apply_user_asset_restriction(
    user: Principal,
    asset: String,
    job_id: u64,
    operation_type: &OriginalFailedOperationType,
) {
    let reason = format!("Rollback for failed {:?} operation on asset {} is pending (Job ID: {}). Interactions restricted.", operation_type, asset, job_id);
    USER_ACTION_RESTRICTED.with(|r| {
        r.borrow_mut().insert((user, asset.clone()), reason.clone());
    });
    debug!(
        "[RESTRICTION APPLIED] User: {}, Asset: {}, Reason: {}",
        user, asset, reason
    );
}

pub fn remove_user_asset_restriction(user: Principal, asset: &String) {
    let removed = USER_ACTION_RESTRICTED.with(|r| r.borrow_mut().remove(&(user, asset.clone())));
    if removed.is_some() {
        debug!("[RESTRICTION REMOVED] User: {}, Asset: {}", user, asset);
    }
}

pub fn check_user_asset_restriction(user: Principal, asset: String) -> Result<(), Error> {
    if let Some(reason) =
        USER_ACTION_RESTRICTED.with(|r| r.borrow().get(&(user, asset.clone())).cloned())
    {
        error!(
            "[RESTRICTION CHECK] User: {}, Asset: {}. Restricted due to: {}",
            user, asset, reason
        );
        Err(Error::UserActionRestricted)
    } else {
        Ok(())
    }
}

#[ic_cdk_macros::heartbeat]
async fn rollback_retry() {
    let current_time = current_timestamp_ns();
    let mut jobs_to_process_ids: Vec<u64> = Vec::new();

    PENDING_ROLLBACK_JOBS.with(|jobs_ref| {
        for (job_id, job) in jobs_ref.borrow().iter() {
            if jobs_to_process_ids.len() >= MAX_JOBS_PER_HEARTBEAT {
                break; // Limit number of jobs processed per heartbeat
            }
            if job.status == RollbackJobStatus::PendingRetry
                && job.next_attempt_timestamp <= current_time
            {
                jobs_to_process_ids.push(*job_id);
            }
        }
    });

    if jobs_to_process_ids.is_empty() {
        return;
    }

    debug!(
        "[HEARTBEAT] Found {} due rollback jobs: {:?}",
        jobs_to_process_ids.len(),
        jobs_to_process_ids
    );

    for job_id in jobs_to_process_ids {
        let mut job_opt =
            PENDING_ROLLBACK_JOBS.with(|jobs_ref| jobs_ref.borrow().get(&job_id).cloned());

        if job_opt.is_none() {
            debug!(
                "[HEARTBEAT ERROR] Job ID {} was due but not found when processing. Skipping.",
                job_id
            );
            continue;
        }
        let mut job = job_opt.unwrap();

        debug!(
            "[HEARTBEAT PROCESS] Attempting Job ID: {}, Attempt #: {}",
            job.job_id,
            job.retry_attempt + 1
        );
        job.last_attempt_at = current_time;

        // --- Fetch current ReserveData for this attempt ---
        let mut reserve_data_rollback: ReserveData;
        match get_reserve_data(job.asset_name.clone()) {
            Ok(rd) => reserve_data_rollback = rd,
            Err(e) => {
                let err_msg = format!(
                    "Heartbeat Job {}: Failed to fetch ReserveData for asset {}: {:?}",
                    job_id, job.asset_name, e
                );
                debug!(
                    "Heartbeat Job {}: Failed to fetch ReserveData for asset {}: {:?}",
                    job_id, job.asset_name, e
                );
                job.last_error_message = Some(err_msg);
                job.status = RollbackJobStatus::RollbackFailed;
                PENDING_ROLLBACK_JOBS.with(|jobs_ref| {
                    jobs_ref.borrow_mut().insert(job_id, job);
                });
                continue; // Move to next job
            }
        }

        let reserve_cache_rollback = job.reserve_cache.clone();

        let execution_result: Result<(), Error> = match job.rollback_params.clone() {
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
                "[HEARTBEAT SUCCESS] Job ID {} for user {} asset {} succeeded on attempt {}.",
                job.job_id,
                job.user_principal,
                job.asset_name,
                job.retry_attempt + 1
            );

            let asset = job.asset_name.clone();
            let user_principal = job.user_principal;

            mutate_state(|s| {
                s.asset_index
                    .insert(asset.clone(), Candid(reserve_data_rollback.clone()));
            });
            insert_certified_value(asset.clone(), reserve_data_rollback);

            // Finalize job state to Completed and remove
            job.status = RollbackJobStatus::Completed;
            job.last_error_message = None;
            PENDING_ROLLBACK_JOBS.with(|jobs_ref| {
                jobs_ref.borrow_mut().remove(&job.job_id);
            });
            remove_user_asset_restriction(user_principal, &asset);
        } else {
            let error = execution_result.unwrap_err();
            ic_cdk::println!(
                "[HEARTBEAT FAIL] Job ID {} attempt {} failed. Error: {:?}",
                job.job_id,
                job.retry_attempt + 1,
                error
            );
            job.retry_attempt += 1;

            let current_error_for_scheduler = error; // The error from the failed execution

            let principal = Principal::anonymous();
            let asset_name = String::new();
            let op_type = job.original_operation.clone();
            let params_variant = job.rollback_params.clone();
            let reserve_cache = job.reserve_cache.clone();

            let _ = schedule_rollback(
                Some(job.job_id),
                &mut job,
                current_error_for_scheduler,
                principal,
                asset_name,
                op_type,
                params_variant,
                reserve_cache,
            )
            .await;
        }
    } // end for loop processing jobs
}

pub async fn schedule_rollback(
    job_id_option: Option<u64>,
    job_struct_for_update: &mut RollbackRetryJob,
    current_error: Error,
    user_principal: Principal,
    asset_name: String,
    original_op_type: OriginalFailedOperationType,
    params_variant: RollbackParamsVariant,
    reserve_cache: ReserveCache,
) -> Result<u64, Error> {
    let job_id: u64;

    if let Some(existing_job_id) = job_id_option {
        job_id = existing_job_id;
        job_struct_for_update.last_error_message = Some(format!("{:?}", current_error));
        job_struct_for_update.last_attempt_at = current_timestamp_ns();

        if job_struct_for_update.retry_attempt >= job_struct_for_update.max_retries {
            job_struct_for_update.status = RollbackJobStatus::RollbackFailed; // max retries done
            error!(
                "[JOB UPDATE] Job ID {} reached max retries. Escalated. Last Error: {:?}",
                job_id, current_error
            );
        } else {
            job_struct_for_update.status = RollbackJobStatus::PendingRetry;
            job_struct_for_update.next_attempt_timestamp =
                calculate_next_attempt_timestamp(job_struct_for_update.retry_attempt);
            debug!(
                "[JOB UPDATE] Job ID {} attempt failed, rescheduled for {}. Error: {:?}",
                job_id, job_struct_for_update.next_attempt_timestamp, current_error
            );
        }

        PENDING_ROLLBACK_JOBS.with(|jobs_ref| {
            jobs_ref
                .borrow_mut()
                .insert(job_id, job_struct_for_update.clone());
        });
    } else {
        // Creating new job

        job_id = NEXT_BASIC_JOB_ID.with(|id_counter| {
            let mut val = id_counter.borrow_mut();
            *val += 1;
            *val
        });

        let new_job = RollbackRetryJob {
            job_id,
            user_principal: user_principal,
            asset_name: asset_name.clone(),
            original_operation: original_op_type.clone(),
            rollback_params: params_variant,
            reserve_cache: reserve_cache,
            retry_attempt: 0, // First attempt will be in heartbeat
            max_retries: DEFAULT_MAX_RETRIES,
            last_error_message: Some(format!("{:?}", current_error)),
            status: RollbackJobStatus::PendingRetry, //same here
            created_at: current_timestamp_ns(),
            last_attempt_at: current_timestamp_ns(),
            next_attempt_timestamp: calculate_next_attempt_timestamp(0),
        };

        PENDING_ROLLBACK_JOBS.with(|jobs_ref| {
            jobs_ref.borrow_mut().insert(job_id, new_job.clone());
        });

        apply_user_asset_restriction(user_principal, asset_name, job_id, &original_op_type);

        debug!("[NEW JOB FOR HEARTBEAT] Job ID {}. User: {}, Asset: {}. Next attempt at: {}. Initial Error: {:?}",
            job_id, new_job.user_principal, new_job.asset_name, new_job.next_attempt_timestamp, new_job.last_error_message);
    }
    Ok(job_id)
}
