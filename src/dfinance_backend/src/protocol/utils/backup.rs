use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::LOG_CANISTER_NAME;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::stable_storage::storable::Candid;
use ic_cdk::api;
use candid::Principal;
use ic_cdk::{call, update};
use candid::{CandidType, Deserialize};
use serde::Serialize;
use crate::declarations::datatypes::{ReserveData,FaucetReserves, UserData};
use std::collections::BTreeMap;
use crate::protocol::utils::log::{log_internal, LogLevel, LogFlusher};
use crate::{debug, error, info};


// --- Data Structures ---

#[derive(Serialize, Deserialize)]
struct Snapshot {
    asset_index: BTreeMap<String, ReserveData>,
    faucet_data: BTreeMap<Principal, FaucetReserves>,
    user_profile: BTreeMap<Principal, UserData>,
    tester_list: BTreeMap<String, Principal>,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct BackupData {
    pub load_time: u64,
    pub data: String,
}

// --- Export Snapshot ---

fn export_snapshot() -> String {
    read_state(|state| {
        let snapshot = Snapshot {
            asset_index: state.asset_index.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            faucet_data: state.faucet_data.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            user_profile: state.user_profile.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            tester_list: state.tester_list.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
        };

        serde_json::to_string(&snapshot).expect("Serialization failed")
    })
}

// --- Import Snapshot ---

pub fn import_snapshot(snapshot_json: &str) {
    let snapshot: Snapshot = serde_json::from_str(snapshot_json)
        .expect("Failed to parse snapshot JSON");

    mutate_state(|state| {
        for (k, v) in snapshot.asset_index {
            state.asset_index.insert(k, Candid(v));
        }
        for (k, v) in snapshot.faucet_data {
            state.faucet_data.insert(k, Candid(v));
        }
        for (k, v) in snapshot.user_profile {
            state.user_profile.insert(k, Candid(v));
        }
        for (k, v) in snapshot.tester_list {
            state.tester_list.insert(k, v);
        }
    });
}

// --- Send Backup to Logs Canister ---

#[update]
pub async fn send_backup_data_to_canister() -> Result<(), String> {
    let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => {
            error!("❌ Failed to get logs canister ID");
            return Err("Failed to get logs canister ID".to_string());
        },
    };

    let backup_data = export_snapshot();

    let backup_param = BackupData {
        load_time: api::time(),
        data: serde_json::to_string(&backup_data).expect("Failed to encode snapshot string"),
    };

    match call::<(BackupData,), (Result<(), String>,)>(
        logs_canister_id,
        "receive_data_backup",
        (backup_param,)
    ).await {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(err_msg),)) => {
            error!("❌ receive_logs_batch returned error: {}", err_msg);
            Err(format!("Error from logs canister: {}", err_msg))
        }
        Err((code, msg)) => {
            error!("❌ Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg);
            Err(format!("Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg))
        }
    }
}

// --- Load Backup from Logs Canister ---

#[update]
pub async fn receive_and_load_data_backup(backup_id: u64) -> Result<(), String> {
    let logs_canister_id = match get_canister_id_by_name(LOG_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => {
            error!("❌ Failed to get logs canister ID");
            return Err("Failed to get logs canister ID".to_string());
        },
    };

    let backup_data = match call::<(u64,), (Result<BackupData, String>,)>(
        logs_canister_id,
        "get_data_backup",
        (backup_id,)
    ).await {
        Ok((Ok(data),)) => data,
        Ok((Err(err_msg),)) => {
            error!("❌ get_data_backup returned error: {}", err_msg);
            return Err(format!("Error from logs canister: {}", err_msg));
        }
        Err((code, msg)) => {
            error!("❌ Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg);
            return Err(format!("Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg));
        }
    };

    // Decode inner snapshot string from JSON
    let raw_snapshot_str = serde_json::from_str::<String>(&backup_data.data)
        .map_err(|e| format!("❌ Failed to decode snapshot JSON string: {}", e))?;

    // Load the snapshot
    import_snapshot(&raw_snapshot_str);

    Ok(())
}
