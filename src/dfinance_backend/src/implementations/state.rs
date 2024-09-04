
use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

use crate::constants::memory::{ASSET_INDEX_MEMORY_ID, USER_PROFILE_MEMORY_ID, RESERVES_MEMORY_ID};
use crate::declarations::state::State;
use crate::protocol::libraries::types::assets::{AssetIndex, ReserveList, UserProfile};

impl State {
    pub fn new(memory_manager: &MemoryManager<DefaultMemoryImpl>) -> Self {
        Self {
            asset_index: AssetIndex::init(memory_manager.get(ASSET_INDEX_MEMORY_ID)),
            user_profile: UserProfile::init(memory_manager.get(USER_PROFILE_MEMORY_ID)),
            reserve_list: ReserveList::init(memory_manager.get(RESERVES_MEMORY_ID)),
        }
    }
}
