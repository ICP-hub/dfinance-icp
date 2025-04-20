use crate::constants::errors::Error;
use protocol::logic::faucet::reset_faucet_usage;
use candid::Nat;
use candid::Principal;
use declarations::structs::AssetData;
use declarations::structs::InitArgs;
use ic_cdk::{init, update};
use ic_cdk_macros::export_candid;
use crate::declarations::datatypes::{PriceCache,SessionStorageData,UserData, UserAccountData};
mod api;
mod constants;
pub mod declarations;
mod dynamic_canister;
mod guards;
mod stable_storage;
mod protocol;
use crate::stable_storage::state_handler::mutate_state;
use crate::declarations::structs::ReserveData;
use crate::declarations::structs::{
    ExecuteBorrowParams, ExecuteLiquidationParams, ExecuteRepayParams, ExecuteSupplyParams,
    ExecuteWithdrawParams, AssetInfo
};
use crate::stable_storage::storable::Candid;
use ic_cdk_timers::{set_timer_interval, set_timer};
use std::time::Duration;
use constants::constant_variables::constants::SECOND_PER_DAY;
use api::query::get_all_users;
use crate::guards::access_control::to_check_controller;



/*
 * @title Initialization Function
 * @dev Initializes the contract by setting the controller and scheduling a task.
 * @param args The principal ID of the controller.
 * @returns None
 * 
 * @functionality Initialize Contract and Schedule Task
 */
#[init]
pub async fn init(args: Principal) {
    ic_cdk::println!("init function = {:?}", args);

    mutate_state(|state| {
        state.meta_data.insert(
            0,
            Candid(InitArgs {
                controller_id: args,
            }),
        );
    });

    ic_cdk::println!("function called");
    schedule_midnight_task().await;
}

/*
 * @title Schedule Midnight Task
 * @dev This function schedules a task to reset faucet usage at midnight.
 * @returns None
 * @functionality Schedules a daily reset task at midnight for faucet usage.
 */
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

/*
 * @title Run Midnight Reset
 * @dev Resets faucet usage for all registered users at midnight (UTC).
 * @returns None
 * 
 * This function retrieves all user data and calls `reset_faucet_usage` for each user. 
 * Any errors encountered during the reset are silently ignored, but can be logged for debugging purposes.
 * @functionality Resets faucet usage for all users at midnight.
 */
async fn run_midnight_reset() {
    let vector_user_data: Vec<(Principal, UserData)> = get_all_users().await;
    for (user_principal, _) in vector_user_data {
        if let Err(_) = reset_faucet_usage(user_principal).await {
            ic_cdk::println!(
                "Error resetting faucet usage for user: {}",
                user_principal.to_string()
            );
        } else {
            ic_cdk::println!(
                "Successfully reset faucet usage for user: {}",
                user_principal.to_string()
            );
        }
    }
}

/*
 * @title Time Until Midnight
 * @dev Calculates the duration remaining until midnight (UTC).
 * @returns A `Duration` representing the time left until midnight.
 * @functionality Computes the remaining time until midnight (UTC).
 */
fn time_until_midnight() -> Duration {
    let now = ic_cdk::api::time();
    let nanos_since_midnight = now % SECOND_PER_DAY.as_nanos() as u64;
    let duration_until_midnight = SECOND_PER_DAY.as_nanos() as u64 - nanos_since_midnight;
    Duration::from_nanos(duration_until_midnight)
}

/*
 * @title Schedule after upgrade by admin
 * @dev This function will re-initialize the scheduled tasks, such as the midnight reset.
 * @notice Re-initializes scheduled tasks, such as the midnight reset.
 * @returns ok or Error.
 * @functionality Allows the admin to re-initialize scheduled tasks after an upgrade.
 */
#[update]
pub async fn admin_restart_reset_task() -> Result<(), Error> {
   
    if !to_check_controller() {
        return Err(Error::ErrorNotController);
    }
    schedule_midnight_task().await;
    return Ok(());
}

export_candid!();
