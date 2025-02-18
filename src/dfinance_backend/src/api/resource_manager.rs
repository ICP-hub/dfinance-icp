use crate::constants::errors::Error;
use candid::{Nat, Principal};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

/*
 * Global lock to manage user locks.
 */
pub static LOCKS: Lazy<Mutex<HashMap<Principal, bool>>> = Lazy::new(|| Mutex::new(HashMap::new()));
pub static AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static REPAY_AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
pub static TO_CHECK_AMOUNT: Lazy<Mutex<HashMap<Principal, ()>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/*
 * @title Lock Management - Acquire Lock
 * @notice Attempts to acquire a lock for the given key (Principal).
 * @dev Uses a global lock (`LOCKS`) to track locked keys and prevent concurrent operations.
 *
 * # Parameters
 * @param key The Principal ID for which the lock is being acquired.
 *
 * # Returns
 * @return `Ok(())` if the lock is acquired successfully.
 */
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

/*
 * @title Lock Management - Release Lock
 * @notice Releases the lock for the given key (Principal).
 * @dev Uses a global lock (`LOCKS`) to track and remove locked keys.
 *
 * # Parameters
 * @param key The Principal ID for which the lock is being released.
 *
 * # Returns
 * @return `Ok(())` if the lock is released successfully.
 */
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

/*
 * @title Asset Lock Management - Lock Amount
 * @notice Locks a specified amount of an asset for a user.
 * @dev Manages locked amounts using `AMOUNT_LOCKS` and tracks users in `TO_CHECK_AMOUNT`.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) to lock the amount for.
 * @param amount The amount of the asset to be locked.
 * @param user_principal The Principal ID of the user requesting the lock.
 *
 * # Returns
 * @return `Ok(())` if the amount is locked successfully.
 */
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

/*
 * @title Asset Lock Management - Release Amount
 * @notice Releases a specified amount of an asset from the locked balance.
 * @dev Updates `AMOUNT_LOCKS` to reflect the released amount. If the locked balance becomes zero, it removes the asset entry.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) from which the amount is to be released.
 * @param amount The amount of the asset to be released.
 *
 * # Returns
 * @return `Ok(())` if the amount is released successfully.
 */
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

/*
 * @title Asset Lock Management - Get Locked Amount
 * @notice Retrieves the currently locked amount for a specified asset.
 * @dev Fetches the locked amount from `AMOUNT_LOCKS`. If no amount is found, it returns `0`.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) whose locked amount is to be retrieved.
 *
 * # Returns
 * @return `Nat` - The amount of the asset that is currently locked.
 */
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

/*
 * @title Asset Lock Management - Check Locked Amount
 * @notice Checks if a given user principal has a locked amount.
 * @dev Acquires a lock on `TO_CHECK_AMOUNT` and checks if the user's principal exists in the map.
 *      If found, it removes the entry and returns `true`, indicating that the user had a locked amount.
 *
 * # Parameters
 * @param user_principal The principal ID of the user to check for locked amounts.
 *
 * # Returns
 * @return `bool` - Returns `true` if the user's principal is found and removed, otherwise `false`.
 */
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

/*
 * @title Repay Lock Management
 * @notice Locks a specified amount of an asset for repayment.
 * @dev Uses `REPAY_AMOUNT_LOCKS` to manage locked amounts for repayment.
 *      Ensures proper handling in case of lock acquisition failure.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) for which the amount is locked.
 * @param amount The amount of the asset to be locked for repayment.
 *
 * # Returns
 * @return `Ok(())` if the amount is locked successfully.
 */
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

/*
 * @title Repay Lock Release
 * @notice Releases a specified amount of an asset from the locked repayment balance.
 * @dev Updates `REPAY_AMOUNT_LOCKS` to reflect the released amount.
 *      If the locked balance reaches zero, it removes the asset entry.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) from which the amount is to be released.
 * @param amount The amount of the asset to be released.
 *
 * # Returns
 * @return `Ok(())` if the amount is successfully released.
 */
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

/*
 * @title Get Repay Locked Amount
 * @notice Retrieves the currently locked repayment amount for a specified asset.
 * @dev Fetches the locked amount from `REPAY_AMOUNT_LOCKS`.
 *      If the lock cannot be acquired or no amount is found, it returns `0`.
 *
 * # Parameters
 * @param asset The asset identifier (e.g., token name) whose locked repayment amount is to be retrieved.
 *
 * # Returns
 * @return `Nat` - The amount of the asset that is currently locked.
 */
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
