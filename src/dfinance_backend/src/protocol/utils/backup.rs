use crate::api::query::get_canister_id_by_name;
use crate::constants::constant_variables::constants::DATA_STORAGE_CANISTER_NAME;
use crate::stable_storage::state_handler::{mutate_state, read_state};
use crate::stable_storage::storable::Candid;
use ic_cdk::{call, update,api};
use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use crate::declarations::datatypes::{ReserveData,FaucetReserves, UserData, PriceCache, AssetInfo, InitArgs};
use std::collections::BTreeMap;
use crate::protocol::utils::log::{log_internal, LogLevel};
use crate::error;
use crate::guards::access_control::guard_controller_only;


/**  Snapshot struct represents the entire state snapshot of the system.
*    It contains mappings of asset indices, faucet data, user profiles, and tester lists.
*    Used for serialization/deserialization to export or import the complete system state.
*/
#[derive(Serialize, Deserialize)]
struct Snapshot {
    asset_index: BTreeMap<String, ReserveData>,
    user_profile: BTreeMap<Principal, UserData>,
    reserve_list: BTreeMap<String, Principal>,
    canister_list: BTreeMap<String, Principal>,
    meta_data: BTreeMap<String, InitArgs>,
    tester_list: BTreeMap<String, Principal>,
    access_control: BTreeMap<Principal, Vec<String>>,
    asset_records: BTreeMap<String, AssetInfo>,
    faucet_data: BTreeMap<Principal, FaucetReserves>,
}


/**
 * BackupData struct encapsulates backup payload for inter-canister communication.
 * It holds the timestamp when the backup was created and the actual data as a JSON string.
 */
#[derive(CandidType, Deserialize, Clone)]
pub struct BackupData {
    pub upload_time: u64,
    pub data: String,
}

/**
 * @title Export Snapshot
 * @notice Serializes the current full state snapshot of the system into a JSON string.
 * @functionality This function gathers the current system state from asset indices, faucet data,
 *               user profiles, and tester lists, packages them into a `Snapshot` struct,
 *               and serializes it to a JSON string for backup or transfer.
 * @return A JSON string representing the serialized snapshot of the entire system state.
 */
fn export_snapshot() -> String {
    read_state(|state| {
        let snapshot = Snapshot {
            asset_index: state.asset_index.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            user_profile: state.user_profile.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            reserve_list: state.reserve_list.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
            canister_list: state.canister_list.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
            meta_data: state.meta_data.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            tester_list: state.tester_list.iter().map(|(k, v)| (k.clone(), v.clone())).collect(),
            access_control: state.access_control.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            asset_records: state.asset_records.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
            faucet_data: state.faucet_data.iter().map(|(k, v)| (k.clone(), v.0.clone())).collect(),
        };

        serde_json::to_string(&snapshot).expect("Serialization failed")
    })
}




/**
 * @title Import Snapshot
 * @notice Deserializes a given JSON string to restore the system state snapshot.
 * @functionality This function parses the provided JSON string into a `Snapshot` struct,
 *               then updates the system's internal state with the snapshot's content,
 *               restoring asset indices, faucet data, user profiles, and tester lists.
 * @param snapshot_json A JSON string representing the serialized snapshot of the system state.
 * @return None (side effects on internal state).
 */
pub fn import_snapshot(snapshot_json: &str) {
    let snapshot: Snapshot = serde_json::from_str(snapshot_json)
        .expect("Failed to parse snapshot JSON");

    mutate_state(|state| {
        if !state.asset_index.is_empty() {
            state.asset_index.clear_new();
        }
        if !state.user_profile.is_empty() {
            state.user_profile.clear_new();
        }
        if !state.reserve_list.is_empty() {
            state.reserve_list.clear_new();
        }
        if !state.canister_list.is_empty() {
            state.canister_list.clear_new();
        }
        if !state.meta_data.is_empty() {
            state.meta_data.clear_new();
        }
        if !state.tester_list.is_empty() {
            state.tester_list.clear_new();
        }
        if !state.access_control.is_empty() {
            state.access_control.clear_new();
        }
        if !state.asset_records.is_empty() {
            state.asset_records.clear_new();
        }
        if !state.faucet_data.is_empty() {
            state.faucet_data.clear_new();
        }
    });

    mutate_state(|state| {
        for (k, v) in snapshot.asset_index {
            state.asset_index.insert(k, Candid(v));
        }
        for (k, v) in snapshot.user_profile {
            state.user_profile.insert(k, Candid(v));
        }
        for (k, v) in snapshot.reserve_list {
            state.reserve_list.insert(k, v);
        }
        for (k, v) in snapshot.canister_list {
            state.canister_list.insert(k, v);
        }
        for (k, v) in snapshot.meta_data {
            state.meta_data.insert(k, Candid(v));
        }
        for (k, v) in snapshot.tester_list {
            state.tester_list.insert(k, v);
        }
        for (k, v) in snapshot.access_control {
            state.access_control.insert(k, Candid(v));
        }
        for (k, v) in snapshot.asset_records {
            state.asset_records.insert(k, Candid(v));
        }
        for (k, v) in snapshot.faucet_data {
            state.faucet_data.insert(k, Candid(v));
        }
    });
}




/**
 * @title Send Backup Data to data_storage canister
 * @notice Exports the current system snapshot and sends it to a designated data_storage canister for backup storage.
 * @functionality This async update function fetches the data_storage canister ID, exports the current snapshot,
 *               packages it into a `BackupData` struct with a timestamp, and performs an inter-canister
 *               call to the data_storage canister's `receive_data_backup` method to save the backup.
 * @return `Result<(), String>` indicating success or failure with an error message.
 */
#[update]
pub async fn send_backup_data_to_canister() -> Result<(), String> {
    match guard_controller_only(){
        Ok(_) => {},
        Err(e) => {
            error!("❌ Access denied: {}", e.message());
            return Err(e.message().to_string());
        }
    };
    let logs_canister_id = match get_canister_id_by_name(DATA_STORAGE_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => {
            error!("❌ Failed to get data_storage canister ID");
            return Err("Failed to get data_storage canister ID".to_string());
        },
    };

    let backup_data = export_snapshot();

    let backup_param = BackupData {
        upload_time: api::time(),
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
            Err(format!("Error from data_storage canister: {}", err_msg))
        }
        Err((code, msg)) => {
            error!("❌ Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg);
            Err(format!("Inter-canister call failed. Code: {:?}, Message: {:?}", code, msg))
        }
    }
}

/**
 * @title Receive and Load Data Backup from data_storage canister
 * @notice Retrieves a specific backup by ID from the data_storage canister and loads it into the current system state.
 * @functionality This async update function obtains the data_storage canister ID, requests the backup data
 *               identified by `backup_id` from the data_storage canister via inter-canister call, deserializes
 *               the backup data, and imports the snapshot into the system state.
 * @param backup_id The unique identifier of the backup to retrieve.
 * @return `Result<(), String>` indicating success or failure with an error message.
 */
#[update]
pub async fn receive_and_load_data_backup(backup_id: u64) -> Result<(), String> {

    match guard_controller_only(){
        Ok(_) => {},
        Err(e) => {
            error!("❌ Access denied: {}", e.message());
            return Err(e.message().to_string());
        }
    };
    let logs_canister_id = match get_canister_id_by_name(DATA_STORAGE_CANISTER_NAME.to_string()) {
        Ok(id) => id,
        Err(_) => {
            error!("❌ Failed to get data_storage canister ID");
            return Err("Failed to get data_storage canister ID".to_string());
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
            return Err(format!("Error from data_storage canister: {}", err_msg));
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
