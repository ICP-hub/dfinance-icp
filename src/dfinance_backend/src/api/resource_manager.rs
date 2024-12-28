use std::collections::HashMap;
use std::sync::Mutex;
use candid::Nat;
use ic_cdk::query;
use once_cell::sync::Lazy;

pub static LOCKS: Lazy<Mutex<HashMap<String, bool>>> = Lazy::new(|| Mutex::new(HashMap::new()));
pub static AMOUNT_LOCKS: Lazy<Mutex<HashMap<String, Nat>>> = Lazy::new(|| Mutex::new(HashMap::new()));
//on user
pub fn acquire_lock(key: &str) -> Result<(), String> {
    ic_cdk::println!("acquire_lock: {}", key);
    let mut locks = LOCKS.lock().map_err(|_| "Failed to acquire lock".to_string())?;
    if locks.get(key).copied().unwrap_or(false) {
        return Err(format!("Another operation is already in progress for user: {}", key));
    }
    locks.insert(key.to_string(), true);
    Ok(())
}

pub fn release_lock(key: &str) {
    ic_cdk::println!("release_lock: {}", key);
    let mut locks = LOCKS.lock().unwrap_or_else(|e| {
        panic!("Failed to release lock: {}", e);
    });
    locks.remove(key);
}



/// on amount
pub fn lock_amount(asset: &str, amount: &Nat) -> Result<(), String> {
    let mut locks = AMOUNT_LOCKS.lock().map_err(|_| "Failed to acquire lock".to_string())?;
    let current_locked = locks.get(asset).cloned().unwrap_or_else(|| Nat::from(0u128));
    locks.insert(asset.to_string(), current_locked + amount.clone());
    Ok(())
}


pub fn release_amount(asset: &str, amount: &Nat) {
    let mut locks = AMOUNT_LOCKS.lock().unwrap_or_else(|e| {
        panic!("Failed to release lock: {}", e);
    });

    if let Some(current_locked) = locks.get_mut(asset) {
        *current_locked -= amount.clone();
        if *current_locked == Nat::from(0u128) {
            locks.remove(asset);
        }
    }
}


pub fn get_locked_amount(asset: &str) -> Nat {
    AMOUNT_LOCKS
        .lock()
        .map(|locks| locks.get(asset).cloned().unwrap_or_else(|| Nat::from(0u128)))
        .unwrap_or_else(|_| Nat::from(0u128))
}

