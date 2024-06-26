use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{ DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;
use crate::types::user::UserDataStorage;

// A memory for upgrades, where data from the heap can be serialized/deserialized.
// const UPGRADES: MemoryId = MemoryId::new(0);

// A memory for the StableBTreeMap we're using. A new memory should be created for
// every additional stable structure.
// const STABLE_BTREE: MemoryId = MemoryId::new(1);




const USER_DATA_MEMORY_ID: MemoryId = MemoryId::new(0);

pub struct State {
    pub user_data: UserDataStorage,
}

thread_local! {
    // The memory manager is used for simulating multiple memories. Given a `MemoryId` it can
    // return a memory that can be used by stable structures.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State {
            user_data: UserDataStorage::init(mm.borrow().get(USER_DATA_MEMORY_ID)),
    }));
}

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|cell| f(&cell.borrow()))
}

pub fn mutate_state<R>(f: impl FnOnce(&mut State) -> R) -> R {
    STATE.with(|cell| f(&mut cell.borrow_mut()))
}

