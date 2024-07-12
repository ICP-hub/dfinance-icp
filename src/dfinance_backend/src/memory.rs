use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

use std::cell::RefCell;

thread_local! {

    // The memory manager.
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

}
