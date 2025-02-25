use crate::protocol::libraries::types::assets::*;

pub struct State {
    pub asset_index: AssetIndex,
    pub user_profile: UserProfile,
    pub reserve_list: ReserveList,
    pub price_cache_list: PriceCacheList,
    pub canister_list:CanisterList, 
    pub meta_data: MetaData,
    pub tester_list:TesterList,
    pub requests: Requests,
    pub blocked_users:BlockedUsers,
}
