use crate::math;
use crate::types::*;
use crate::{api::*, math::*, with_state};
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};
use ic_cdk_macros::*;
use ic_cdk_timers::{clear_timer, set_timer_interval};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
pub const RELEASE_MONTH: usize = 4;
#[update]
pub fn start_monthly_task() {
    let duration = Duration::from_secs(60); // Approximate month in seconds

    let timer_id = set_timer_interval(duration, move || {
        ic_cdk::println!("Running scheduled monthly task.");
        run_scheduled_task();
    });
}

pub fn run_scheduled_task() {
    // Implementation of what needs to be done monthly
    let current_phase = get_current_phase();
    add_monthly_data();

    ic_cdk::println!("current phase is {}", current_phase);
}

pub fn get_current_month() -> u32 {
    let current_month = timestamp_to_month(time());
    current_month
}

#[query]
pub fn get_total_months() -> u32 {
    let current_month = get_current_month();
    with_state(|state| {
        let timestamp = state
            .launch_timestamp
            .expect("Launch timestamp must be set before accessing");
        let launch_month = timestamp_to_month(timestamp);
        (current_month - launch_month) + 1
    })
}

#[update]
pub fn get_current_phase() -> u32 {
    let month_diff = get_total_months();
    let mut current_phase: u32 = 0;
    if month_diff < 3 {
        current_phase = 1
    } else if month_diff >= 3 && month_diff < 12 {
        current_phase = 2
    } else if month_diff >= 12 {
        current_phase = 3
    }
    with_state(|state| {
        state.current_phase = current_phase;
        state.current_phase
    })
}

#[update]
pub fn add_monthly_data() {
    let monthly_data = MonthlyData {
        total_deposits: get_current_deposist(),
        phase: get_current_phase(),
        current_month: get_current_month(),
        total_borrowed: amount_available_for_borrowing(),
        total_fees: fees_generated(),
        team_income: get_team_fees(),
        lending_apr: get_lending_apr(),
        buy_and_burn: get_buy_and_burn(),
        fees_to_lender: get_lender_fees(),
        lender_lp_yield: get_lender_lp_yield(),
        borrower_lp_yield: get_borrow_lp_yield(),
        supply_stacked: get_supply_stacked(),
    };

    with_state(|state| {
        let current_month = get_current_month();
        if let Some(existing_data) = state.monthly_data.get_mut(&current_month) {
            *existing_data = monthly_data;
        } else {
            state.monthly_data.insert(current_month, monthly_data);
        }
    })
}
