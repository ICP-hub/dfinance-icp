use crate::constants::constant_variables::constants::FOUR_HOUR;
use crate::constants::errors::Error;
use crate::declarations::datatypes::{
    AssetInfo, FaucetReserves, ReserveData, UserData, InitArgs
};

#[cfg(feature = "testnet")]
use declarations::structs::Challenge;
use candid::{Nat,Principal};
use guards::access_control::guard_admin_only;
use ic_cdk::{init, update};
use ic_cdk_macros::export_candid;
#[cfg(feature = "testnet")]
use protocol::logic::faucet::reset_faucet_usage;
use protocol::utils::log::{clear_temp_log, init_logging};
mod api;
mod constants;
pub mod declarations;
mod dynamic_canister;
mod guards;
mod protocol;

mod stable_storage;
use crate::declarations::structs::{
    ExecuteBorrowParams, ExecuteLiquidationParams, ExecuteRepayParams, ExecuteSupplyParams,
    ExecuteWithdrawParams, UserAccountData, AssetData, CycleAlert, TokenAlert
};
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::stable_storage::state_handler::mutate_state;
use crate::stable_storage::storable::Candid;
#[cfg(feature = "testnet")]
use crate::protocol::logic::faucet::get_all_faucet;
use constants::constant_variables::constants::{ADMIN, MAIN_CONTROLLER, SECONDS_PER_DAY, SECOND_PER_DAY};
use ic_cdk_timers::{set_timer, set_timer_interval};
use std::time::Duration;
use crate::declarations::datatypes::Certificate;
use crate::protocol::utils::rollback_retry::rollback_retry_all;

/*
 * @title Initialization Function
 * @dev Initializes the contract by setting the controller and scheduling a task.
 * @param args The principal ID of the controller.
 * @returns None
 *
 * @functionality Initialize Contract and Schedule Task
 */

#[init]
pub fn init(args: Principal) {
    // This controller ID will be used for setting the controller
    // of other canisters (e.g., asset reserves) dynamically created
    // by the admin during initialization.
    mutate_state(|state| {
        // state.access_control.insert(args, Candid(ADMIN.to_string()));
        state.access_control.insert(args, Candid(vec![ADMIN.to_string()]));
        state.meta_data.insert(
            MAIN_CONTROLLER.to_string(),
            Candid(InitArgs {
                controller_id: args,
            }),
        );
    });
    #[cfg(feature = "mainnet")]
    init_logging(true); //info, warn, error
    #[cfg(feature = "testnet")]
    init_logging(false);

    schedule_temp_log_cleanup();
    schedule_rollback_retry();
}
/* @title Schedule Midnight Task (Only for Testnet)
 * @dev This function schedules a task to reset faucet usage at midnight.
 * @functionality Schedules a daily reset task at midnight for faucet usage.
 */
#[cfg(feature = "testnet")]
pub async fn schedule_midnight_task() {
    let initial_delay = time_until_midnight();
    
    set_timer(initial_delay, || {
        ic_cdk::spawn(async {
            run_midnight_reset().await;

            set_timer_interval(SECOND_PER_DAY, || {
                ic_cdk::spawn(async {
                    run_midnight_reset().await;
                });
            });
        });
    });
}

/**
 * @title Schedule Temporary Log Cleanup
 * @dev Schedules a recurring task to clean up temporary logs once per day.
 * @functionality Sets up a timer that triggers log cleanup at daily intervals (86400 seconds), clears the temporary logs, and logs the scheduling action.
 */
pub fn schedule_temp_log_cleanup() {
    let interval = Duration::from_secs(SECONDS_PER_DAY);

    ic_cdk_timers::set_timer_interval(interval, || {
        clear_temp_log();
    });
}

/* @title Run Midnight Reset (Only for Testnet)
 * @dev Resets faucet usage for all registered users at midnight (UTC).
 * This function retrieves all user data and calls `reset_faucet_usage` for each user.
 * Any errors encountered during the reset are silently ignored, but can be logged for debugging purposes.
 * @functionality Resets faucet usage for all users at midnight.
 */
#[cfg(feature = "testnet")]
async fn run_midnight_reset() {
    let vector_faucet_data = get_all_faucet().await;

    for (user_principal, _) in vector_faucet_data {
        match reset_faucet_usage(user_principal).await {
            Ok(_) => {
                debug!(
                    "Successfully reset faucet usage for user: {}",
                    user_principal.to_string()
                );
            }
            Err(_) => {
                error!(
                    "Error resetting faucet usage for user: {}",
                    user_principal.to_string()
                );
            }
        }
    }
}

/* @title Time Until Midnight
 * @dev Calculates the duration remaining until midnight (UTC).
 * @returns A `Duration` representing the time left until midnight.
 * @functionality Computes the remaining time until midnight (UTC).
 */
#[cfg(feature = "testnet")]
fn time_until_midnight() -> Duration {
    let now = ic_cdk::api::time();
    let nanos_since_midnight = now % SECOND_PER_DAY.as_nanos() as u64;
    let duration_until_midnight = SECOND_PER_DAY.as_nanos() as u64 - nanos_since_midnight;
    Duration::from_nanos(duration_until_midnight)
}
/* @title Schedule after upgrade by admin
 * @dev This function will re-initialize the scheduled tasks, such as the midnight reset.
 * @notice Re-initializes scheduled tasks, such as the midnight reset.
 * @returns ok or Error.
 * @functionality Allows the admin to re-initialize scheduled tasks after an upgrade.
 */
#[cfg(feature = "testnet")]
#[update]
pub async fn admin_restart_reset_task() -> Result<(), Error> {
    guard_admin_only()?;

    schedule_midnight_task().await;
    return Ok(());
}


pub async  fn schedule_rollback_retry() {
    let interval = Duration::from_secs(FOUR_HOUR);

    set_timer_interval(interval, || {
        ic_cdk::spawn(async {

            match rollback_retry_all().await {
                Ok(_) => {
                    debug!(
                        "Successfully rolled back and retried all pending jobs."
                    );
                }
                Err(_) => {
                    error!(
                        "Error rollback retry all"
                    );
                }
            }
        });
    });
}

export_candid!();
