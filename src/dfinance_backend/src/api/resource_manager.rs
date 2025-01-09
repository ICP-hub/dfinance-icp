use crate::constants::errors::Error;
use candid::{Nat, Principal};
use ic_cdk::{query, update};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

pub static LOCKS: Lazy<Mutex<HashMap<Principal, bool>>> = Lazy::new(|| Mutex::new(HashMap::new()));
pub static AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub fn acquire_lock(key: &Principal) -> Result<(), Error> {
    ic_cdk::println!("Attempting to acquire lock for key: {}", key);

    // Attempt to acquire the mutex lock for LOCKS
    let mut locks = match LOCKS.lock() {
        Ok(lock) => {
            ic_cdk::println!("Successfully acquired global lock for managing user locks.");
            lock
        }
        Err(_) => {
            ic_cdk::println!("Failed to acquire the global lock for managing user locks.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    // Print the current state of the locks before acquiring
    ic_cdk::println!("Locks state before acquiring: {:?}", locks);

    // Check if the key is already locked
    if locks.get(key).copied().unwrap_or(false) {
        ic_cdk::println!("Lock acquisition failed: Key '{}' is already locked.", key);
        return Err(Error::LockOperationInProgess);
    }

    // Acquire the lock for the key
    locks.insert(*key, true);
    ic_cdk::println!("Lock acquired successfully for key: {}", key);

    // Print the state of the locks after acquiring
    ic_cdk::println!("Locks state after acquiring: {:?}", locks);

    Ok(())
}

pub fn release_lock(key: &Principal) -> Result<(), Error> {
    ic_cdk::println!("Attempting to release lock for key: {}", key);

    // Attempt to acquire the mutex lock for LOCKS
    let mut locks = match LOCKS.lock() {
        Ok(lock) => {
            ic_cdk::println!("Successfully acquired global lock for managing user locks.");
            lock
        }
        Err(_) => {
            ic_cdk::println!("Failed to acquire the global lock for managing user locks.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    // Print the current state of the locks before releasing
    ic_cdk::println!("Locks state before releasing: {:?}", locks);

    // Release the lock for the key (remove the key from the map)
    if locks.remove(key).is_some() {
        ic_cdk::println!("Lock released successfully for key: {}", key);
    } else {
        ic_cdk::println!(
            "Release lock failed: No lock existed for key '{}'. It may have already been released.",
            key
        );
    }

    // Print the state of the locks after releasing
    ic_cdk::println!("Locks state after releasing: {:?}", locks);

    Ok(())
}

#[update]
pub fn clear_all_locks() -> Result<(), Error> {
    ic_cdk::println!("Attempting to clear all user locks.");

    // Attempt to acquire the mutex lock for LOCKS
    let mut locks = match LOCKS.lock() {
        Ok(lock) => {
            ic_cdk::println!("Successfully acquired global lock for clearing all user locks.");
            lock
        }
        Err(_) => {
            ic_cdk::println!("Failed to acquire the global lock for clearing user locks.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    // Print the current state of the locks before clearing
    ic_cdk::println!("Locks state before clearing: {:?}", locks);

    // Clear all the locks
    locks.clear();
    ic_cdk::println!("All locks cleared successfully.");

    // Print the state of the locks after clearing
    ic_cdk::println!("Locks state after clearing: {:?}", locks);

    Ok(())
}

#[query]
pub fn get_all_principals() -> Result<Vec<Principal>, Error> {
    ic_cdk::println!("Retrieving all principals from the locks.");

    // Attempt to acquire the mutex lock for LOCKS
    let locks = match LOCKS.lock() {
        Ok(lock) => {
            ic_cdk::println!("Successfully acquired global lock for retrieving principals.");
            lock
        }
        Err(_) => {
            ic_cdk::println!("Failed to acquire the global lock for retrieving principals.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    // Collect all the principals in the locks map
    let principals: Vec<Principal> = locks.keys().cloned().collect();
    ic_cdk::println!("Found principals: {:?}", principals);

    Ok(principals)
}

/// on amount
pub fn lock_amount(asset: &str, amount: &Nat) -> Result<(), Error> {
    let mut locks = match AMOUNT_LOCKS.lock() {
        Ok(lock) => lock,
        Err(_) => return Err(Error::LockAcquisitionFailed),
    };
    let current_locked = locks
        .get(asset)
        .cloned()
        .unwrap_or_else(|| Nat::from(0u128));
    locks.insert(asset.to_string(), current_locked + amount.clone());
    Ok(())
}

pub fn release_amount(asset: &str, amount: &Nat) -> Result<(), Error> {
    let mut locks = AMOUNT_LOCKS
        .lock()
        .map_err(|_| Error::LockAcquisitionFailed)?;

    if let Some(current_locked) = locks.get_mut(asset) {
        ic_cdk::println!("Amount to release: {}", amount);
        ic_cdk::println!("Current locked amount: {}", current_locked);

        // if *amount > *current_locked {
        //     return Err(Error::AmountTooMuch);
        // }

        *current_locked -= amount.clone();

        if *current_locked == Nat::from(0u128) {
            locks.remove(asset);
            ic_cdk::println!("Asset lock for '{}' fully released.", asset);
        } else {
            ic_cdk::println!("Updated locked amount for '{}': {}", asset, current_locked);
        }
    } else {
        ic_cdk::println!("No locked amount found for asset '{}'.", asset);
        return Err(Error::EmptyAsset);
    }

    Ok(())
}

pub fn get_locked_amount(asset: &str) -> Nat {
    AMOUNT_LOCKS
        .lock()
        .map(|locks| {
            locks
                .get(asset)
                .cloned()
                .unwrap_or_else(|| Nat::from(0u128))
        })
        .unwrap_or_else(|_| Nat::from(0u128))
}
