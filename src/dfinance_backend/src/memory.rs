use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

use std::cell::RefCell;
/*
 * @title Memory Manager
 * @dev This thread-local static variable initializes and manages the memory allocation.
 * @notice It uses the `MemoryManager` with the `DefaultMemoryImpl` implementation.
 * @returns A `RefCell` wrapping a `MemoryManager` instance.
 */

thread_local! {

    // The memory manager.
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

}
