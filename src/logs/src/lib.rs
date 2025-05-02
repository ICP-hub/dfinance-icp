use candid::candid_method;
use candid::{CandidType, Deserialize};
use ic_cdk::api::{self};
use ic_cdk_macros::*;
use ic_stable_structures::{
    memory_manager::{MemoryManager, MemoryId},
    DefaultMemoryImpl, StableBTreeMap,
};
use core::cell::RefCell;
use std::time::Duration;
use std::collections::HashMap;

// Define the virtual memory type
type VMem = ic_stable_structures::memory_manager::VirtualMemory<DefaultMemoryImpl>;

// Thread-local memory manager and storage
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static LOG_STORAGE: RefCell<StableBTreeMap<u32, Vec<u8>, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
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
     // Re-initialize LOG_STORAGE by replacing the existing StableBTreeMap
     LOG_STORAGE.with(|logs| {
        let new_map = StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        );
        *logs.borrow_mut() = new_map;
    });
}

#[update]
#[candid_method(update)]
pub fn receive_logs_batch(batch_logs: HashMap<u32, Vec<String>>) {
    // let caller = ic_cdk::api::caller();
    // let platform_principal = ic_cdk::api::id();

    //TODO: this validation is not working.
    // make backend canister controller of the log canister and then validate.
    // if caller != platform_principal && !ic_cdk::api::is_controller(&caller) {
    //     ic_cdk::println!("Unauthorized access");
    //     return 
    // }

    LOG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();

        // Find the current maximum log ID in storage
        let mut max_id = storage.iter().map(|(key, _)| key).max().map(|key| key).unwrap_or(0);
        ic_cdk::println!("max id = {:?}",max_id);

        for (log_id, new_logs) in batch_logs {
            let final_id = if storage.contains_key(&log_id) {
                max_id += 1;
                max_id // Use a new ID
            } else {
                log_id
            };

            let serialized_logs = candid::encode_one(&new_logs)
                .expect("Failed to serialize logs");

            storage.insert(final_id, serialized_logs);
        }

        ic_cdk::println!("✅ Batch logs received and stored.");
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

pub fn clear_old_logs(retention_cutoff: u64) {
    ic_cdk::println!("clear old logs is working ");
    let removed_count = LOG_STORAGE.with(|state| {
        let mut state_mut = state.borrow_mut();

        let logs_to_remove: Vec<u32> = state_mut
            .iter()
            .filter_map(|(key, bytes)| {
                // Decode bytes into Vec<String>
                let logs: Vec<String> = match candid::decode_one(&bytes) {
                    Ok(l) => l,
                    Err(_) => return Some(key), // Remove corrupted entries
                };

                // Check if the first log's timestamp is older than cutoff
                if let Some(log_entry) = logs.first() {
                    if let Some(timestamp_str) = log_entry.split(']').next() {
                        if let Ok(timestamp) = timestamp_str.trim_start_matches('[').parse::<u64>() {
                            ic_cdk::println!("comparision in time = {} , {}", timestamp, retention_cutoff);
                            if timestamp < retention_cutoff {
                                return Some(key);
                            }
                        }
                    }
                }

                None
            })
            .collect();

        let count = logs_to_remove.len();
        for key in logs_to_remove {
            ic_cdk::println!("🗑️ Removing log entry with ID: {}", key);
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

// access validations.
#[query]
#[candid_method(query)]
pub fn get_logs() -> Vec<LogRecord> {
    LOG_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .filter_map(|(id, bytes)| {
                // Decode the bytes into Vec<String> using candid
                let deserialized_logs: Vec<String> = match candid::decode_one(&bytes) {
                    Ok(logs) => logs,
                    Err(_) => return None, // If deserialization fails, skip the log entry
                };

                // Return the log record if deserialization is successful
                Some(LogRecord {
                    id,
                    logs: deserialized_logs,
                })
            })
            .collect()
    })
}

pub fn log_internal(level: LogLevel, file: &str, line: u32, message: &str) {
    ic_cdk::print(format!("[{:?}] {}:{} - {}", level, file, line, message));
}
