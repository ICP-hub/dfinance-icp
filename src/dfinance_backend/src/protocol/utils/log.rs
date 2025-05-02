
use crate::constants::constant_variables::constants::MAX_LOG_ENTRIES;
use crate::constants::errors::Error;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::stable_storage::storable::Candid;
use ic_cdk::api;
use ic_cdk::query;
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

const MAX_LOGS: u64 = MAX_LOG_ENTRIES; // Define maximum number of logs to store

pub fn store_log(
    level: LogLevel,
    file: &str,
    line: u32,
    message: String,
) -> Result<(), Error> {
    let timestamp = api::time() / 1_000_000_000;
    let file_name = file.split('/').last().unwrap_or(file);
    // let logs_canister_id = get_canister_id_by_name("logs".to_string())
    // .unwrap_or(Principal::anonymous());
    let mut oldest_log_to_send = Default::default();
    let mut oldest_log_id: u32 = 0;
    // let mut call_inter_canister = false;

    let formatted_log = format!(
        "[{}] [{}] [{}:{}] {}",
        timestamp, level, file_name, line, message
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

        ic_cdk::println!("total logs ={:?}",log_storage.len());
        // If we've reached the maximum logs, remove the oldest one
        if log_storage.len() >= MAX_LOGS {
            // Remove the smallest key (oldest log)
            if let Some((oldest_id, oldest_log)) = log_storage.iter().next() {
                oldest_log_to_send = oldest_log.clone();
                oldest_log_id = oldest_id;
                // ic_cdk::println!("removing logs: {:?}",old);
                // call_inter_canister = true;
                log_storage.remove(&oldest_id);
            }
        }


        // Insert the new log entry into the storage
        log_storage.insert(next_id, Candid(vec![formatted_log]));
    });

    // if call_inter_canister {
    //     send_log_to_logs_canister(logs_canister_id, oldest_log_id, oldest_log_to_send.clone())
    //         .await?;
    // }
    Ok(())
}

// pub async fn send_log_to_logs_canister(
//     logs_canister_id: Principal,
//     log_id: u32,
//     log: Candid<Vec<String>>,
// ) -> Result<(), Error> {

//     let log_data: String = log.0[0].clone();

//     match call::<(u32, String), ()>(logs_canister_id, "receive_log", (log_id, log_data)).await {
//         Ok(()) => {
//             ic_cdk::println!("Log sent successfully to logs canister.");
//             Ok(())
//         }
//         Err(e) => {
//             ic_cdk::println!("Failed to send log to logs canister. Error: {:?}", e.1);
//             Err(Error::InvalidCanister)
//         }
//     }
// }

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

// pub fn get_stored_logs() -> Vec<String> {
//     STATE.with(|state| {
//         let state_ref = state.borrow();
//         let log_storage = &state_ref.log_storage;
        
//         // Collect all logs in order
//         let mut all_logs = Vec::new();
//         for (_, Candid(logs)) in log_storage.iter() {
//             all_logs.extend(logs.clone());
//         }
//         all_logs
//     })
// }

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
    // }

    let file_name = file.split('/').last().unwrap_or(file);

    let log_message = format!("[{}] [{}:{}] {}", level, file_name, line, msg);

    ic_cdk::println!("{}", log_message);

    // Only store logs at appropriate levels
    if level <= LogLevel::TRACE || level <= get_log_level() {
        let _ = store_log(level, file, line, msg.to_string());
    }
}
