use candid::candid_method;
use candid::{CandidType, Deserialize};
use ic_cdk::api;
use ic_cdk::query;
use ic_cdk::storage;
use ic_cdk::update;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade};
use std::cell::RefCell;
use std::collections::HashMap;
use std::time::Duration;

type LogStorage = HashMap<u32, Vec<String>>;

thread_local! {
    static LOG_STORAGE: RefCell<LogStorage> = RefCell::new(HashMap::new());
}

// Constants
const LOG_RETENTION_DAYS: u64 = 7; // Number of days to retain logs
const SECONDS_PER_DAY: u64 = 24 * 60 * 60;

#[derive(CandidType, Deserialize, Clone)]
pub struct LogRecord {
    pub id: u32,
    pub logs: Vec<String>,
}

#[derive(CandidType, Deserialize, Clone)]
struct CandidLog(Vec<String>);

#[derive(Debug)]
pub enum LogLevel {
    DEBUG,
    INFO,
}

#[init]
fn init() {
    schedule_log_cleanup();
    // Initialize the log storage
    LOG_STORAGE.with(|logs| logs.borrow_mut().clear());
}

#[pre_upgrade]
fn pre_upgrade() {
    LOG_STORAGE.with(|logs| {
        let logs = logs.borrow();
        storage::stable_save((logs.clone(),)).expect("Failed to save logs");
    });
}

#[post_upgrade]
fn post_upgrade() {
    let (logs,): (LogStorage,) = storage::stable_restore().expect("Failed to restore logs");
    LOG_STORAGE.with(|cell| {
        let mut logs_ref = cell.borrow_mut();
        logs_ref.extend(logs);
    });
}

//TODO: add some validation.
#[update]
#[candid_method(update)]
pub fn receive_log(log_id: u32, log_data: String) {
    LOG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();

        storage
            .entry(log_id)
            .or_insert_with(Vec::new)
            .push(log_data);

        ic_cdk::println!("Log received and stored with ID: {}", log_id);
    });
}


// Main function to clean up old logs
pub fn process_log_heartbeat() {
    let current_time = api::time() / 1_000_000_000;
    let retention_cutoff = current_time.saturating_sub(LOG_RETENTION_DAYS * SECONDS_PER_DAY);
    ic_cdk::println!(
        "Current time: {}, Retention cutoff: {}",
        current_time,
        retention_cutoff
    );

    clear_old_logs(retention_cutoff);

    log_internal(
        LogLevel::DEBUG,
        file!(),
        line!(),
        &format!(
            "Log cleanup processed, removed logs older than {} seconds ago",
            LOG_RETENTION_DAYS * SECONDS_PER_DAY
        ),
    );
}

// Function to actually clear old logs
pub fn clear_old_logs(retention_cutoff: u64) {
    let removed_count = LOG_STORAGE.with(|state| {
        let mut state_mut = state.borrow_mut();

        let logs_to_remove: Vec<u32> = state_mut
            .iter()
            .filter_map(|(key, logs)| {
                if let Some(log_entry) = logs.first() {
                    if let Some(timestamp_str) = log_entry.split(']').next() {
                        if let Ok(timestamp) = timestamp_str.trim_start_matches('[').parse::<u64>()
                        {
                            if timestamp < retention_cutoff {
                                return Some(*key);
                            }
                        }
                    }
                }
                None
            })
            .collect();

        let count = logs_to_remove.len();
        for key in logs_to_remove {
            ic_cdk::println!("are we Removing log entry with ID: {}", key);
            state_mut.remove(&key);
        }

        count
    });

    log_internal(
        LogLevel::INFO,
        file!(),
        line!(),
        &format!(
            "Removed {} old log entries older than retention period",
            removed_count
        ),
    );
}

pub fn schedule_log_cleanup() {
    // Schedule the log cleanup to run once per day (86400 seconds)
    let interval = Duration::from_secs(SECONDS_PER_DAY);

    // Set up a recurring timer that will call process_log_heartbeat
    ic_cdk_timers::set_timer_interval(interval, || {
        process_log_heartbeat();
    });

    log_internal(
        LogLevel::INFO,
        file!(),
        line!(),
        "Log cleanup scheduled to run once per day",
    );
}

//TODO: add some validation.
#[query]
#[candid_method(query)]
pub fn get_logs() -> Vec<LogRecord> {
    LOG_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(id, logs)| LogRecord {
                id: *id,
                logs: logs.clone(),
            })
            .collect()
    })
}

pub fn log_internal(level: LogLevel, file: &str, line: u32, message: &str) {
    ic_cdk::print(format!("[{:?}] {}:{} - {}", level, file, line, message));
}
