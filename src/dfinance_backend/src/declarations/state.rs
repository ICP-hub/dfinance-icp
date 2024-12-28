use crate::protocol::libraries::types::assets::*;

use super::assets::InitArgs;


pub struct State {
    pub asset_index: AssetIndex,
    pub user_profile: UserProfile,
    pub reserve_list: ReserveList,
    pub price_cache_list: PriceCacheList,
    pub canister_list:CanisterList, 
    pub meta_data: MetaData
}
