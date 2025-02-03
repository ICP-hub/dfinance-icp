use crate::constants::errors::Error;
use candid::{Nat, Principal};
use ic_cdk::{query, update};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

/// Global lock to manage user locks.
pub static LOCKS: Lazy<Mutex<HashMap<Principal, bool>>> = Lazy::new(|| Mutex::new(HashMap::new()));
pub static AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static REPAY_AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static TO_CHECK_AMOUNT: Lazy<Mutex<HashMap<Principal, ()>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// @notice Attempts to acquire a lock for the given key (Principal).
/// @dev Uses a global lock (`LOCKS`) to track locked keys.
/// @param key The Principal ID for which the lock is being acquired.
/// @return Returns `Ok(())` if the lock is acquired successfully, otherwise returns an `Error`.
/// @custom:error `LockAcquisitionFailed` if the global lock cannot be acquired.
/// @custom:error `LockOperationInProgess` if the key is already locked.    
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

/// @notice Releases the lock for the given key (Principal).
/// @dev Uses a global lock (`LOCKS`) to track and remove locked keys.
/// @param key The Principal ID for which the lock is being released.
/// @return Returns `Ok(())` if the lock is released successfully, otherwise returns an `Error`.
/// @custom:error `LockAcquisitionFailed` if the global lock cannot be acquired.
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

/// @notice Locks a specified amount of an asset for a user.
/// @dev Manages locked amounts using `AMOUNT_LOCKS` and tracks users in `TO_CHECK_AMOUNT`.
/// @param asset The asset identifier (e.g., token name) to lock the amount for.
/// @param amount The amount of the asset to be locked.
/// @param user_principal The Principal ID of the user requesting the lock.
/// @return Returns `Ok(())` if the amount is locked successfully, otherwise returns an `Error`.
/// @custom:error `LockAcquisitionFailed` if the global lock for `AMOUNT_LOCKS` or `TO_CHECK_AMOUNT` cannot be acquired.
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

/// @notice Releases a specified amount of an asset from the locked balance.
/// @dev Updates the `AMOUNT_LOCKS` to reflect the released amount. If the locked balance becomes zero, it removes the asset entry.
/// @param asset The asset identifier (e.g., token name) from which the amount is to be released.
/// @param amount The amount of the asset to be released.
/// @return Returns `Ok(())` if the amount is released successfully, otherwise returns an `Error`.
/// @custom:error `LockAcquisitionFailed` if the global lock for `AMOUNT_LOCKS` cannot be acquired.
/// @custom:error `AmountSubtractionError` if the release amount exceeds the currently locked balance.
/// @custom:error `EmptyAsset` if no locked amount exists for the specified asset.
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

/// @notice Retrieves the currently locked amount for a specified asset.
/// @dev Fetches the locked amount from `AMOUNT_LOCKS`. If the lock cannot be acquired or no amount is found, it returns `0`.
/// @param asset The asset identifier (e.g., token name) whose locked amount is to be retrieved.
/// @return The amount of the asset that is currently locked.
/// @custom:returns `0` if no lock exists for the asset or if the lock acquisition fails.
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

/// @notice Checks if a given user principal has a locked amount.
/// @dev Acquires a lock on `TO_CHECK_AMOUNT` and checks if the user's principal exists in the map.
///      If found, it removes the entry and returns `true`, indicating that the user had a locked amount.
/// @param user_principal The principal ID of the user to check for locked amounts.
/// @return `true` if the user's principal is found and removed, otherwise `false`.
/// @custom:error Returns `false` if the lock on `TO_CHECK_AMOUNT` cannot be acquired.
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
