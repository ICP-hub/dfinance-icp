use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::{BATCH_SIZE, LOGS_LIMIT, LOG_CANISTER_NAME};
use crate::constants::errors::Error;
use crate::guards::access_control::guard_admin_only;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::stable_storage::storable::Candid;
use candid::Principal;
use ic_cdk::api;
use ic_cdk::{call, query};
use std::collections::HashMap;
use std::fmt;

#[derive(PartialEq, Eq, PartialOrd, Ord, Copy, Clone, Debug)]
pub enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

pub struct LogFlusher {
    pub user_key: String,
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
 * @title LogFlusher Drop Handler
 * @dev Automatically triggers log flushing to a remote canister when the `LogFlusher` is dropped, if log count exceeds `LOGS_LIMIT`.
 *
 * @functionality
 * - Attempts to resolve the target canister ID using a predefined name.
 * - Checks the total number of stored logs.
 * - If the log count exceeds the defined `LOGS_LIMIT`, triggers an asynchronous flush operation.
 * - Uses `ic_cdk::spawn` to call `send_log_to_logs_canister` without awaiting.
 * - Upon successful transmission, removes flushed logs from local memory.
 * - On failure, logs the error and retains logs in memory for future attempts.
 */
impl Drop for LogFlusher {
    fn drop(&mut self) {
        let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
            Ok(id) => id,
            Err(_) => return,
        };

        let all_logs = get_logs_in_batches();
        let log_count = read_state(|state| state.log_storage.len());

        if log_count >= LOGS_LIMIT {
            // This fires and ignores the result; runs asynchronously but not awaited.
            ic_cdk::spawn(async move {
                let result = send_log_to_logs_canister(all_logs.clone(), logs_canister_id).await;
                if result.is_ok() {
                    info!("✅ Batch logs sent successfully.");
                    mutate_state(|state| {
                        for user_id in all_logs.keys() {
                            state.log_storage.remove(user_id);
                        }
                    });
                } else {
                    error!("❌ Failed to send batch logs. Logs remain in memory.");
                }
            });
        }
    }
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
    let all_logs: HashMap<u32, Vec<String>> = mutate_state(|state| {
        let logs: Vec<(u32, Vec<String>)> = state
            .log_storage
            .iter()
            .map(|(user_id, log)| (user_id, log.0.clone())) // log is Candid<Vec<String>>
            .collect();

        // Slice the logs in batches of BATCH_SIZE
        let start_index = 0;
        let end_index = std::cmp::min(start_index + BATCH_SIZE, logs.len());

        let batch: Vec<(u32, Vec<String>)> = logs[start_index..end_index].to_vec();

        batch.into_iter().collect()
    });

    all_logs
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

    mutate_state(|state| {
        let log_storage = &mut state.log_storage;

        let mut highest_key = 0;
        for (key, _) in log_storage.iter() {
            if key > highest_key {
                highest_key = key;
            }
        }

        // Calculate the next log ID
        let next_id = highest_key + 1;

        // Insert the new log entry into the storage
        log_storage.insert(next_id, Candid(vec![formatted_log]));
    });
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
        (logs,),
    )
    .await
    {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(err_msg),)) => {
            error!("❌ receive_logs_batch returned error: {}", err_msg);
            Err(LogError::Rejected(err_msg))
        }
        Err((code, msg)) => {
            error!(
                "❌ Inter-canister call failed. Code: {:?}, Message: {:?}",
                code, msg
            );
            Err(LogError::Rejected(format!(
                "Call failed with code {:?}: {}",
                code, msg
            )))
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
                info!("✅ Batch logs sent successfully.");
                mutate_state(|state| {
                    for user_id in all_logs.keys() {
                        state.log_storage.remove(user_id);
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
pub fn get_all_logs() -> Result<Vec<String>, Error> {
    guard_admin_only()?;
    read_state(|state| {
        let log_storage = &state.log_storage;

        let mut logs: Vec<(u32, String)> = Vec::new();

        for (key, value) in log_storage.iter() {
            if let Some(log) = value.0.get(0) {
                logs.push((key, log.clone()));
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
    let user_principal = ic_cdk::caller().to_text();
    ic_cdk::println!("[{:?}] [{}:{}] : {}", level, file, line, msg);
    if level <= LogLevel::TRACE || level <= get_log_level() {
        let _ = store_log(user_principal, level, file, line, msg.to_string());
    }
}
