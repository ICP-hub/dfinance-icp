use crate::protocol::libraries::types::assets::*;


pub struct State {
    pub asset_index: AssetIndex,
    pub user_profile: UserProfile,
    pub reserve_list: ReserveList,
    pub price_cache_list: PriceCacheList,
}
