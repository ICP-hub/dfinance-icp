use crate::constants::errors::Error;
use candid::{Nat, Principal};
use ic_cdk::{query, update};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

pub static LOCKS: Lazy<Mutex<HashMap<Principal, bool>>> = Lazy::new(|| Mutex::new(HashMap::new()));
pub static AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static REPAY_AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static TO_CHECK_AMOUNT: Lazy<Mutex<HashMap<Principal, ()>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn acquire_lock(key: &Principal) -> Result<(), Error> {
    ic_cdk::println!("Attempting to acquire lock for key: {}", key);

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

    ic_cdk::println!("Locks state before acquiring: {:?}", locks);

    if locks.get(key).copied().unwrap_or(false) {
        ic_cdk::println!("Lock acquisition failed: Key '{}' is already locked.", key);
        return Err(Error::LockOperationInProgess);
    }

    locks.insert(*key, true);
    ic_cdk::println!("Lock acquired successfully for key: {}", key);

    ic_cdk::println!("Locks state after acquiring: {:?}", locks);

    Ok(())
}

pub fn release_lock(key: &Principal) -> Result<(), Error> {
    ic_cdk::println!("Attempting to release lock for key: {}", key);

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

    ic_cdk::println!("Locks state before releasing: {:?}", locks);

    if locks.remove(key).is_some() {
        ic_cdk::println!("Lock released successfully for key: {}", key);
    } else {
        ic_cdk::println!(
            "Release lock failed: No lock existed for key '{}'. It may have already been released.",
            key
        );
    }

    ic_cdk::println!("Locks state after releasing: {:?}", locks);

    Ok(())
}

// TODO: remove this function no need in main code.
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

    ic_cdk::println!("Locks state before clearing: {:?}", locks);

    // Clear all the locks
    locks.clear();
    ic_cdk::println!("All locks cleared successfully.");

    // Print the state of the locks after clearing
    ic_cdk::println!("Locks state after clearing: {:?}", locks);

    Ok(())
}

// TODO: remove this function no need.
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

pub fn lock_amount(asset: &str, amount: &Nat, user_principal: &Principal) -> Result<(), Error> {
    ic_cdk::println!("Attempting to lock amount: {} for asset: {}", amount, asset);

    let mut amount_locks = match AMOUNT_LOCKS.lock() {
        Ok(lock) => lock,
        Err(_) => {
            ic_cdk::println!("Failed to acquire lock for AMOUNT_LOCKS.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    let mut to_check_amount = match TO_CHECK_AMOUNT.lock() {
        Ok(lock) => lock,
        Err(_) => {
            ic_cdk::println!("Failed to acquire lock for TO_CHECK_AMOUNT.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    let current_locked = amount_locks
        .get(asset)
        .cloned()
        .unwrap_or_else(|| Nat::from(0u128));

    ic_cdk::println!(
        "Current locked amount for asset '{}': {}",
        asset,
        current_locked
    );

    let new_locked_amount = current_locked + amount.clone();
    amount_locks.insert(asset.to_string(), new_locked_amount.clone());

    ic_cdk::println!(
        "New locked amount for asset '{}': {}",
        asset,
        new_locked_amount
    );

    to_check_amount.insert(*user_principal, ());
    ic_cdk::println!("Stored user principal: {}", user_principal);

    Ok(())
}

pub fn release_amount(asset: &str, amount: &Nat) -> Result<(), Error> {
    let mut locks = AMOUNT_LOCKS
        .lock()
        .map_err(|_| Error::LockAcquisitionFailed)?;

    if let Some(current_locked) = locks.get_mut(asset) {
        ic_cdk::println!("Amount to release: {}", amount);
        ic_cdk::println!("Current locked amount: {}", current_locked);

        if current_locked < &mut amount.clone() {
            return Err(Error::AmountSubtractionError);
        }

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

pub fn is_amount_locked(user_principal: &Principal) -> bool {
    ic_cdk::println!("Checking principal existence: {:?}", user_principal);

    let mut to_check_amount = match TO_CHECK_AMOUNT.lock() {
        Ok(lock) => lock,
        Err(_) => {
            ic_cdk::println!("Failed to acquire lock for TO_CHECK_AMOUNT.");
            return false;
        }
    };

    if to_check_amount.contains_key(user_principal) {
        ic_cdk::println!(
            "Principal '{}' found. Clearing from TO_CHECK_AMOUNT.",
            user_principal
        );

        to_check_amount.remove(user_principal);

        true
    } else {
        ic_cdk::println!(
            "Principal '{}' not found in TO_CHECK_AMOUNT.",
            user_principal
        );
        false
    }
}

pub fn repay_lock_amount(asset: &str, amount: &Nat) -> Result<(), Error> {
    ic_cdk::println!("Attempting to lock amount: {} for asset: {}", amount, asset);

    let mut amount_locks = match REPAY_AMOUNT_LOCKS.lock() {
        Ok(lock) => lock,
        Err(_) => {
            ic_cdk::println!("Failed to acquire lock for AMOUNT_LOCKS.");
            return Err(Error::LockAcquisitionFailed);
        }
    };

    let current_locked = amount_locks
        .get(asset)
        .cloned()
        .unwrap_or_else(|| Nat::from(0u128));

    ic_cdk::println!(
        "Current locked amount for asset '{}': {}",
        asset,
        current_locked
    );

    let new_locked_amount = current_locked + amount.clone();
    amount_locks.insert(asset.to_string(), new_locked_amount.clone());

    ic_cdk::println!(
        "New locked amount for asset '{}': {}",
        asset,
        new_locked_amount
    );
    Ok(())
}

pub fn repay_release_amount(asset: &str, amount: &Nat) -> Result<(), Error> {
    let mut locks = REPAY_AMOUNT_LOCKS
        .lock()
        .map_err(|_| Error::LockAcquisitionFailed)?;

    if let Some(current_locked) = locks.get_mut(asset) {
        ic_cdk::println!("Amount to release: {}", amount);
        ic_cdk::println!("Current locked amount: {}", current_locked);

        if current_locked < &mut amount.clone() {
            return Err(Error::AmountSubtractionError);
        }

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

pub fn get_repay_locked_amount(asset: &str) -> Nat {
    REPAY_AMOUNT_LOCKS
        .lock()
        .map(|locks| {
            locks
                .get(asset)
                .cloned()
                .unwrap_or_else(|| Nat::from(0u128))
        })
        .unwrap_or_else(|_| Nat::from(0u128))
}
