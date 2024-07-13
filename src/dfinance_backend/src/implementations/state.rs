//you can create implementation for any struct or enum in this folder
//you can also create new files in this folder
use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

use crate::constants::memory::ASSET_INDEX_MEMORY_ID;
use crate::declarations::state::State;
use crate::protocol::libraries::types::assets::AssetIndex;

impl State {
    pub fn new(memory_manager: &MemoryManager<DefaultMemoryImpl>) -> Self {
        Self {
            asset_index: AssetIndex::init(memory_manager.get(ASSET_INDEX_MEMORY_ID)),
        }
    }
}
