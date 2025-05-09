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
use ic_stable_structures::storable::{Bound, Storable};

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
    static DATA_BACKUP_STORAGE: RefCell<StableBTreeMap<u64, BackupData, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
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
#[derive(CandidType, Deserialize, Clone)]
pub struct BackupData {
    pub load_time: u64,
    pub data: String,
}

// Implement the Storable trait for BackupData
impl Storable for BackupData {
    const BOUND: Bound = Bound::Unbounded;
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        let serialized = candid::encode_one(self).expect("Failed to serialize BackupData");
        std::borrow::Cow::Owned(serialized)
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).expect("Failed to deserialize BackupData")
    }
}


/*
 * @title Initialization Function
 * @dev Initializes the contract and schedules periodic tasks for log cleanup.
 * @param None
 * @returns None
 *
 * @functionality Sets up the initial state of the contract, initializes the log storage,
 * and schedules a periodic task to clean up old logs.
 */

#[init]
fn init() {
    schedule_log_cleanup();
    // Initialize the log storage
     LOG_STORAGE.with(|logs| {
        let new_map = StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        );
        *logs.borrow_mut() = new_map;
    });
}

/*
 * @title Log Storage Function
 * @dev Receives a batch of logs and stores them in the log storage.
 * @param batch_logs A HashMap where the key is the log ID and the value is a vector of log messages.
 * @returns None
 *
 * @functionality Receives a batch of logs, serializes them, and stores them in the log storage.
 */
 #[update]
 #[candid_method(update)]
 pub fn receive_logs_batch(batch_logs: HashMap<u32, Vec<String>>) ->Result<(), String> {
     let caller = ic_cdk::caller();
 
     if !ic_cdk::api::is_controller(&caller) {
        ic_cdk::println!("Unauthorized access to logs");
         return Err("Unauthorized access to logs.".to_string());
     }
     
     LOG_STORAGE.with(|storage| {
         let mut storage = storage.borrow_mut();
 
         // Find the current maximum log ID in storage
         let mut max_id = storage.iter().map(|(key, _)| key).max().map(|key| key).unwrap_or(0);
 
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
     Ok(())
 }

/*
 * @title Log Cleanup Function
 * @dev Cleans up old logs based on a retention policy.
 * @param None
 * @returns None
 *
 * @functionality Iterates through the log storage and removes logs older than the specified retention period.
 */
// Main function to clean up old logs
pub fn process_log_schedule() {
    let current_time = api::time() / 1_000_000_000;
    let retention_cutoff = current_time.saturating_sub(LOG_RETENTION_DAYS * SECONDS_PER_DAY);

    clear_old_logs(retention_cutoff);

}

pub fn clear_old_logs(retention_cutoff: u64) {

    let _ = LOG_STORAGE.with(|state| {
        let mut state_mut = state.borrow_mut();

        let logs_to_remove: Vec<u32> = state_mut
            .iter()
            .filter_map(|(key, bytes)| {
                // Decode bytes into Vec<String>
                let logs: Vec<String> = match candid::decode_one(&bytes) {
                    Ok(l) => l,
                    Err(_) => return Some(key), // Remove corrupted entries
                };

            
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
            state_mut.remove(&key);
        }

        count
    });

    
}

/*
 * @title Log Cleanup Scheduler
 * @dev Schedules the log cleanup to run periodically.
 * @param None
 * @returns None
 *
 * @functionality Sets up a timer to trigger the log cleanup function at regular intervals.
 */
pub fn schedule_log_cleanup() {
    // Schedule the log cleanup to run once per day (86400 seconds)
    let interval = Duration::from_secs(SECONDS_PER_DAY);

    // Set up a recurring timer that will call process_log_schedule
    ic_cdk_timers::set_timer_interval(interval, || {
        process_log_schedule();
    });
}


#[query]
#[candid::candid_method(query)]
pub fn get_logs() -> Result<Vec<LogRecord>, String> {
    let caller = ic_cdk::caller();

    if !ic_cdk::api::is_controller(&caller) {
        return Err("Unauthorized access to logs.".to_string());
    }

    let logs = LOG_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .filter_map(|(id, bytes)| {
                match candid::decode_one::<Vec<String>>(&bytes) {
                    Ok(deserialized_logs) => Some(LogRecord {
                        id,
                        logs: deserialized_logs,
                    }),
                    Err(_) => None,
                }
            })
            .collect()
    });

    Ok(logs)
}


#[update]
#[candid_method(update)]
pub fn receive_data_backup(data: BackupData) -> Result<(), String> {
    let caller = ic_cdk::caller();

    if !ic_cdk::api::is_controller(&caller) {
        return Err("Unauthorized access to logs.".to_string());
    }

    DATA_BACKUP_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        // let serialized_data = candid::encode_one(&data).expect("Failed to serialize BackupData");
        storage.insert(1000u64 , data);
    });

    Ok(())
}

#[query]
#[candid_method(query)]
pub fn get_data_backup(id : u64) -> Result<BackupData, String> {
    let caller = ic_cdk::caller();

    if !ic_cdk::api::is_controller(&caller) {
        return Err("Unauthorized access to logs.".to_string());
    }

    //get the data from the storage of given id
    let data = DATA_BACKUP_STORAGE.with(|storage| {
        let storage = storage.borrow();
        storage.get(&id).map(|data| data.clone()).ok_or_else(|| "Data not found".to_string())
    });

    return data;
}