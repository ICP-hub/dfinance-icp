use crate::api::query::{self, get_canister_id_by_name};
use crate::constants::errors::Error;
use crate::stable_storage::state_handler::{mutate_state, read_state, STATE};
use crate::stable_storage::storable::Candid;
use candid::Principal;
use ic_cdk::{call, query};
use ic_cdk::{api, update};
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

const MAX_LOGS: u64 = 100; // Define maximum number of logs to store

pub async fn store_log(
    level: LogLevel,
    file: &str,
    line: u32,
    message: String,
) -> Result<(), Error> {
    let timestamp = api::time() / 1_000_000_000;
    let file_name = file.split('/').last().unwrap_or(file);
    let logs_canister_id = get_canister_id_by_name("logs".to_string()).unwrap();
    let mut oldest_log_to_send = Default::default();
    let mut oldest_log_id: u32 = 0;
    let mut call_inter_canister = false;

    let formatted_log = format!(
        "[{}] [{}] [{}:{}] {}",
        timestamp, level, file_name, line, message
    );

    ic_cdk::println!("Storing log: {}", formatted_log);

    mutate_state(|state| {
        let log_storage = &mut state.log_storage;

        ic_cdk::println!("Current log storage size: {}", log_storage.len());

        let mut highest_key = 0;
        for (key, _) in log_storage.iter() {
            ic_cdk::println!("Current log ID: {}", key);
            if key > highest_key {
                highest_key = key;
            }
        }
        ic_cdk::println!("Highest log ID: {}", highest_key);

        // Calculate the next log ID
        let next_id = highest_key + 1;

        // If we've reached the maximum logs, remove the oldest one
        if log_storage.len() >= MAX_LOGS {
            // Remove the smallest key (oldest log)
            if let Some((oldest_id, oldest_log)) = log_storage.iter().next() {
                oldest_log_to_send = oldest_log.clone();
                oldest_log_id = oldest_id;
                call_inter_canister = true;
                log_storage.remove(&oldest_id);
            }
        }

        ic_cdk::println!("Next log ID: {}", next_id);

        // Insert the new log entry into the storage
        log_storage.insert(next_id, Candid(vec![formatted_log]));
    });

    if call_inter_canister {
        send_log_to_logs_canister(logs_canister_id, oldest_log_id, oldest_log_to_send.clone())
            .await?;
    }
    Ok(())
}


pub async fn send_log_to_logs_canister(
    logs_canister_id: Principal,
    log_id: u32,
    log: Candid<Vec<String>>,
) -> Result<(), Error> {
    ic_cdk::println!(
        "Initiating log transfer to logs_canister_id {:?} with log ID {} and log data: {:?}",
        logs_canister_id,
        log_id,
        log
    );

    if log.0.is_empty() {
        ic_cdk::println!("No log entries to send.");
        return Err(Error::InvalidCanister);
    }

    let log_data: String = log.0[0].clone();
    ic_cdk::println!("Sending log entry: ID = {}, Data = {:?}", log_id, log_data);

    match call::<(u32, String), ()>(logs_canister_id, "receive_log", (log_id, log_data)).await {
        Ok(()) => {
            ic_cdk::println!("Log sent successfully to logs canister.");
            Ok(())
        }
        Err(e) => {
            ic_cdk::println!("Failed to send log to logs canister. Error: {:?}", e.1);
            Err(Error::InvalidCanister)
        }
    }
}

//TODO: can remove later.
#[update]
pub async fn insert_multiple_logs() -> Result<(), Error> {
    for i in 0..1 {
        let level = match i % 5 {
            0 => LogLevel::ERROR,
            1 => LogLevel::WARN,
            2 => LogLevel::INFO,
            3 => LogLevel::DEBUG,
            _ => LogLevel::TRACE,
        };

        let file = "example_file.rs"; // You can change this to simulate different files
        let line = (i + 1) * 10; // Just a dummy line number
        let message = format!("This is log number {}", i + 1); // Log message

        store_log(level, file, line, message).await?;
    }
    Ok(())
}

//TODO: can remove later.
#[query]
pub fn get_all_logs() -> Vec<String> {
    // Read-only access to the log storage
    read_state(|state| {
        let log_storage = &state.log_storage;

        let mut logs: Vec<(u32, String)> = Vec::new();

        for (key, value) in log_storage.iter() {
            // Assume value is a Candid(vec![formatted_log])
            if let Some(log) = value.0.get(0) {
                logs.push((key, log.clone()));
            }
        }

        // Sort logs by key (optional, in case keys are not perfectly ordered)
        logs.sort_by_key(|(key, _)| *key);

        // Return just the logs (without the IDs)
        logs.into_iter().map(|(_, log)| log).collect()
    })
}
