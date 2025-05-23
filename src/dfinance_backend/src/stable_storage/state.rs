use ic_stable_structures::{memory_manager::MemoryManager, DefaultMemoryImpl};
use crate::stable_storage::memory::{
    ASSET_INDEX_MEMORY_ID,  CANISTER_MEMORY_ID,
    META_DATA, PRICE_CACHE_MEMORY_ID, RESERVES_MEMORY_ID, TESTER_LIST,
     USER_PROFILE_MEMORY_ID,
};
use crate::stable_storage::types::{
    AssetIndex,CanisterList, MetaData, PriceCacheList,
    ReserveList, TesterList, UserProfile,
};

use super::memory::{ADMIN_DATA, ASSET_RECORDS_MEMORY_ID, FAUCETDATA};
use super::types::{AdminData, AssetRecords, FaucetData};

pub struct State {
    pub asset_index: AssetIndex,
    pub user_profile: UserProfile,
    pub reserve_list: ReserveList,
    pub price_cache_list: PriceCacheList,
    pub canister_list: CanisterList,
    pub meta_data: MetaData,
    pub tester_list: TesterList,
    pub admin_data: AdminData,
    pub asset_records:AssetRecords,
    pub faucet_data: FaucetData,
}
/*
 * @title State
 * @functionality Manages and initializes the global state of the lending protocol using stable memory.
 * @notice This struct represents the global state of the lending protocol.
 * @dev The state is initialized using a memory manager that allocates persistent storage.
 *      It manages key protocol components such as user profiles, reserves, price cache, and metadata.
 */
impl State {
    pub fn new(memory_manager: &MemoryManager<DefaultMemoryImpl>) -> Self {
        Self {
            asset_index: AssetIndex::init(memory_manager.get(ASSET_INDEX_MEMORY_ID)),
            user_profile: UserProfile::init(memory_manager.get(USER_PROFILE_MEMORY_ID)),
            reserve_list: ReserveList::init(memory_manager.get(RESERVES_MEMORY_ID)),
            price_cache_list: PriceCacheList::init(memory_manager.get(PRICE_CACHE_MEMORY_ID)),
            canister_list: CanisterList::init(memory_manager.get(CANISTER_MEMORY_ID)),
            meta_data: MetaData::init(memory_manager.get(META_DATA)),
            tester_list: TesterList::init(memory_manager.get(TESTER_LIST)),
            admin_data: AdminData::init(memory_manager.get(ADMIN_DATA)),
            asset_records: AssetRecords::init(memory_manager.get(ASSET_RECORDS_MEMORY_ID)),
            faucet_data: FaucetData::init(memory_manager.get(FAUCETDATA)),
        }
    }
}
