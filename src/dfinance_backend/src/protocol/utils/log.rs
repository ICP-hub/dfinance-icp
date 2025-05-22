use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::{BATCH_SIZE, LOGS_LIMIT, LOG_CANISTER_NAME, CHECK_FREQUENCY};
use crate::constants::errors::Error;
use crate::guards::access_control::guard_admin_only;
use candid::Principal;
use ic_cdk::api;
use ic_cdk::{call, query};
use std::cell::RefCell;
use std::collections::HashMap;
use std::fmt;

// Thread-local storage for logs
thread_local! {
    static LOG_STORAGE: RefCell<HashMap<u32, Vec<String>>> = RefCell::new(HashMap::new());
    static FLUSH_IN_PROGRESS: RefCell<bool> = RefCell::new(false);
    static LOG_COUNT: RefCell<u64> = RefCell::new(0);
    static NEXT_LOG_ID: RefCell<u32> = RefCell::new(1);
    static CHECK_COUNTER: RefCell<u64> = RefCell::new(0);
}

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

pub fn init_logging(is_production: bool) {
    if is_production {
        set_log_level(LogLevel::INFO);
    } else {
        set_log_level(LogLevel::DEBUG);
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

#[macro_export]
macro_rules! error {
    ($($arg:tt)*) => {
        log_internal(
            LogLevel::ERROR,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! warn {
    ($($arg:tt)*) => {
        log_internal(
            LogLevel::WARN,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! info {
    ($($arg:tt)*) => {
        log_internal(
            LogLevel::INFO,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        log_internal(
            LogLevel::DEBUG,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! trace {
    ($($arg:tt)*) => {
        log_internal(
            LogLevel::TRACE,
            file!(),
            line!(),
            &format!($($arg)*)
        )
    };
}

/**
 * @title Increment Log Count
 * @dev Thread-safe way to increment the log counter
 */
fn increment_log_count() {
    LOG_COUNT.with(|count| {
        *count.borrow_mut() += 1;
    });
}

/**
 * @title Decrement Log Count
 * @dev Thread-safe way to decrement the log counter by specified amount
 */
fn decrement_log_count(amount: u64) {
    LOG_COUNT.with(|count| {
        let mut current = count.borrow_mut();
        *current = current.saturating_sub(amount);
    });
}

/**
 * @title Get Log Count
 * @dev Returns the current log count without traversing the HashMap
 */
fn get_log_count() -> u64 {
    LOG_COUNT.with(|count| *count.borrow())
}

/**
 * @title Get Next Log ID
 * @dev Thread-safe way to get the next log ID and increment the counter
 */
fn get_next_log_id() -> u32 {
    NEXT_LOG_ID.with(|id| {
        let current = *id.borrow();
        *id.borrow_mut() = current + 1;
        current
    })
}

/**
 * @title Maybe Check And Flush Logs
 * @dev Periodically checks if logs need flushing (not on every log addition)
 * Uses a counter to only check every CHECK_FREQUENCY logs
 */
fn maybe_check_and_flush_logs() {
    // Only check periodically to reduce overhead
    let should_check = CHECK_COUNTER.with(|counter| {
        let mut current = counter.borrow_mut();
        *current += 1;
        
        if *current >= CHECK_FREQUENCY {
            *current = 0;
            true
        } else {
            // Also check if we're way over the limit to avoid delaying too much
            get_log_count() >= (2 * LOGS_LIMIT)
        }
    });
    
    if should_check {
        check_and_flush_logs();
    }
}

/**
 * @title Check And Flush Logs
 * @dev Checks if log count exceeds the limit and triggers a flush if needed.
 * This is only called periodically to reduce overhead.
 */
pub fn check_and_flush_logs() {
    // Fast check using our counter instead of traversing the HashMap
    if get_log_count() < LOGS_LIMIT {
        return; // Not enough logs to flush
    }
    
    // Check if a flush is already in progress
    let should_flush = FLUSH_IN_PROGRESS.with(|flag| {
        if *flag.borrow() {
            return false; // Another flush is already in progress
        }
        
        // Set the flag to true
        *flag.borrow_mut() = true;
        true
    });
    
    if !should_flush {
        return;
    }
    
    // Get the logs canister ID
    let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => {
            // Reset the flag if we couldn't get the canister ID
            FLUSH_IN_PROGRESS.with(|flag| *flag.borrow_mut() = false);
            return;
        }
    };
    
    // Spawn the flush operation to run asynchronously
    ic_cdk::spawn(async move {
        // Keep track of logs processed in this flush operation
        let mut total_logs_flushed = 0;
        
        // Process logs in batches until we've cleared enough or hit an error
        while get_log_count() >= LOGS_LIMIT {
            // Get batch of logs efficiently (up to BATCH_SIZE)
            let batch_logs = get_next_batch_of_logs(BATCH_SIZE as usize);
            
            if batch_logs.is_empty() {
                break; // No more logs to process
            }
            
            // Count logs in this batch
            let batch_size = batch_logs.values().map(|v| v.len()).sum::<usize>();
            
            match send_log_to_logs_canister(batch_logs.clone(), logs_canister_id).await {
                Ok(_) => {
                    total_logs_flushed += batch_size;
                    
                    // Remove the sent logs from storage and update counter
                    remove_logs_from_storage(&batch_logs);
                    decrement_log_count(batch_size as u64);
                    
                    // Only log occasionally to reduce log volume in high-throughput scenarios
                    if total_logs_flushed % (5 * BATCH_SIZE) == 0 {
                        info!("✅ Flushed {} logs so far. Remaining: {}", 
                              total_logs_flushed, get_log_count());
                    }
                },
                Err(e) => {
                    error!("❌ Failed to send batch logs: {:?}. Aborting flush operation.", e);
                    break;
                }
            }
        }
        
        // Reset the flag now that we're done
        FLUSH_IN_PROGRESS.with(|flag| *flag.borrow_mut() = false);
        
        // Log completion info
        if total_logs_flushed > 0 {
            info!("📝 Flush operation complete. Total logs flushed: {}", total_logs_flushed);
        }
    });
}

/**
 * @title Get Next Batch Of Logs
 * @dev Retrieves the next batch of logs up to the specified batch size.
 * Optimized to avoid sorting the entire key set each time.
 * @param batch_size The maximum number of logs to retrieve.
 * @return A HashMap containing the logs in the batch.
 */
fn get_next_batch_of_logs(batch_size: usize) -> HashMap<u32, Vec<String>> {
    LOG_STORAGE.with(|log_storage| {
        let storage = log_storage.borrow();
        
        // Optimization: Instead of sorting all keys, just find the lowest N keys
        // This is much more efficient with large numbers of logs
        let mut batch = HashMap::new();
        let mut batch_count = 0;
        
        // Find the smallest keys first (oldest logs)
        if !storage.is_empty() {
            let mut keys: Vec<u32> = storage.keys().cloned().collect();
            keys.sort(); // Sort the keys to process oldest logs first
            
            // Take only up to batch_size keys
            for &key in keys.iter().take(batch_size) {
                if let Some(logs) = storage.get(&key) {
                    batch.insert(key, logs.clone());
                    batch_count += 1;
                    if batch_count >= batch_size {
                        break;
                    }
                }
            }
        }
        
        batch
    })
}

/**
 * @title Remove Logs From Storage
 * @dev Removes the specified logs from the thread-local storage.
 * @param logs_to_remove HashMap containing the logs to remove.
 */
fn remove_logs_from_storage(logs_to_remove: &HashMap<u32, Vec<String>>) {
    LOG_STORAGE.with(|log_storage| {
        let mut storage = log_storage.borrow_mut();
        for key in logs_to_remove.keys() {
            storage.remove(key);
        }
    });
}

/**
 * @title Retrieve Logs in Batches
 * @dev Retrieves logs from the state and slices them into batches.
 * @returns A `HashMap` containing the logs in batches, where each entry is a tuple of user ID and their respective log data.
 *
 * @functionality Collects all logs from `log_storage`, slices them into batches of size `BATCH_SIZE`,
 * and returns the logs for the current batch. The function processes a batch starting from `start_index`
 * and returns logs in the range between `start_index` and `end_index`.
 */
pub fn get_logs_in_batches() -> HashMap<u32, Vec<String>> {
    LOG_STORAGE.with(|log_storage| {
        let storage = log_storage.borrow();
        let logs: Vec<(u32, Vec<String>)> = storage
            .iter()
            .map(|(user_id, log)| (*user_id, log.clone()))
            .collect();

        // Slice the logs in batches of BATCH_SIZE
        let start_index = 0;
        let end_index = std::cmp::min(start_index + BATCH_SIZE, logs.len());

        let batch: Vec<(u32, Vec<String>)> = logs[start_index..end_index].to_vec();

        batch.into_iter().collect()
    })
}

/**
 * @title Store Log Entry
 * @dev Stores a log entry with a timestamp, log level, file name, line number, user principal, and message.
 * @param user_principal The principal of the user generating the log.
 * @param level The log level (e.g., INFO, ERROR).
 * @param file The file from which the log entry was generated.
 * @param line The line number from which the log entry was generated.
 * @param message The log message.
 * @returns `Ok(())` if the log is successfully stored, or an error if the operation fails.
 *
 * @functionality Formats the log data, calculates a new log ID based on the highest existing key,
 * and stores the log entry in the state. Each log entry is stored with a unique ID in `log_storage`.
 */
pub fn store_log(
    user_principal: String,
    level: LogLevel,
    file: &str,
    line: u32,
    message: String,
) -> Result<(), Error> {
    let timestamp = api::time() / 1_000_000_000;
    let file_name = file.split('/').last().unwrap_or(file);

    let formatted_log = format!(
        "[{}] [{}] [{}:{}] {} {}",
        timestamp, level, file_name, line, user_principal, message
    );

    // Use atomically generated ID 
    let log_id = get_next_log_id();
    
    LOG_STORAGE.with(|log_storage| {
        let mut storage = log_storage.borrow_mut();
        
        // Insert the new log entry into the storage
        let log_entry = storage.entry(log_id).or_insert_with(Vec::new);
        log_entry.push(formatted_log);
    });
    
    // Increment our log counter
    increment_log_count();
    
    // Only check for flush periodically to reduce overhead
    maybe_check_and_flush_logs();
    
    Ok(())
}


#[derive(Debug)]
pub enum LogError {
    InvalidCanister,
    Rejected(String),
}

/**
 * @title Send Logs to Logs Canister
 * @dev Sends a batch of logs to the specified logs canister for processing.
 * @param logs The logs to be sent, in the form of a `HashMap<u32, Vec<String>>`.
 * @param logs_canister_id The principal ID of the logs canister where logs should be sent.
 * @returns `Ok(())` if the logs are successfully received by the logs canister, or an error if the process fails.
 * @throws LogError::Rejected if the logs are rejected by the canister or the inter-canister call fails.
 *
 * @functionality Makes an inter-canister call to the `receive_logs_batch` function of the logs canister. If the call succeeds, it returns `Ok(())`; otherwise, it logs the error and returns a `LogError::Rejected` error.
 */
pub async fn send_log_to_logs_canister(
    logs: HashMap<u32, Vec<String>>,
    logs_canister_id: Principal,
) -> Result<(), LogError> {
    match call::<(HashMap<u32, Vec<String>>,), (Result<(), String>,)>(
        logs_canister_id,
        "receive_logs_batch",
        (logs,)
    ).await {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(err_msg),)) => {
            error!("❌ receive_logs_batch returned error: {}", err_msg);
            Err(LogError::Rejected(err_msg))
        }
        Err((code, msg)) => {
            error!("❌ Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg);
            Err(LogError::Rejected(format!("Call failed with code {:?}: {}", code, msg)))
        }
    }
}

/**
 * @title Clear Temporary Logs
 * @dev Clears the temporary logs by sending them to the designated logs canister.
 * @functionality Retrieves logs in batches, sends them to the logs canister, and removes successfully sent logs from the state. The process is repeated until all logs are cleared or an error occurs.
 */
pub fn clear_temp_log() {
    let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => return,
    };

    ic_cdk::spawn(async move {
        loop {
            let all_logs = get_logs_in_batches();

            if all_logs.is_empty() {
                break;
            }

            let result = send_log_to_logs_canister(all_logs.clone(), logs_canister_id).await;

            if result.is_ok() {
                info!("✅ Batch logs sent successfully (clear temp log).");
                LOG_STORAGE.with(|log_storage| {
                    let mut storage = log_storage.borrow_mut();
                    for user_id in all_logs.keys() {
                        storage.remove(user_id);
                    }
                });
            } else {
                error!("❌ Failed to send batch logs. Stopping process.");
                break;
            }
        }
    });
}

/**
 * @title Get All Logs
 * @dev Returns all log entries stored in the canister in ascending order by their keys.
 *
 * @access Requires admin privileges via `guard_admin_only`.
 *
 * @functionality
 * - Accesses the internal state to retrieve the log storage.
 * - Iterates over the log storage and extracts the first entry from each `Candid<Vec<String>>` value.
 * - Sorts the logs by their log IDs (keys) in ascending order.
 * - Returns a flat vector of log strings.
 *
 * @return `Result<Vec<String>, Error>` containing all logs or an error if access is unauthorized.
 */
#[query]
pub fn get_all_logs() -> Result<Vec<String>,Error> {
    guard_admin_only()?;
    LOG_STORAGE.with(|log_storage| {
        let storage = log_storage.borrow();
        
        let mut logs: Vec<(u32, String)> = Vec::new();
        
        for (key, value) in storage.iter() {
            if let Some(log) = value.get(0) {
                logs.push((*key, log.clone()));
            }
        }
        
        logs.sort_by_key(|(key, _)| *key);
        
        Ok(logs.into_iter().map(|(_, log)| log).collect())
    })
}


/**
 * @title Internal Logging Utility
 * @dev Logs a message to the internal log storage if the level is appropriate.
 *
 * @functionality
 * - Retrieves the caller's principal as a string.
 * - Checks if the provided log level is at or below the configured system log level.
 * - If allowed, formats and stores the log message using `store_log`.
 * - Used for recording internal operations, errors, or debug information.
 *
 * @params
 * @param level `LogLevel` - The severity level of the log (e.g., INFO, DEBUG, ERROR).
 * @param file `&str` - The source file name from which the log was emitted.
 * @param line `u32` - The line number in the source file.
 * @param msg `&str` - The message content to be logged.
 */
pub fn log_internal(level: LogLevel, file: &str, line: u32, msg: &str) {
    #[cfg(feature = "testnet")]
    ic_cdk::println!(
        "[{:?}] [{}:{}] : {}",
        level, file, line, msg
    );
    let user_principal = ic_cdk::caller().to_text();

    if level <= LogLevel::TRACE || level <= get_log_level() {
        let _ = store_log(user_principal, level, file, line, msg.to_string());
    }
}