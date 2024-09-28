// use std::time::Duration;

// const N: Duration = Duration::from_secs(60);

// fn ring() {
//     ic_cdk::println!("arijit 700 million");
// }

// #[ic_cdk::init]
// fn init() {
//     let _timer_id = ic_cdk_timers::set_timer_interval(N, ring);
// }

// #[ic_cdk::post_upgrade]
// fn post_upgrade() {
//     init();
// }


use std::time::Duration;
use ic_cdk_timers::{set_timer_interval, clear_timer, TimerId};
use std::cell::RefCell;

// Use thread_local to store the Timer ID and track if it's active
thread_local! {
    static TIMER_ID: RefCell<Option<TimerId>> = RefCell::new(None);  // Store the timer ID
}

// Function to be called every 60 seconds
fn function_called() {
    ic_cdk::println!("700 million dollars company CEO");
}

#[ic_cdk_macros::init]
fn init() {
    // Set a timer to call `function_called` every 60 seconds
    start_timer();
    ic_cdk::println!("Timer initialized to call function every 60 seconds.");
}

#[ic_cdk_macros::post_upgrade]
fn post_upgrade() {
    // Reinitialize the timer after upgrade
    init();
}

// Query to check if the timer is active
#[ic_cdk_macros::query]
fn timer_active() -> String {
    TIMER_ID.with(|id| {
        if id.borrow().is_some() {
            "Timer is active".to_string()
        } else {
            "Timer is not active".to_string()
        }
    })
}

// Function to start the timer dynamically
#[ic_cdk_macros::update]
fn start_timer() {
    TIMER_ID.with(|id| {
        if id.borrow().is_none() {
            let timer_id = set_timer_interval(Duration::from_secs(10), function_called);
            *id.borrow_mut() = Some(timer_id);
            ic_cdk::println!("Timer started.");
        } else {
            ic_cdk::println!("Timer is already running.");
        }
    });
}

// Optional function to stop the timer dynamically
#[ic_cdk_macros::update]
fn stop_timer() {
    TIMER_ID.with(|id| {
        if let Some(timer_id) = id.borrow_mut().take() {
            clear_timer(timer_id);  // Clears the timer
            ic_cdk::println!("Timer stopped.");
        } else {
            ic_cdk::println!("No active timer to stop.");
        }
    });
}


// # Set variables
// ckbtc_canister="a3shf-5eaaa-aaaaa-qaafa-cai"  
// backend_canister=$CANISTER_ID_DFINANCE_BACKEND  
// dtoken_canister="a4tbr-q4aaa-aaaaa-qaafq-cai"
// approve_method="icrc2_approve"
// deposit_method="supply"
// reserve_data_method="get_reserve_data"










