use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::{BATCH_SIZE, LOG_CANISTER_NAME};
use crate::constants::errors::Error;
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
    // schedule_log_cleanup();
    // init_log_clearing();
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

pub fn get_logs_in_batches() -> HashMap<u32, Vec<String>> {
    let all_logs: HashMap<u32, Vec<String>> = mutate_state(|state| {
        // Convert to vector for easier slicing
        let logs: Vec<(u32, Vec<String>)> = state
            .log_storage
            .iter()
            .map(|(user_id, log)| (user_id, log.0.clone())) // log is Candid<Vec<String>>
            .collect();

        // Slice the logs in batches of BATCH_SIZE
        let start_index = 0;
        let end_index = std::cmp::min(start_index + BATCH_SIZE, logs.len());

        let batch: Vec<(u32, Vec<String>)> = logs[start_index..end_index].to_vec();

        // Convert the batch into a HashMap
        batch.into_iter().collect()
    });

    all_logs
}

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

        ic_cdk::println!("total logs ={:?}", log_storage.len());

        // Insert the new log entry into the storage
        log_storage.insert(next_id, Candid(vec![formatted_log]));
    });
    Ok(())
}

pub async fn send_log_to_logs_canister(
    logs: HashMap<u32, Vec<String>>,
    logs_canister_id: Principal,
) -> Result<(), Error> {
    match call::<(HashMap<u32, Vec<String>>,), ()>(logs_canister_id, "receive_logs_batch", (logs,))
        .await
    {
        Ok(()) => {
            ic_cdk::println!("✅ Logs batch sent successfully.");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("❌ Failed to send logs: {:?}", e.1);
            Err(Error::InvalidCanister)
        }
    }
}

pub fn clear_temp_log() {
    let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => return,
    };

    ic_cdk::spawn(async move {
        loop {
            let all_logs = get_logs_in_batches();

            if all_logs.is_empty() {
                ic_cdk::println!("✅ All logs cleared from temporary memory.");
                break;
            }

            ic_cdk::println!("📦 Sending batch of logs. Length = {}", all_logs.len());

            let result = send_log_to_logs_canister(all_logs.clone(), logs_canister_id).await;

            if result.is_ok() {
                ic_cdk::println!("✅ Batch logs sent successfully.");
                mutate_state(|state| {
                    for user_id in all_logs.keys() {
                        state.log_storage.remove(user_id);
                    }
                });
            } else {
                ic_cdk::println!("❌ Failed to send batch logs. Stopping process.");
                break;
            }
        }
    });
}

//TODO: can remove later.
#[query]
pub fn get_all_logs() -> Vec<String> {
    read_state(|state| {
        let log_storage = &state.log_storage;

        let mut logs: Vec<(u32, String)> = Vec::new();

        for (key, value) in log_storage.iter() {
            if let Some(log) = value.0.get(0) {
                logs.push((key, log.clone()));
            }
        }

        logs.sort_by_key(|(key, _)| *key);

        logs.into_iter().map(|(_, log)| log).collect()
    })
}

pub fn log_internal(level: LogLevel, file: &str, line: u32, msg: &str) {
    ic_cdk::println!(
        "Log level: {:?}, File: {}, Line: {}, Message: {}",
        level,
        file,
        line,
        msg
    );

    //TODO: anshika i think we can remove this check.(this is creating trouble in letting debug and trace to go forward)
    // if level as usize > get_log_level() as usize {

    //     ic_cdk::println!("get log level: {:?}", get_log_level());
    //     ic_cdk::println!("size of log level: {:?}", get_log_level() as usize);
    //     ic_cdk::println!("size of log level: {:?}", level as usize);
    //     ic_cdk::println!("Log level is too low, skipping log{:?}", level);
    //     return;
    //

    let user_principal = ic_cdk::caller().to_text();
    let file_name = file.split('/').last().unwrap_or(file);

    // let log_message = format!("[{}] [{}:{}] {}", level, file_name, line, msg);
    let log_message = format!(
        "[{}] [{}:{}] [User: {}] {}",
        level, file_name, line, user_principal, msg
    );

    ic_cdk::println!("{}", log_message);

    //TODO: do we really need this below validation --> Only store logs at appropriate levels
    if level <= LogLevel::TRACE || level <= get_log_level() {
        let _ = store_log(user_principal, level, file, line, msg.to_string());
    }
}
