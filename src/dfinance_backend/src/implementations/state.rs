
use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};

use crate::constants::memory::{ASSET_INDEX_MEMORY_ID, CANISTER_MEMORY_ID, PRICE_CACHE_MEMORY_ID, RESERVES_MEMORY_ID, USER_PROFILE_MEMORY_ID};
use crate::declarations::state::State;
use crate::protocol::libraries::types::assets::{AssetIndex, CanisterList, PriceCacheList, ReserveList, UserProfile};

impl State {
    pub fn new(memory_manager: &MemoryManager<DefaultMemoryImpl>) -> Self {
        Self {
            asset_index: AssetIndex::init(memory_manager.get(ASSET_INDEX_MEMORY_ID)),
            user_profile: UserProfile::init(memory_manager.get(USER_PROFILE_MEMORY_ID)),
            reserve_list: ReserveList::init(memory_manager.get(RESERVES_MEMORY_ID)),
            price_cache_list: PriceCacheList::init(memory_manager.get(PRICE_CACHE_MEMORY_ID)),
            canister_list: CanisterList::init(memory_manager.get(CANISTER_MEMORY_ID)),
        }
    }
}
