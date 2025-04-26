
use ic_cdk::api;
use std::fmt;
use crate::stable_storage::storable::Candid;
use crate::stable_storage::state_handler::STATE;

#[derive(PartialEq, Eq, PartialOrd, Ord, Copy, Clone, Debug)]
pub enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

impl fmt::Display for LogLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LogLevel::ERROR => write!(f, "ERROR"),
            LogLevel::WARN => write!(f, "WARN"),
            LogLevel::INFO => write!(f, "INFO"),
            LogLevel::DEBUG => write!(f, "DEBUG"),
            LogLevel::TRACE => write!(f, "TRACE"),
        }
    }
}

static mut CURRENT_LOG_LEVEL: LogLevel = LogLevel::INFO;

pub fn set_log_level(level: LogLevel) {
    unsafe {
        CURRENT_LOG_LEVEL = level;
    }
}

pub fn get_log_level() -> LogLevel {
    unsafe { CURRENT_LOG_LEVEL }
}

const MAX_LOGS: usize = 1000; // Define maximum number of logs to store

pub fn store_log(level: LogLevel, file: &str, line: u32, message: String) {
    let timestamp = api::time() / 1_000_000_000;
    let file_name = file.split('/').last().unwrap_or(file);

    let formatted_log = format!(
        "[{}] [{}] [{}:{}] {}",
        timestamp, level, file_name, line, message
    );

    STATE.with(|state| {
        let mut state_mut = state.borrow_mut();
        let log_storage = &mut state_mut.log_storage;
        
        // Find the highest key
        let mut highest_key = 0;
        for key in log_storage.iter().map(|(k, _)| k) {
            if key > highest_key {
                highest_key = key;
            }
        }
        
        let next_id = highest_key + 1;
        
        // If we've reached the maximum logs, remove the oldest one
        if log_storage.len() >= MAX_LOGS as u64 {
            // Find the smallest key
            if let Some((oldest_id, _)) = log_storage.iter().next() {
                log_storage.remove(&oldest_id);
            }
        }
        
        // Store the log as a new entry
        log_storage.insert(next_id, Candid(vec![formatted_log]));
    });
}


const LOG_RETENTION_DAYS: u64 = 7;
const SECONDS_PER_DAY: u64 = 24 * 60 * 60;

pub fn process_log_heartbeat() {
    let current_time = api::time() / 1_000_000_000;
    let retention_cutoff = current_time.saturating_sub(LOG_RETENTION_DAYS * SECONDS_PER_DAY);
    
    // Only delete logs older than the retention period
    clear_old_logs(retention_cutoff);
    
    log_internal(
        LogLevel::DEBUG,
        file!(),
        line!(),
        &format!("Log cleanup processed, removed logs older than {} seconds ago", 
                LOG_RETENTION_DAYS * SECONDS_PER_DAY)
    );
}

pub fn clear_old_logs(retention_cutoff: u64) {
    let removed_count = STATE.with(|state| {
        let mut state_mut = state.borrow_mut();
        let log_storage = &mut state_mut.log_storage;
        
        // Identify logs to remove based on timestamp
        let logs_to_remove: Vec<u32> = log_storage
            .iter()
            .filter_map(|(key, Candid(logs))| {
                // Parse the timestamp from the first log entry
                if let Some(log_entry) = logs.first() {
                    // Extract timestamp from log format: "[timestamp] [level] [file:line] message"
                    if let Some(timestamp_str) = log_entry.split(']').next() {
                        if let Ok(timestamp) = timestamp_str.trim_start_matches('[').parse::<u64>() {
                            if timestamp < retention_cutoff {
                                return Some(key);
                            }
                        }
                    }
                }
                None
            })
            .collect();
        
        // Remove only the identified old logs
        let count = logs_to_remove.len();
        for key in logs_to_remove {
            log_storage.remove(&key);
        }
        
        count
    });

    log_internal(
        LogLevel::INFO, 
        file!(), 
        line!(), 
        &format!("Removed {} old log entries older than retention period", removed_count)
    );
}


pub fn get_stored_logs() -> Vec<String> {
    STATE.with(|state| {
        let state_ref = state.borrow();
        let log_storage = &state_ref.log_storage;
        
        // Collect all logs in order
        let mut all_logs = Vec::new();
        for (_, Candid(logs)) in log_storage.iter() {
            all_logs.extend(logs.clone());
        }
        all_logs
    })
}

pub fn log_internal(level: LogLevel, file: &str, line: u32, msg: &str) {
    if level as usize > get_log_level() as usize {
        return;
    }

    let file_name = file.split('/').last().unwrap_or(file);

    let log_message = format!("[{}] [{}:{}] {}", level, file_name, line, msg);

    ic_cdk::println!("{}", log_message);

    // Only store logs at appropriate levels
    if level <= LogLevel::TRACE || level <= get_log_level() {
        store_log(level, file, line, msg.to_string());
    }
}

#[macro_export]
macro_rules! error {
    ($($arg:tt)*) => {
        $crate::utils::logging::log_internal(
            $crate::utils::logging::LogLevel::ERROR,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! warn {
    ($($arg:tt)*) => {
        $crate::utils::logging::log_internal(
            $crate::utils::logging::LogLevel::WARN,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! info {
    ($($arg:tt)*) => {
        $crate::utils::logging::log_internal(
            $crate::utils::logging::LogLevel::INFO,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        $crate::utils::logging::log_internal(
            $crate::utils::logging::LogLevel::DEBUG,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! trace {
    ($($arg:tt)*) => {
        $crate::utils::logging::log_internal(
            $crate::utils::logging::LogLevel::TRACE,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

pub fn init_logging(is_production: bool) {
    if is_production {
        set_log_level(LogLevel::INFO);
    } else {
        set_log_level(LogLevel::DEBUG);
    }
    schedule_log_cleanup();
    // init_log_clearing();
}

use std::time::Duration;

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
        "Log cleanup scheduled to run once per day"
    );
}